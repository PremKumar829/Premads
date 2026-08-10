import React, { useState } from 'react';
import { User, SystemSettings, GroupMessage, WithdrawalRequest } from '../types';
import { MessageSquare, Send, Zap, CheckCircle2, XCircle, Shield, AlertTriangle, Copy, Check } from 'lucide-react';

interface FastGroupViewProps {
  currentUser: User;
  settings: SystemSettings;
  groupMessages: GroupMessage[];
  withdrawals: WithdrawalRequest[];
  onSendMessage: (text: string, sender?: string, senderRole?: string) => Promise<any>;
  onProcessWithdrawal: (id: string, action: 'PASS' | 'APPROVE' | 'REJECT', processedBy?: string, reason?: string) => Promise<any>;
}

export const FastGroupView: React.FC<FastGroupViewProps> = ({
  currentUser,
  settings,
  groupMessages,
  withdrawals,
  onSendMessage,
  onProcessWithdrawal
}) => {
  const [inputText, setInputText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const hashtag = settings.fastApprovalHashtag || '#1';

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const txt = inputText.trim();

    if (txt.startsWith(hashtag) && currentUser.role === 'USER') {
      alert("⚠️ Access Denied: Only Admins & CEO can execute withdrawal pass commands!");
      return;
    }

    setInputText('');
    setSubmitting(true);
    try {
      await onSendMessage(txt, `${currentUser.firstName} (${currentUser.role})`, currentUser.role);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickCommand = (reqId: string, cmd: 'PASS' | 'REJECT') => {
    const text = `${hashtag} ${reqId} ${cmd}`;
    setInputText(text);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="space-y-4 pb-16">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-950 via-slate-900 to-slate-950 border border-cyan-800/40 rounded-2xl p-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-cyan-300 font-semibold">
            <Shield className="w-4 h-4 text-amber-400" />
            {settings.fastGroupTitle || 'AdEarn Private Fast Approvals VIP Group'}
          </div>
          <h2 className="text-lg font-bold text-white mt-1">Hashtag {hashtag} Fast Approval Channel</h2>
          <p className="text-xs text-slate-400">
            Admins send <code className="text-cyan-300 font-mono font-bold bg-slate-950 px-1 py-0.5 rounded">{hashtag} &lt;REQ_ID&gt; PASS</code> to approve payouts instantly.
          </p>
        </div>

        <div className="text-right bg-slate-950 p-2.5 rounded-xl border border-slate-800">
          <div className="text-[10px] text-slate-400">Prefix</div>
          <div className="text-sm font-extrabold text-cyan-400 font-mono">{hashtag}</div>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 h-[420px] overflow-y-auto space-y-3 font-sans">
        {groupMessages.map((msg) => {
          const isNotification = msg.isSystemNotification;
          const req = msg.withdrawalRequestId
            ? withdrawals.find(w => w.id === msg.withdrawalRequestId)
            : null;

          return (
            <div
              key={msg.id}
              className={`p-3.5 rounded-2xl border text-xs leading-relaxed space-y-2 ${
                isNotification
                  ? 'bg-slate-950/80 border-cyan-800/50 text-slate-200'
                  : 'bg-slate-950 border-slate-800 text-slate-300'
              }`}
            >
              {/* Message Sender Header */}
              <div className="flex items-center justify-between text-[11px] border-b border-slate-800/60 pb-1.5">
                <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                  {msg.sender}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {/* Message Body */}
              <div className="whitespace-pre-wrap font-mono text-[11px] text-slate-200">
                {msg.text}
              </div>

              {/* Attached Request Quick Actions */}
              {req && (
                <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between mt-2">
                  <div>
                    <div className="text-[10px] text-slate-400">
                      Request #{req.id} • {req.method} • <span className="font-bold text-white">₹{req.amount}</span>
                    </div>
                    <div className="text-[10px] text-slate-300 font-mono">
                      {req.method === 'UPI' ? req.upiId : `Bank: ${req.bankDetails?.accountNumber}`}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {req.status === 'PENDING' ? (
                      currentUser.role !== 'USER' ? (
                        <>
                          <button
                            onClick={() => onProcessWithdrawal(req.id, 'PASS', `${currentUser.firstName} (${currentUser.role})`)}
                            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-2.5 py-1 rounded-lg text-[10px] flex items-center gap-1 transition-all active:scale-95 shadow"
                          >
                            <Zap className="w-3 h-3 fill-slate-950" />
                            <span>PASS</span>
                          </button>

                          <button
                            onClick={() => onProcessWithdrawal(req.id, 'REJECT', `${currentUser.firstName} (${currentUser.role})`, 'Rejected by admin in group')}
                            className="bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 px-2 py-1 rounded-lg text-[10px] transition-all"
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <span className="text-[10px] text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded flex items-center gap-1 font-bold">
                          🔒 Admin Only
                        </span>
                      )
                    ) : (
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          req.status === 'APPROVED'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-rose-950 text-rose-400 border border-rose-800'
                        }`}
                      >
                        {req.status === 'APPROVED' ? 'FAST PAID ⚡' : 'REJECTED'}
                      </span>
                    )}

                    <button
                      onClick={() => copyToClipboard(`${hashtag} ${req.id} PASS`, req.id)}
                      className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white"
                      title="Copy Fast Command"
                    >
                      {copiedId === req.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Input Form for Fast Approval Hashtag Commands */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={`Type command e.g. ${hashtag} 1002 PASS or message...`}
          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
        />

        <button
          onClick={handleSend}
          disabled={submitting}
          className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold p-2.5 rounded-xl shadow transition-all active:scale-95 shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
