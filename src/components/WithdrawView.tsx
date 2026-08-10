import React, { useState } from 'react';
import { User, SystemSettings, WithdrawalRequest, WithdrawalMethod } from '../types';
import { getTelegramGroupLink, getTelegramGroupDisplay } from '../utils/telegram';
import { Wallet, CreditCard, Building2, AlertCircle, CheckCircle2, Clock, ShieldCheck, Sparkles, Users, ExternalLink, Lock } from 'lucide-react';

interface WithdrawViewProps {
  user: User;
  settings: SystemSettings;
  withdrawals: WithdrawalRequest[];
  onRequestWithdrawal: (payload: {
    userId: string;
    amount: number;
    method: WithdrawalMethod;
    upiId?: string;
    bankDetails?: { accountNumber: string; ifscCode: string; accountHolder: string; bankName: string };
  }) => Promise<any>;
  onVerifyGroupJoin?: () => Promise<any>;
}

export const WithdrawView: React.FC<WithdrawViewProps> = ({
  user,
  settings,
  withdrawals,
  onRequestWithdrawal,
  onVerifyGroupJoin
}) => {
  const [method, setMethod] = useState<WithdrawalMethod>('UPI');
  const [amount, setAmount] = useState<string>(settings.minWithdrawal?.toString() || '50');
  const [upiId, setUpiId] = useState('user@okicici');

  // Bank Form State
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccount, setConfirmAccount] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [accountHolder, setAccountHolder] = useState(user.firstName);
  const [bankName, setBankName] = useState('State Bank of India');

  const [loading, setLoading] = useState(false);
  const [verifyingGroup, setVerifyingGroup] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const myWithdrawals = withdrawals.filter(w => w.userId === user.id);
  const lifetimeAds = user.totalAdsWatched || user.watchedAdIds?.length || 0;
  const isWithdrawLocked = lifetimeAds < 100;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // STRICT ANTI-FRAUD CONDITION 1: 100 Ads Watched Minimum
    if (isWithdrawLocked) {
      setErrorMsg(`⚠️ Action Required: You must personally watch at least 100 ads to unlock payouts. (Watched: ${lifetimeAds}/100)`);
      return;
    }

    if (!user.hasJoinedFastGroup) {
      setErrorMsg(`You must join the Telegram Fast Withdrawal group (${getTelegramGroupDisplay(settings.fastGroupUsername)}) before requesting withdrawals.`);
      return;
    }

    const numAmount = parseFloat(amount);
    const minPayout = settings.minWithdrawal || 50;

    if (isNaN(numAmount) || numAmount < minPayout) {
      setErrorMsg(`Minimum withdrawal amount is ₹${minPayout} (10,000 Coins)`);
      return;
    }

    if (numAmount > user.balance) {
      setErrorMsg(`Insufficient wallet balance. Available balance is ₹${user.balance.toFixed(2)} (${(user.coins || 0).toLocaleString()} Coins)`);
      return;
    }

    if (method === 'UPI') {
      if (!upiId || !upiId.includes('@')) {
        setErrorMsg('Please enter a valid UPI VPA ID (e.g. name@upi)');
        return;
      }
    } else {
      if (!accountNumber || accountNumber !== confirmAccount) {
        setErrorMsg('Bank account numbers do not match');
        return;
      }
      if (!ifscCode || ifscCode.length < 5) {
        setErrorMsg('Please enter a valid 11-digit Bank IFSC code');
        return;
      }
      if (!accountHolder) {
        setErrorMsg('Please enter Account Holder name');
        return;
      }
    }

    setLoading(true);
    try {
      const res = await onRequestWithdrawal({
        userId: user.id,
        amount: numAmount,
        method,
        upiId: method === 'UPI' ? upiId : undefined,
        bankDetails: method === 'BANK' ? {
          accountNumber,
          ifscCode,
          accountHolder,
          bankName
        } : undefined
      });

      setSuccessMsg(`Withdrawal request #${res.request.id} for ₹${numAmount} submitted! Dispatched to Fast Approval Group.`);
      setAmount(settings.minWithdrawal?.toString() || '100');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit withdrawal request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 pb-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 border border-emerald-800/40 rounded-2xl p-4 flex items-center justify-between shadow-xl">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Instant Fast Payout System
          </div>
          <h2 className="text-lg font-bold text-white mt-1">UPI & Bank Payouts</h2>
          <p className="text-xs text-slate-400">Withdraw earnings directly to your UPI ID or Bank Account.</p>
        </div>
        <div className="text-right bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 shrink-0">
          <div className="text-[10px] text-slate-400">Min Threshold</div>
          <div className="text-sm font-extrabold text-emerald-400">₹{settings.minWithdrawal}.00</div>
        </div>
      </div>

      {/* STRICT ANTI-FRAUD WITHDRAWAL CONDITION (100 ADS MINIMUM) */}
      <div className={`p-4 rounded-2xl border shadow-xl transition-all ${
        (user.totalAdsWatched || 0) >= 100
          ? 'bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-950 border-emerald-500/50'
          : 'bg-gradient-to-r from-amber-950/80 via-slate-900 to-slate-950 border-amber-500/50'
      }`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
              (user.totalAdsWatched || 0) >= 100
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}>
              {(user.totalAdsWatched || 0) >= 100 ? <ShieldCheck className="w-5 h-5 text-emerald-400" /> : <Lock className="w-5 h-5 text-amber-400" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xs font-bold text-white">Withdrawal Progress Tracker</h3>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                  (user.totalAdsWatched || 0) >= 100
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}>
                  {(user.totalAdsWatched || 0) >= 100 ? '✅ 100/100 Ads Verified' : `🔒 ${user.totalAdsWatched || 0}/100 Ads Watched`}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1">
                {(user.totalAdsWatched || 0) >= 100
                  ? '🎉 Anti-Fraud Check Passed! You have watched 100+ ads. Payout requests are unlocked.'
                  : `⚠️ Action Required: You must personally watch at least 100 ads to unlock payouts. (Watched: ${user.totalAdsWatched || 0}/100)`
                }
              </p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3.5 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-semibold">
            <span className="text-slate-300 font-bold">Ads Watched: {user.totalAdsWatched || 0} / 100 Minimum</span>
            <span className={(user.totalAdsWatched || 0) >= 100 ? 'text-emerald-400' : 'text-amber-400'}>
              {Math.min(100, Math.round(((user.totalAdsWatched || 0) / 100) * 100))}%
            </span>
          </div>
          <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                (user.totalAdsWatched || 0) >= 100
                  ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]'
                  : 'bg-gradient-to-r from-amber-500 to-amber-300'
              }`}
              style={{ width: `${Math.min(100, (((user.totalAdsWatched || 0) / 100) * 100))}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* REQUIRED TELEGRAM GROUP JOIN BANNER */}
      {!user.hasJoinedFastGroup && (
        <div className="bg-gradient-to-r from-amber-950/90 via-slate-900 to-slate-950 border border-amber-500/60 rounded-2xl p-4 space-y-3 shadow-xl">
          <div className="flex items-start gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-amber-300">Fast Withdrawal Telegram Group Required</h3>
              <p className="text-[11px] text-slate-300 mt-0.5">
                To submit withdrawal requests and receive instant payment updates, you MUST join our official Fast Approval Group: <strong className="text-amber-200">{getTelegramGroupDisplay(settings.fastGroupUsername)}</strong>.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <a
              href={getTelegramGroupLink(settings.fastGroupUsername)}
              target="_blank"
              rel="noreferrer"
              className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow"
            >
              <span>1. Join Fast Withdrawal Group</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={handleVerifyGroup}
              disabled={verifyingGroup}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-1.5 shadow"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{verifyingGroup ? 'Verifying...' : '2. Verify Membership'}</span>
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

      {successMsg && (
        <div className="bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 p-3.5 rounded-xl text-xs flex items-start gap-2 shadow-lg">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
          <div>
            <div className="font-bold text-emerald-200">Request Sent Successfully!</div>
            <p className="mt-0.5 text-emerald-300/80">{successMsg}</p>
          </div>
        </div>
      )}

      {/* Wallet Balance Summary Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-medium">Available Balance</div>
            <div className="text-base font-extrabold text-white">₹{user.balance.toFixed(2)}</div>
          </div>
        </div>

        <button
          onClick={() => setAmount(user.balance.toFixed(0))}
          className="bg-cyan-950 text-cyan-300 border border-cyan-800/50 hover:bg-cyan-900 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
        >
          Max (₹{Math.floor(user.balance)})
        </button>
      </div>

      {/* Withdrawal Method Selector & Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4 relative">
        {!user.hasJoinedFastGroup && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[2px] rounded-2xl z-10 flex flex-col items-center justify-center p-6 text-center">
            <Lock className="w-8 h-8 text-amber-400 mb-2" />
            <h3 className="text-sm font-bold text-white">Payout Form Locked</h3>
            <p className="text-xs text-slate-400 max-w-xs mt-1">
              Join the official Fast Withdrawal Telegram group above to unlock payout requests.
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setMethod('UPI')}
            className={`py-3 px-4 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
              method === 'UPI'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-md'
                : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>UPI Transfer</span>
          </button>

          <button
            type="button"
            onClick={() => setMethod('BANK')}
            className={`py-3 px-4 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
              method === 'BANK'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-md'
                : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Bank Account</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 pt-2">
          {/* Amount Input */}
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1 block">
              Enter Withdrawal Amount (INR ₹)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">₹</span>
              <input
                type="number"
                min={settings.minWithdrawal}
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`Min ₹${settings.minWithdrawal}`}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Minimum payout: ₹{settings.minWithdrawal}. Fee: ₹0.00 (Free)</p>
          </div>

          {/* UPI Fields */}
          {method === 'UPI' ? (
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">
                UPI Virtual Payment Address (VPA)
              </label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="e.g. mobile@upi or username@okicici"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
              <p className="text-[10px] text-slate-500 mt-1">Supported: GPay, PhonePe, Paytm, BHIM, Amazon Pay</p>
            </div>
          ) : (
            /* Bank Account Fields */
            <div className="space-y-2.5">
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block">Account Holder Name</label>
                <input
                  type="text"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  placeholder="Name as on Bank Passbook"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block">Bank Name</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. State Bank of India, HDFC Bank"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1 block">Account Number</label>
                  <input
                    type="password"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="Account Number"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1 block">Confirm Account No.</label>
                  <input
                    type="text"
                    value={confirmAccount}
                    onChange={(e) => setConfirmAccount(e.target.value)}
                    placeholder="Re-enter A/C No"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block">IFSC Code</label>
                <input
                  type="text"
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                  placeholder="e.g. SBIN0001234"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 uppercase font-mono"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !user.hasJoinedFastGroup}
            className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-extrabold py-3.5 px-4 rounded-xl shadow-lg transition-all active:scale-98 flex items-center justify-center gap-2 mt-4"
          >
            <Sparkles className="w-5 h-5 fill-slate-950" />
            <span>{loading ? 'Submitting Request...' : `Confirm Withdrawal ₹${amount || '0'}`}</span>
          </button>
        </form>

        {/* TELEGRAM BOT WITHDRAWAL COMMAND GENERATOR */}
        <div className="bg-slate-950/90 border border-slate-800 p-3 rounded-xl space-y-2 mt-4">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-300 font-semibold flex items-center gap-1.5">
              🤖 Telegram Bot Withdrawal Command Format:
            </span>
            <span className="text-emerald-400 font-mono text-[10px]">@{settings.botUsername || 'AdEarn_WatchEarn_Bot'}</span>
          </div>

          <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 font-mono text-xs text-amber-300 flex items-center justify-between gap-2">
            <span className="truncate">
              /withdraw {amount || settings.minWithdrawal} {method} {method === 'UPI' ? (upiId || 'your@upi') : (accountNumber || '1234567890')}
            </span>
            <button
              type="button"
              onClick={() => {
                const cmd = `/withdraw ${amount || settings.minWithdrawal} ${method} ${method === 'UPI' ? (upiId || 'your@upi') : (accountNumber || '1234567890')}`;
                navigator.clipboard.writeText(cmd);
                alert('Copied Bot Withdrawal Command to clipboard!');
              }}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded text-[10px] font-sans font-bold shrink-0"
            >
              Copy Command
            </button>
          </div>
        </div>
      </div>

      {/* Withdrawal History Log */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
        <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-cyan-400" />
          Your Withdrawal History ({myWithdrawals.length})
        </h3>

        {myWithdrawals.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-slate-800 rounded-xl">
            <p className="text-xs text-slate-400">No payout history found.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {myWithdrawals.map((w) => (
              <div
                key={w.id}
                className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-200">
                    Request #{w.id} • {w.method}
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                      w.status === 'APPROVED'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : w.status === 'REJECTED'
                        ? 'bg-rose-950 text-rose-400 border border-rose-800'
                        : 'bg-amber-950 text-amber-400 border border-amber-800 animate-pulse'
                    }`}
                  >
                    {w.status === 'APPROVED' ? 'APPROVED ⚡' : w.status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Details: {w.method === 'UPI' ? w.upiId : `${w.bankDetails?.bankName} (A/C: ${w.bankDetails?.accountNumber})`}</span>
                  <span className="font-extrabold text-white">₹{w.amount.toFixed(2)}</span>
                </div>

                <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800/60 flex items-center justify-between">
                  <span>Requested: {new Date(w.requestedAt).toLocaleString()}</span>
                  {w.processedBy && <span>Processed by: {w.processedBy}</span>}
                </div>

                {w.rejectionReason && (
                  <div className="text-[10px] text-rose-400 bg-rose-950/40 p-1.5 rounded border border-rose-900/50 mt-1">
                    Reason: {w.rejectionReason}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
