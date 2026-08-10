import React, { useState } from 'react';
import { User, SystemSettings } from '../types';
import { UserPlus, Copy, Share2, Check, Gift, Sparkles, Users, Award, ShieldCheck } from 'lucide-react';

interface ReferralViewProps {
  user: User;
  settings: SystemSettings;
  allUsers: User[];
}

export const ReferralView: React.FC<ReferralViewProps> = ({
  user,
  settings,
  allUsers
}) => {
  const [copied, setCopied] = useState(false);

  // Referral link
  const botUser = settings.botUsername || 'AdEarn_WatchEarn_Bot';
  const referralLink = `https://t.me/${botUser}?start=ref_${user.id}`;

  // Find referred users
  const myReferrals = allUsers.filter(u => u.referredBy === user.id);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareTelegram = () => {
    const text = `🔥 Join AdEarn Bot & Get ₹${settings.welcomeBonus} Welcome Bonus instantly! Watch ads to earn ₹${settings.perAdReward} per view. Minimum payout ₹${settings.minWithdrawal} via UPI/Bank!`;
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(text)}`;
    window.open(shareUrl, '_blank');
  };

  return (
    <div className="space-y-4 pb-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-slate-950 border border-purple-800/40 rounded-2xl p-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-purple-300 font-semibold">
            <Gift className="w-4 h-4 text-purple-400" />
            Conditional Referral Program
          </div>
          <h2 className="text-sm sm:text-base font-bold text-white mt-1 leading-snug">
            Earn bonus when your friend watches 50 ads + get 10% lifetime commission!
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Flat bonus: ₹{settings.referralReward} ({(settings.referralReward * 200).toLocaleString()} Coins) credited after friend's 50th ad watch.
          </p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
          <Sparkles className="w-6 h-6 animate-pulse" />
        </div>
      </div>

      {/* Referral Link Copy Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <UserPlus className="w-4 h-4 text-cyan-400" />
          Your Unique Referral Link
        </label>

        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={referralLink}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none"
          />

          <button
            onClick={handleCopy}
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all active:scale-95 shrink-0"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>

        {/* BOT START COMMAND GENERATOR FOR DIRECT TELEGRAM CHAT */}
        <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-semibold flex items-center gap-1">
              🤖 Telegram Bot Command Format:
            </span>
            <span className="text-cyan-400 font-mono text-[10px]">@{botUser}</span>
          </div>
          <div className="flex items-center justify-between bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 font-mono text-xs text-amber-300">
            <span>/start ref_{user.id}</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`/start ref_${user.id}`);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 py-0.5 rounded font-sans"
            >
              Copy Command
            </button>
          </div>
        </div>

        <button
          onClick={handleShareTelegram}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-98"
        >
          <Share2 className="w-4 h-4" />
          <span>Share Link on Telegram</span>
        </button>
      </div>

      {/* Reward Rules Breakdown */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-2">
              <Award className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-slate-200">Active Referral Bonus</div>
            <div className="text-lg font-extrabold text-emerald-400 mt-0.5">₹{settings.referralReward}.00</div>
          </div>
          <p className="text-[10px] text-amber-300/90 mt-2 font-medium bg-amber-950/40 p-1.5 rounded-lg border border-amber-500/30">
            ⚡ Credited automatically when friend completes <strong>50 ads</strong>!
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center mb-2">
              <Users className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-slate-200">Ad Commission</div>
            <div className="text-lg font-extrabold text-purple-400 mt-0.5">{settings.referralCommissionPct}%</div>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
            Earn instant lifetime commission on every single ad watched by your referrals!
          </p>
        </div>
      </div>

      {/* My Referral History & Progress */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-cyan-400" />
            Your Referred Team ({myReferrals.length})
          </h3>
          <span className="text-[11px] text-cyan-400 font-bold">
            Total Earned: ₹{user.referralEarnings.toFixed(2)}
          </span>
        </div>

        {myReferrals.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-slate-800 rounded-xl">
            <p className="text-xs text-slate-400">No referrals yet.</p>
            <p className="text-[10px] text-slate-500 mt-1">
              Share your link! Friends get ₹{settings.welcomeBonus} bonus, and you unlock ₹{settings.referralReward} when they watch 50 ads!
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {myReferrals.map((ref) => {
              const watched = ref.totalAdsWatched || 0;
              const isQualified = watched >= 50 || ref.referralBonusCredited;
              return (
                <div
                  key={ref.id}
                  className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-cyan-950 text-cyan-400 font-bold flex items-center justify-center text-xs border border-cyan-800 shrink-0">
                        {ref.firstName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-200">{ref.firstName}</div>
                        <div className="text-[10px] text-slate-400">@{ref.username} • ID: {ref.id}</div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {isQualified ? (
                        <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] px-2 py-0.5 rounded-full font-bold">
                          ✅ +₹{settings.referralReward} Credited
                        </span>
                      ) : (
                        <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] px-2 py-0.5 rounded-full font-bold">
                          ⏳ Pending (50 Ads Req)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Per Referral Ad Progress Bar */}
                  <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-400">Friend's Ad Watch Progress:</span>
                      <span className={isQualified ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                        {watched} / 50 ads {isQualified && "(Active User Verified)"}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className={`h-full transition-all duration-300 rounded-full ${isQualified ? 'bg-emerald-400' : 'bg-amber-400'}`}
                        style={{ width: `${Math.min(100, (watched / 50) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
