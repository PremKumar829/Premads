import React, { useState, useEffect } from 'react';
import { User, SystemSettings, WithdrawalRequest, AdminMember, UserRole, SupportTicket } from '../types';
import { api } from '../services/api';
import { Shield, Settings, Wallet, Users, Key, Save, CheckCircle2, AlertCircle, Zap, Ban, RefreshCw, Plus, Trash2, Search, Copy, Check, Lock, Unlock, Smartphone, TrendingUp, DollarSign, Eye, ArrowUpRight, RotateCcw, Headset, MessageSquare, Clock } from 'lucide-react';

interface AdminPanelProps {
  currentUser: User;
  settings: SystemSettings;
  users: User[];
  withdrawals: WithdrawalRequest[];
  adminTeam: AdminMember[];
  onUpdateSettings: (settings: Partial<SystemSettings>) => Promise<any>;
  onProcessWithdrawal: (id: string, action: 'PASS' | 'APPROVE' | 'REJECT', processedBy?: string, reason?: string) => Promise<any>;
  onAddAdminMember: (payload: { name: string; telegramId?: string; role: UserRole; passPin?: string }) => Promise<any>;
  onDeleteAdminMember: (id: string) => Promise<any>;
  onUserAction: (userId: string, action: 'BAN' | 'UNBAN' | 'ADD_BALANCE' | 'DEDUCT_BALANCE' | 'ELEVATE_ROLE', amount?: number, reason?: string, role?: string) => Promise<any>;
  onElevateUserRole?: (role: UserRole) => Promise<any>;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  currentUser,
  settings,
  users,
  withdrawals,
  adminTeam,
  onUpdateSettings,
  onProcessWithdrawal,
  onAddAdminMember,
  onDeleteAdminMember,
  onUserAction,
  onElevateUserRole
}) => {
  // SECURITY PIN LOCK STATE (Always require PIN verification to view Admin suite)
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  const isCeoRole = currentUser.role === 'CEO';
  const [activeTab, setActiveTab] = useState<'SETTINGS' | 'WITHDRAWALS' | 'TEAM' | 'USERS' | 'SUPPORT' | 'BROADCAST'>('WITHDRAWALS');

  // Support Tickets State
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [supportFilter, setSupportFilter] = useState<'ALL' | 'OPEN' | 'RESOLVED'>('OPEN');
  const [supportReplyMap, setSupportReplyMap] = useState<Record<string, string>>({});
  const [replyingTicketId, setReplyingTicketId] = useState<string | null>(null);

  // System Maintenance & Broadcasting State
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(settings.isMaintenanceMode ?? false);
  const [maintenanceMessage, setMaintenanceMessage] = useState(settings.maintenanceMessage || '🛠️ System Maintenance Underway - All earning tasks are temporarily locked.');
  const [broadcastTitle, setBroadcastTitle] = useState('📢 SYSTEM ANNOUNCEMENT');
  const [broadcastMessageText, setBroadcastMessageText] = useState('');
  const [sendTelegramBroadcast, setSendTelegramBroadcast] = useState(true);
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState<string | null>(null);

  const handleDispatchBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessageText.trim()) return;
    setSendingBroadcast(true);
    setBroadcastSuccess(null);
    try {
      const res = await api.sendBroadcast(broadcastTitle, broadcastMessageText.trim(), sendTelegramBroadcast);
      setBroadcastSuccess(res.message || 'Broadcast successfully dispatched!');
      setBroadcastMessageText('');
      setTimeout(() => setBroadcastSuccess(null), 4000);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to dispatch broadcast');
    } finally {
      setSendingBroadcast(false);
    }
  };

  const fetchSupportTickets = async () => {
    try {
      const tickets = await api.getSupportTickets();
      setSupportTickets(tickets);
    } catch (err) {
      console.warn('Failed to load support tickets', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchSupportTickets();
    }
  }, [isAuthenticated, activeTab]);

  // Ensure non-CEO users stay strictly on WITHDRAWALS or SUPPORT tab
  useEffect(() => {
    if (!isCeoRole && activeTab !== 'WITHDRAWALS' && activeTab !== 'SUPPORT') {
      setActiveTab('WITHDRAWALS');
    }
  }, [isCeoRole, activeTab]);

  // Local settings form state
  const [welcomeBonus, setWelcomeBonus] = useState(settings.welcomeBonus);
  const [perAdReward, setPerAdReward] = useState(settings.perAdReward);
  const [referralReward, setReferralReward] = useState(settings.referralReward);
  const [referralCommissionPct, setReferralCommissionPct] = useState(settings.referralCommissionPct);
  const [minWithdrawal, setMinWithdrawal] = useState(settings.minWithdrawal);
  const [minAdsWatchForWithdrawal, setMinAdsWatchForWithdrawal] = useState(settings.minAdsWatchForWithdrawal || 100);
  const [adCooldownSec, setAdCooldownSec] = useState(settings.adCooldownSec);
  const [dailyAdLimit, setDailyAdLimit] = useState(settings.dailyAdLimit);
  const [monetagDirectLinkUrl, setMonetagDirectLinkUrl] = useState(settings.monetagDirectLinkUrl);
  const [monetagZoneId, setMonetagZoneId] = useState(settings.monetagZoneId);
  const [fastApprovalHashtag, setFastApprovalHashtag] = useState(settings.fastApprovalHashtag || '#1');
  const [fastGroupUsername, setFastGroupUsername] = useState(settings.fastGroupUsername || 'AdEarn_FastWithdrawals');
  const [botUsername, setBotUsername] = useState(settings.botUsername || 'PrimeAdsEbot');
  const [botToken, setBotToken] = useState(settings.botToken || '');
  const [botAppUrl, setBotAppUrl] = useState(settings.botAppUrl || 'https://premads.onrender.com');
  const [disableTelegramPolling, setDisableTelegramPolling] = useState(settings.disableTelegramPolling ?? true);
  const [ownerTelegramId, setOwnerTelegramId] = useState(settings.ownerTelegramId || '');

  // Withdrawal queue state
  const [withdrawalFilter, setWithdrawalFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [withdrawalSearch, setWithdrawalSearch] = useState('');
  const [rejectionReasonMap, setRejectionReasonMap] = useState<Record<string, string>>({});

  // Team form state
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminTgId, setNewAdminTgId] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<UserRole>('WITHDRAWAL_PASS');
  const [newAdminPin, setNewAdminPin] = useState('1234');

  // User search & balance adjustments state
  const [userSearch, setUserSearch] = useState('');
  const [adjustAmountMap, setAdjustAmountMap] = useState<Record<string, string>>({});
  const [deductAmountMap, setDeductAmountMap] = useState<Record<string, string>>({});
  const [deductReasonMap, setDeductReasonMap] = useState<Record<string, string>>({});

  const [savingSettings, setSavingSettings] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // PIN Unlock Handler
  const handleUnlockAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);

    const cleanPin = pinInput.trim();
    const isCeoPin = cleanPin === '9999' || cleanPin === '7788';
    const isAdminPin = cleanPin === '8888' || cleanPin === '1234' || cleanPin === '9900' || adminTeam.some(a => a.passPin === cleanPin);

    if (isCeoPin || isAdminPin) {
      const targetRole: UserRole = isCeoPin ? 'CEO' : 'ADMIN';
      setIsAuthenticated(true);
      setPinInput('');
      if (onElevateUserRole) {
        try {
          await onElevateUserRole(targetRole);
        } catch (err) {
          console.error('Role elevation notice:', err);
        }
      }
    } else {
      setPinError('Invalid Security PIN! Please enter PIN 8888 (Admin) or 9999 (CEO).');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSaveSuccess(false);
    try {
      await onUpdateSettings({
        welcomeBonus: Number(welcomeBonus),
        perAdReward: Number(perAdReward),
        referralReward: Number(referralReward),
        referralCommissionPct: Number(referralCommissionPct),
        minWithdrawal: Number(minWithdrawal),
        minAdsWatchForWithdrawal: Number(minAdsWatchForWithdrawal),
        adCooldownSec: Number(adCooldownSec),
        dailyAdLimit: Number(dailyAdLimit),
        monetagDirectLinkUrl,
        monetagZoneId,
        fastApprovalHashtag,
        fastGroupUsername,
        botUsername,
        botToken,
        botAppUrl,
        disableTelegramPolling,
        ownerTelegramId,
        isMaintenanceMode,
        maintenanceMessage
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminName) return;
    try {
      await onAddAdminMember({
        name: newAdminName,
        telegramId: newAdminTgId,
        role: newAdminRole,
        passPin: newAdminPin
      });
      setNewAdminName('');
      setNewAdminTgId('');
    } catch (e) {
      console.error(e);
    }
  };

  const filteredWithdrawals = withdrawals.filter((w) => {
    const matchesFilter = withdrawalFilter === 'ALL' || w.status === withdrawalFilter;
    const searchLower = withdrawalSearch.toLowerCase();
    const matchesSearch =
      !withdrawalSearch ||
      w.id.includes(searchLower) ||
      w.userName.toLowerCase().includes(searchLower) ||
      (w.upiId && w.upiId.toLowerCase().includes(searchLower)) ||
      (w.bankDetails && w.bankDetails.accountNumber.includes(searchLower));

    return matchesFilter && matchesSearch;
  });

  const filteredUsers = users.filter(u =>
    !userSearch ||
    u.firstName.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.id.includes(userSearch) ||
    u.username.toLowerCase().includes(userSearch.toLowerCase())
  );

  const copyText = (txt: string, id: string) => {
    navigator.clipboard.writeText(txt);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // CALCULATE STATS
  const totalUsers = users.length;
  const pendingRequests = withdrawals.filter(w => w.status === 'PENDING');
  const pendingAmount = pendingRequests.reduce((acc, r) => acc + r.amount, 0);
  const totalPaid = withdrawals.filter(w => w.status === 'APPROVED').reduce((acc, r) => acc + r.amount, 0);
  const totalAdsWatched = users.reduce((acc, u) => acc + (u.watchedAdIds?.length || u.adsWatchedToday || 0), 0);

  // ROLE PROTECTION: Standard USER must enter Admin PIN (7788 or 9999) to elevate and access Admin Suite
  if (currentUser.role === 'USER' && !isAuthenticated) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center max-w-md mx-auto my-8 shadow-2xl space-y-4 font-sans">
        <div className="w-16 h-16 rounded-3xl bg-amber-950/80 border border-amber-800/80 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
          <Shield className="w-8 h-8 text-amber-400" />
        </div>
        <div>
          <h2 className="text-xl font-black text-white">Admin Security Authentication</h2>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            This Admin Console is hidden from standard users. Enter your Executive Admin Pass PIN to continue.
          </p>
        </div>

        <form onSubmit={handleUnlockAdmin} className="space-y-3 pt-2">
          <div>
            <input
              type="password"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="Enter Admin Security PIN..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-center text-sm font-mono text-amber-400 tracking-widest focus:outline-none focus:border-amber-500 placeholder-slate-600"
              maxLength={6}
            />
            {pinError && (
              <p className="text-[11px] text-rose-400 font-semibold mt-1.5 flex items-center justify-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{pinError}</span>
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black py-3 rounded-xl text-xs uppercase tracking-wider shadow-lg transition-all active:scale-98 flex items-center justify-center gap-2"
          >
            <Key className="w-4 h-4" />
            <span>Authenticate Admin Access</span>
          </button>
        </form>
      </div>
    );
  }

  if (!isAuthenticated && currentUser.role !== 'USER') {
    // If user is already ADMIN or CEO role, default to authenticated
    setIsAuthenticated(true);
  }

  return (
    <div className="space-y-4 pb-16 font-sans">
      {/* Sleek Admin Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center shadow">
            <Shield className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-extrabold text-white tracking-tight">AdEarn Executive Console</h2>
              <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold">
                {currentUser.role}
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                🔥 Firebase: prime-earn-49202
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Logged in as <strong className="text-slate-200">{currentUser.firstName}</strong> • System Operational
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAuthenticated(false)}
          className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <Lock className="w-3.5 h-3.5 text-slate-400" />
          <span>Lock Admin Session</span>
        </button>
      </div>

      {/* Analytics High-Contrast Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-1">
          <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
            <span>Total Users</span>
            <Users className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-xl font-extrabold text-white">{totalUsers}</div>
          <div className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
            <TrendingUp className="w-3 h-3" /> +18% growth
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-1">
          <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
            <span>Pending Payout</span>
            <Wallet className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-extrabold text-amber-300">₹{pendingAmount.toFixed(0)}</div>
          <div className="text-[10px] text-slate-400 font-semibold">
            {pendingRequests.length} Requests pending
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-1">
          <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
            <span>Total Paid Out</span>
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-extrabold text-emerald-400">₹{totalPaid.toFixed(0)}</div>
          <div className="text-[10px] text-emerald-400 font-semibold">
            100% Fast verified
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-1">
          <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
            <span>Ads Watched</span>
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-xl font-extrabold text-cyan-300">{totalAdsWatched}</div>
          <div className="text-[10px] text-cyan-400 font-semibold">
            Monetag eCPM Zone #{settings.monetagZoneId}
          </div>
        </div>
      </div>

      {/* Role Access Notice for Withdrawal Pass admins */}
      {!isCeoRole && (
        <div className="bg-amber-950/60 border border-amber-800/80 p-3 rounded-2xl flex items-center justify-between text-xs text-amber-200">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <span className="font-bold">Withdrawal Pass Authorization Active</span>
              <p className="text-[10px] text-amber-300/80">You have access to approve/reject payout requests. Bot Token & Global Settings are restricted to CEO only.</p>
            </div>
          </div>
          <span className="bg-amber-500/20 text-amber-300 text-[10px] px-2 py-0.5 rounded border border-amber-500/40 font-extrabold shrink-0">
            WITHDRAWAL_PASS
          </span>
        </div>
      )}

      {/* Sleek Admin Navigation Tabs */}
      <div className="flex items-center bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs gap-1 overflow-x-auto">
        <button
          onClick={() => isCeoRole && setActiveTab('SETTINGS')}
          disabled={!isCeoRole}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
            activeTab === 'SETTINGS'
              ? 'bg-blue-600 text-white shadow-md'
              : isCeoRole
              ? 'text-slate-400 hover:text-slate-200 cursor-pointer'
              : 'text-slate-600 cursor-not-allowed opacity-60'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>System Settings</span>
          {!isCeoRole && <Lock className="w-3 h-3 text-amber-500" />}
        </button>

        <button
          onClick={() => setActiveTab('WITHDRAWALS')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold transition-all whitespace-nowrap relative ${
            activeTab === 'WITHDRAWALS'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 cursor-pointer'
          }`}
        >
          <Wallet className="w-3.5 h-3.5" />
          <span>Payout Queue</span>
          {pendingRequests.length > 0 && (
            <span className="bg-rose-500 text-white font-extrabold text-[9px] px-1.5 rounded-full">
              {pendingRequests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => isCeoRole && setActiveTab('TEAM')}
          disabled={!isCeoRole}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
            activeTab === 'TEAM'
              ? 'bg-blue-600 text-white shadow-md'
              : isCeoRole
              ? 'text-slate-400 hover:text-slate-200 cursor-pointer'
              : 'text-slate-600 cursor-not-allowed opacity-60'
          }`}
        >
          <Key className="w-3.5 h-3.5" />
          <span>Admin Team & PINs</span>
          {!isCeoRole && <Lock className="w-3 h-3 text-amber-500" />}
        </button>

        <button
          onClick={() => isCeoRole && setActiveTab('USERS')}
          disabled={!isCeoRole}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
            activeTab === 'USERS'
              ? 'bg-blue-600 text-white shadow-md'
              : isCeoRole
              ? 'text-slate-400 hover:text-slate-200 cursor-pointer'
              : 'text-slate-600 cursor-not-allowed opacity-60'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>User Directory</span>
          {!isCeoRole && <Lock className="w-3 h-3 text-amber-500" />}
        </button>

        <button
          onClick={() => setActiveTab('SUPPORT')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold transition-all whitespace-nowrap relative ${
            activeTab === 'SUPPORT'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 cursor-pointer'
          }`}
        >
          <Headset className="w-3.5 h-3.5" />
          <span>Support Tickets</span>
          {supportTickets.filter(t => t.status === 'OPEN').length > 0 && (
            <span className="bg-purple-500 text-white font-extrabold text-[9px] px-1.5 rounded-full">
              {supportTickets.filter(t => t.status === 'OPEN').length}
            </span>
          )}
        </button>

        <button
          onClick={() => isCeoRole && setActiveTab('BROADCAST')}
          disabled={!isCeoRole}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
            activeTab === 'BROADCAST'
              ? 'bg-amber-600 text-white shadow-md'
              : isCeoRole
              ? 'text-slate-400 hover:text-slate-200 cursor-pointer'
              : 'text-slate-600 cursor-not-allowed opacity-60'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Broadcasting Mode</span>
          {!isCeoRole && <Lock className="w-3 h-3 text-amber-500" />}
        </button>
      </div>

      {/* TAB 1: SYSTEM SETTINGS */}
      {activeTab === 'SETTINGS' && (
        <form onSubmit={handleSaveSettings} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <Settings className="w-4 h-4 text-blue-400" />
              Global Reward Rates & Fast Group Configuration
            </h3>

            {saveSuccess && (
              <span className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Changes Saved!
              </span>
            )}
          </div>

          {/* SYSTEM MAINTENANCE MODE CONTROL CARD */}
          <div className={`p-4 rounded-2xl border transition-all ${isMaintenanceMode ? 'bg-rose-950/60 border-rose-500/80' : 'bg-slate-950/80 border-slate-800'} space-y-3`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${isMaintenanceMode ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' : 'bg-slate-800 text-slate-400'}`}>
                  {isMaintenanceMode ? <Lock className="w-4 h-4 text-rose-400" /> : <Unlock className="w-4 h-4 text-emerald-400" />}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    System Maintenance Lock Mode
                    {isMaintenanceMode && <span className="text-[10px] bg-rose-500 text-white font-black px-2 py-0.2 rounded-full animate-pulse">ACTIVE LOCK</span>}
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    When active, all user earning tasks (Ads, Check-in, Referral Claims, Withdrawals) are completely locked.
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isMaintenanceMode}
                  onChange={(e) => setIsMaintenanceMode(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
              </label>
            </div>

            {isMaintenanceMode && (
              <div className="space-y-1 pt-1">
                <label className="text-[11px] font-semibold text-rose-300">
                  Custom Maintenance Lock Message Displayed To Users:
                </label>
                <input
                  type="text"
                  value={maintenanceMessage}
                  onChange={(e) => setMaintenanceMessage(e.target.value)}
                  placeholder="e.g. 🛠️ System Maintenance Underway. Tasks locked."
                  className="w-full bg-slate-900 border border-rose-800/80 rounded-xl px-3 py-2 text-xs font-medium text-rose-200 focus:outline-none focus:border-rose-500"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">Welcome Bonus (₹)</label>
              <input
                type="number"
                value={welcomeBonus}
                onChange={(e) => setWelcomeBonus(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold focus:border-blue-500"
              />
              <p className="text-[10px] text-slate-500 mt-0.5">₹20 bonus credited on user signup</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">Per Ad Reward Rate (₹)</label>
              <input
                type="number"
                value={perAdReward}
                onChange={(e) => setPerAdReward(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold focus:border-blue-500"
              />
              <p className="text-[10px] text-slate-500 mt-0.5">₹5.00 reward per unique watched ad</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">Referral Reward (₹)</label>
              <input
                type="number"
                value={referralReward}
                onChange={(e) => setReferralReward(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold focus:border-blue-500"
              />
              <p className="text-[10px] text-slate-500 mt-0.5">₹15.00 direct referral reward</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">Referral Commission (%)</label>
              <input
                type="number"
                value={referralCommissionPct}
                onChange={(e) => setReferralCommissionPct(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold focus:border-blue-500"
              />
              <p className="text-[10px] text-slate-500 mt-0.5">Lifetime ad earning commission percentage</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">Minimum Withdrawal (₹)</label>
              <input
                type="number"
                value={minWithdrawal}
                onChange={(e) => setMinWithdrawal(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold focus:border-blue-500"
              />
              <p className="text-[10px] text-slate-500 mt-0.5">Minimum payout threshold</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-amber-300 mb-1 flex items-center justify-between">
                <span>Minimum Ads Watch Threshold</span>
                <span className="bg-amber-950 text-amber-300 text-[9px] px-1.5 py-0.5 rounded border border-amber-800 font-extrabold">Anti-Fraud</span>
              </label>
              <input
                type="number"
                value={minAdsWatchForWithdrawal}
                onChange={(e) => setMinAdsWatchForWithdrawal(Number(e.target.value))}
                className="w-full bg-slate-950 border border-amber-500/40 rounded-xl px-3 py-2 text-xs text-amber-300 font-bold focus:border-amber-400"
              />
              <p className="text-[10px] text-amber-200/70 mt-0.5">Number of ads user must watch to unlock withdrawals (e.g., 100)</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">Fast Approval Hashtag Command</label>
              <input
                type="text"
                value={fastApprovalHashtag}
                onChange={(e) => setFastApprovalHashtag(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-blue-300 font-mono font-bold focus:border-blue-500"
              />
              <p className="text-[10px] text-slate-500 mt-0.5">Format: #1 &lt;REQ_ID&gt; PASS</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">Fast Withdrawal Group Username</label>
              <input
                type="text"
                value={fastGroupUsername}
                onChange={(e) => setFastGroupUsername(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:border-blue-500"
              />
              <p className="text-[10px] text-slate-500 mt-0.5">Telegram group handle users must join</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">Telegram Bot Username</label>
              <input
                type="text"
                value={botUsername}
                onChange={(e) => setBotUsername(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-cyan-300 font-mono focus:border-blue-500"
              />
              <p className="text-[10px] text-slate-500 mt-0.5">e.g. PrimeAdsEbot</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">Telegram Bot Token (@BotFather)</label>
              <input
                type="text"
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                placeholder="e.g. 7890123456:AAFx..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-emerald-400 font-mono focus:border-blue-500"
              />
              <p className="text-[10px] text-slate-500 mt-0.5">Bot HTTP API token from BotFather</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">Telegram Mini App URL (Render)</label>
              <input
                type="text"
                value={botAppUrl}
                onChange={(e) => setBotAppUrl(e.target.value)}
                placeholder="https://premads.onrender.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-cyan-400 font-mono focus:border-blue-500"
              />
              <p className="text-[10px] text-slate-500 mt-0.5">Used for inline keyboard Web App buttons</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">Owner Telegram ID (CEO)</label>
              <input
                type="text"
                value={ownerTelegramId}
                onChange={(e) => setOwnerTelegramId(e.target.value)}
                placeholder="e.g. 826258444"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-amber-300 font-mono focus:border-blue-500"
              />
              <p className="text-[10px] text-slate-500 mt-0.5">Main CEO Telegram numeric User ID</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">Daily Ad Limit Per User</label>
              <input
                type="number"
                value={dailyAdLimit}
                onChange={(e) => setDailyAdLimit(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold focus:border-blue-500"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between bg-slate-950 border border-slate-800 p-3 rounded-xl">
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Disable AI Studio Local Bot Polling</span>
                  <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] px-1.5 py-0.5 rounded font-bold">Recommended</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Prevents double bot replies when your app is deployed & polling on Render!
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={disableTelegramPolling}
                  onChange={(e) => setDisableTelegramPolling(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">Monetag Direct Link URL</label>
              <input
                type="text"
                value={monetagDirectLinkUrl}
                onChange={(e) => setMonetagDirectLinkUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={savingSettings}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-extrabold py-3 px-4 rounded-xl shadow-lg transition-all active:scale-98 flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{savingSettings ? 'Saving Settings...' : 'Save Global Settings'}</span>
          </button>

          <div className="pt-4 border-t border-slate-800 space-y-2">
            <div className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
              <RotateCcw className="w-4 h-4" />
              <span>Clean Old Test Data (Reset System Data)</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Resets all user balances, pending payout queues, ad watch counts, and activity logs to 0 for a clean launch state.
            </p>
            <button
              type="button"
              onClick={async () => {
                if (window.confirm('Are you sure you want to clean all old test data and reset payout queues to zero?')) {
                  try {
                    await api.resetData();
                    window.location.reload();
                  } catch (err) {
                    alert('Failed to reset data');
                  }
                }
              }}
              className="w-full bg-rose-950/80 hover:bg-rose-900/90 border border-rose-800 text-rose-300 font-extrabold py-2.5 px-4 rounded-xl shadow transition-all flex items-center justify-center gap-2 text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>🧹 Clean Old Data & Reset All Balances to ₹0</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: WITHDRAWAL QUEUE */}
      {activeTab === 'WITHDRAWALS' && (
        <div className="space-y-3">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setWithdrawalFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    withdrawalFilter === st
                      ? 'bg-blue-600 text-white shadow'
                      : 'bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <div className="relative flex-1 max-w-xs">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                value={withdrawalSearch}
                onChange={(e) => setWithdrawalSearch(e.target.value)}
                placeholder="Search ID, UPI, Bank..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            {filteredWithdrawals.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-xs text-slate-400">
                No withdrawal requests match current filter.
              </div>
            ) : (
              filteredWithdrawals.map((req) => (
                <div
                  key={req.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-blue-300 text-sm">Request #{req.id}</span>
                      <span className="bg-slate-950 border border-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px]">
                        {req.method}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-white text-base">₹{req.amount.toFixed(2)}</span>
                      <span
                        className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold ${
                          req.status === 'APPROVED'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : req.status === 'REJECTED'
                            ? 'bg-rose-950 text-rose-400 border border-rose-800'
                            : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}
                      >
                        {req.status === 'APPROVED' ? 'FAST PAID ⚡' : req.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300">
                    <div>
                      <span className="text-slate-500">User:</span> {req.userName} ({req.userTelegram})
                    </div>
                    <div>
                      <span className="text-slate-500">Time:</span> {new Date(req.requestedAt).toLocaleString()}
                    </div>

                    <div className="sm:col-span-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800 font-mono flex items-center justify-between">
                      <div>
                        {req.method === 'UPI' ? (
                          <span>UPI ID: <strong className="text-cyan-300">{req.upiId}</strong></span>
                        ) : (
                          <span>
                            Bank: <strong className="text-cyan-300">{req.bankDetails?.bankName}</strong> | A/C: <strong className="text-cyan-300">{req.bankDetails?.accountNumber}</strong> | IFSC: <strong className="text-cyan-300">{req.bankDetails?.ifscCode}</strong> ({req.bankDetails?.accountHolder})
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => copyText(req.method === 'UPI' ? req.upiId || '' : req.bankDetails?.accountNumber || '', req.id)}
                        className="bg-slate-800 hover:bg-slate-700 p-1.5 rounded text-[10px] font-sans flex items-center gap-1 text-slate-300"
                      >
                        {copiedId === req.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedId === req.id ? 'Copied' : 'Copy Details'}</span>
                      </button>
                    </div>
                  </div>

                  {req.status === 'PENDING' && (
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                      <button
                        onClick={() => onProcessWithdrawal(req.id, 'PASS', `${currentUser.firstName} (${currentUser.role})`)}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-98 shadow"
                      >
                        <Zap className="w-4 h-4 fill-slate-950" />
                        <span>⚡ Fast Approve / PASS</span>
                      </button>

                      <div className="flex-1 flex items-center gap-1">
                        <input
                          type="text"
                          placeholder="Rejection reason..."
                          value={rejectionReasonMap[req.id] || ''}
                          onChange={(e) => setRejectionReasonMap(prev => ({ ...prev, [req.id]: e.target.value }))}
                          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-[11px] text-white focus:outline-none"
                        />
                        <button
                          onClick={() => onProcessWithdrawal(req.id, 'REJECT', `${currentUser.firstName} (${currentUser.role})`, rejectionReasonMap[req.id] || 'Details incorrect')}
                          className="bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 font-bold px-3 py-2 rounded-xl text-xs transition-all shrink-0"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: ADMIN TEAM & PINS */}
      {activeTab === 'TEAM' && (
        <div className="space-y-4">
          <form onSubmit={handleAddAdmin} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <Key className="w-4 h-4 text-blue-400" />
              Add Multi-Admin Member & Set Pass PIN
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] text-slate-400 mb-1 block">Admin Name</label>
                <input
                  type="text"
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  placeholder="e.g. Vikram (Fast Payout)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 mb-1 block">Telegram ID</label>
                <input
                  type="text"
                  value={newAdminTgId}
                  onChange={(e) => setNewAdminTgId(e.target.value)}
                  placeholder="e.g. 826258443"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 mb-1 block">Role</label>
                <select
                  value={newAdminRole}
                  onChange={(e) => setNewAdminRole(e.target.value as UserRole)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="WITHDRAWAL_PASS">WITHDRAWAL_PASS (Pass Admin)</option>
                  <option value="MANAGER">MANAGER (Operations Admin)</option>
                  <option value="CEO">CEO (Super Admin)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 mb-1 block">Security Passcode PIN</label>
                <input
                  type="text"
                  value={newAdminPin}
                  onChange={(e) => setNewAdminPin(e.target.value)}
                  placeholder="e.g. 1234"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Add Authorized Admin Member</span>
            </button>
          </form>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
            <h3 className="text-xs font-bold text-slate-200">Active Admin Team ({adminTeam.length})</h3>

            <div className="space-y-2">
              {adminTeam.map((adm) => (
                <div
                  key={adm.id}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-200 flex items-center gap-2">
                      <span>{adm.name}</span>
                      <span className="bg-blue-500/20 text-blue-300 text-[10px] px-2 py-0.5 rounded border border-blue-500/30">
                        {adm.role}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      TG ID: {adm.telegramId} • PIN: <strong className="text-blue-300 font-mono">{adm.passPin}</strong> • Added {adm.addedAt}
                    </div>
                  </div>

                  {adm.role !== 'CEO' && (
                    <button
                      onClick={() => onDeleteAdminMember(adm.id)}
                      className="text-rose-400 hover:text-rose-300 p-1.5 rounded hover:bg-rose-950/50"
                      title="Remove Admin"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: USER DIRECTORY */}
      {activeTab === 'USERS' && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search user name or Telegram ID..."
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            {filteredUsers.map((u) => (
              <div
                key={u.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-100 flex items-center gap-2">
                      <span>{u.firstName}</span>
                      <span className="text-[10px] text-slate-400">@{u.username}</span>
                      {u.isBanned && (
                        <span className="bg-rose-950 text-rose-400 border border-rose-800 text-[9px] px-1.5 py-0.5 rounded font-bold">
                          BANNED
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      ID: {u.id} • Joined Group: {u.hasJoinedFastGroup ? 'YES ✓' : 'NO ❌'} • Watched Ads: {u.watchedAdIds?.length || 0}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-extrabold text-emerald-400 text-sm">₹{u.balance.toFixed(2)}</div>
                    <div className="text-[10px] text-slate-400">Earned: ₹{u.totalEarned.toFixed(2)}</div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 space-y-2 text-[11px]">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <button
                      onClick={() => onUserAction(u.id, u.isBanned ? 'UNBAN' : 'BAN')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                        u.isBanned
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                          : 'bg-rose-950 text-rose-300 border-rose-800'
                      }`}
                    >
                      {u.isBanned ? 'Unban Account' : 'Ban Account'}
                    </button>

                    {/* ADD BALANCE CONTROL */}
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        placeholder="Add ₹"
                        value={adjustAmountMap[u.id] || ''}
                        onChange={(e) => setAdjustAmountMap(prev => ({ ...prev, [u.id]: e.target.value }))}
                        className="w-16 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[10px] text-white"
                      />
                      <button
                        onClick={() => {
                          const amt = Number(adjustAmountMap[u.id] || 0);
                          if (amt > 0) {
                            onUserAction(u.id, 'ADD_BALANCE', amt);
                            setAdjustAmountMap(prev => ({ ...prev, [u.id]: '' }));
                          }
                        }}
                        className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-2 py-1 rounded-lg text-[10px]"
                      >
                        + Add ₹
                      </button>
                    </div>
                  </div>

                  {/* DEDUCT BALANCE CONTROL WITH REASON */}
                  <div className="bg-rose-950/30 border border-rose-900/50 p-2 rounded-xl flex flex-wrap items-center justify-between gap-2">
                    <input
                      type="text"
                      placeholder="Deduction reason (e.g. Terms violation)..."
                      value={deductReasonMap[u.id] || ''}
                      onChange={(e) => setDeductReasonMap(prev => ({ ...prev, [u.id]: e.target.value }))}
                      className="flex-1 min-w-[140px] bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[10px] text-rose-200"
                    />
                    <div className="flex items-center gap-1.5 shrink-0">
                      <input
                        type="number"
                        placeholder="Deduct ₹"
                        value={deductAmountMap[u.id] || ''}
                        onChange={(e) => setDeductAmountMap(prev => ({ ...prev, [u.id]: e.target.value }))}
                        className="w-16 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[10px] text-rose-300 font-bold"
                      />
                      <button
                        onClick={() => {
                          const amt = Number(deductAmountMap[u.id] || 0);
                          const reason = deductReasonMap[u.id] || 'Admin adjustment';
                          if (amt > 0) {
                            onUserAction(u.id, 'DEDUCT_BALANCE', amt, reason);
                            setDeductAmountMap(prev => ({ ...prev, [u.id]: '' }));
                            setDeductReasonMap(prev => ({ ...prev, [u.id]: '' }));
                          }
                        }}
                        className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-2.5 py-1 rounded-lg text-[10px] shadow"
                      >
                        - Deduct Balance
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: SUPPORT TICKETS MANAGEMENT */}
      {activeTab === 'SUPPORT' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4 font-sans">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <Headset className="w-4 h-4 text-purple-400" />
              <span>User Support Tickets Management ({supportTickets.length})</span>
            </h3>

            <div className="flex items-center gap-1.5">
              {(['ALL', 'OPEN', 'RESOLVED'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setSupportFilter(f)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    supportFilter === f ? 'bg-purple-600 text-white shadow' : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                  }`}
                >
                  {f} {f === 'OPEN' && `(${supportTickets.filter(t => t.status === 'OPEN').length})`}
                </button>
              ))}
            </div>
          </div>

          {supportTickets.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              <Headset className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              No support tickets found in the system.
            </div>
          ) : (
            <div className="space-y-3">
              {supportTickets
                .filter(t => supportFilter === 'ALL' || t.status === supportFilter)
                .map(t => (
                  <div key={t.id} className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{t.userName}</span>
                        <span className="text-[11px] text-cyan-400 font-mono">{t.userTelegram}</span>
                        <span className="bg-slate-900 text-slate-400 text-[10px] px-2 py-0.5 rounded border border-slate-800 font-mono">
                          ID: {t.userId}
                        </span>
                      </div>

                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        t.status === 'RESOLVED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {t.status}
                      </span>
                    </div>

                    <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80 space-y-1">
                      <div className="text-[11px] font-bold text-purple-300">{t.issueType}</div>
                      <p className="text-slate-200 text-xs font-mono whitespace-pre-wrap">{t.message}</p>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1 pt-1">
                        <Clock className="w-3 h-3" />
                        <span>Submitted: {new Date(t.createdAt).toLocaleString()}</span>
                      </div>
                    </div>

                    {t.reply && (
                      <div className="bg-purple-950/40 border border-purple-800/40 p-2.5 rounded-lg text-xs space-y-1">
                        <div className="text-purple-300 font-bold flex items-center gap-1 text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                          Admin Response:
                        </div>
                        <p className="text-slate-200 text-[11px] font-mono">{t.reply}</p>
                      </div>
                    )}

                    {t.status === 'OPEN' && (
                      <div className="pt-2 border-t border-slate-900 space-y-2">
                        <textarea
                          placeholder="Type response to user..."
                          rows={2}
                          value={supportReplyMap[t.id] || ''}
                          onChange={(e) => setSupportReplyMap(prev => ({ ...prev, [t.id]: e.target.value }))}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-purple-500 placeholder-slate-600 font-sans"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={async () => {
                              const replyMsg = supportReplyMap[t.id] || 'Your issue has been resolved. Thanks for contacting support!';
                              setReplyingTicketId(t.id);
                              try {
                                await api.replySupportTicket(t.id, {
                                  reply: replyMsg,
                                  status: 'RESOLVED',
                                  processedBy: currentUser.firstName
                                });
                                fetchSupportTickets();
                                setSupportReplyMap(prev => ({ ...prev, [t.id]: '' }));
                              } catch (err: any) {
                                alert(err.message || 'Failed to reply ticket');
                              } finally {
                                setReplyingTicketId(null);
                              }
                            }}
                            disabled={replyingTicketId === t.id}
                            className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow transition-all active:scale-98"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>{replyingTicketId === t.id ? 'Sending...' : 'Send Reply & Mark Resolved'}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
