/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, SystemSettings, WithdrawalRequest, AdminMember, GroupMessage } from './types';
import { initialSettings, initialUsers, initialAdminTeam, initialWithdrawalRequests, initialGroupMessages, defaultGuestUser } from './mockData';
import { api } from './services/api';
import { TelegramFrame } from './components/TelegramFrame';
import { Navigation } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { WatchAdsView } from './components/WatchAdsView';
import { ReferralView } from './components/ReferralView';
import { WithdrawView } from './components/WithdrawView';
import { BotSimulatorView } from './components/BotSimulatorView';
import { FastGroupView } from './components/FastGroupView';
import { AdminPanel } from './components/AdminPanel';
import { HelpView } from './components/HelpView';
import { UserNotificationModal } from './components/UserNotificationModal';
import { MaintenanceModal } from './components/MaintenanceModal';

export default function App() {
  const [settings, setSettings] = useState<SystemSettings>(initialSettings);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [currentUser, setCurrentUser] = useState<User>(defaultGuestUser);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>(initialWithdrawalRequests);
  const [adminTeam, setAdminTeam] = useState<AdminMember[]>(initialAdminTeam);
  const [groupMessages, setGroupMessages] = useState<GroupMessage[]>(initialGroupMessages);

  const [activeAppMode, setActiveAppMode] = useState<'miniapp' | 'botchat' | 'admin' | 'fastgroup'>('miniapp');
  const [activeTab, setActiveTab] = useState<'home' | 'watch' | 'refer' | 'withdraw' | 'help' | 'admin'>('home');
  const [dailyClaimed, setDailyClaimed] = useState(false);

  // Load initial data from Express backend & Auto-detect Telegram WebApp User
  useEffect(() => {
    const autoDetectTgUser = async () => {
      try {
        if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
          const tg = (window as any).Telegram.WebApp;
          try {
            if (typeof tg.ready === 'function') tg.ready();
            if (typeof tg.expand === 'function') tg.expand();
          } catch (e) {
            // Ignored non-fatal initialization warning
          }

          const tgUser = tg.initDataUnsafe?.user;
          const startParam = tg.initDataUnsafe?.start_param;

          if (tgUser && tgUser.id) {
            const detectedUser = await api.loginUser({
              telegramId: String(tgUser.id),
              username: tgUser.username || `user_${tgUser.id}`,
              firstName: tgUser.first_name || 'Telegram User',
              referrerId: startParam ? String(startParam).replace('ref_', '') : null
            });
            if (detectedUser && detectedUser.id) {
              setCurrentUser(detectedUser);
            }
          }
        }
      } catch (err) {
        console.warn('Telegram Auto-Detect notice:', err);
      }
    };

    autoDetectTgUser();

    refreshAllData();
    const interval = setInterval(refreshAllData, 4000);
    return () => clearInterval(interval);
  }, []);

  const refreshAllData = async () => {
    try {
      const s = await api.getSettings();
      setSettings(s);

      const u = await api.getAllUsers();
      if (u && u.length > 0) {
        setUsers(u);
        setCurrentUser(prev => u.find((item) => item.id === prev.id) || prev);
      }

      const w = await api.getWithdrawals();
      if (w) setWithdrawals(w);

      const a = await api.getAdminTeam();
      if (a) setAdminTeam(a);

      const g = await api.getGroupMessages();
      if (g) setGroupMessages(g);
    } catch (err) {
      console.warn('Backend API sync notice, using active fallback state:', err);
    }
  };

  // Update current user reference when user list updates
  useEffect(() => {
    const fresh = users.find(u => u.id === currentUser.id);
    if (fresh) {
      setCurrentUser(fresh);
    }
  }, [users]);

  // Handle user switching
  const handleSelectUser = (user: User) => {
    setCurrentUser(user);
  };

  // Watch Ad action
  const handleAdWatched = async (adId?: string) => {
    const data = await api.watchAd(currentUser.id, adId);

    // Refresh full users state to capture delayed referral credit triggers & updated totalAdsWatched
    const freshUsers = await api.getAllUsers();
    setUsers(freshUsers);

    // Refresh withdrawals and messages
    const freshWithdrawals = await api.getWithdrawals();
    setWithdrawals(freshWithdrawals);

    const freshMsgs = await api.getGroupMessages();
    setGroupMessages(freshMsgs);

    return data;
  };

  // Verify Fast Withdrawal Group Join Action
  const handleVerifyGroupJoin = async () => {
    const data = await api.verifyGroupJoin(currentUser.id);
    setUsers(prev => prev.map(u => {
      if (u.id === currentUser.id) {
        return { ...u, hasJoinedFastGroup: true };
      }
      return u;
    }));
    return data;
  };

  // Request Withdrawal action
  const handleRequestWithdrawal = async (payload: {
    userId: string;
    amount: number;
    method: 'UPI' | 'BANK';
    upiId?: string;
    bankDetails?: { accountNumber: string; ifscCode: string; accountHolder: string; bankName: string };
  }) => {
    const res = await api.requestWithdrawal(payload);

    // Refresh lists
    const freshUsers = await api.getAllUsers();
    setUsers(freshUsers);

    const freshWithdrawals = await api.getWithdrawals();
    setWithdrawals(freshWithdrawals);

    const freshMsgs = await api.getGroupMessages();
    setGroupMessages(freshMsgs);

    return res;
  };

  // Process Withdrawal action
  const handleProcessWithdrawal = async (
    id: string,
    action: 'PASS' | 'APPROVE' | 'REJECT',
    processedBy?: string,
    reason?: string
  ) => {
    const res = await api.processWithdrawal(id, action, processedBy, reason);

    const freshWithdrawals = await api.getWithdrawals();
    setWithdrawals(freshWithdrawals);

    const freshUsers = await api.getAllUsers();
    setUsers(freshUsers);

    const freshMsgs = await api.getGroupMessages();
    setGroupMessages(freshMsgs);

    return res;
  };

  // Update Settings action
  const handleUpdateSettings = async (newSettings: Partial<SystemSettings>) => {
    const res = await api.updateSettings(newSettings);
    setSettings(res.settings);

    const freshMsgs = await api.getGroupMessages();
    setGroupMessages(freshMsgs);

    return res;
  };

  // Admin Team Actions
  const handleAddAdminMember = async (payload: { name: string; telegramId?: string; role: any; passPin?: string }) => {
    const res = await api.addAdminMember(payload);
    const freshTeam = await api.getAdminTeam();
    setAdminTeam(freshTeam);
    return res;
  };

  const handleDeleteAdminMember = async (id: string) => {
    await api.deleteAdminMember(id);
    const freshTeam = await api.getAdminTeam();
    setAdminTeam(freshTeam);
  };

  // User Actions
  const handleUserAction = async (userId: string, action: 'BAN' | 'UNBAN' | 'ADD_BALANCE' | 'DEDUCT_BALANCE', amount?: number, reason?: string) => {
    await api.userAction(userId, action, amount, reason);
    const freshUsers = await api.getAllUsers();
    setUsers(freshUsers);
  };

  // Notification Dismissal
  const handleDismissNotification = async (notificationId: string) => {
    await api.dismissNotification(currentUser.id, notificationId);
    const freshUsers = await api.getAllUsers();
    setUsers(freshUsers);
  };

  // Send message in Fast Group
  const handleSendGroupMessage = async (text: string, sender?: string, senderRole?: string) => {
    const res = await api.sendGroupMessage(text, sender, senderRole);
    const freshMsgs = await api.getGroupMessages();
    setGroupMessages(freshMsgs);
    const freshWithdrawals = await api.getWithdrawals();
    setWithdrawals(freshWithdrawals);
    return res;
  };

  // Bot Command trigger
  const handleSendBotCommand = async (commandText: string) => {
    if (commandText.startsWith(settings.fastApprovalHashtag || '#1')) {
      await handleSendGroupMessage(commandText, `${currentUser.firstName} (${currentUser.role})`, currentUser.role);
    }
  };

  // Claim Daily Streak
  const handleClaimDailyStreak = async () => {
    if (dailyClaimed) return;
    await api.userAction(currentUser.id, 'ADD_BALANCE', 2);
    setDailyClaimed(true);
    const freshUsers = await api.getAllUsers();
    setUsers(freshUsers);
  };

  // Elevate current user role upon PIN verification
  const handleElevateUserRole = async (newRole: any) => {
    try {
      await api.userAction(currentUser.id, 'ELEVATE_ROLE', undefined, undefined, newRole);
      const updatedUser = { ...currentUser, role: newRole };
      setCurrentUser(updatedUser);
      setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
    } catch (e) {
      console.warn('Backend elevation notice, setting active role locally:', e);
      setCurrentUser(prev => ({ ...prev, role: newRole }));
    }
  };

  const isAdmin = currentUser.role !== 'USER';
  const unreadNotification = currentUser.notifications?.find(n => !n.read);

  return (
    <>
      {activeAppMode !== 'admin' && (
        <MaintenanceModal
          settings={settings}
          user={currentUser}
          onOpenAdminPanel={() => {
            setActiveAppMode('admin');
            setActiveTab('admin');
          }}
          onDisableMaintenance={async () => {
            await handleUpdateSettings({ isMaintenanceMode: false });
          }}
          onElevateUserRole={handleElevateUserRole}
        />
      )}

      {unreadNotification && (
        <UserNotificationModal
          notification={unreadNotification}
          onDismiss={handleDismissNotification}
        />
      )}

      <TelegramFrame
        currentUser={currentUser}
        users={users}
        onSelectUser={handleSelectUser}
        activeAppMode={activeAppMode}
        onSelectMode={(mode) => {
          setActiveAppMode(mode);
          if (mode === 'admin') setActiveTab('admin');
        }}
      >
        {/* MODE 1: TELEGRAM MINI APP INTERFACE */}
        {activeAppMode === 'miniapp' && (
          <div className="flex flex-col h-full min-h-[580px] justify-between">
            <div className="flex-1">
              {activeTab === 'home' && (
                <DashboardView
                  user={currentUser}
                  settings={settings}
                  withdrawals={withdrawals}
                  onNavigate={(t) => setActiveTab(t as any)}
                  onClaimDailyStreak={handleClaimDailyStreak}
                  dailyClaimed={dailyClaimed}
                  onRefreshUserData={refreshAllData}
                />
              )}

              {activeTab === 'watch' && (
                <WatchAdsView
                  user={currentUser}
                  settings={settings}
                  onAdWatched={handleAdWatched}
                  onVerifyGroupJoin={handleVerifyGroupJoin}
                />
              )}

              {activeTab === 'refer' && (
                <ReferralView
                  user={currentUser}
                  settings={settings}
                  allUsers={users}
                />
              )}

              {activeTab === 'withdraw' && (
                <WithdrawView
                  user={currentUser}
                  settings={settings}
                  withdrawals={withdrawals}
                  onRequestWithdrawal={handleRequestWithdrawal}
                  onVerifyGroupJoin={handleVerifyGroupJoin}
                />
              )}

              {activeTab === 'help' && (
                <HelpView settings={settings} currentUser={currentUser} />
              )}

              {activeTab === 'admin' && (
                <AdminPanel
                  currentUser={currentUser}
                  settings={settings}
                  users={users}
                  withdrawals={withdrawals}
                  adminTeam={adminTeam}
                  onUpdateSettings={handleUpdateSettings}
                  onProcessWithdrawal={handleProcessWithdrawal}
                  onAddAdminMember={handleAddAdminMember}
                  onDeleteAdminMember={handleDeleteAdminMember}
                  onUserAction={handleUserAction}
                  onElevateUserRole={handleElevateUserRole}
                />
              )}
            </div>

            <Navigation
              activeTab={activeTab}
              onTabChange={(t) => {
                setActiveTab(t);
              }}
              isAdmin={isAdmin}
              perAdReward={settings.perAdReward}
            />
          </div>
        )}

      {/* MODE 2: TELEGRAM BOT CHAT SIMULATOR */}
      {activeAppMode === 'botchat' && (
        <BotSimulatorView
          user={currentUser}
          settings={settings}
          onOpenMiniAppTab={(tab) => {
            setActiveAppMode('miniapp');
            setActiveTab(tab);
          }}
          onSendBotCommand={handleSendBotCommand}
        />
      )}

      {/* MODE 3: PRIVATE FAST APPROVAL GROUP (#1 HASHTAG COMMAND) */}
      {activeAppMode === 'fastgroup' && currentUser.role !== 'USER' && (
        <FastGroupView
          currentUser={currentUser}
          settings={settings}
          groupMessages={groupMessages}
          withdrawals={withdrawals}
          onSendMessage={handleSendGroupMessage}
          onProcessWithdrawal={handleProcessWithdrawal}
        />
      )}

      {/* MODE 4: FULL ADMIN SUITE */}
      {activeAppMode === 'admin' && (
        <AdminPanel
          currentUser={currentUser}
          settings={settings}
          users={users}
          withdrawals={withdrawals}
          adminTeam={adminTeam}
          onUpdateSettings={handleUpdateSettings}
          onProcessWithdrawal={handleProcessWithdrawal}
          onAddAdminMember={handleAddAdminMember}
          onDeleteAdminMember={handleDeleteAdminMember}
          onUserAction={handleUserAction}
          onElevateUserRole={handleElevateUserRole}
        />
      )}
    </TelegramFrame>
  </>
);
}
