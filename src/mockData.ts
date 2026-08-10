import { SystemSettings, User, WithdrawalRequest, AdminMember, GroupMessage, AdWatchLog, AdItem } from './types';

export const initialSettings: SystemSettings = {
  welcomeBonus: 5,                  // ₹5 = 1,000 Coins
  perAdReward: 0.05,               // ₹0.05 = 10 Coins
  referralReward: 5,               // ₹5 = 1,000 Coins
  referralCommissionPct: 10,       // 10% lifetime commission
  minWithdrawal: 50,               // ₹50 = 10,000 Coins
  adCooldownSec: 10,
  dailyAdLimit: 50,
  monetagDirectLinkUrl: 'https://monetag.com/directlink/demo_ad_zone_77821',
  monetagScriptTag: '<script src="//libtl.com/sdk.js" data-zone="11537959" data-sdk="show_11537959"></script>',
  monetagZoneId: '11537959',
  enableRealMonetagSdk: true,
  fastApprovalHashtag: '#1',
  fastGroupTitle: 'AdEarn Private Fast Approvals VIP Group',
  fastGroupUsername: 'AdEarn_FastWithdrawals',
  botUsername: 'PrimeAdsEbot',
  botToken: '7890123456:AAFx_PrimeAdsEbotTokenDemoKey',
  ownerTelegramId: '826258444'
};

export const availableAdCatalog: AdItem[] = [
  {
    id: 'AD-MONETAG-101',
    title: 'Monetag High-eCPM Interstitial #101',
    category: 'REWARDED',
    reward: 0.05,
    provider: 'Monetag Official Ad Network',
    eCpm: '$4.50',
    durationSec: 10,
    description: 'Watch 10s video ad offer to earn 10 Coins (₹0.05) credited instantly to wallet.',
    targetUrl: 'https://monetag.com/directlink/demo_ad_zone_77821'
  },
  {
    id: 'AD-SMARTLINK-102',
    title: 'Monetag Direct SmartLink Offer #102',
    category: 'DIRECT',
    reward: 0.05,
    provider: 'Monetag Direct eCPM Engine',
    eCpm: '$5.20',
    durationSec: 10,
    description: 'Interact with SmartLink direct sponsor page to earn 10 Coins (₹0.05).',
    targetUrl: 'https://monetag.com/directlink/demo_ad_zone_77821'
  },
  {
    id: 'AD-PUSH-103',
    title: 'Monetag In-Page Push Spotlight #103',
    category: 'PUSH',
    reward: 0.05,
    provider: 'Monetag Premium Push Ad',
    eCpm: '$3.80',
    durationSec: 10,
    description: 'View premium crypto trading & cashback offer push banner for 10 Coins (₹0.05).',
    targetUrl: 'https://monetag.com/directlink/demo_ad_zone_77821'
  },
  {
    id: 'AD-SPONSOR-104',
    title: 'Telegram Mini App VIP Sponsor #104',
    category: 'SPONSOR',
    reward: 0.05,
    provider: 'PrimeAds Exclusive Partner',
    eCpm: '$6.00',
    durationSec: 10,
    description: 'Watch exclusive partner mini app trial preview to earn 10 Coins (₹0.05).',
    targetUrl: 'https://monetag.com/directlink/demo_ad_zone_77821'
  },
  {
    id: 'AD-REWARDED-105',
    title: 'Monetag Rewarded Stream #105',
    category: 'REWARDED',
    reward: 0.05,
    provider: 'Monetag Ad SDK v7',
    eCpm: '$4.80',
    durationSec: 10,
    description: 'Watch full 10-second video ad to receive 10 Coins (₹0.05).',
    targetUrl: 'https://monetag.com/directlink/demo_ad_zone_77821'
  },
  {
    id: 'AD-SMARTLINK-106',
    title: 'Monetag Direct SmartLink Campaign #106',
    category: 'DIRECT',
    reward: 0.05,
    provider: 'Monetag Direct Engine',
    eCpm: '$5.10',
    durationSec: 10,
    description: 'Explore high conversion sponsor offer page to claim 10 Coins (₹0.05).',
    targetUrl: 'https://monetag.com/directlink/demo_ad_zone_77821'
  }
];

export const initialUsers: User[] = [
  {
    id: '826258441',
    username: 'premsargam',
    firstName: 'Prem Sargam',
    coins: 29000,
    totalCoinsEarned: 49000,
    balance: 145,
    totalEarned: 245,
    totalWithdrawn: 100,
    totalAdsWatched: 115,
    adsWatchedToday: 6,
    lastAdWatchedAt: Date.now() - 60000,
    watchedAdIds: ['AD-MONETAG-101'],
    hasJoinedFastGroup: true,
    referredBy: null,
    referralCount: 4,
    referralEarnings: 60,
    referralBonusCredited: true,
    role: 'CEO',
    isBanned: false,
    joinedAt: new Date(Date.now() - 7 * 86400000).toISOString()
  },
  {
    id: '826258442',
    username: 'rahul_trader',
    firstName: 'Rahul Sharma',
    coins: 22000,
    totalCoinsEarned: 22000,
    balance: 110,
    totalEarned: 110,
    totalWithdrawn: 0,
    totalAdsWatched: 105,
    adsWatchedToday: 12,
    lastAdWatchedAt: Date.now() - 300000,
    watchedAdIds: [],
    hasJoinedFastGroup: true,
    referredBy: '826258441',
    referralCount: 2,
    referralEarnings: 30,
    referralBonusCredited: true,
    role: 'MANAGER',
    isBanned: false,
    joinedAt: new Date(Date.now() - 5 * 86400000).toISOString()
  },
  {
    id: '826258443',
    username: 'vikram_pass_admin',
    firstName: 'Vikram (Withdrawal Pass Admin)',
    coins: 17000,
    totalCoinsEarned: 17000,
    balance: 85,
    totalEarned: 85,
    totalWithdrawn: 0,
    totalAdsWatched: 52,
    adsWatchedToday: 3,
    lastAdWatchedAt: Date.now() - 1200000,
    watchedAdIds: [],
    hasJoinedFastGroup: true,
    referredBy: '826258441',
    referralCount: 1,
    referralEarnings: 15,
    referralBonusCredited: true,
    role: 'WITHDRAWAL_PASS',
    isBanned: false,
    joinedAt: new Date(Date.now() - 3 * 86400000).toISOString()
  },
  {
    id: '826258444',
    username: 'anita_kumar',
    firstName: 'Anita Kumar',
    coins: 7000,
    totalCoinsEarned: 7000,
    balance: 35,
    totalEarned: 35,
    totalWithdrawn: 0,
    totalAdsWatched: 18,
    adsWatchedToday: 3,
    lastAdWatchedAt: Date.now() - 4000000,
    watchedAdIds: [],
    hasJoinedFastGroup: false, // New user needs to join Fast Withdrawal Group
    referredBy: '826258442',
    referralCount: 0,
    referralEarnings: 0,
    referralBonusCredited: false, // Has watched 18/50 ads so far
    role: 'USER',
    isBanned: false,
    joinedAt: new Date(Date.now() - 1 * 86400000).toISOString()
  }
];

export const initialAdminTeam: AdminMember[] = [
  {
    id: 'adm_1',
    name: 'Prem (Chief Executive)',
    telegramId: '826258441',
    role: 'CEO',
    passPin: '7788',
    addedAt: '2026-08-01',
    status: 'ACTIVE'
  },
  {
    id: 'adm_2',
    name: 'Rahul (Operations Manager)',
    telegramId: '826258442',
    role: 'MANAGER',
    passPin: '1234',
    addedAt: '2026-08-03',
    status: 'ACTIVE'
  },
  {
    id: 'adm_3',
    name: 'Vikram (Fast Payout Specialist)',
    telegramId: '826258443',
    role: 'WITHDRAWAL_PASS',
    passPin: '9900',
    addedAt: '2026-08-05',
    status: 'ACTIVE'
  }
];

export const initialWithdrawalRequests: WithdrawalRequest[] = [
  {
    id: '1001',
    userId: '826258441',
    userName: 'Prem Sargam',
    userTelegram: '@premsargam',
    amount: 100,
    method: 'UPI',
    upiId: 'premsargam@upi',
    status: 'APPROVED',
    requestedAt: new Date(Date.now() - 86400000).toISOString(),
    processedAt: new Date(Date.now() - 80000000).toISOString(),
    processedBy: 'Vikram (Fast Payout)',
    fastApproved: true
  },
  {
    id: '1002',
    userId: '826258442',
    userName: 'Rahul Sharma',
    userTelegram: '@rahul_trader',
    amount: 150,
    method: 'UPI',
    upiId: 'rahulsharma@okicici',
    status: 'PENDING',
    requestedAt: new Date(Date.now() - 1800000).toISOString(),
    fastApproved: false
  },
  {
    id: '1003',
    userId: '826258443',
    userName: 'Vikram',
    userTelegram: '@vikram_pass_admin',
    amount: 120,
    method: 'BANK',
    bankDetails: {
      accountNumber: '9182736450192',
      ifscCode: 'SBIN0004512',
      accountHolder: 'Vikram Singh',
      bankName: 'State Bank of India'
    },
    status: 'PENDING',
    requestedAt: new Date(Date.now() - 600000).toISOString(),
    fastApproved: false
  }
];

export const initialGroupMessages: GroupMessage[] = [
  {
    id: 'msg_1',
    sender: 'System Bot',
    senderRole: 'SYSTEM',
    text: '🤖 Fast Withdrawal Bot linked to Private Group @AdEarn_Withdrawal_FastGroup! Admins can reply with `#1 <REQ_ID> PASS` to instantly approve requests.',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    isSystemNotification: true
  },
  {
    id: 'msg_2',
    sender: 'System Alert',
    senderRole: 'SYSTEM',
    text: '🚨 NEW WITHDRAWAL REQUEST #1002\n👤 User: Rahul Sharma (@rahul_trader)\n💰 Amount: ₹150.00\n💳 Method: UPI (rahulsharma@okicici)\n\n⚡ Reply `#1 1002 PASS` or click Approve button below!',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    isSystemNotification: true,
    withdrawalRequestId: '1002'
  },
  {
    id: 'msg_3',
    sender: 'System Alert',
    senderRole: 'SYSTEM',
    text: '🚨 NEW WITHDRAWAL REQUEST #1003\n👤 User: Vikram (@vikram_pass_admin)\n🏦 Method: BANK (A/C: 9182736450192 | IFSC: SBIN0004512)\n💰 Amount: ₹120.00\n\n⚡ Reply `#1 1003 PASS` to process instantly!',
    timestamp: new Date(Date.now() - 600000).toISOString(),
    isSystemNotification: true,
    withdrawalRequestId: '1003'
  }
];

export const initialAdWatchLogs: AdWatchLog[] = [
  {
    id: 'log_1',
    userId: '826258441',
    adId: 'AD-MONETAG-101',
    reward: 5,
    adProvider: 'Monetag Rewarded Interstitial',
    timestamp: new Date(Date.now() - 300000).toISOString()
  },
  {
    id: 'log_2',
    userId: '826258442',
    adId: 'AD-SMARTLINK-102',
    reward: 5,
    adProvider: 'Monetag SmartLink Direct',
    timestamp: new Date(Date.now() - 600000).toISOString()
  }
];
