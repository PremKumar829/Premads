import React, { useState, useEffect } from 'react';
import { User, SystemSettings, AdItem } from '../types';
import { availableAdCatalog } from '../mockData';
import { getTelegramGroupLink, getTelegramGroupDisplay } from '../utils/telegram';
import { Tv, Play, CheckCircle2, AlertCircle, ExternalLink, ShieldCheck, Users, Sparkles, Lock, ArrowRight } from 'lucide-react';

interface WatchAdsViewProps {
  user: User;
  settings: SystemSettings;
  onAdWatched: (adId: string) => Promise<any>;
  onVerifyGroupJoin?: () => Promise<any>;
}

export const WatchAdsView: React.FC<WatchAdsViewProps> = ({
  user,
  settings,
  onAdWatched,
  onVerifyGroupJoin
}) => {
  const [selectedAd, setSelectedAd] = useState<AdItem>(availableAdCatalog[0]);
  const [adState, setAdState] = useState<'IDLE' | 'WATCHING' | 'VERIFY' | 'CLAIMED' | 'COOLDOWN'>('IDLE');
  const [timerSec, setTimerSec] = useState(10);
  const [cooldownSec, setCooldownSec] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [rewardClaimed, setRewardClaimed] = useState<number | null>(null);
  const [puzzleAnswer, setPuzzleAnswer] = useState('');
  const [numA, setNumA] = useState(3);
  const [numB, setNumB] = useState(4);
  const [verifyingGroup, setVerifyingGroup] = useState(false);

  const watchedSet = new Set(user.watchedAdIds || []);

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
      setErrorMsg(`You have already watched ${ad.title} and claimed ₹${ad.reward}. Please select an un-watched ad!`);
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
          // 1. Rewarded Interstitial
          showAdFn().then(() => {
            console.log('[Monetag SDK] Rewarded interstitial ad completed!');
          }).catch((e: any) => {
            console.warn('[Monetag SDK] Rewarded ad notice:', e);
          });
        } else if (ad.category === 'PUSH' || ad.category === 'DIRECT') {
          // 2. Rewarded Popup
          showAdFn('pop').then(() => {
            console.log('[Monetag SDK] Rewarded Popup ad completed!');
          }).catch((e: any) => {
            console.warn('[Monetag SDK] Rewarded Popup notice:', e);
          });
        } else {
          // 3. In-App Interstitial
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
      setRewardClaimed(res.rewardEarned || settings.perAdReward);
      setAdState('CLAIMED');
      setCooldownSec(settings.adCooldownSec || 10);
      setPuzzleAnswer('');
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

  return (
    <div className="space-y-4 pb-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-slate-950 border border-blue-800/40 rounded-2xl p-4 flex items-center justify-between shadow-xl">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-semibold">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            Monetag Ad Network Zone #{settings.monetagZoneId}
          </div>
          <h2 className="text-lg font-bold text-white mt-1">Watch Ads & Earn 10 Coins (₹0.05) / Ad</h2>
          <p className="text-xs text-slate-400">Tracked ad playback ensures 100% payout accuracy with no duplicate claims.</p>
        </div>
        <div className="text-right bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 shrink-0">
          <div className="text-[10px] text-slate-400">Watched Today</div>
          <div className="text-sm font-extrabold text-cyan-400">
            {user.adsWatchedToday} / {settings.dailyAdLimit || 50} Ads
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
            (user.totalAdsWatched || 0) >= 100 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
          }`}>
            {(user.totalAdsWatched || 0) >= 100 ? '✅ 100/100 Payouts Unlocked' : `🔒 ${user.totalAdsWatched || 0}/100 Ads (Need ${Math.max(0, 100 - (user.totalAdsWatched || 0))} more for Withdrawal)`}
          </span>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>Progress: {user.totalAdsWatched || 0} / 100 Ads Watched</span>
            <span>{(user.totalAdsWatched || 0) < 50 ? `(Friend Referral Bonus Unlocks at 50 Ads)` : `(50-Ad Referral Milestone Completed ✅)`}</span>
          </div>
          <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-300 rounded-full ${(user.totalAdsWatched || 0) >= 100 ? 'bg-emerald-400' : 'bg-amber-400'}`}
              style={{ width: `${Math.min(100, (((user.totalAdsWatched || 0) / 100) * 100))}%` }}
            ></div>
          </div>
        </div>
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
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg active:scale-98"
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
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold py-2 px-3 rounded-xl text-xs flex items-center gap-1"
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

      {/* Main Interactive Monetag Player Window */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl relative overflow-hidden min-h-[300px] flex flex-col justify-between">
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
                  : 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 active:scale-95'
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
              className="mt-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 px-6 rounded-xl shadow-lg transition-all active:scale-95 text-xs"
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
                onClick={() => setAdState('IDLE')}
                className={`py-2.5 px-6 rounded-xl text-xs font-bold transition-all ${
                  cooldownSec > 0
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg'
                }`}
              >
                {cooldownSec > 0 ? `Cooldown (${cooldownSec}s)` : 'Select Next Available Ad'}
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

      {/* Available Ads Catalog List (Duplicate Tracking Protection) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
            <Tv className="w-4 h-4 text-cyan-400" />
            Available Ad Campaigns ({availableAdCatalog.length})
          </h3>

          <span className="text-[10px] text-slate-400">
            {watchedSet.size} / {availableAdCatalog.length} Watched
          </span>
        </div>

        <div className="space-y-2">
          {availableAdCatalog.map((ad) => {
            const isWatched = watchedSet.has(ad.id);
            const isSelected = selectedAd.id === ad.id;

            return (
              <div
                key={ad.id}
                className={`p-3 rounded-xl border text-xs flex items-center justify-between transition-all ${
                  isWatched
                    ? 'bg-slate-950/60 border-slate-800/80 opacity-75'
                    : isSelected
                    ? 'bg-cyan-950/40 border-cyan-800/80'
                    : 'bg-slate-950 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-100">{ad.title}</span>
                    <span className="bg-slate-800 text-slate-400 text-[9px] px-1.5 py-0.5 rounded font-mono">
                      {ad.id}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Provider: {ad.provider} • Duration: {ad.durationSec}s • eCPM: {ad.eCpm}
                  </div>
                </div>

                <div className="shrink-0 ml-2">
                  {isWatched ? (
                    <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] px-2.5 py-1 rounded-lg font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      Watched (+10 🪙)
                    </span>
                  ) : (
                    <button
                      onClick={() => handleStartAd(ad)}
                      className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 transition-all active:scale-95 shadow"
                    >
                      <Play className="w-3 h-3 fill-slate-950" />
                      <span>Watch (+10 🪙)</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
