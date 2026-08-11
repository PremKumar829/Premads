import React, { useState, useEffect } from 'react';
import { TransactionItem } from '../types';
import { api } from '../services/api';
import { History, ArrowUpRight, ArrowDownLeft, Tv, Gift, Users, AlertTriangle, X, RefreshCw, Calendar, Coins } from 'lucide-react';

interface TransactionHistoryModalProps {
  userId: string;
  onClose: () => void;
}

export const TransactionHistoryModal: React.FC<TransactionHistoryModalProps> = ({
  userId,
  onClose
}) => {
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'EARNINGS' | 'DEDUCTIONS'>('ALL');

  useEffect(() => {
    loadTransactions();
  }, [userId]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const data = await api.getUserTransactions(userId);
      setTransactions(data || []);
    } catch (err) {
      console.error('Failed to load transaction history:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTxs = transactions.filter(t => {
    if (filter === 'EARNINGS') return t.coins > 0;
    if (filter === 'DEDUCTIONS') return t.coins < 0 || t.type === 'ADMIN_DEDUCTION';
    return true;
  });

  const getTxIcon = (type: string) => {
    switch (type) {
      case 'DAILY_CHECKIN':
        return <Gift className="w-4 h-4 text-purple-400" />;
      case 'AD_WATCH':
        return <Tv className="w-4 h-4 text-cyan-400" />;
      case 'REFERRAL_BONUS':
      case 'COMMISSION':
        return <Users className="w-4 h-4 text-emerald-400" />;
      case 'ADMIN_DEDUCTION':
      case 'WITHDRAWAL_REQUEST':
        return <AlertTriangle className="w-4 h-4 text-rose-400" />;
      default:
        return <Coins className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200 font-sans">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-5 space-y-4 shadow-2xl relative text-slate-100 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white">Detailed Earning History</h2>
              <p className="text-[10px] text-slate-400">All income streams, check-ins, rewards & deductions</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg bg-slate-800 border border-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setFilter('ALL')}
            className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${filter === 'ALL' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'}`}
          >
            All Activity
          </button>
          <button
            onClick={() => setFilter('EARNINGS')}
            className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${filter === 'EARNINGS' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'}`}
          >
            Earnings (+🪙)
          </button>
          <button
            onClick={() => setFilter('DEDUCTIONS')}
            className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${filter === 'DEDUCTIONS' ? 'bg-rose-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'}`}
          >
            Deductions (-🪙)
          </button>
        </div>

        {/* Transaction Items Scroll Area */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[220px]">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-cyan-400" />
              <span>Loading transaction records...</span>
            </div>
          ) : filteredTxs.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs border border-dashed border-slate-800 rounded-xl space-y-1">
              <p>No transaction history recorded yet.</p>
              <p className="text-[10px] text-slate-500">Watch ads, claim daily check-ins, or invite friends to earn!</p>
            </div>
          ) : (
            filteredTxs.map((tx) => {
              const isPositive = tx.coins >= 0;
              return (
                <div
                  key={tx.id}
                  className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs transition-all hover:border-slate-700"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 shrink-0 mt-0.5">
                      {getTxIcon(tx.type)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-100 flex items-center gap-1.5">
                        <span>{tx.title}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">{tx.description || tx.type}</p>
                      <div className="text-[9px] text-slate-500 mt-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-600" />
                        <span>{new Date(tx.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className={`font-extrabold text-xs ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isPositive ? '+' : ''}{tx.coins.toLocaleString()} 🪙
                    </div>
                    <div className={`text-[10px] font-semibold ${isPositive ? 'text-emerald-300/80' : 'text-rose-300/80'}`}>
                      {isPositive ? '+' : ''}₹{Math.abs(tx.amountInr).toFixed(2)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <button
          onClick={onClose}
          className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2.5 rounded-xl text-xs transition-all border border-slate-700"
        >
          Close History Window
        </button>
      </div>
    </div>
  );
};
