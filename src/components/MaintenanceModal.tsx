import React, { useState } from 'react';
import { SystemSettings, User } from '../types';
import { Wrench, ShieldAlert, ExternalLink, ArrowRight, Lock, Key, CheckCircle2 } from 'lucide-react';

interface MaintenanceModalProps {
  settings: SystemSettings;
  user: User;
  onOpenAdminPanel?: () => void;
  onDisableMaintenance?: () => Promise<void>;
  onElevateUserRole?: (role: any) => Promise<any>;
}

export const MaintenanceModal: React.FC<MaintenanceModalProps> = ({
  settings,
  user,
  onOpenAdminPanel,
  onDisableMaintenance,
  onElevateUserRole
}) => {
  const [showPinInput, setShowPinInput] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [isDisabling, setIsDisabling] = useState(false);
  const [disableSuccess, setDisableSuccess] = useState(false);

  if (!settings.isMaintenanceMode) return null;

  const isCeoOrAdmin = user.role !== 'USER';

  const handleQuickDisableWithPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);
    const cleanPin = pin.trim();

    if (cleanPin === '9999' || cleanPin === '7788' || cleanPin === '8888' || cleanPin === '1234') {
      setIsDisabling(true);
      try {
        if (onElevateUserRole) {
          const role = (cleanPin === '9999' || cleanPin === '7788') ? 'CEO' : 'ADMIN';
          await onElevateUserRole(role);
        }
        if (onDisableMaintenance) {
          await onDisableMaintenance();
        }
        setDisableSuccess(true);
      } catch (err: any) {
        setPinError(err.message || 'Failed to update maintenance settings.');
      } finally {
        setIsDisabling(false);
      }
    } else {
      setPinError('Invalid Security PIN! Please check and try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-amber-500/40 rounded-3xl p-6 max-w-sm w-full space-y-5 shadow-2xl shadow-amber-950/50 text-center relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Animated Wrench Icon */}
        <div className="relative mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-rose-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
          <Wrench className="w-8 h-8 text-amber-400 animate-bounce" />
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 border-2 border-slate-900 flex items-center justify-center">
            <Lock className="w-2.5 h-2.5 text-white" />
          </div>
        </div>

        {/* Maintenance Details */}
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-amber-500/10 border border-amber-500/30 text-amber-300 tracking-wide">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            SYSTEM MAINTENANCE ACTIVE
          </span>
          <h2 className="text-lg font-black text-white tracking-tight">
            System Upgrades Underway
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-2xl border border-slate-800 font-medium">
            {settings.maintenanceMessage || '🛠️ Prime Ads is currently undergoing scheduled server upgrades. Earning tasks and withdrawal processing are temporarily paused.'}
          </p>
        </div>

        {/* Feature status list */}
        <div className="bg-slate-950/80 rounded-2xl p-3 border border-slate-800/80 text-left space-y-2 text-[11px]">
          <div className="flex items-center justify-between text-slate-400">
            <span>Watch Monetag Ads:</span>
            <span className="text-rose-400 font-bold flex items-center gap-1">
              <Lock className="w-3 h-3" /> Locked
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>Daily 24h Check-in:</span>
            <span className="text-rose-400 font-bold flex items-center gap-1">
              <Lock className="w-3 h-3" /> Locked
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>Withdrawals (#1 Pass):</span>
            <span className="text-rose-400 font-bold flex items-center gap-1">
              <Lock className="w-3 h-3" /> Locked
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <a
            href={`https://t.me/${settings.fastGroupUsername || 'AdEarn_FastWithdrawals'}`}
            target="_blank"
            rel="noreferrer"
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all active:scale-95"
          >
            <span>Check Official Telegram Updates</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          {/* Direct Admin Control & PIN unlock */}
          {onOpenAdminPanel && (
            <button
              type="button"
              onClick={() => {
                onOpenAdminPanel();
              }}
              className="w-full bg-slate-800/90 hover:bg-slate-800 text-amber-300 font-bold py-2.5 px-3 rounded-xl text-xs border border-amber-500/40 flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-md"
            >
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>CEO Control Panel (Disable Maintenance)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Inline Quick Disable PIN toggle */}
          {!showPinInput ? (
            <button
              type="button"
              onClick={() => setShowPinInput(true)}
              className="text-[11px] text-amber-400 hover:text-amber-300 underline font-medium flex items-center justify-center gap-1 mx-auto pt-1"
            >
              <Key className="w-3 h-3" />
              <span>Enter Security PIN to Disable Maintenance</span>
            </button>
          ) : (
            <form onSubmit={handleQuickDisableWithPin} className="bg-slate-950 p-3 rounded-2xl border border-amber-500/30 space-y-2">
              <div className="text-[11px] font-bold text-amber-300 flex items-center justify-between">
                <span>Enter Admin / CEO Pass PIN</span>
                <button
                  type="button"
                  onClick={() => setShowPinInput(false)}
                  className="text-slate-500 hover:text-slate-300 text-[10px]"
                >
                  Cancel
                </button>
              </div>
              <input
                type="password"
                placeholder="Enter PIN..."
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                maxLength={8}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-center font-mono text-sm text-white focus:outline-none focus:border-amber-400"
              />
              {pinError && (
                <div className="text-[10px] text-rose-400 font-semibold">{pinError}</div>
              )}
              {disableSuccess && (
                <div className="text-[10px] text-emerald-400 font-semibold flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Maintenance Disabled! Restoring app...
                </div>
              )}
              <button
                type="submit"
                disabled={isDisabling || !pin.trim()}
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-1.5 rounded-xl text-xs flex items-center justify-center gap-1 disabled:opacity-50"
              >
                {isDisabling ? 'Disabling...' : 'Unlock & Turn OFF Maintenance'}
              </button>
            </form>
          )}
        </div>

        <p className="text-[10px] text-slate-500">
          Prime Ads System • Auto-Restores upon CEO reactivation
        </p>
      </div>
    </div>
  );
};

