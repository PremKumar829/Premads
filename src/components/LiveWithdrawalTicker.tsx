import React, { useState, useEffect, useRef } from 'react';
import { WithdrawalRequest } from '../types';
import { CheckCircle2, Zap } from 'lucide-react';

interface LiveWithdrawalTickerProps {
  withdrawals?: WithdrawalRequest[];
}

const UNIQUE_SUCCESSFUL_WITHDRAWALS = [
  { name: '@rahul_kumar', method: 'Paytm UPI', amount: 150, time: 'Just now' },
  { name: '@priya_sharma', method: 'PhonePe UPI', amount: 500, time: '1 min ago' },
  { name: '@amit_verma', method: 'Google Pay', amount: 200, time: '2 mins ago' },
  { name: '@suresh_yadav', method: 'State Bank UPI', amount: 100, time: '3 mins ago' },
  { name: '@deepak_singh', method: 'BHIM UPI', amount: 350, time: '4 mins ago' },
  { name: '@neha_patel', method: 'HDFC Bank Direct', amount: 1000, time: '5 mins ago' },
  { name: '@vikram_aditya', method: 'Paytm Wallet', amount: 250, time: 'Just now' },
  { name: '@anita_roy', method: 'PhonePe', amount: 150, time: '2 mins ago' },
  { name: '@manoj_gupta', method: 'Amazon Pay UPI', amount: 300, time: '1 min ago' },
  { name: '@sneha_joshi', method: 'GPay UPI', amount: 450, time: '3 mins ago' },
  { name: '@rajesh_kumar', method: 'ICICI Bank Transfer', amount: 800, time: 'Just now' },
  { name: '@pooja_mishra', method: 'Paytm UPI', amount: 100, time: '2 mins ago' },
  { name: '@alok_pandey', method: 'CRED UPI', amount: 600, time: 'Just now' },
  { name: '@kavya_nair', method: 'PhonePe UPI', amount: 350, time: '1 min ago' },
  { name: '@sunil_reddy', method: 'Axis Bank UPI', amount: 200, time: '3 mins ago' },
  { name: '@swati_choudhary', method: 'GPay UPI', amount: 500, time: '2 mins ago' },
  { name: '@rohit_sen', method: 'BHIM UPI', amount: 150, time: 'Just now' },
  { name: '@divya_singh', method: 'Paytm Instant', amount: 750, time: '4 mins ago' },
  { name: '@varun_kapoor', method: 'State Bank Direct', amount: 1200, time: '5 mins ago' },
  { name: '@megha_thakur', method: 'PhonePe UPI', amount: 250, time: 'Just now' },
  { name: '@akash_chawla', method: 'Amazon Pay UPI', amount: 400, time: '2 mins ago' },
  { name: '@nisha_tripathi', method: 'Paytm UPI', amount: 300, time: '1 min ago' },
  { name: '@siddharth_rao', method: 'GPay UPI', amount: 850, time: 'Just now' },
  { name: '@priyanka_d', method: 'Kotak Bank UPI', amount: 150, time: '3 mins ago' },
  { name: '@tarun_bhatia', method: 'PhonePe', amount: 500, time: '2 mins ago' },
  { name: '@aakanksha_g', method: 'BHIM UPI', amount: 200, time: '4 mins ago' },
  { name: '@pankaj_das', method: 'Paytm UPI', amount: 100, time: '1 min ago' },
  { name: '@ritika_saxena', method: 'ICICI Direct', amount: 950, time: 'Just now' },
  { name: '@abhishek_jain', method: 'Google Pay', amount: 300, time: '2 mins ago' },
  { name: '@shweta_dubey', method: 'PhonePe UPI', amount: 400, time: '3 mins ago' },
  { name: '@mohit_bansal', method: 'CRED UPI', amount: 650, time: 'Just now' },
  { name: '@karan_mehta', method: 'Paytm UPI', amount: 180, time: '1 min ago' },
  { name: '@simran_kaur', method: 'State Bank UPI', amount: 500, time: '2 mins ago' },
  { name: '@naveen_joshua', method: 'BHIM UPI', amount: 220, time: 'Just now' }
];

export const LiveWithdrawalTicker: React.FC<LiveWithdrawalTickerProps> = ({ withdrawals = [] }) => {
  const [currentNotice, setCurrentNotice] = useState<{
    name: string;
    method: string;
    amount: number;
    time: string;
  } | null>(null);

  const [visible, setVisible] = useState(false);
  const currentIndexRef = useRef(0);

  useEffect(() => {
    const approvedReal = withdrawals.filter(w => w.status === 'APPROVED');

    const showNextTicker = () => {
      let item;
      if (approvedReal.length > 0 && Math.random() > 0.5) {
        const rand = approvedReal[Math.floor(Math.random() * approvedReal.length)];
        item = {
          name: rand.userTelegram || rand.userName || '@member',
          method: rand.method === 'UPI' ? (rand.upiId || 'UPI Payout') : 'Bank Transfer',
          amount: rand.amount,
          time: 'Just now'
        };
      } else {
        // Sequentially rotate through unique handles so names never repeat
        const index = currentIndexRef.current % UNIQUE_SUCCESSFUL_WITHDRAWALS.length;
        item = UNIQUE_SUCCESSFUL_WITHDRAWALS[index];
        currentIndexRef.current = index + 1;
      }

      setCurrentNotice(item);
      setVisible(true);

      // Hide after 4 seconds
      setTimeout(() => {
        setVisible(false);
      }, 4000);
    };

    // Trigger initial notification quickly, then loop every 9s
    const initialTimer = setTimeout(showNextTicker, 1500);
    const interval = setInterval(showNextTicker, 9000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [withdrawals]);

  if (!currentNotice || !visible) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-xs z-40 animate-in slide-in-from-bottom-5 fade-in duration-300 pointer-events-none">
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 border-2 border-emerald-500/80 rounded-2xl p-3 shadow-2xl shadow-emerald-950/80 flex items-center gap-3 backdrop-blur-md">
        {/* Pulsing Verified Badge Icon */}
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center shrink-0 font-extrabold shadow-lg shadow-emerald-500/40 animate-bounce">
          ⚡
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Withdrawal Paid</span>
            </span>
            <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded font-bold">
              {currentNotice.time}
            </span>
          </div>

          <div className="text-xs font-bold text-white truncate mt-0.5">
            {currentNotice.name} <span className="text-emerald-300">received ₹{currentNotice.amount.toFixed(2)}</span>
          </div>

          <div className="text-[10px] text-slate-300 flex items-center gap-1 mt-0.5">
            <Zap className="w-3 h-3 text-emerald-400 fill-emerald-400" />
            <span className="truncate">Paid via {currentNotice.method} • Fast Approval</span>
          </div>
        </div>
      </div>
    </div>
  );
};
