import React from 'react';
import { Home, Tv, UserPlus, Wallet, HelpCircle, Shield } from 'lucide-react';

interface NavigationProps {
  activeTab: 'home' | 'watch' | 'refer' | 'withdraw' | 'help' | 'admin';
  onTabChange: (tab: 'home' | 'watch' | 'refer' | 'withdraw' | 'help' | 'admin') => void;
  isAdmin: boolean;
  perAdReward: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  isAdmin,
  perAdReward
}) => {
  return (
    <div className="bg-slate-950/90 border-t border-slate-800 backdrop-blur-md p-2 flex items-center justify-around rounded-b-3xl sticky bottom-0 z-40">
      <button
        onClick={() => onTabChange('home')}
        className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all ${
          activeTab === 'home'
            ? 'text-cyan-400 font-bold bg-cyan-950/40 border border-cyan-800/30'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Home className="w-4 h-4 sm:w-5 sm:h-5" />
        <span className="text-[10px] sm:text-[11px]">Home</span>
      </button>

      <button
        onClick={() => onTabChange('watch')}
        className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all relative ${
          activeTab === 'watch'
            ? 'text-cyan-400 font-bold bg-cyan-950/40 border border-cyan-800/30'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <div className="relative">
          <Tv className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="absolute -top-1.5 -right-2 bg-emerald-500 text-slate-950 font-extrabold text-[8px] px-1 rounded-full">
            ₹{perAdReward}
          </span>
        </div>
        <span className="text-[10px] sm:text-[11px]">Ads</span>
      </button>

      <button
        onClick={() => onTabChange('refer')}
        className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all ${
          activeTab === 'refer'
            ? 'text-cyan-400 font-bold bg-cyan-950/40 border border-cyan-800/30'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
        <span className="text-[10px] sm:text-[11px]">Refer</span>
      </button>

      <button
        onClick={() => onTabChange('withdraw')}
        className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all ${
          activeTab === 'withdraw'
            ? 'text-cyan-400 font-bold bg-cyan-950/40 border border-cyan-800/30'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
        <span className="text-[10px] sm:text-[11px]">Withdraw</span>
      </button>

      <button
        onClick={() => onTabChange('help')}
        className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all ${
          activeTab === 'help'
            ? 'text-cyan-400 font-bold bg-cyan-950/40 border border-cyan-800/30'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />
        <span className="text-[10px] sm:text-[11px]">Help</span>
      </button>

      {isAdmin && (
        <button
          onClick={() => onTabChange('admin')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all ${
            activeTab === 'admin'
              ? 'text-amber-400 font-bold bg-amber-950/40 border border-amber-800/40'
              : 'text-amber-400/80 hover:text-amber-200'
          }`}
        >
          <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
          <span className="text-[10px] sm:text-[11px] text-amber-300 font-semibold">Admin</span>
        </button>
      )}
    </div>
  );
};
