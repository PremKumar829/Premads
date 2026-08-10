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
  botAppUrl: 'https://premads.onrender.com',
  disableTelegramPolling: true,
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
    coins: 0,
    totalCoinsEarned: 0,
    balance: 0,
    totalEarned: 0,
    totalWithdrawn: 0,
    totalAdsWatched: 0,
    adsWatchedToday: 0,
    lastAdWatchedAt: 0,
    watchedAdIds: [],
    hasJoinedFastGroup: true,
    referredBy: null,
    referralCount: 0,
    referralEarnings: 0,
    referralBonusCredited: false,
    role: 'CEO',
    isBanned: false,
    joinedAt: new Date().toISOString()
  }
];

export const initialAdminTeam: AdminMember[] = [
  {
    id: 'adm_1',
    name: 'Prem (Chief Executive)',
    telegramId: '826258441',
    role: 'CEO',
    passPin: '7788',
    addedAt: new Date().toISOString().split('T')[0],
    status: 'ACTIVE'
  }
];

export const initialWithdrawalRequests: WithdrawalRequest[] = [];

export const initialGroupMessages: GroupMessage[] = [
  {
    id: 'msg_1',
    sender: 'System Bot',
    senderRole: 'SYSTEM',
    text: '🤖 Fast Withdrawal Bot activated. Ready for real payout requests.',
    timestamp: new Date().toISOString(),
    isSystemNotification: true
  }
];

export const initialAdWatchLogs: AdWatchLog[] = [];
