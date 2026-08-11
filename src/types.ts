export type UserRole = 'CEO' | 'ADMIN' | 'MANAGER' | 'WITHDRAWAL_PASS' | 'USER';

export type WithdrawalMethod = 'UPI' | 'BANK';

export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type TransactionType = 'AD_WATCH' | 'DAILY_CHECKIN' | 'REFERRAL_BONUS' | 'COMMISSION' | 'GIFT_CLAIM' | 'WITHDRAWAL_REQUEST' | 'WITHDRAWAL_REFUND' | 'ADMIN_DEDUCTION' | 'ADMIN_ADDITION';

export interface TransactionItem {
  id: string;
  userId: string;
  type: TransactionType;
  title: string;
  coins: number;
  amountInr: number;
  timestamp: string;
  description?: string;
}

export interface UserNotification {
  id: string;
  type: 'BALANCE_DEDUCTED' | 'WITHDRAWAL_APPROVED' | 'WITHDRAWAL_REJECTED' | 'REFERRAL_SUCCESS' | 'SYSTEM_ALERT' | 'ACCOUNT_BANNED' | 'ACCOUNT_UNBANNED' | 'DAILY_CHECKIN' | 'REFERRAL_NEW_JOIN';
  title: string;
  message: string;
  amount?: number;
  reason?: string;
  read: boolean;
  timestamp: string;
}

export interface SystemSettings {
  welcomeBonus: number;            // Default: ₹5 (1,000 Coins)
  perAdReward: number;             // Default: ₹0.05 (10 Coins)
  referralReward: number;          // Default: ₹5 (1,000 Coins)
  referralCommissionPct: number;   // Default: 10%
  minWithdrawal: number;           // Default: ₹50 (10,000 Coins)
  minAdsWatchForWithdrawal: number; // Default: 100 ads (Configurable by CEO/Admin)
  adCooldownSec: number;           // Default: 10 sec
  dailyAdLimit: number;            // Default: 50 ads
  monetagDirectLinkUrl: string;
  monetagScriptTag: string;
  monetagZoneId: string;
  enableRealMonetagSdk: boolean;
  fastApprovalHashtag: string;     // Default: "#1"
  fastGroupTitle: string;          // Default: "AdEarn Private Fast Approvals"
  fastGroupUsername: string;       // Default: "AdEarn_FastWithdrawals"
  botUsername: string;             // Default: "PrimeAdsEbot"
  botToken?: string;               // e.g. "7890123456:AAFx..." from BotFather
  botAppUrl?: string;              // e.g. "https://premads.onrender.com"
  disableTelegramPolling?: boolean;// Turn off AI Studio polling to prevent double replies when deployed on Render
  ownerTelegramId?: string;        // e.g. "826258444"
}

export interface User {
  id: string;                      // Telegram User ID (e.g., "826258444")
  username: string;
  firstName: string;
  coins: number;                   // Current coin balance (10,000 Coins = ₹50, 1 Coin = ₹0.005)
  totalCoinsEarned: number;        // Lifetime coins earned
  balance: number;                 // Wallet balance in INR ₹ (coins / 200)
  totalEarned: number;             // Lifetime earned in INR ₹
  totalWithdrawn: number;          // Total withdrawn in INR ₹
  totalAdsWatched: number;         // Lifetime total Monetag ads watched
  adsWatchedToday: number;
  lastAdWatchedAt: number;         // Timestamp ms
  lastCheckInAt?: number;          // Timestamp ms for 24h daily check-in
  watchedAdIds: string[];          // Tracked Ad IDs watched by this user
  hasJoinedFastGroup: boolean;     // Must join Telegram group for fast withdrawals
  referredBy: string | null;       // Referrer ID
  referralCount: number;
  referralEarnings: number;
  referralBonusCredited?: boolean; // True when delayed 50-ad referral bonus credited to inviter
  notifications?: UserNotification[];
  role: UserRole;
  isBanned: boolean;
  banType?: 'TEMPORARY' | 'PERMANENT';
  banReason?: string;
  joinedAt: string;
}

export interface AdItem {
  id: string;
  title: string;
  category: 'REWARDED' | 'DIRECT' | 'PUSH' | 'SPONSOR';
  reward: number;
  provider: string;
  eCpm: string;
  durationSec: number;
  description: string;
  targetUrl: string;
}

export interface BankDetails {
  accountNumber: string;
  ifscCode: string;
  accountHolder: string;
  bankName: string;
}

export interface WithdrawalRequest {
  id: string;                      // Request ID e.g., "1001"
  userId: string;
  userName: string;
  userTelegram: string;
  amount: number;
  method: WithdrawalMethod;
  upiId?: string;
  bankDetails?: BankDetails;
  status: RequestStatus;
  requestedAt: string;
  processedAt?: string;
  processedBy?: string;
  rejectionReason?: string;
  fastApproved: boolean;
}

export interface AdminMember {
  id: string;
  name: string;
  telegramId: string;
  role: UserRole;
  passPin: string;
  addedAt: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface AdWatchLog {
  id: string;
  userId: string;
  adId: string;
  reward: number;
  adProvider: string;
  timestamp: string;
}

export interface GroupMessage {
  id: string;
  sender: string;
  senderRole: string;
  text: string;
  timestamp: string;
  isSystemNotification: boolean;
  withdrawalRequestId?: string;
}

export interface BotChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
  inlineButtons?: Array<{
    text: string;
    action: string;
    url?: string;
    adId?: string;
    color?: 'red' | 'blue' | 'green' | 'amber' | 'purple' | 'crimson' | 'emerald' | 'cyan';
    animatedEmoji?: string;
  }>;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userTelegram: string;
  issueType: string;
  message: string;
  status: 'OPEN' | 'RESOLVED' | 'CLOSED';
  reply?: string;
  createdAt: string;
  updatedAt?: string;
}
