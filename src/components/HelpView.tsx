import React from 'react';
import { HelpCircle, ShieldCheck, MessageCircle, AlertTriangle, Users, ExternalLink, CheckCircle2 } from 'lucide-react';
import { SystemSettings } from '../types';
import { getTelegramGroupLink, getTelegramGroupDisplay } from '../utils/telegram';

interface HelpViewProps {
  settings: SystemSettings;
}

export const HelpView: React.FC<HelpViewProps> = ({ settings }) => {
  return (
    <div className="space-y-4 pb-16">
      {/* Help Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-slate-950 border border-blue-800/40 rounded-2xl p-4 flex items-center justify-between shadow-xl">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-semibold">
            <HelpCircle className="w-4 h-4" />
            VYRNXY ADS Help & Knowledge Base
          </div>
          <h2 className="text-lg font-bold text-white mt-1">Help & Support Center</h2>
          <p className="text-xs text-slate-400">Everything you need to know about earning & payouts.</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
          <HelpCircle className="w-6 h-6" />
        </div>
      </div>

      {/* Official Telegram Support Contact */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <h3 className="text-xs font-bold text-white flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-cyan-400" />
          Official Telegram Support Handle
        </h3>
        <p className="text-xs text-slate-300">
          Have an issue with your withdrawal or account balance? Contact our 24/7 support admin directly on Telegram:
        </p>
        <button
          onClick={() => window.open(getTelegramGroupLink(settings.fastGroupUsername), '_blank')}
          className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-98"
        >
          <ExternalLink className="w-4 h-4" />
          <span>Contact Support ({getTelegramGroupDisplay(settings.fastGroupUsername)})</span>
        </button>
      </div>

      {/* Frequently Asked Questions */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <h3 className="text-xs font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Frequently Asked Questions (FAQ)
        </h3>

        <div className="space-y-3 text-xs">
          {/* FAQ 1: 100 Ad Requirement */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
            <div className="font-bold text-cyan-300 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Why do I need 100 watched ads to withdraw?</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              To prevent bot spam, multi-account fraud, and fake referrals, users are strictly required to personally watch at least 100 Monetag ads before initiating their first payout.
            </p>
          </div>

          {/* FAQ 2: 50 Ad Referral Milestone */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
            <div className="font-bold text-cyan-300 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span>When is the referral bonus credited?</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              The flat ₹{settings.referralReward} referral bonus is automatically credited to the inviter's wallet as soon as the referred user reaches their 50th watched ad.
            </p>
          </div>

          {/* FAQ 3: Fast Withdrawal Group */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
            <div className="font-bold text-cyan-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>What is the #1 Fast Approval Group?</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Every withdrawal request automatically posts a hashtag notification e.g., <code className="text-amber-300">{settings.fastApprovalHashtag || '#1'} 1002 PASS</code> into our private admin team group. Joining the fast group enables instant automated approvals!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
