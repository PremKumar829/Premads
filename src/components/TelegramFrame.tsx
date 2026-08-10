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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center p-2 sm:p-4 font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Application Switcher Bar */}
      <div className="w-full max-w-2xl bg-slate-900/90 border border-slate-800 rounded-2xl p-3 mb-3 backdrop-blur shadow-xl flex flex-wrap items-center justify-between gap-2">
        {/* Environment & User Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-200 transition-colors"
          >
            <div className="w-6 h-6 rounded-full bg-cyan-600 flex items-center justify-center font-bold text-xs text-white">
              {currentUser.firstName.charAt(0)}
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1.5 leading-none">
                <span>{currentUser.firstName}</span>
                {getRoleBadge(currentUser.role)}
              </div>
              <span className="text-[10px] text-slate-400">ID: {currentUser.id}</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
          </button>

          {showUserDropdown && (
            <div className="absolute left-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 p-3 backdrop-blur-xl">
              <div className="text-[10px] uppercase font-extrabold text-cyan-400 px-1 mb-1.5 tracking-wider flex items-center justify-between">
                <span>Direct TG Username Login</span>
                <span className="text-[9px] bg-cyan-950 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-800">Auto Detect</span>
              </div>

              {/* Direct Username Input Login */}
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const target = e.currentTarget;
                  const input = target.elements.namedItem('tgInput') as HTMLInputElement;
                  if (!input || !input.value.trim()) return;
                  const val = input.value.trim();
                  try {
                    const { api } = await import('../services/api');
                    const isNumeric = /^\d+$/.test(val);
                    const res = await api.loginUser({
                      telegramId: isNumeric ? val : `tg_${Date.now()}`,
                      username: isNumeric ? `user_${val}` : val.replace(/^@/, ''),
                      firstName: val.replace(/^@/, '')
                    });
                    if (res && res.id) {
                      onSelectUser(res);
                      setShowUserDropdown(false);
                      input.value = '';
                    }
                  } catch (err) {
                    console.error('Login error:', err);
                  }
                }}
                className="mb-3"
              >
                <div className="flex gap-1.5">
                  <input
                    name="tgInput"
                    type="text"
                    placeholder="Enter @username or TG ID..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs shrink-0 shadow"
                  >
                    Login
                  </button>
                </div>
              </form>

              <div className="text-[10px] uppercase font-bold text-slate-500 px-1 py-1 tracking-wider border-t border-slate-800 pt-2">
                Profiles in Memory
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                {users.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      onSelectUser(u);
                      setShowUserDropdown(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors ${
                      u.id === currentUser.id ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 font-medium' : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-cyan-400">
                        {u.firstName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-200">{u.firstName}</div>
                        <div className="text-[10px] text-slate-400">@{u.username} • {u.id}</div>
                      </div>
                    </div>
                    {getRoleBadge(u.role)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex items-center bg-slate-950/70 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => onSelectMode('miniapp')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-all ${
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
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-all ${
              activeAppMode === 'botchat'
                ? 'bg-cyan-500 text-slate-950 font-semibold shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Bot Chat</span>
          </button>

          <button
            onClick={() => onSelectMode('fastgroup')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-all ${
              activeAppMode === 'fastgroup'
                ? 'bg-cyan-500 text-slate-950 font-semibold shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">#1 Group</span>
            <span className="sm:hidden">#1</span>
          </button>

          {currentUser.role !== 'USER' && (
            <button
              onClick={() => onSelectMode('admin')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-all ${
                activeAppMode === 'admin'
                  ? 'bg-cyan-500 text-slate-950 font-semibold shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-amber-300" />
              <span>Admin</span>
            </button>
          )}
        </div>
      </div>

      {/* Telegram Main App Container Shell */}
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col min-h-[640px] relative">
        {/* Telegram Header Bar */}
        <div className="bg-slate-950 border-b border-slate-800/80 px-4 py-3 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 p-0.5 flex items-center justify-center shadow-lg">
                <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-cyan-400" />
                </div>
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-950 rounded-full"></span>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-bold text-sm sm:text-base text-slate-100 tracking-tight">PrimeAdsE Official Bot</h1>
                <CheckCircle2 className="w-4 h-4 text-cyan-400 fill-cyan-400/20" />
              </div>
              <p className="text-[11px] text-slate-400 font-mono">@PrimeAdsEbot • Mini App SDK v7.10</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="bg-cyan-950/80 text-cyan-400 border border-cyan-800/50 text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
              Monetag Live
            </span>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 relative bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950">
          {children}
        </div>
      </div>
    </div>
  );
};
