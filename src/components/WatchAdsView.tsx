import React, { useState, useEffect } from 'react';
import { User, SystemSettings, AdItem } from '../types';
import { availableAdCatalog } from '../mockData';
import { getTelegramGroupLink, getTelegramGroupDisplay } from '../utils/telegram';
import { audioSynth } from '../utils/audio';
import { api } from '../services/api';
import { 
  Tv, Play, CheckCircle2, AlertCircle, ExternalLink, ShieldCheck, Users, Sparkles, 
  Lock, ArrowRight, Gift, Clock, RefreshCw, Zap, Flame, Filter, Layers, Infinity as InfinityIcon
} from 'lucide-react';

interface WatchAdsViewProps {
  user: User;
  settings: SystemSettings;
  onAdWatched: (adId: string) => Promise<any>;
  onVerifyGroupJoin?: () => Promise<any>;
  onRefreshUserData?: () => void;
}

// Dynamic Campaign Generator helper for Infinite Campaign Streams
const createDynamicCampaignBatch = (startIndex: number, perAdReward: number, directUrl: string, count: number = 6): AdItem[] => {
  const categories: ('REWARDED' | 'DIRECT' | 'PUSH' | 'SPONSOR')[] = ['REWARDED', 'DIRECT', 'PUSH', 'SPONSOR'];
  const providers = [
    'Monetag Official Ad SDK v7',
    'Monetag Direct eCPM Engine',
    'Monetag In-Page Push Network',
    'PrimeAds High-eCPM Partner',
    'Monetag SmartLink Direct',
    'VIP Crypto & Gaming Sponsor',
    'Monetag Multi-Tag High CPM'
  ];
  const eCpmRates = ['$4.50', '$5.80', '$6.20', '$7.10', '$8.50', '$9.20', '$10.40'];

  const batch: AdItem[] = [];
  for (let i = 0; i < count; i++) {
    const num = startIndex + i + 1;
    const cat = categories[i % categories.length];
    const prov = providers[i % providers.length];
    const ecpm = eCpmRates[i % eCpmRates.length];
    
    batch.push({
      id: `AD-MONETAG-${100 + num}`,
      title: `Monetag High-eCPM Campaign #${100 + num}`,
      category: cat,
      reward: perAdReward || 0.05,
      provider: prov,
      eCpm: ecpm,
      durationSec: 10,
      description: `Watch 10s video/sponsor offer to claim 10 Coins (₹${perAdReward || 0.05}) instantly.`,
      targetUrl: directUrl || 'https://monetag.com/directlink/demo_ad_zone_77821'
    });
  }
  return batch;
};

export const WatchAdsView: React.FC<WatchAdsViewProps> = ({
  user,
  settings,
  onAdWatched,
  onVerifyGroupJoin,
  onRefreshUserData
}) => {
  // Campaign List State (Supports Infinite Append & Unlimited Streams)
  const [campaigns, setCampaigns] = useState<AdItem[]>(() => {
    return availableAdCatalog.length >= 6 
      ? availableAdCatalog 
      : createDynamicCampaignBatch(0, settings.perAdReward, settings.monetagDirectLinkUrl, 6);
  });

  const [selectedAd, setSelectedAd] = useState<AdItem>(campaigns[0] || availableAdCatalog[0]);
  const [adState, setAdState] = useState<'IDLE' | 'WATCHING' | 'VERIFY' | 'CLAIMED' | 'COOLDOWN'>('IDLE');
  const [timerSec, setTimerSec] = useState(10);
  const [cooldownSec, setCooldownSec] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [rewardClaimed, setRewardClaimed] = useState<number | null>(null);
  const [puzzleAnswer, setPuzzleAnswer] = useState('');
  const [numA, setNumA] = useState(3);
  const [numB, setNumB] = useState(4);
  const [verifyingGroup, setVerifyingGroup] = useState(false);
  const [claimingCheckIn, setClaimingCheckIn] = useState(false);
  const [checkInMsg, setCheckInMsg] = useState<string | null>(null);

  // Unique Filtering State
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'UNWATCHED' | 'REWARDED' | 'DIRECT' | 'PUSH' | 'SPONSOR'>('ALL');
  const [autoHideWatched, setAutoHideWatched] = useState(true);

  const watchedSet = new Set(user.watchedAdIds || []);

  // 24H Daily Check-in Cooldown Calculation
  const now = Date.now();
  const checkInCooldown = 24 * 3600 * 1000;
  const timeSinceLastCheckIn = user.lastCheckInAt ? (now - user.lastCheckInAt) : checkInCooldown + 1;
  const isCheckInAvailable = timeSinceLastCheckIn >= checkInCooldown;
  const msRemaining = Math.max(0, checkInCooldown - timeSinceLastCheckIn);
  const hoursRemaining = Math.floor(msRemaining / (3600 * 1000));
  const minsRemaining = Math.floor((msRemaining % (3600 * 1000)) / (60 * 1000));

  // Function to load more dynamic unlimited campaigns
  const handleLoadMoreCampaigns = (isAuto: boolean = false) => {
    const currentLength = campaigns.length;
    const newBatch = createDynamicCampaignBatch(currentLength, settings.perAdReward, settings.monetagDirectLinkUrl, 6);
    setCampaigns(prev => [...prev, ...newBatch]);
    
    audioSynth.playDailyCheckInSound();
    setSuccessNotice(
      isAuto 
        ? `🎉 All campaigns completed! 6 new fresh Monetag campaigns auto-loaded below!` 
        : `⚡ +6 Fresh High-eCPM Monetag Campaigns loaded to your catalog!`
    );
    setTimeout(() => setSuccessNotice(null), 5000);
  };

  const handleClaimDailyCheckIn = async () => {
    if (!isCheckInAvailable || claimingCheckIn) return;
    setClaimingCheckIn(true);
    setCheckInMsg(null);
    try {
      const res = await api.claimDailyCheckIn(user.id);
      audioSynth.playDailyCheckInSound();
      setCheckInMsg(`🎉 Claimed +50 Coins (₹0.25) Daily Login Bonus!`);
      if (onRefreshUserData) onRefreshUserData();
    } catch (err: any) {
      setCheckInMsg(err.message || 'Failed to claim daily bonus');
    } finally {
      setClaimingCheckIn(false);
    }
  };

  // Cooldown timer effect
  useEffect(() => {
    let interval: any;
    if (cooldownSec > 0) {
      interval = setInterval(() => {
        setCooldownSec((prev) => {
          if (prev <= 1) {
            setAdState('IDLE');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [cooldownSec]);

  // Active Ad countdown effect
  useEffect(() => {
    let interval: any;
    if (adState === 'WATCHING') {
      interval = setInterval(() => {
        setTimerSec((prev) => {
          if (prev <= 1) {
            setNumA(Math.floor(Math.random() * 8) + 1);
            setNumB(Math.floor(Math.random() * 8) + 1);
            setAdState('VERIFY');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [adState]);

  const handleStartAd = (ad: AdItem) => {
    setErrorMsg(null);

    // Prevent watching already watched ad
    if (watchedSet.has(ad.id)) {
      setErrorMsg(`You have already watched ${ad.title}. Select an un-watched campaign or click 'Load More Campaigns' below!`);
      return;
    }

    if (user.adsWatchedToday >= settings.dailyAdLimit) {
      setErrorMsg(`Daily limit reached (${settings.dailyAdLimit} ads). Please try again tomorrow.`);
      return;
    }

    setSelectedAd(ad);
    setTimerSec(ad.durationSec || 10);
    setAdState('WATCHING');

    // Trigger Monetag official SDK functions based on ad category/format
    try {
      const sdkFuncName = `show_${settings.monetagZoneId || '11537959'}`;
      const showAdFn = (window as any)[sdkFuncName] || (window as any).show_11537959;

      if (typeof showAdFn === 'function') {
        console.log(`[Monetag SDK Zone ${settings.monetagZoneId || '11537959'}] Triggering format for category: ${ad.category}`);

        if (ad.category === 'REWARDED') {
          showAdFn().then(() => {
            console.log('[Monetag SDK] Rewarded interstitial ad completed!');
          }).catch((e: any) => {
            console.warn('[Monetag SDK] Rewarded ad notice:', e);
          });
        } else if (ad.category === 'PUSH' || ad.category === 'DIRECT') {
          showAdFn('pop').then(() => {
            console.log('[Monetag SDK] Rewarded Popup ad completed!');
          }).catch((e: any) => {
            console.warn('[Monetag SDK] Rewarded Popup notice:', e);
          });
        } else {
          showAdFn({
            type: 'inApp',
            inAppSettings: {
              frequency: 2,
              capping: 0.1,
              interval: 30,
              timeout: 5,
              everyPage: false
            }
          }).then(() => {
            console.log('[Monetag SDK] In-App Interstitial ad completed!');
          }).catch((e: any) => {
            console.warn('[Monetag SDK] In-App Interstitial notice:', e);
          });
        }
      } else {
        console.info('[Monetag SDK] SDK script not detected in preview frame; using standard interactive player.');
      }
    } catch (e) {
      console.warn('Monetag SDK Execution:', e);
    }
  };

  const handleVerifyAndClaim = async () => {
    if (parseInt(puzzleAnswer) !== numA + numB) {
      setErrorMsg('Incorrect answer. Please solve the puzzle correctly.');
      return;
    }

    setErrorMsg(null);
    try {
      const res = await onAdWatched(selectedAd.id);
      audioSynth.playCoinSound();
      setRewardClaimed(res.rewardEarned || settings.perAdReward);
      setAdState('CLAIMED');
      setCooldownSec(settings.adCooldownSec || 10);
      setPuzzleAnswer('');

      // Auto-check if all active campaigns are watched! When 6 ads completed, auto-refresh clean list with 6 fresh ads!
      const updatedWatchedIds = [...(user.watchedAdIds || []), selectedAd.id];
      const remainingUnwatched = campaigns.filter(c => !updatedWatchedIds.includes(c.id));
      
      if (remainingUnwatched.length === 0) {
        setTimeout(() => {
          // Replace watched campaigns with 6 brand new clean Monetag campaigns!
          const newStartIndex = campaigns.length;
          const freshBatch = createDynamicCampaignBatch(newStartIndex, settings.perAdReward, settings.monetagDirectLinkUrl, 6);
          setCampaigns(freshBatch);
          setSelectedAd(freshBatch[0]);
          audioSynth.playDailyCheckInSound();
          setSuccessNotice(`✨ 6 Ads Completed! Auto-refreshed with 6 clean fresh unwatched campaigns!`);
          setTimeout(() => setSuccessNotice(null), 5000);
        }, 1200);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to claim ad reward');
      setAdState('IDLE');
    }
  };

  const handleVerifyGroup = async () => {
    if (!onVerifyGroupJoin) return;
    setVerifyingGroup(true);
    try {
      await onVerifyGroupJoin();
    } catch (e) {
      console.error(e);
    } finally {
      setVerifyingGroup(false);
    }
  };

  // Filtered campaign catalog (Auto-hides watched ads when autoHideWatched is ON for a clean view)
  const filteredCampaigns = campaigns.filter(c => {
    if (autoHideWatched && watchedSet.has(c.id)) return false;
    if (activeCategory === 'UNWATCHED') return !watchedSet.has(c.id);
    if (activeCategory === 'REWARDED') return c.category === 'REWARDED';
    if (activeCategory === 'DIRECT') return c.category === 'DIRECT';
    if (activeCategory === 'PUSH') return c.category === 'PUSH';
    if (activeCategory === 'SPONSOR') return c.category === 'SPONSOR';
    return true;
  });

  const firstUnwatched = campaigns.find(c => !watchedSet.has(c.id));

  return (
    <div className="space-y-4 pb-16 font-sans">
      {/* Dynamic Unique Header Banner */}
      <div className="bg-gradient-to-r from-cyan-950 via-slate-900 to-purple-950 border border-cyan-500/40 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-3 relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="bg-cyan-950/90 text-cyan-300 border border-cyan-500/50 text-[10px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shrink-0" />
              <InfinityIcon className="w-3.5 h-3.5 text-cyan-400" />
              <span>UNLIMITED CAMPAIGN STREAM ACTIVE</span>
            </span>
          </div>

          <span className="text-[10px] text-purple-300 font-mono bg-purple-950/80 border border-purple-800 px-2 py-0.5 rounded-lg">
            Monetag Zone #{settings.monetagZoneId}
          </span>
        </div>

        <div>
          <h2 className="text-lg sm:text-xl font-black text-white tracking-wide flex items-center gap-2">
            <span>Watch Unlimited Campaigns & Earn 10 Coins / Ad</span>
          </h2>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            Continuously watch high-eCPM Monetag sponsor campaigns. Every ad completed credits 10 Coins (₹0.05) instantly to your balance!
          </p>
        </div>

        {/* Live Metrics Row */}
        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-800/80">
          <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800/80 text-center">
            <div className="text-[9px] text-slate-400 font-medium">Available Stream</div>
            <div className="text-xs font-black text-cyan-400 flex items-center justify-center gap-1 mt-0.5">
              <span>{campaigns.length} Campaigns</span>
            </div>
          </div>

          <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800/80 text-center">
            <div className="text-[9px] text-slate-400 font-medium">Completed Today</div>
            <div className="text-xs font-black text-emerald-400 mt-0.5">
              {user.adsWatchedToday} / {settings.dailyAdLimit || 50}
            </div>
          </div>

          <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800/80 text-center">
            <div className="text-[9px] text-slate-400 font-medium">Average eCPM</div>
            <div className="text-xs font-black text-amber-300 mt-0.5">
              $6.80 High CPM
            </div>
          </div>
        </div>
      </div>

      {/* Lifetime Ad Progress & Anti-Fraud Unlock Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-2 shadow-md">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-slate-200">Personal Lifetime Ad Progress</span>
          </div>
          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
            (user.totalAdsWatched || 0) >= (settings.minAdsWatchForWithdrawal || 100) 
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
              : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
          }`}>
            {(user.totalAdsWatched || 0) >= (settings.minAdsWatchForWithdrawal || 100) 
              ? `✅ ${settings.minAdsWatchForWithdrawal || 100}/${settings.minAdsWatchForWithdrawal || 100} Payouts Unlocked` 
              : `🔒 ${user.totalAdsWatched || 0}/${settings.minAdsWatchForWithdrawal || 100} Ads (Need ${Math.max(0, (settings.minAdsWatchForWithdrawal || 100) - (user.totalAdsWatched || 0))} more for Withdrawal)`}
          </span>
        </div>

        <div className="w-full bg-slate-950 rounded-full h-2 border border-slate-800 overflow-hidden">
          <div
            className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full transition-all duration-500"
            style={{ width: `${Math.min(100, ((user.totalAdsWatched || 0) / (settings.minAdsWatchForWithdrawal || 100)) * 100)}%` }}
          />
        </div>
      </div>

      {/* DAILY 24H CHECK-IN BONUS CARD */}
      <div className="bg-gradient-to-r from-purple-950/90 via-slate-900 to-indigo-950/90 border border-purple-500/40 rounded-2xl p-4 space-y-3 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center justify-center font-bold text-lg shrink-0">
              🎁
            </div>
            <div>
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Daily 24H Login Streak Reward</span>
                <span className="bg-purple-950 text-purple-300 text-[9px] px-1.5 py-0.5 rounded border border-purple-800 font-extrabold">24H Timer</span>
              </h3>
              <p className="text-[10px] text-slate-300 mt-0.5">
                Claim +50 Coins (₹0.25) every 24 hours just for opening the app!
              </p>
            </div>
          </div>

          <span className="text-xs font-extrabold text-amber-300 bg-amber-950/80 border border-amber-800 px-2.5 py-1 rounded-lg shrink-0">
            +50 🪙
          </span>
        </div>

        {checkInMsg && (
          <div className="bg-purple-950/80 border border-purple-800 text-purple-200 p-2.5 rounded-xl text-xs font-semibold">
            {checkInMsg}
          </div>
        )}

        <div className="flex items-center justify-between bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-300">
            <Clock className="w-4 h-4 text-purple-400" />
            <span>Next Claim:</span>
          </div>
          <span className={`text-xs font-bold font-mono ${isCheckInAvailable ? 'text-emerald-400' : 'text-amber-400'}`}>
            {isCheckInAvailable ? 'READY TO CLAIM NOW!' : `${hoursRemaining}h ${minsRemaining}m remaining`}
          </span>
        </div>

        <button
          disabled={!isCheckInAvailable || claimingCheckIn}
          onClick={handleClaimDailyCheckIn}
          className={`w-full font-extrabold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg active:scale-98 ${
            isCheckInAvailable && !claimingCheckIn
              ? 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white cursor-pointer'
              : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
          }`}
        >
          <Gift className="w-4 h-4" />
          <span>{claimingCheckIn ? 'Claiming Reward...' : isCheckInAvailable ? 'Claim Daily 50 Coins (₹0.25)' : `Claimed! (Try in ${hoursRemaining}h ${minsRemaining}m)`}</span>
        </button>
      </div>

      {/* MONETAG DIRECT LINK HIGH-CPM BANNER */}
      <div className="bg-gradient-to-r from-blue-950/80 via-slate-900 to-indigo-950/80 border border-blue-500/40 rounded-2xl p-4 space-y-3 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold text-sm">
              ⚡
            </div>
            <div>
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Monetag Direct Link Offer</span>
                <span className="bg-cyan-950 text-cyan-300 text-[9px] px-1.5 py-0.5 rounded border border-cyan-800">High CPM</span>
              </h3>
              <p className="text-[10px] text-slate-300 mt-0.5">
                Click direct link to view sponsor landing page & earn ₹{settings.perAdReward}.00 instantly!
              </p>
            </div>
          </div>

          <span className="text-xs font-extrabold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-1 rounded-lg">
            +₹{settings.perAdReward}
          </span>
        </div>

        <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800 text-[10px] font-mono text-cyan-300 truncate">
          🔗 {settings.monetagDirectLinkUrl || 'https://monetag.com/directlink/demo_ad_zone_77821'}
        </div>

        <button
          onClick={() => {
            const directAdItem: AdItem = {
              id: `DIRECT-${Date.now()}`,
              title: 'Monetag Direct Link High-CPM Offer',
              category: 'DIRECT',
              reward: settings.perAdReward,
              provider: 'Monetag Direct Engine',
              eCpm: '$6.50',
              durationSec: 10,
              description: 'Official Monetag High-CPM Direct Link offer page.',
              targetUrl: settings.monetagDirectLinkUrl || 'https://monetag.com/directlink/demo_ad_zone_77821'
            };
            window.open(settings.monetagDirectLinkUrl || 'https://monetag.com/directlink/demo_ad_zone_77821', '_blank');
            handleStartAd(directAdItem);
          }}
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg active:scale-98 cursor-pointer"
        >
          <ExternalLink className="w-4 h-4" />
          <span>Launch Monetag Direct Link Ad & Earn ₹{settings.perAdReward}</span>
        </button>
      </div>

      {/* Fast Withdrawal Telegram Group Join Notice */}
      {!user.hasJoinedFastGroup && (
        <div className="bg-gradient-to-r from-amber-950/90 via-slate-900 to-slate-950 border border-amber-500/50 rounded-2xl p-4 space-y-3 shadow-lg">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-xs font-bold text-amber-300">Telegram Fast Withdrawal Group Required</h3>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Join our official group <strong className="text-amber-200">{getTelegramGroupDisplay(settings.fastGroupUsername)}</strong> for fast payouts & ad updates.
                </p>
              </div>
            </div>
            <span className="bg-amber-500/20 text-amber-300 text-[10px] px-2 py-0.5 rounded border border-amber-500/40 font-bold shrink-0">
              Action Required
            </span>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <a
              href={getTelegramGroupLink(settings.fastGroupUsername)}
              target="_blank"
              rel="noreferrer"
              className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow"
            >
              <span>Join Group ({getTelegramGroupDisplay(settings.fastGroupUsername)})</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={handleVerifyGroup}
              disabled={verifyingGroup}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold py-2 px-3 rounded-xl text-xs flex items-center gap-1 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{verifyingGroup ? 'Verifying...' : 'Verify Join'}</span>
            </button>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-950/80 border border-rose-800/80 text-rose-300 p-3 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successNotice && (
        <div className="bg-emerald-950/90 border border-emerald-500/80 text-emerald-200 p-3 rounded-xl text-xs flex items-center gap-2 font-bold shadow-lg animate-in fade-in duration-300">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Main Interactive Monetag Player Window */}
      <div className="bg-slate-900 border-2 border-cyan-500/30 rounded-3xl p-5 shadow-2xl relative overflow-hidden min-h-[300px] flex flex-col justify-between">
        {/* Ad Status Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Tv className="w-4 h-4 text-cyan-400" />
            {selectedAd.title}
          </span>

          <span className="text-xs text-amber-300 bg-amber-950/80 border border-amber-800/60 px-2.5 py-0.5 rounded-full font-bold">
            Reward: 10 Coins (₹0.05)
          </span>
        </div>

        {/* STATE: IDLE */}
        {adState === 'IDLE' && (
          <div className="my-auto text-center py-6">
            <div className="w-16 h-16 rounded-3xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mx-auto flex items-center justify-center mb-3 shadow-lg">
              <Play className="w-8 h-8 fill-cyan-400 translate-x-0.5" />
            </div>

            <h3 className="text-base font-bold text-white">{selectedAd.title}</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
              {selectedAd.description}
            </p>

            <button
              disabled={watchedSet.has(selectedAd.id)}
              onClick={() => handleStartAd(selectedAd)}
              className={`mt-5 font-extrabold py-3.5 px-8 rounded-2xl shadow-xl transition-all inline-flex items-center gap-2 ${
                watchedSet.has(selectedAd.id)
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 active:scale-95 cursor-pointer'
              }`}
            >
              {watchedSet.has(selectedAd.id) ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>Already Watched (+10 🪙)</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-slate-950" />
                  <span>Watch This Ad & Earn 10 Coins (₹0.05)</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* STATE: WATCHING */}
        {adState === 'WATCHING' && (
          <div className="my-auto text-center py-4 space-y-4">
            <div className="bg-slate-950 border border-cyan-500/30 rounded-2xl p-4 text-left relative overflow-hidden shadow-inner">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                  {selectedAd.provider}
                </span>
                <span className="text-xs text-amber-400 font-mono font-bold animate-pulse">
                  {timerSec}s Remaining
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-100">{selectedAd.title}</h4>
              <p className="text-xs text-slate-400 mt-1">{selectedAd.description}</p>
              <a
                href={selectedAd.targetUrl || settings.monetagDirectLinkUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-xs text-cyan-400 font-semibold hover:underline"
              >
                Visit Sponsor Offer Page <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Watching Ad Stream...</span>
                <span>{selectedAd.durationSec - timerSec} / {selectedAd.durationSec} sec</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2.5 border border-slate-800 overflow-hidden">
                <div
                  className="bg-cyan-400 h-full transition-all duration-1000"
                  style={{ width: `${((selectedAd.durationSec - timerSec) / selectedAd.durationSec) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* STATE: VERIFY (Human Verification Puzzle) */}
        {adState === 'VERIFY' && (
          <div className="my-auto text-center py-4 bg-slate-950 border border-slate-800 rounded-2xl p-4">
            <ShieldCheck className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-white">Human Verification Anti-Cheat</h3>
            <p className="text-xs text-slate-400 mt-1">Solve arithmetic puzzle to verify view for {selectedAd.id}:</p>

            <div className="mt-4 bg-slate-900 p-3 rounded-xl border border-slate-800 max-w-xs mx-auto flex items-center justify-center gap-3">
              <span className="text-lg font-extrabold text-cyan-300">{numA} + {numB} = ?</span>
              <input
                type="number"
                value={puzzleAnswer}
                onChange={(e) => setPuzzleAnswer(e.target.value)}
                placeholder="Answer"
                className="w-20 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-center text-sm font-bold text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <button
              onClick={handleVerifyAndClaim}
              className="mt-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 px-6 rounded-xl shadow-lg transition-all active:scale-95 text-xs cursor-pointer"
            >
              Verify & Claim ₹{settings.perAdReward}
            </button>
          </div>
        )}

        {/* STATE: CLAIMED / COOLDOWN */}
        {(adState === 'CLAIMED' || cooldownSec > 0) && (
          <div className="my-auto text-center py-6 space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <h3 className="text-base font-bold text-emerald-300">
              ₹{rewardClaimed || settings.perAdReward}.00 Credited to Wallet!
            </h3>
            <p className="text-xs text-slate-400">
              Ad <span className="text-white font-bold">{selectedAd.id}</span> logged in history. Next ad unlocks in <span className="text-cyan-400 font-bold">{cooldownSec}s</span>.
            </p>

            <div className="pt-2">
              <button
                disabled={cooldownSec > 0}
                onClick={() => {
                  setAdState('IDLE');
                  if (firstUnwatched) setSelectedAd(firstUnwatched);
                }}
                className={`py-2.5 px-6 rounded-xl text-xs font-bold transition-all ${
                  cooldownSec > 0
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg cursor-pointer'
                }`}
              >
                {cooldownSec > 0 ? `Cooldown (${cooldownSec}s)` : 'Select Next Available Campaign'}
              </button>
            </div>
          </div>
        )}

        {/* Bottom Ad Zone info */}
        <div className="text-[10px] text-slate-500 border-t border-slate-800 pt-2 flex items-center justify-between">
          <span>Ad ID: {selectedAd.id}</span>
          <span>eCPM Rate: {selectedAd.eCpm}</span>
        </div>
      </div>

      {/* UNIQUE CAMPAIGN CATALOG HEADER & FILTERS */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-3.5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Tv className="w-4 h-4 text-cyan-400" />
              <span>Unlimited Campaign Streams ({campaigns.length} Active)</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Select any campaign below to launch. New campaigns auto-generate continuously!
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleLoadMoreCampaigns(false)}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-extrabold px-3 py-1.5 rounded-xl border border-purple-400/30 flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>+6 Unlimited Campaigns</span>
            </button>
          </div>
        </div>

        {/* Quick Auto-Play Next Best Campaign CTA */}
        {firstUnwatched && (
          <button
            onClick={() => handleStartAd(firstUnwatched)}
            className="w-full bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black py-3 px-4 rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>Auto-Play Next Campaign: {firstUnwatched.title} (+10 🪙)</span>
          </button>
        )}

        {/* Unique Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setAutoHideWatched(!autoHideWatched)}
            className={`px-3 py-1.5 rounded-xl font-extrabold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 border ${
              autoHideWatched
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-md'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Auto-Clear Watched ({autoHideWatched ? 'ON (Clean View)' : 'OFF'})</span>
          </button>

          <button
            onClick={() => setActiveCategory('ALL')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeCategory === 'ALL'
                ? 'bg-cyan-500 text-slate-950 shadow'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            All Streams ({campaigns.length})
          </button>

          <button
            onClick={() => setActiveCategory('UNWATCHED')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeCategory === 'UNWATCHED'
                ? 'bg-amber-400 text-slate-950 shadow'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Unwatched Only ({campaigns.filter(c => !watchedSet.has(c.id)).length})
          </button>

          <button
            onClick={() => setActiveCategory('REWARDED')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeCategory === 'REWARDED'
                ? 'bg-purple-500 text-white shadow'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Video Rewarded
          </button>

          <button
            onClick={() => setActiveCategory('DIRECT')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeCategory === 'DIRECT'
                ? 'bg-blue-500 text-white shadow'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            SmartLink Direct
          </button>

          <button
            onClick={() => setActiveCategory('PUSH')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeCategory === 'PUSH'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            In-Page Push
          </button>

          <button
            onClick={() => setActiveCategory('SPONSOR')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeCategory === 'SPONSOR'
                ? 'bg-rose-500 text-white shadow'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            VIP Partner
          </button>
        </div>

        {/* Campaign List */}
        <div className="space-y-2.5">
          {filteredCampaigns.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs border border-dashed border-slate-800 rounded-2xl space-y-2">
              <p className="font-bold text-slate-200">No campaigns found in this filter.</p>
              <button
                onClick={() => handleLoadMoreCampaigns(false)}
                className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold px-4 py-2 rounded-xl text-xs transition-all cursor-pointer"
              >
                + Load Fresh Unlimited Campaigns Now
              </button>
            </div>
          ) : (
            filteredCampaigns.map((ad) => {
              const isWatched = watchedSet.has(ad.id);
              const isSelected = selectedAd.id === ad.id;

              return (
                <div
                  key={ad.id}
                  className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between transition-all ${
                    isWatched
                      ? 'bg-slate-950/60 border-slate-800/80 opacity-70'
                      : isSelected
                      ? 'bg-cyan-950/40 border-cyan-500/80 shadow-md'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-slate-100">{ad.title}</span>
                      <span className="bg-slate-800 text-slate-400 text-[9px] px-1.5 py-0.5 rounded font-mono border border-slate-700">
                        {ad.id}
                      </span>
                      <span className="bg-emerald-950 text-emerald-300 text-[9px] px-1.5 py-0.5 rounded font-extrabold border border-emerald-800">
                        {ad.eCpm}
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-400 flex items-center gap-2">
                      <span>{ad.provider}</span>
                      <span>•</span>
                      <span>10 Sec Stream</span>
                      <span>•</span>
                      <span className="text-amber-300 font-semibold">+10 Coins (₹{ad.reward})</span>
                    </div>
                  </div>

                  <div className="shrink-0 ml-2">
                    {isWatched ? (
                      <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] px-3 py-1.5 rounded-xl font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Watched (+10 🪙)</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleStartAd(ad)}
                        className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-slate-950" />
                        <span>Watch (+10 🪙)</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Load More Fresh Unlimited Campaigns Footer CTA */}
        <div className="pt-2 border-t border-slate-800 text-center">
          <button
            onClick={() => handleLoadMoreCampaigns(false)}
            className="w-full bg-slate-950 hover:bg-slate-900 border border-purple-500/40 text-purple-300 hover:text-purple-200 font-extrabold py-3 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 transition-all shadow cursor-pointer"
          >
            <Zap className="w-4 h-4 text-amber-300" />
            <span>Load More Unlimited Monetag Campaigns (+6)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
