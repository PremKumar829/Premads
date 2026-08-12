import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { Bot, Shield, Smartphone, Users, MessageSquare, CheckCircle2, ChevronDown, UserCheck } from 'lucide-react';

interface TelegramFrameProps {
  currentUser: User;
  users: User[];
  onSelectUser: (user: User) => void;
  activeAppMode: 'miniapp' | 'botchat' | 'admin' | 'fastgroup';
  onSelectMode: (mode: 'miniapp' | 'botchat' | 'admin' | 'fastgroup') => void;
  children: React.ReactNode;
}

export const TelegramFrame: React.FC<TelegramFrameProps> = ({
  currentUser,
  users,
  onSelectUser,
  activeAppMode,
  onSelectMode,
  children
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'CEO':
        return <span className="bg-amber-500/20 text-amber-300 text-xs px-2 py-0.5 rounded border border-amber-500/30 font-semibold">CEO</span>;
      case 'MANAGER':
        return <span className="bg-purple-500/20 text-purple-300 text-xs px-2 py-0.5 rounded border border-purple-500/30 font-semibold">Manager</span>;
      case 'WITHDRAWAL_PASS':
        return <span className="bg-emerald-500/20 text-emerald-300 text-xs px-2 py-0.5 rounded border border-emerald-500/30 font-semibold">Payout Pass Admin</span>;
      default:
        return <span className="bg-slate-700/50 text-slate-300 text-xs px-2 py-0.5 rounded border border-slate-600/30">User</span>;
    }
  };

  return (
    <div className="h-[100dvh] w-full bg-slate-950 text-slate-100 flex flex-col items-center p-1.5 sm:p-4 font-sans selection:bg-cyan-500 selection:text-slate-950 overflow-hidden">
      {/* Top Application Switcher Bar */}
      <div className="w-full max-w-2xl bg-slate-900/90 border border-slate-800 rounded-2xl p-2 sm:p-3 mb-2 backdrop-blur shadow-xl flex items-center justify-between gap-2 shrink-0 z-40">
        {/* Environment & User Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-1.5 sm:gap-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs sm:text-sm font-medium text-slate-200 transition-colors"
          >
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-cyan-600 flex items-center justify-center font-bold text-xs text-white">
              {currentUser.firstName.charAt(0)}
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1 leading-none">
                <span className="truncate max-w-[100px] sm:max-w-none">{currentUser.firstName}</span>
                {getRoleBadge(currentUser.role)}
              </div>
              <span className="text-[10px] text-slate-400">ID: {currentUser.id}</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
          </button>

          {showUserDropdown && (
            <div className="absolute left-0 mt-2 w-72 max-h-[80vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 p-3 backdrop-blur-xl">
              <div className="text-[10px] uppercase font-extrabold text-cyan-400 px-1 mb-1.5 tracking-wider flex items-center justify-between">
                <span>Active Account Profile</span>
                <span className="text-[9px] bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-800">Verified TG Session</span>
              </div>

              {/* Account Details Card */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 mb-2 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-100">{currentUser.firstName}</span>
                  {getRoleBadge(currentUser.role)}
                </div>
                <div className="text-[11px] text-slate-400">Username: @{currentUser.username}</div>
                <div className="text-[10px] font-mono text-slate-500">TG ID: {currentUser.id}</div>
              </div>

              {/* Only show Admin Security Access if admin or if attempting admin unlock */}
              <button
                onClick={() => {
                  onSelectMode('admin');
                  setShowUserDropdown(false);
                }}
                className="w-full mt-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium p-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all active:scale-98"
              >
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>🔑 Staff & Admin Access (PIN)</span>
              </button>
            </div>
          )}
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex items-center bg-slate-950/70 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => onSelectMode('miniapp')}
            className={`flex items-center gap-1.5 px-2 py-1 sm:px-2.5 rounded-lg font-medium transition-all ${
              activeAppMode === 'miniapp'
                ? 'bg-cyan-500 text-slate-950 font-semibold shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mini App</span>
          </button>

          <button
            onClick={() => onSelectMode('botchat')}
            className={`flex items-center gap-1.5 px-2 py-1 sm:px-2.5 rounded-lg font-medium transition-all ${
              activeAppMode === 'botchat'
                ? 'bg-cyan-500 text-slate-950 font-semibold shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Bot Chat</span>
          </button>

          {currentUser.role !== 'USER' && (
            <>
              <button
                onClick={() => onSelectMode('fastgroup')}
                className={`flex items-center gap-1.5 px-2 py-1 sm:px-2.5 rounded-lg font-medium transition-all ${
                  activeAppMode === 'fastgroup'
                    ? 'bg-cyan-500 text-slate-950 font-semibold shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">#1 Group</span>
                <span className="sm:hidden">#1</span>
              </button>

              <button
                onClick={() => onSelectMode('admin')}
                className={`flex items-center gap-1.5 px-2 py-1 sm:px-2.5 rounded-lg font-medium transition-all ${
                  activeAppMode === 'admin'
                    ? 'bg-amber-500 text-slate-950 font-extrabold shadow-md'
                    : 'text-amber-400 hover:text-amber-200 border border-amber-500/30 bg-amber-500/10'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Telegram Main App Container Shell */}
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col flex-1 min-h-0 relative">
        {/* Telegram Header Bar */}
        <div className="bg-slate-950 border-b border-slate-800/80 px-3 py-2 sm:px-4 sm:py-3 flex items-center justify-between shadow-md shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 p-0.5 flex items-center justify-center shadow-lg">
                <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
                  <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
                </div>
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-950 rounded-full"></span>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-bold text-xs sm:text-base text-slate-100 tracking-tight">PrimeAdsE Official Bot</h1>
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400 fill-cyan-400/20" />
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 font-mono">@PrimeAdsEbot • Mini App SDK v7.10</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="bg-cyan-950/80 text-cyan-400 border border-cyan-800/50 text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
              Monetag Live
            </span>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 relative bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 scroll-smooth">
          {children}
        </div>
      </div>
    </div>
  );
};
