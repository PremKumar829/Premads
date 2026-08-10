import React from 'react';
import { UserNotification } from '../types';
import { AlertTriangle, CheckCircle2, XCircle, Gift, Bell, X } from 'lucide-react';

interface UserNotificationModalProps {
  notification: UserNotification;
  onDismiss: (notificationId: string) => void;
}

export const UserNotificationModal: React.FC<UserNotificationModalProps> = ({
  notification,
  onDismiss
}) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'BALANCE_DEDUCTED':
        return <AlertTriangle className="w-8 h-8 text-rose-400" />;
      case 'WITHDRAWAL_APPROVED':
        return <CheckCircle2 className="w-8 h-8 text-emerald-400" />;
      case 'WITHDRAWAL_REJECTED':
        return <XCircle className="w-8 h-8 text-rose-400" />;
      case 'REFERRAL_SUCCESS':
        return <Gift className="w-8 h-8 text-purple-400" />;
      default:
        return <Bell className="w-8 h-8 text-cyan-400" />;
    }
  };

  const getBorderColor = () => {
    switch (notification.type) {
      case 'BALANCE_DEDUCTED':
      case 'WITHDRAWAL_REJECTED':
        return 'border-rose-500/80 bg-rose-950/90';
      case 'WITHDRAWAL_APPROVED':
        return 'border-emerald-500/80 bg-emerald-950/90';
      case 'REFERRAL_SUCCESS':
        return 'border-purple-500/80 bg-purple-950/90';
      default:
        return 'border-cyan-500/80 bg-slate-900/95';
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className={`w-full max-w-sm rounded-2xl border ${getBorderColor()} p-5 space-y-4 shadow-2xl relative text-slate-100`}>
        <button
          onClick={() => onDismiss(notification.id)}
          className="absolute top-3 right-3 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-900/60"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-700 shrink-0">
            {getIcon()}
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white">{notification.title}</h3>
            <p className="text-[10px] text-slate-300">{new Date(notification.timestamp).toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-slate-950/90 p-3 rounded-xl border border-slate-800 text-xs leading-relaxed space-y-2">
          <p className="text-slate-200">{notification.message}</p>
          {notification.reason && (
            <div className="text-[11px] text-rose-300 font-medium bg-rose-950/50 p-2 rounded border border-rose-900/60">
              Reason: {notification.reason}
            </div>
          )}
        </div>

        <button
          onClick={() => onDismiss(notification.id)}
          className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold py-2.5 px-4 rounded-xl text-xs transition-all shadow-lg active:scale-98"
        >
          Acknowledge & Close
        </button>
      </div>
    </div>
  );
};
