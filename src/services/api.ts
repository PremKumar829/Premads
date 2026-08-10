import { SystemSettings, User, WithdrawalRequest, AdminMember, GroupMessage } from '../types';

export const api = {
  // Settings
  getSettings: async (): Promise<SystemSettings> => {
    try {
      const res = await fetch('/api/settings');
      if (!res.ok) throw new Error('Failed to fetch settings');
      return await res.json();
    } catch (e) {
      console.warn('API error, using local state:', e);
      return (window as any).__SETTINGS__ || {
        welcomeBonus: 20,
        perAdReward: 5,
        referralReward: 15,
        referralCommissionPct: 10,
        minWithdrawal: 100,
        adCooldownSec: 10,
        dailyAdLimit: 20,
        monetagDirectLinkUrl: 'https://monetag.com/directlink/demo_zone_77821',
        monetagScriptTag: '<script src="//monetag.com/sdk/inpage.js"></script>',
        monetagZoneId: '881923',
        enableRealMonetagSdk: false,
        fastApprovalHashtag: '#1',
        fastGroupTitle: 'AdEarn Private Fast Approvals VIP Group',
        fastGroupUsername: 'AdEarn_FastWithdrawals',
        botUsername: 'PrimeAdsEbot'
      };
    }
  },

  updateSettings: async (settings: Partial<SystemSettings>): Promise<{ success: boolean; settings: SystemSettings }> => {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    if (!res.ok) throw new Error('Failed to update settings');
    return await res.json();
  },

  // Users
  loginUser: async (
    paramsOrTelegramId: string | { telegramId?: string; username?: string; firstName?: string; referrerId?: string | null },
    username?: string,
    firstName?: string,
    referrerId?: string | null
  ): Promise<User> => {
    let bodyData: any = {};
    if (typeof paramsOrTelegramId === 'object') {
      bodyData = paramsOrTelegramId;
    } else {
      bodyData = { telegramId: paramsOrTelegramId, username, firstName, referrerId };
    }

    const res = await fetch('/api/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyData)
    });
    if (!res.ok) throw new Error('User login failed');
    return await res.json();
  },

  getUser: async (id: string): Promise<User> => {
    const res = await fetch(`/api/users/${id}`);
    if (!res.ok) throw new Error('User not found');
    return await res.json();
  },

  getAllUsers: async (): Promise<User[]> => {
    const res = await fetch('/api/users');
    if (!res.ok) throw new Error('Failed to fetch users');
    return await res.json();
  },

  userAction: async (userId: string, action: 'BAN' | 'UNBAN' | 'ADD_BALANCE' | 'DEDUCT_BALANCE' | 'ELEVATE_ROLE', amount?: number, reason?: string, role?: string) => {
    const res = await fetch(`/api/users/${userId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, amount, reason, role })
    });
    if (!res.ok) throw new Error('Failed to perform user action');
    return await res.json();
  },

  dismissNotification: async (userId: string, notificationId: string) => {
    const res = await fetch(`/api/users/${userId}/notifications/${notificationId}/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error('Failed to dismiss notification');
    return await res.json();
  },

  // User Group Verification
  verifyGroupJoin: async (userId: string) => {
    const res = await fetch(`/api/users/${userId}/verify-group`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error('Failed to verify group joining');
    return await res.json();
  },

  // Ad Watching
  watchAd: async (userId: string, adId?: string) => {
    const res = await fetch(`/api/users/${userId}/watch-ad`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to watch ad');
    return data;
  },

  // Withdrawals
  getWithdrawals: async (): Promise<WithdrawalRequest[]> => {
    const res = await fetch('/api/withdrawals');
    if (!res.ok) throw new Error('Failed to fetch withdrawals');
    return await res.json();
  },

  requestWithdrawal: async (payload: {
    userId: string;
    amount: number;
    method: 'UPI' | 'BANK';
    upiId?: string;
    bankDetails?: { accountNumber: string; ifscCode: string; accountHolder: string; bankName: string };
  }) => {
    const res = await fetch('/api/withdrawals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to submit withdrawal request');
    return data;
  },

  processWithdrawal: async (id: string, action: 'PASS' | 'APPROVE' | 'REJECT', processedBy?: string, rejectionReason?: string) => {
    const res = await fetch(`/api/withdrawals/${id}/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, processedBy, rejectionReason })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to process withdrawal');
    return data;
  },

  // Admin Team
  getAdminTeam: async (): Promise<AdminMember[]> => {
    const res = await fetch('/api/admin/team');
    if (!res.ok) throw new Error('Failed to fetch admin team');
    return await res.json();
  },

  addAdminMember: async (payload: { name: string; telegramId?: string; role: string; passPin?: string }) => {
    const res = await fetch('/api/admin/team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to add admin');
    return data;
  },

  deleteAdminMember: async (id: string) => {
    const res = await fetch(`/api/admin/team/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to remove admin member');
    return await res.json();
  },

  // Fast Group
  getGroupMessages: async (): Promise<GroupMessage[]> => {
    const res = await fetch('/api/admin/fast-group/messages');
    if (!res.ok) throw new Error('Failed to fetch group messages');
    return await res.json();
  },

  sendGroupMessage: async (text: string, sender?: string, senderRole?: string) => {
    const res = await fetch('/api/admin/fast-group/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, sender, senderRole })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to send message');
    return data;
  },

  resetData: async () => {
    const res = await fetch('/api/admin/reset-data', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reset system data');
    return await res.json();
  }
};
