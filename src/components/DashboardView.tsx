import React, { useState } from 'react';
import { User, SystemSettings, WithdrawalRequest } from '../types';
import { Wallet, Tv, UserPlus, Gift, ArrowUpRight, TrendingUp, Sparkles, CheckCircle, Clock } from 'lucide-react';

interface DashboardViewProps {
  user: User;
  settings: SystemSettings;
  withdrawals: WithdrawalRequest[];
  onNavigate: (tab: 'home' | 'watch' | 'refer' | 'withdraw' | 'admin') => void;
  onClaimDailyStreak: () => void;
  dailyClaimed: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  settings,
  withdrawals,
  onNavigate,
  onClaimDailyStreak,
  dailyClaimed
}) => {
  const [streakClaiming, setStreakClaiming] = useState(false);

  // User's withdrawal history
  const userWithdrawals = withdrawals.filter(w => w.userId === user.id);
  const pendingCount = userWithdrawals.filter(w => w.status === 'PENDING').length;
  const pendingAmount = userWithdrawals
    .filter(w => w.status === 'PENDING')
    .reduce((sum, w) => sum + w.amount, 0);

  const adLimitProgress = Math.min(100, (user.adsWatchedToday / (settings.dailyAdLimit || 20)) * 100);

  return (
    <div className="space-[#space-y-4] space-y-4 pb-4">
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

        {/* Main Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mt-4">
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
          className="bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 p-3.5 rounded-2xl text-left transition-all flex items-start gap-3"
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
          className="bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 p-3.5 rounded-2xl text-left transition-all flex items-start gap-3"
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
    </div>
  );
};
