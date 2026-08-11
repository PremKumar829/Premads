import React, { useState, useEffect } from 'react';
import { HelpCircle, ShieldCheck, MessageCircle, AlertTriangle, Users, ExternalLink, CheckCircle2, Send, Headset, Clock, CheckCircle, Sparkles, Bot, RefreshCw, Search, Lightbulb, FileText } from 'lucide-react';
import { SystemSettings, User, SupportTicket } from '../types';
import { getTelegramGroupLink, getTelegramGroupDisplay } from '../utils/telegram';
import { api } from '../services/api';

interface HelpViewProps {
  settings: SystemSettings;
  currentUser?: User;
}

export const HelpView: React.FC<HelpViewProps> = ({ settings, currentUser }) => {
  const [ticketSubject, setTicketSubject] = useState('UPI / Bank Withdrawal Query');
  const [ticketMsg, setTicketMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [ticketSubmitted, setTicketSubmitted] = useState(false);
  const [myTickets, setMyTickets] = useState<SupportTicket[]>([]);

  // Gemini AI FAQ State
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [aiAskedQuestion, setAiAskedQuestion] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const sampleQuestions = [
    "What is the minimum withdrawal limit & coin conversion rate?",
    "Why is there a 100 ad requirement before first withdrawal?",
    "How does the ₹2 referral bonus work?",
    "Which payment methods are supported (UPI/Bank)?",
    "Are auto-clickers or VPN proxies allowed?"
  ];

  const handleAskAi = async (query?: string) => {
    const q = (query !== undefined ? query : aiQuestion).trim();
    if (!q) return;

    if (query !== undefined) {
      setAiQuestion(query);
    }

    setAiLoading(true);
    setAiError(null);
    setAiAskedQuestion(q);

    try {
      const res = await api.askAiFaq(q);
      setAiAnswer(res.answer);
    } catch (err: any) {
      setAiError(err.message || 'Failed to query AI Assistant. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const fetchMyTickets = async () => {
    if (!currentUser) return;
    try {
      const tickets = await api.getSupportTickets(currentUser.id);
      setMyTickets(tickets);
    } catch (err) {
      console.warn('Failed to load tickets', err);
    }
  };

  useEffect(() => {
    fetchMyTickets();
  }, [currentUser]);

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketMsg.trim() || !currentUser) return;

    setSubmitting(true);
    try {
      await api.submitSupportTicket({
        userId: currentUser.id,
        issueType: ticketSubject,
        message: ticketMsg
      });
      setTicketSubmitted(true);
      setTicketMsg('');
      fetchMyTickets();
      setTimeout(() => setTicketSubmitted(false), 5000);
    } catch (err: any) {
      alert(err.message || 'Failed to submit support ticket');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 pb-16 font-sans">
      {/* Help Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-slate-950 border border-blue-800/40 rounded-2xl p-4 flex items-center justify-between shadow-xl">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-semibold">
            <HelpCircle className="w-4 h-4" />
            24/7 Support & Knowledge Base
          </div>
          <h2 className="text-lg font-bold text-white mt-1">Help & Direct Support Center</h2>
          <p className="text-xs text-slate-400">Instant answers, support tickets, and direct Telegram admin contact.</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
          <Headset className="w-6 h-6" />
        </div>
      </div>

      {/* Official Telegram Support Contact */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <h3 className="text-xs font-bold text-white flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-cyan-400" />
          Official 24/7 Telegram Fast Support
        </h3>
        <p className="text-xs text-slate-300">
          Have an urgent issue with your withdrawal or account balance? Connect directly with our admin team:
        </p>
        <button
          onClick={() => window.open(getTelegramGroupLink(settings.fastGroupUsername), '_blank')}
          className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-98"
        >
          <ExternalLink className="w-4 h-4" />
          <span>Open Telegram Support ({getTelegramGroupDisplay(settings.fastGroupUsername)})</span>
        </button>
      </div>

      {/* Interactive Support Ticket Submission Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <h3 className="text-xs font-bold text-white flex items-center gap-2">
          <Headset className="w-4 h-4 text-purple-400" />
          Submit a Direct Support Ticket
        </h3>

        {ticketSubmitted ? (
          <div className="bg-emerald-950/80 border border-emerald-800 text-emerald-300 p-3 rounded-xl text-xs flex items-center gap-2 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Your support query has been logged! Our admin team will respond within 1 hour.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmitTicket} className="space-y-3 text-xs">
            <div>
              <label className="text-[11px] text-slate-400 mb-1 block">Issue Type</label>
              <select
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="Withdrawal Issue">UPI / Bank Withdrawal Query</option>
                <option value="Ad Watching Bonus">Ad Watch Coins Not Credited</option>
                <option value="Referral Reward">Referral Bonus Milestone</option>
                <option value="Account Query">Account / Ban Appeal</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 mb-1 block">Describe Your Problem</label>
              <textarea
                value={ticketMsg}
                onChange={(e) => setTicketMsg(e.target.value)}
                placeholder="Provide details about your query or transaction ID..."
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-500 placeholder-slate-600"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-98"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Submitting Ticket...' : 'Submit Support Ticket'}</span>
            </button>
          </form>
        )}

        {/* My Submitted Tickets List */}
        {myTickets.length > 0 && (
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>My Logged Support Tickets ({myTickets.length})</span>
              <span className="text-cyan-400 font-semibold text-[10px]">Live Updates</span>
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {myTickets.map(t => (
                <div key={t.id} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-[11px]">{t.issueType}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      t.status === 'RESOLVED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {t.status}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px] bg-slate-900/60 p-2 rounded-lg font-mono">{t.message}</p>
                  {t.reply && (
                    <div className="bg-purple-950/40 border border-purple-800/40 p-2 rounded-lg text-[11px] space-y-0.5">
                      <span className="text-purple-300 font-bold flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-purple-400" />
                        Admin Reply:
                      </span>
                      <p className="text-slate-200">{t.reply}</p>
                    </div>
                  )}
                  <div className="text-[10px] text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(t.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* PRIME ASSISTANT POLICY & FAQ CARD */}
      <div className="bg-gradient-to-br from-slate-900 via-purple-950/40 to-slate-900 border border-purple-500/30 rounded-2xl p-4 space-y-4 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between border-b border-purple-500/20 pb-3 relative z-10">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-extrabold text-white">Prime Assistant</h3>
                <span className="text-[9px] bg-purple-500/20 border border-purple-500/40 text-purple-300 px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wider flex items-center gap-1">
                  <Bot className="w-2.5 h-2.5 text-purple-300" />
                  Live FAQ
                </span>
              </div>
              <p className="text-[10px] text-slate-300">Instant answers based on official platform & withdrawal policies.</p>
            </div>
          </div>
        </div>

        {/* Suggestion Prompt Chips */}
        <div className="space-y-1.5 relative z-10">
          <div className="flex items-center gap-1.5 text-[10px] text-purple-300 font-bold">
            <Lightbulb className="w-3 h-3 text-amber-400" />
            <span>Popular Quick Questions:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {sampleQuestions.map((sq, i) => (
              <button
                key={i}
                onClick={() => handleAskAi(sq)}
                disabled={aiLoading}
                className="text-[10px] bg-slate-950/80 hover:bg-purple-900/40 border border-slate-800 hover:border-purple-500/50 text-slate-300 hover:text-white px-2.5 py-1 rounded-xl transition-all text-left flex items-center gap-1 active:scale-98 cursor-pointer disabled:opacity-50"
              >
                <Search className="w-2.5 h-2.5 text-purple-400 shrink-0" />
                <span>{sq}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Input & Ask Button Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAskAi();
          }}
          className="space-y-2 relative z-10"
        >
          <div className="relative flex items-center">
            <input
              type="text"
              value={aiQuestion}
              onChange={(e) => setAiQuestion(e.target.value)}
              placeholder="Ask anything about withdrawal rules, coins, referral payouts..."
              className="w-full bg-slate-950/90 border border-purple-500/30 rounded-xl pl-3 pr-24 py-2.5 text-xs text-white focus:outline-none focus:border-purple-400 placeholder-slate-500 shadow-inner"
            />
            <button
              type="submit"
              disabled={aiLoading || !aiQuestion.trim()}
              className="absolute right-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 text-white font-extrabold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              {aiLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Asking...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Ask Assistant</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* AI Answer Result Banner */}
        {aiLoading && (
          <div className="bg-slate-950/90 border border-purple-500/40 rounded-xl p-3.5 space-y-2 animate-pulse relative z-10">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
              <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />
              <span>Prime Assistant is analyzing platform rules & policies...</span>
            </div>
            <div className="h-3 bg-purple-900/30 rounded w-3/4" />
            <div className="h-3 bg-purple-900/20 rounded w-1/2" />
          </div>
        )}

        {aiError && (
          <div className="bg-rose-950/80 border border-rose-800 text-rose-300 p-3 rounded-xl text-xs flex items-start justify-between gap-2 relative z-10">
            <div className="flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{aiError}</span>
            </div>
            <button
              onClick={() => handleAskAi()}
              className="px-2 py-1 bg-rose-900 border border-rose-700 text-white rounded-lg text-[10px] font-bold"
            >
              Retry
            </button>
          </div>
        )}

        {aiAnswer && !aiLoading && (
          <div className="bg-slate-950/90 border border-purple-500/40 rounded-xl p-3.5 space-y-2.5 text-xs relative z-10 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-200">
                <FileText className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-slate-300 font-normal">Q:</span>
                <span className="text-amber-300">{aiAskedQuestion}</span>
              </div>
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                <CheckCircle2 className="w-3 h-3" />
                Verified Policy
              </span>
            </div>

            <div className="text-slate-200 text-xs leading-relaxed whitespace-pre-wrap font-sans space-y-1 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
              {aiAnswer}
            </div>

            <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
              <span>Powered by Prime Assistant</span>
              <button
                onClick={() => {
                  setAiAnswer(null);
                  setAiAskedQuestion(null);
                  setAiQuestion('');
                }}
                className="text-purple-400 hover:text-purple-300 font-bold underline"
              >
                Clear Answer
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Frequently Asked Questions */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <h3 className="text-xs font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Frequently Asked Questions (FAQ)
        </h3>

        <div className="space-y-3 text-xs">
          {/* FAQ 1: Minimum Ads Threshold */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
            <div className="font-bold text-cyan-300 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Why is there a minimum ad watch requirement for withdrawals?</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              To ensure genuine traffic for sponsors and prevent multi-account bot abuse, users must personally watch the minimum required Monetag ads before requesting payouts.
            </p>
          </div>

          {/* FAQ 2: Referral Milestone */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
            <div className="font-bold text-cyan-300 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span>When is the referral bonus credited?</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              The direct ₹{settings.referralReward} referral bonus is automatically credited to your balance when your referred friend reaches their 50th watched ad.
            </p>
          </div>

          {/* FAQ 3: Fast Approval Group */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
            <div className="font-bold text-cyan-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>What is the #1 Fast Approval Group?</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Every withdrawal request automatically posts a hashtag notification into our private group e.g. <code className="text-amber-300">{settings.fastApprovalHashtag || '#1'} 1002 PASS</code> for instant automated approvals!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
