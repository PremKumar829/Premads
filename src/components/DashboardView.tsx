import React, { useState, useEffect } from 'react';
import { User, SystemSettings, WithdrawalRequest } from '../types';
import { TransactionHistoryModal } from './TransactionHistoryModal';
import { SpinWheel } from './SpinWheel';
import { LiveWithdrawalTicker } from './LiveWithdrawalTicker';
import { Wallet, Tv, UserPlus, Gift, ArrowUpRight, TrendingUp, Sparkles, CheckCircle, Clock, History, Users, Coins, Trophy, Award, Target, Flame, Zap } from 'lucide-react';
import { api } from '../services/api';

interface LeaderboardUser {
  rank: number;
  id: string;
  firstName: string;
  username: string;
  totalEarned: number;
  totalCoinsEarned: number;
  totalAdsWatched: number;
  referralCount: number;
}

interface DashboardViewProps {
  user: User;
  settings: SystemSettings;
  withdrawals: WithdrawalRequest[];
  onNavigate: (tab: 'home' | 'watch' | 'refer' | 'withdraw' | 'admin') => void;
  onClaimDailyStreak: () => void;
  dailyClaimed: boolean;
  onRefreshUserData?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  settings,
  withdrawals,
  onNavigate,
  onClaimDailyStreak,
  dailyClaimed,
  onRefreshUserData
}) => {
  const [streakClaiming, setStreakClaiming] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showSpinModal, setShowSpinModal] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  useEffect(() => {
    const loadLeaderboard = async () => {
      setLoadingLeaderboard(true);
      try {
        const data = await api.getLeaderboard();
        setLeaderboard(data);
      } catch (err) {
        console.warn('Failed to load leaderboard', err);
      } finally {
        setLoadingLeaderboard(false);
      }
    };
    loadLeaderboard();
  }, []);

  // User's withdrawal history
  const userWithdrawals = withdrawals.filter(w => w.userId === user.id);
  const pendingCount = userWithdrawals.filter(w => w.status === 'PENDING').length;
  const pendingAmount = userWithdrawals
    .filter(w => w.status === 'PENDING')
    .reduce((sum, w) => sum + w.amount, 0);

  const adLimitProgress = Math.min(100, (user.adsWatchedToday / (settings.dailyAdLimit || 20)) * 100);

  return (
    <div className="space-y-4 pb-16">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-cyan-950/80 via-slate-900 to-slate-950 border border-cyan-800/40 rounded-2xl p-4 relative overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="flex items-center justify-between relative z-10">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-md font-semibold border border-cyan-500/30">
                Welcome Bonus Active 🎁
              </span>
              <span className="text-xs text-slate-400">Bonus: ₹{settings.welcomeBonus} ({(settings.welcomeBonus * 200).toLocaleString()} Coins)</span>
              <span className="text-[10px] bg-emerald-950/80 border border-emerald-600/40 text-emerald-300 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                DB: prime-earn-49202
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-100 mt-1">Hello, {user.firstName}! 👋</h2>
            <p className="text-xs text-slate-400 mt-0.5">Watch Monetag ads & earn 10 Coins (₹0.05) per ad watch.</p>
          </div>
          <div className="bg-cyan-500/10 border border-cyan-500/20 p-2.5 rounded-2xl flex flex-col items-center">
            <Sparkles className="w-6 h-6 text-cyan-400 animate-pulse" />
            <span className="text-[10px] text-cyan-300 font-bold mt-1">1 Ad = 10 Coins</span>
          </div>
        </div>
      </div>

      {/* Main Balance Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/50 border border-slate-800 rounded-3xl p-5 shadow-2xl relative">
        <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
          <span className="flex items-center gap-1.5">
            <Wallet className="w-4 h-4 text-cyan-400" />
            Coin Balance
          </span>
          <span className="text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800/40 px-2.5 py-0.5 rounded-full">
            Min Payout: ₹{settings.minWithdrawal} (10,000 Coins)
          </span>
        </div>

        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-amber-400 tracking-tight flex items-center gap-1.5">
              🪙 {(user.coins || 0).toLocaleString()}
            </span>
            <span className="text-sm font-bold text-amber-300/80 uppercase">Coins</span>
          </div>
          <div className="text-sm font-semibold text-emerald-400 mt-1 flex items-center gap-1">
            <span>≈ ₹{(user.balance || 0).toFixed(2)} INR</span>
            <span className="text-[11px] text-slate-500 font-normal">(10,000 Coins = ₹50)</span>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-800/80">
          <div className="bg-slate-950/60 rounded-xl p-2.5 border border-slate-800">
            <div className="text-[10px] text-slate-400">Total Earned</div>
            <div className="text-sm font-bold text-amber-400 mt-0.5">{(user.totalCoinsEarned || 0).toLocaleString()} 🪙</div>
            <div className="text-[10px] text-emerald-400">₹{user.totalEarned.toFixed(2)}</div>
          </div>

          <div className="bg-slate-950/60 rounded-xl p-2.5 border border-slate-800">
            <div className="text-[10px] text-slate-400">Withdrawn</div>
            <div className="text-sm font-bold text-cyan-400 mt-0.5">₹{user.totalWithdrawn.toFixed(2)}</div>
            <div className="text-[10px] text-slate-400">{(user.totalWithdrawn * 200).toLocaleString()} 🪙</div>
          </div>

          <div className="bg-slate-950/60 rounded-xl p-2.5 border border-slate-800">
            <div className="text-[10px] text-slate-400">Pending Req</div>
            <div className="text-sm font-bold text-amber-400 mt-0.5">₹{pendingAmount.toFixed(2)}</div>
            <div className="text-[10px] text-slate-400">{(pendingAmount * 200).toLocaleString()} 🪙</div>
          </div>
        </div>

        {/* Earning History Trigger Button */}
        <button
          onClick={() => setShowHistoryModal(true)}
          className="w-full mt-3 bg-slate-950/80 hover:bg-slate-950 border border-slate-800 hover:border-cyan-500/40 text-cyan-300 font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
        >
          <History className="w-4 h-4 text-cyan-400" />
          <span>View Detailed Earning History (Ads, Referrals, Gifts, Deductions)</span>
        </button>

        {/* Main Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mt-3">
          <button
            onClick={() => onNavigate('watch')}
            className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold py-3 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <Tv className="w-5 h-5 fill-slate-950" />
            <span>Watch Ads (+10 🪙)</span>
          </button>

          <button
            onClick={() => onNavigate('withdraw')}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <Wallet className="w-5 h-5 text-cyan-400" />
            <span>Withdraw UPI</span>
          </button>
        </div>
      </div>

      {/* 100 ADS ANTI-FRAUD PROGRESS CARD */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
              (user.totalAdsWatched || 0) >= 100 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}>
              {(user.totalAdsWatched || 0) >= 100 ? '✅' : '🔒'}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-200">Withdrawal Unlock Status</div>
              <div className="text-[10px] text-slate-400">Req: 100 lifetime ads watched (Anti-Fraud)</div>
            </div>
          </div>

          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
            (user.totalAdsWatched || 0) >= 100 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
          }`}>
            {(user.totalAdsWatched || 0) >= 100 ? 'Unlocked' : `${user.totalAdsWatched || 0}/100 Ads`}
          </span>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-medium text-slate-400">
            <span>Lifetime Watched: {user.totalAdsWatched || 0} / 100</span>
            <span>{Math.min(100, Math.round(((user.totalAdsWatched || 0) / 100) * 100))}%</span>
          </div>
          <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-300 rounded-full ${(user.totalAdsWatched || 0) >= 100 ? 'bg-emerald-400' : 'bg-amber-400'}`}
              style={{ width: `${Math.min(100, (((user.totalAdsWatched || 0) / 100) * 100))}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* USER REFERRAL SUMMARY CARD */}
      <div className="bg-gradient-to-br from-purple-950/60 via-slate-900 to-slate-950 border border-purple-800/40 rounded-2xl p-4 shadow-lg space-y-3 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-28 h-28 bg-purple-500/10 rounded-full blur-xl pointer-events-none"></div>

        <div className="flex items-center justify-between border-b border-purple-900/40 pb-2.5 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                <span>Your Referral Summary</span>
                <span className="text-[9px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30 font-extrabold">
                  {settings.referralCommissionPct}% Commission
                </span>
              </h3>
              <p className="text-[10px] text-slate-400">Earn ₹{settings.referralReward} per invited friend + lifetime ad commission</p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('refer')}
            className="text-xs text-purple-300 hover:text-purple-200 font-bold bg-purple-900/40 hover:bg-purple-800/60 border border-purple-700/50 px-2.5 py-1 rounded-xl transition-all flex items-center gap-1 active:scale-95 shadow"
          >
            <span>Invite</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2.5 relative z-10">
          {/* Total Referrals */}
          <div className="bg-slate-950/70 border border-purple-900/30 rounded-xl p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-semibold">Total Referrals</span>
              <Users className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-xl font-extrabold text-purple-300">{user.referralCount || 0}</span>
              <span className="text-[10px] text-slate-400 font-medium">Friends</span>
            </div>
            <div className="text-[9px] text-purple-400/80 mt-1">
              ₹{settings.referralReward} per referral reward
            </div>
          </div>

          {/* Total Referral Earnings */}
          <div className="bg-slate-950/70 border border-emerald-900/30 rounded-xl p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-semibold">Referral Earnings</span>
              <Coins className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-xl font-extrabold text-emerald-400">₹{(user.referralEarnings || 0).toFixed(2)}</span>
            </div>
            <div className="text-[9px] text-emerald-300/80 mt-1 font-mono">
              ≈ {((user.referralEarnings || 0) * 200).toLocaleString()} 🪙 Coins
            </div>
          </div>
        </div>

        <div className="bg-purple-950/30 border border-purple-800/30 p-2.5 rounded-xl flex items-center justify-between text-[11px] text-slate-300 relative z-10">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Referral Code: <strong className="font-mono text-amber-300">{user.id}</strong></span>
          </div>
          <button
            onClick={() => onNavigate('refer')}
            className="text-purple-300 hover:text-white font-bold underline text-[10px]"
          >
            Share & Copy Link
          </button>
        </div>
      </div>

      {/* Daily Ad Progress Tracker */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-md">
        <div className="flex items-center justify-between text-xs font-semibold mb-2">
          <div className="flex items-center gap-2 text-slate-200">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <span>Today's Ad Quota</span>
          </div>
          <span className="text-cyan-400">
            {user.adsWatchedToday} / {settings.dailyAdLimit} Ads
          </span>
        </div>

        <div className="w-full bg-slate-950 rounded-full h-3 p-0.5 border border-slate-800">
          <div
            className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full rounded-full transition-all duration-500 shadow-sm"
            style={{ width: `${adLimitProgress}%` }}
          ></div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
          <span>Earned today: ₹{(user.adsWatchedToday * settings.perAdReward).toFixed(2)}</span>
          <span>Remaining: {settings.dailyAdLimit - user.adsWatchedToday} ads</span>
        </div>
      </div>

      {/* Lucky Spin Wheel Booster Widget */}
      <div className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-yellow-950/80 border border-amber-500/40 rounded-2xl p-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-extrabold text-lg shadow-sm">
            🎰
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Lucky Spin Wheel</span>
              <span className="bg-amber-500 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded">Free Spins</span>
            </div>
            <div className="text-[11px] text-slate-300">Spin wheel & win up to 500 Coins (₹2.50)</div>
          </div>
        </div>

        <button
          onClick={() => setShowSpinModal(true)}
          className="bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
        >
          <Sparkles className="w-4 h-4 fill-slate-950" />
          <span>Spin Now</span>
        </button>
      </div>

      {/* Daily Check-in Bonus Widget */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-200">Daily Check-in Streak</div>
            <div className="text-[11px] text-slate-400">Claim +₹2 free daily bonus</div>
          </div>
        </div>

        <button
          disabled={dailyClaimed || streakClaiming}
          onClick={() => {
            setStreakClaiming(true);
            setTimeout(() => {
              onClaimDailyStreak();
              setStreakClaiming(false);
            }, 500);
          }}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
            dailyClaimed
              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 cursor-default'
              : 'bg-amber-500 hover:bg-amber-400 text-slate-950 active:scale-95 shadow-md'
          }`}
        >
          {dailyClaimed ? 'Claimed ✓' : streakClaiming ? 'Claiming...' : 'Claim ₹2'}
        </button>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onNavigate('refer')}
          className="bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 p-3.5 rounded-2xl text-left transition-all flex items-start gap-3 cursor-pointer"
        >
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-200">Refer & Earn</div>
            <div className="text-[11px] text-slate-400 mt-0.5">₹{settings.referralReward} per ref + {settings.referralCommissionPct}% comm</div>
          </div>
        </button>

        <button
          onClick={() => onNavigate('withdraw')}
          className="bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 p-3.5 rounded-2xl text-left transition-all flex items-start gap-3 cursor-pointer"
        >
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-200">UPI & Bank Payouts</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Fast Approval via #1</div>
          </div>
        </button>
      </div>

      {/* Task Milestones Progress Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-md">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold text-slate-200">Daily Earning Milestones</h3>
          </div>
          <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 font-bold">
            Bonus Multipliers
          </span>
        </div>

        <div className="space-y-2.5 text-xs">
          {/* Milestone 1: First 5 Ads Today */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-200">Watch 5 Ads Today</span>
                {user.adsWatchedToday >= 5 ? (
                  <span className="bg-emerald-500/20 text-emerald-400 text-[9px] px-2 py-0.5 rounded-full font-bold">Completed ✓</span>
                ) : (
                  <span className="bg-slate-800 text-slate-400 text-[9px] px-2 py-0.5 rounded-full">{user.adsWatchedToday}/5</span>
                )}
              </div>
              <p className="text-[10px] text-slate-400">Reward: 50 Bonus Coins (₹0.25)</p>
            </div>
            <button
              onClick={() => onNavigate('watch')}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                user.adsWatchedToday >= 5
                  ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                  : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow'
              }`}
            >
              {user.adsWatchedToday >= 5 ? 'Done' : 'Watch Ads'}
            </button>
          </div>

          {/* Milestone 2: Lifetime Ads Payout Threshold */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-200">Unlock Payouts ({settings.minAdsWatchForWithdrawal || 100} Ads)</span>
                {(user.totalAdsWatched || 0) >= (settings.minAdsWatchForWithdrawal || 100) ? (
                  <span className="bg-emerald-500/20 text-emerald-400 text-[9px] px-2 py-0.5 rounded-full font-bold">Unlocked ⚡</span>
                ) : (
                  <span className="bg-amber-500/20 text-amber-400 text-[9px] px-2 py-0.5 rounded-full font-bold">
                    {user.totalAdsWatched || 0}/{settings.minAdsWatchForWithdrawal || 100}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400">Watch ads to enable instant UPI/Bank withdrawals</p>
            </div>
            <button
              onClick={() => onNavigate('withdraw')}
              className="px-3 py-1.5 bg-purple-900/40 border border-purple-700/50 text-purple-300 hover:text-white rounded-xl text-[11px] font-bold"
            >
              Withdraw
            </button>
          </div>
        </div>
      </div>

      {/* Top Earners Leaderboard Widget */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-md">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold text-slate-200">Top Community Earners</h3>
          </div>
          <span className="text-[10px] text-cyan-400 font-semibold flex items-center gap-1">
            <Flame className="w-3 h-3 text-amber-500 animate-bounce" />
            Live Rankings
          </span>
        </div>

        {loadingLeaderboard ? (
          <div className="text-center py-4 text-xs text-slate-500">Loading top community earners...</div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-4 text-xs text-slate-500">No leaderboard entries available yet.</div>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((u) => {
              const isGold = u.rank === 1;
              const isSilver = u.rank === 2;
              const isBronze = u.rank === 3;
              const isSelf = u.id === user.id;

              return (
                <div
                  key={u.id}
                  className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                    isSelf
                      ? 'bg-purple-950/60 border-purple-500/50 shadow-md'
                      : isGold
                      ? 'bg-amber-950/30 border-amber-500/40'
                      : isSilver
                      ? 'bg-slate-800/40 border-slate-700/40'
                      : isBronze
                      ? 'bg-orange-950/30 border-orange-500/30'
                      : 'bg-slate-950/70 border-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-6 h-6 rounded-lg font-black text-[11px] flex items-center justify-center ${
                      isGold ? 'bg-amber-500 text-slate-950 shadow-md' :
                      isSilver ? 'bg-slate-300 text-slate-950 shadow-md' :
                      isBronze ? 'bg-amber-700 text-white shadow-md' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {u.rank === 1 ? '🥇' : u.rank === 2 ? '🥈' : u.rank === 3 ? '🥉' : `#${u.rank}`}
                    </div>

                    <div>
                      <div className="font-bold text-slate-200 flex items-center gap-1">
                        <span>{u.firstName}</span>
                        {isSelf && <span className="text-[9px] bg-purple-500 text-white font-extrabold px-1.5 rounded">You</span>}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">{u.username} • {u.totalAdsWatched} Ads Watched</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-extrabold text-emerald-400 font-mono text-xs">₹{u.totalEarned.toFixed(2)}</div>
                    <div className="text-[9px] text-slate-400 font-mono">{(u.totalCoinsEarned || 0).toLocaleString()} 🪙</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Withdrawals Tracker */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            Your Recent Transactions
          </h3>
          <button
            onClick={() => onNavigate('withdraw')}
            className="text-[11px] text-cyan-400 hover:underline flex items-center gap-0.5 font-medium"
          >
            View All <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

        {userWithdrawals.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-slate-800 rounded-xl">
            <p className="text-xs text-slate-400">No withdrawal requests yet.</p>
            <p className="text-[11px] text-slate-500 mt-1">Watch ads to reach ₹{settings.minWithdrawal} minimum balance!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {userWithdrawals.slice(0, 3).map((w) => (
              <div
                key={w.id}
                className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-semibold text-slate-200">
                    Withdrawal #{w.id} ({w.method})
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {new Date(w.requestedAt).toLocaleDateString()} • {w.method === 'UPI' ? w.upiId : 'Bank Account'}
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-slate-100">₹{w.amount.toFixed(2)}</div>
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold mt-0.5 ${
                      w.status === 'APPROVED'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : w.status === 'REJECTED'
                        ? 'bg-rose-950 text-rose-400 border border-rose-800'
                        : 'bg-amber-950 text-amber-400 border border-amber-800'
                    }`}
                  >
                    {w.status === 'APPROVED' ? 'PAID ⚡' : w.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showHistoryModal && (
        <TransactionHistoryModal
          userId={user.id}
          onClose={() => setShowHistoryModal(false)}
        />
      )}

      {showSpinModal && (
        <SpinWheel
          user={user}
          onSpinCompleted={async (prizeCoins, label) => {
            await api.spinWheel(user.id, prizeCoins);
            if (onRefreshUserData) onRefreshUserData();
          }}
          onClose={() => setShowSpinModal(false)}
        />
      )}

      <LiveWithdrawalTicker withdrawals={withdrawals} />
    </div>
  );
};
