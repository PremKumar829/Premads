import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import {
  initialSettings,
  initialUsers,
  initialAdminTeam,
  initialWithdrawalRequests,
  initialGroupMessages,
  initialAdWatchLogs
} from "./src/mockData.js";
import { SystemSettings, User, WithdrawalRequest, AdminMember, GroupMessage, AdWatchLog, TransactionItem, SupportTicket } from "./src/types.js";

// In-Memory Data Store (Persisted across API calls during runtime)
let settings: SystemSettings = {
  ...initialSettings,
  minAdsWatchForWithdrawal: initialSettings.minAdsWatchForWithdrawal || 100,
  botToken: process.env.TELEGRAM_BOT_TOKEN || initialSettings.botToken,
  ownerTelegramId: process.env.OWNER_TELEGRAM_ID || initialSettings.ownerTelegramId,
  botAppUrl: process.env.APP_URL || initialSettings.botAppUrl || 'https://premads.onrender.com',
  disableTelegramPolling: process.env.DISABLE_TELEGRAM_POLLING ? process.env.DISABLE_TELEGRAM_POLLING === 'true' : true
};
let users: User[] = [...initialUsers];
let adminTeam: AdminMember[] = [...initialAdminTeam];
let withdrawalRequests: WithdrawalRequest[] = [...initialWithdrawalRequests];
let groupMessages: GroupMessage[] = [...initialGroupMessages];
let adWatchLogs: AdWatchLog[] = [...initialAdWatchLogs];
let supportTickets: SupportTicket[] = [
  {
    id: 'ticket_1001',
    userId: '826258444',
    userName: 'Prem Sargam',
    userTelegram: '@premsargam88',
    issueType: 'UPI / Bank Withdrawal Query',
    message: 'I submitted a ₹50 withdrawal. Please check and approve my payout request!',
    status: 'OPEN',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString()
  }
];
let transactionsLog: TransactionItem[] = [
  {
    id: 'tx_101',
    userId: '826258444',
    type: 'DAILY_CHECKIN',
    title: 'Daily 24H Bonus Claim',
    coins: 50,
    amountInr: 0.25,
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    description: 'Claimed 24-hour streak login reward'
  },
  {
    id: 'tx_102',
    userId: '826258444',
    type: 'AD_WATCH',
    title: 'Monetag Ad Watch Reward',
    coins: 10,
    amountInr: 0.05,
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    description: 'Watched Monetag High eCPM Video Ad'
  }
];
let nextRequestId = 1004;

function addTransaction(userId: string, type: any, title: string, coins: number, amountInr: number, description?: string) {
  const item: TransactionItem = {
    id: `tx_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    userId,
    type,
    title,
    coins,
    amountInr,
    timestamp: new Date().toISOString(),
    description
  };
  transactionsLog.unshift(item);
  return item;
}

// Telegram Bot Helpers & Polling
async function sendTelegramMessage(chatId: string | number, text: string, replyMarkup?: any) {
  if (!settings.botToken || settings.botToken === 'YOUR_BOT_TOKEN_HERE') return;
  try {
    const url = `https://api.telegram.org/bot${settings.botToken}/sendMessage`;
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
        reply_markup: replyMarkup
      })
    });
  } catch (err) {
    console.error('Telegram sendMessage error:', err);
  }
}

async function handleTelegramUpdate(update: any) {
  const message = update.message || update.edited_message;
  if (!message || !message.chat) return;

  const chatId = message.chat.id;
  const telegramId = String(message.from?.id || chatId);
  const username = message.from?.username || `user_${telegramId}`;
  const firstName = message.from?.first_name || 'User';
  const text = (message.text || '').trim();

  // Find or create user in server memory
  let user = users.find(u => u.id === telegramId);
  if (!user) {
    let referrerId: string | null = null;
    if (text.startsWith('/start ref_')) {
      referrerId = text.replace('/start ref_', '').trim();
    }
    const welcomeBonus = settings.welcomeBonus || 5;
    let refUser = referrerId ? users.find(u => u.id === referrerId) : null;

    user = {
      id: telegramId,
      username,
      firstName,
      coins: welcomeBonus * 200,
      totalCoinsEarned: welcomeBonus * 200,
      balance: welcomeBonus,
      totalEarned: welcomeBonus,
      totalWithdrawn: 0,
      totalAdsWatched: 0,
      adsWatchedToday: 0,
      lastAdWatchedAt: 0,
      watchedAdIds: [],
      hasJoinedFastGroup: false,
      referredBy: refUser ? refUser.id : null,
      referralCount: 0,
      referralEarnings: 0,
      referralBonusCredited: false,
      role: (settings.ownerTelegramId && telegramId === settings.ownerTelegramId) ? 'CEO' : 'USER',
      isBanned: false,
      joinedAt: new Date().toISOString()
    };
    users.push(user);
    addTransaction(user.id, 'GIFT_CLAIM', 'Welcome Joining Bonus', welcomeBonus * 200, welcomeBonus, 'Welcome registration reward credited');

    if (refUser) {
      if (!refUser.notifications) refUser.notifications = [];
      refUser.notifications.unshift({
        id: `notif_${Date.now()}`,
        type: 'REFERRAL_NEW_JOIN',
        title: '🎉 New Referral Joined!',
        message: `User @${user.username} (${user.firstName}) joined via your referral link! Bonus will unlock after 50 ad watches.`,
        read: false,
        timestamp: new Date().toISOString()
      });
      sendTelegramMessage(refUser.id, `🎉 *New Referral Joined!*\nUser @${user.username} (${user.firstName}) just joined via your link! You will earn ₹${settings.referralReward || 5} bonus + 10% commission when they watch ads.`);
    }
  } else {
    if (settings.ownerTelegramId && telegramId === settings.ownerTelegramId) {
      user.role = 'CEO';
    }
  }

  const appUrl = settings.botAppUrl || process.env.APP_URL || 'https://premads.onrender.com';

  const keyboard = {
    inline_keyboard: [
      [
        {
          text: "🚀 Open AdEarn Mini App",
          web_app: { url: appUrl }
        }
      ],
      [
        { text: "📺 Watch Ads (+10 Coins)", web_app: { url: appUrl } },
        { text: "🎁 Daily Check-in (+50 Coins)", web_app: { url: appUrl } }
      ],
      [
        { text: "💸 Withdraw (UPI / Bank)", web_app: { url: appUrl } },
        { text: "👥 Refer & Earn (10%)", web_app: { url: appUrl } }
      ],
      [
        { text: "📊 My Balance & History", web_app: { url: appUrl } },
        { text: "🎧 Support & CEO Contact", url: "https://t.me/PremSargam88" }
      ],
      [
        { 
          text: "💬 Join VIP Channel", 
          url: settings.fastGroupUsername ? (settings.fastGroupUsername.startsWith('http') ? settings.fastGroupUsername : `https://t.me/${settings.fastGroupUsername.replace(/^@/, '')}`) : 'https://t.me/AdEarn_FastWithdrawals' 
        }
      ]
    ]
  };

  if (text.startsWith('/start')) {
    const welcomeText = `👋 *Welcome to @${settings.botUsername || 'PrimeAdsEbot'}!*\n\n` +
      `✨ *Welcome Bonus:* ₹${settings.welcomeBonus || 5}.00 (${((settings.welcomeBonus || 5) * 200).toLocaleString()} Coins) credited to your balance!\n\n` +
      `💰 *Conversion Rate:* 10,000 Coins = ₹50 (10 Coins per Ad)\n` +
      `📺 *Watch Unlimited Ads:* Earn 10 Coins (₹0.05) per ad watch.\n` +
      `🎁 *Daily Check-in:* Earn 50 Coins (₹0.25) every 24 hours!\n` +
      `👥 *Referral Program:* Earn ₹5 (${(5 * 200).toLocaleString()} Coins) after 50 ads + 10% lifetime commission!\n` +
      `💳 *Withdrawal:* Min ₹50 (10,000 Coins) via Instant UPI / Bank (Requires ${settings.minAdsWatchForWithdrawal || 100} ads watched).\n\n` +
      `Tap below to launch the Mini App and start earning!`;
    await sendTelegramMessage(chatId, welcomeText, keyboard);
  } else if (text === '/balance' || text === '/dashboard') {
    const dashText = `📊 *AdEarn User Balance*\n\n` +
      `👤 *User:* ${user.firstName} (@${user.username})\n` +
      `🪙 *Coin Balance:* ${(user.coins || 0).toLocaleString()} Coins (≈ ₹${(user.balance || 0).toFixed(2)})\n` +
      `💵 *Total Earned:* ${(user.totalCoinsEarned || 0).toLocaleString()} Coins (≈ ₹${(user.totalEarned || 0).toFixed(2)})\n` +
      `💸 *Total Withdrawn:* ₹${(user.totalWithdrawn || 0).toFixed(2)}\n` +
      `📺 *Ads Watched:* ${user.totalAdsWatched || 0} / ${settings.minAdsWatchForWithdrawal || 100} Minimum Required`;
    await sendTelegramMessage(chatId, dashText, keyboard);
  } else if (text === '/withdraw') {
    const minReq = settings.minAdsWatchForWithdrawal || 100;
    const adsLeft = Math.max(0, minReq - (user.totalAdsWatched || 0));
    const isUnlocked = adsLeft === 0;
    const withdrawText = `💳 *Withdrawal Center*\n\n` +
      `🪙 *Available Balance:* ${(user.coins || 0).toLocaleString()} Coins (≈ ₹${(user.balance || 0).toFixed(2)})\n` +
      `🎯 *Minimum Payout:* 10,000 Coins (₹50)\n` +
      `📊 *Ads Progress:* ${user.totalAdsWatched || 0} / ${minReq} Watched\n\n` +
      (isUnlocked 
        ? `✅ *Status:* UNLOCKED! Open the Mini App to request instant UPI payout.`
        : `⚠️ *Status:* LOCKED. Watch ${adsLeft} more ads to unlock payout.`);
    await sendTelegramMessage(chatId, withdrawText, keyboard);
  } else if (text === '/refer') {
    const refText = `👥 *AdEarn Referral Program*\n\n` +
      `Earn ₹5 bonus when your friend watches 50 ads + get 10% lifetime commission on all their ad views!\n\n` +
      `🔗 *Your Referral Link:*\nhttps://t.me/${settings.botUsername || 'PrimeAdsEbot'}?start=ref_${user.id}`;
    await sendTelegramMessage(chatId, refText, keyboard);
  } else if (text === '/checkin') {
    const now = Date.now();
    const cooldown = 24 * 3600 * 1000;
    if (user.lastCheckInAt && (now - user.lastCheckInAt) < cooldown) {
      const hoursLeft = Math.ceil((cooldown - (now - user.lastCheckInAt)) / (3600 * 1000));
      await sendTelegramMessage(chatId, `⏳ *Daily Check-In Claimed!*\nYou already claimed your daily 50 Coins today. Please try again in ${hoursLeft} hours.`, keyboard);
    } else {
      user.coins = (user.coins || 0) + 50;
      user.totalCoinsEarned = (user.totalCoinsEarned || 0) + 50;
      user.balance = Number((user.coins / 200).toFixed(2));
      user.totalEarned = Number((user.totalCoinsEarned / 200).toFixed(2));
      user.lastCheckInAt = now;
      addTransaction(user.id, 'DAILY_CHECKIN', 'Daily 24H Bonus Claim', 50, 0.25, 'Claimed via Telegram Bot');
      await sendTelegramMessage(chatId, `🎁 *Daily Bonus Claimed!*\n+50 Coins (₹0.25) credited to your balance! New Balance: ${(user.coins || 0).toLocaleString()} Coins.`, keyboard);
    }
  } else if (text === '/support') {
    const suppText = `🎧 *AdEarn Customer Support*\n\nNeed help with withdrawals, ads, or referrals?\n\n` +
      `👑 *CEO Direct Contact:* @PremSargam88\n` +
      `💬 *Official Telegram Channel:* @${settings.fastGroupUsername || 'AdEarn_FastWithdrawals'}\n` +
      `⚡ *Support Availability:* 24/7 Fast Response`;
    await sendTelegramMessage(chatId, suppText, keyboard);
  } else {
    const helpText = `🤖 *AdEarn Telegram Bot*\n\nAvailable commands:\n` +
      `/start - Launch Mini App & Welcome Bonus\n` +
      `/balance - Check Coin Balance & Stats\n` +
      `/withdraw - Check Withdrawal Status\n` +
      `/refer - Get Referral Link\n` +
      `/checkin - Claim Daily 50 Coins\n` +
      `/support - Contact CEO & Support\n\n` +
      `Tap below to open the Mini App:`;
    await sendTelegramMessage(chatId, helpText, keyboard);
  }
}

let isPolling = false;
let lastUpdateId = 0;

async function pollTelegramUpdates() {
  if (isPolling) return;
  isPolling = true;

  while (isPolling) {
    if (settings.disableTelegramPolling || process.env.DISABLE_TELEGRAM_POLLING === 'true' || !settings.botToken || settings.botToken === 'YOUR_BOT_TOKEN_HERE') {
      await new Promise(r => setTimeout(r, 4000));
      continue;
    }

    try {
      const url = `https://api.telegram.org/bot${settings.botToken}/getUpdates?offset=${lastUpdateId + 1}&timeout=10`;
      const resp = await fetch(url);
      if (resp.ok) {
        const data = await resp.json();
        if (data.ok && Array.isArray(data.result)) {
          for (const update of data.result) {
            lastUpdateId = Math.max(lastUpdateId, update.update_id);
            await handleTelegramUpdate(update);
          }
        }
      }
    } catch (err) {
      // Ignore transient polling timeout errors
    }

    await new Promise(r => setTimeout(r, 1000));
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API ROUTE HANDLERS

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // GET & UPDATE System Settings
  app.get("/api/settings", (req, res) => {
    res.json(settings);
  });

  app.post("/api/settings", (req, res) => {
    const updated = req.body;
    settings = { ...settings, ...updated };

    // Post notification to group if settings changed
    const sysMsg: GroupMessage = {
      id: `msg_${Date.now()}`,
      sender: "System Bot",
      senderRole: "SYSTEM",
      text: `⚙️ **SYSTEM SETTINGS UPDATED BY CEO**\n• Welcome Bonus: ₹${settings.welcomeBonus}\n• Per Ad Reward: ₹${settings.perAdReward}\n• Referral Reward: ₹${settings.referralReward}\n• Min Withdrawal: ₹${settings.minWithdrawal}\n• Min Ads Watch Required: ${settings.minAdsWatchForWithdrawal}\n• Commission: ${settings.referralCommissionPct}%`,
      timestamp: new Date().toISOString(),
      isSystemNotification: true
    };
    groupMessages.push(sysMsg);

    res.json({ success: true, settings });
  });

  // USERS API
  app.get("/api/users", (req, res) => {
    res.json(users);
  });

  app.get("/api/users/:id", (req, res) => {
    const user = users.find(u => u.id === req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  });

  // GET USER TRANSACTIONS HISTORY
  app.get("/api/users/:id/transactions", (req, res) => {
    const userTx = transactionsLog.filter(t => t.userId === req.params.id);
    res.json(userTx);
  });

  // DAILY CHECK-IN ENDPOINT
  app.post("/api/users/:id/daily-checkin", (req, res) => {
    const user = users.find(u => u.id === req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.isBanned) {
      return res.status(403).json({ error: "Account is restricted" });
    }

    const now = Date.now();
    const cooldown = 24 * 3600 * 1000; // 24 hours
    if (user.lastCheckInAt && (now - user.lastCheckInAt) < cooldown) {
      const remainingMs = cooldown - (now - user.lastCheckInAt);
      const hoursLeft = Math.floor(remainingMs / (3600 * 1000));
      const minsLeft = Math.floor((remainingMs % (3600 * 1000)) / (60 * 1000));
      return res.status(400).json({
        error: `Daily bonus already claimed! Please wait ${hoursLeft}h ${minsLeft}m for your next check-in.`,
        remainingMs
      });
    }

    const coinsEarned = 50; // 50 Coins = ₹0.25
    const rewardInr = 0.25;

    user.coins = (user.coins || 0) + coinsEarned;
    user.totalCoinsEarned = (user.totalCoinsEarned || 0) + coinsEarned;
    user.balance = Number((user.coins / 200).toFixed(2));
    user.totalEarned = Number((user.totalCoinsEarned / 200).toFixed(2));
    user.lastCheckInAt = now;

    addTransaction(user.id, 'DAILY_CHECKIN', '24H Daily Login Reward', coinsEarned, rewardInr, 'Claimed daily check-in bonus');

    if (!user.notifications) user.notifications = [];
    user.notifications.unshift({
      id: `notif_${Date.now()}`,
      type: 'DAILY_CHECKIN',
      title: '🎁 Daily Check-In Claimed!',
      message: `+50 Coins (₹0.25) added to your account! Next check-in unlocks in 24 hours.`,
      amount: rewardInr,
      read: false,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      coinsEarned,
      rewardEarned: rewardInr,
      newCoins: user.coins,
      newBalance: user.balance,
      lastCheckInAt: user.lastCheckInAt
    });
  });

  // Register / Login User via Telegram ID or Telegram Username
  app.post("/api/users/login", (req, res) => {
    const { telegramId, username, firstName, referrerId } = req.body;
    const cleanUsername = (username || '').replace(/^@/, '').trim();
    const cleanTgId = (telegramId || '').trim();

    // Direct match by Telegram ID or Username
    let user = users.find(u => 
      (cleanTgId && u.id === cleanTgId) || 
      (cleanUsername && u.username.toLowerCase() === cleanUsername.toLowerCase())
    );

    if (!user) {
      // Create new user with welcome bonus!
      const welcomeBonus = settings.welcomeBonus || 5;
      let refId: string | null = null;
      let referrerUser = null;

      if (referrerId && referrerId !== telegramId) {
        referrerUser = users.find(u => u.id === referrerId);
        if (referrerUser) {
          refId = referrerUser.id;
        }
      }

      user = {
        id: telegramId || `user_${Date.now()}`,
        username: username || `user_${telegramId}`,
        firstName: firstName || 'User',
        coins: welcomeBonus * 200,
        totalCoinsEarned: welcomeBonus * 200,
        balance: welcomeBonus,
        totalEarned: welcomeBonus,
        totalWithdrawn: 0,
        totalAdsWatched: 0,
        adsWatchedToday: 0,
        lastAdWatchedAt: 0,
        watchedAdIds: [],
        hasJoinedFastGroup: false,
        referredBy: refId,
        referralCount: 0,
        referralEarnings: 0,
        referralBonusCredited: false,
        role: (settings.ownerTelegramId && (telegramId === settings.ownerTelegramId || telegramId === settings.ownerTelegramId)) ? 'CEO' : 'USER',
        isBanned: false,
        joinedAt: new Date().toISOString()
      };

      users.push(user);
      addTransaction(user.id, 'GIFT_CLAIM', 'Welcome Joining Bonus', welcomeBonus * 200, welcomeBonus, 'Welcome registration reward credited');

      if (referrerUser) {
        const refReward = settings.referralReward || 5;
        if (!referrerUser.notifications) referrerUser.notifications = [];
        referrerUser.notifications.unshift({
          id: `notif_${Date.now()}`,
          type: 'REFERRAL_NEW_JOIN',
          title: '🎉 New Referral Joined!',
          message: `User @${user.username} (${user.firstName}) joined via your referral link! ₹${refReward} bonus will unlock after they watch 50 ads.`,
          read: false,
          timestamp: new Date().toISOString()
        });

        sendTelegramMessage(referrerUser.id, `🎉 *New Referral Joined!*\nUser @${user.username} (${user.firstName}) joined via your referral link! You will earn ₹${refReward} bonus when they watch 50 ads.`);

        groupMessages.push({
          id: `msg_${Date.now()}`,
          sender: "Referral Engine",
          senderRole: "SYSTEM",
          text: `👥 **NEW REFERRAL REGISTERED!**\nUser @${user.username} joined via referral link from @${referrerUser.username}.\n⏳ **Delayed Bonus Anti-Fraud:** ₹${refReward} (${refReward * 200} Coins) referral bonus will be credited to @${referrerUser.username} as soon as @${user.username} watches 50 Monetag ads!`,
          timestamp: new Date().toISOString(),
          isSystemNotification: true
        });
      }
    } else {
      // Update username / name if changed
      if (username) user.username = username;
      if (firstName) user.firstName = firstName;
      if (user.coins === undefined) {
        user.coins = Math.round(user.balance * 200);
        user.totalCoinsEarned = Math.round(user.totalEarned * 200);
      }
      if (settings.ownerTelegramId && (telegramId === settings.ownerTelegramId || user.id === settings.ownerTelegramId)) {
        user.role = 'CEO';
      }
    }

    res.json(user);
  });

  // VERIFY / JOIN TELEGRAM GROUP ENDPOINT
  app.post("/api/users/:id/verify-group", (req, res) => {
    const user = users.find(u => u.id === req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.hasJoinedFastGroup = true;
    res.json({ success: true, message: "Verified! Joined Telegram Fast Withdrawal Group.", hasJoinedFastGroup: true });
  });

  // DAILY CHECK-IN ENDPOINT
  app.post("/api/users/:id/daily-checkin", (req, res) => {
    const user = users.find(u => u.id === req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.isBanned) {
      return res.status(403).json({ error: "Account is restricted" });
    }

    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    if (user.lastCheckInAt && (now - user.lastCheckInAt) < twentyFourHours) {
      const remainingMs = twentyFourHours - (now - user.lastCheckInAt);
      const hoursLeft = Math.floor(remainingMs / (3600 * 1000));
      const minsLeft = Math.ceil((remainingMs % (3600 * 1000)) / (60 * 1000));
      return res.status(400).json({ error: `Daily check-in already claimed! Available again in ${hoursLeft}h ${minsLeft}m.` });
    }

    const checkInBonusCoins = 100; // 100 coins = ₹0.50
    const checkInBonusInr = 0.50;

    user.coins = (user.coins || 0) + checkInBonusCoins;
    user.totalCoinsEarned = (user.totalCoinsEarned || 0) + checkInBonusCoins;
    user.balance = Number((user.coins / 200).toFixed(2));
    user.totalEarned = Number((user.totalCoinsEarned / 200).toFixed(2));
    user.lastCheckInAt = now;

    addTransaction(user.id, 'DAILY_CHECKIN', 'Daily Check-in Bonus', checkInBonusCoins, checkInBonusInr, '24-Hour streak reward claimed');

    if (!user.notifications) user.notifications = [];
    user.notifications.unshift({
      id: `notif_${Date.now()}`,
      type: 'DAILY_CHECKIN',
      title: '🎁 Daily Check-in Claimed!',
      message: `You earned 100 Coins (₹0.50) daily streak bonus!`,
      amount: checkInBonusInr,
      read: false,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: "🎉 Daily Check-in claimed! +100 Coins (₹0.50) added to wallet.",
      coinsEarned: checkInBonusCoins,
      rewardInr: checkInBonusInr,
      newCoins: user.coins,
      newBalance: user.balance,
      lastCheckInAt: user.lastCheckInAt
    });
  });

  // LEADERBOARD ENDPOINT (Top 10 Earners)
  app.get("/api/leaderboard", (req, res) => {
    const sorted = [...users]
      .sort((a, b) => (b.totalEarned || 0) - (a.totalEarned || 0))
      .slice(0, 10)
      .map((u, index) => ({
        rank: index + 1,
        id: u.id,
        firstName: u.firstName || 'User',
        username: u.username ? `@${u.username}` : `ID: ${u.id.substring(0, 5)}...`,
        totalEarned: u.totalEarned || 0,
        totalCoinsEarned: u.totalCoinsEarned || (u.totalEarned || 0) * 200,
        totalAdsWatched: u.totalAdsWatched || 0,
        referralCount: u.referralCount || 0
      }));

    res.json(sorted);
  });

  // GEMINI CLIENT LAZY INITIALIZATION
  let genAiClient: GoogleGenAI | null = null;
  function getGeminiClient(): GoogleGenAI {
    if (!genAiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is missing.");
      }
      genAiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });
    }
    return genAiClient;
  }

  // GEMINI AI FAQ ENDPOINT
  app.post("/api/faq/ask", async (req, res) => {
    try {
      const { question } = req.body;
      if (!question || typeof question !== 'string' || !question.trim()) {
        return res.status(400).json({ error: "Please provide a valid question." });
      }

      const ai = getGeminiClient();

      const systemInstruction = `You are Prime Assistant, the official Support & Policy Assistant for VYRNXY ADS, a high-paying Telegram Mini App & Bot platform where users watch Monetag ads to earn coins and convert them to INR for UPI/Bank withdrawals.

App Rules & Official Withdrawal Policies:
1. Coin Conversion Rate: 200 Coins = ₹1.00 (1 Coin = ₹0.005, 100 Coins = ₹0.50).
2. Ad Watching Rewards: Watching 1 Monetag ad awards 5 Coins (₹0.025). Daily ad watch rewards accumulate towards milestone bonuses.
3. Daily Check-in Streak: Claim 100 Coins (₹0.50) once every 24 hours.
4. Referral Bonus: ₹${settings.referralReward || 2.00} bonus awarded per active friend once they reach their 50th watched ad.
5. Minimum Withdrawal Threshold: Minimum ₹${settings.minWithdrawal || 10.00} wallet balance required to request cashout.
6. Minimum Ad Watch Requirement: Users MUST watch at least ${settings.minAdsWatchForWithdrawal || 100} lifetime Monetag ads before submitting their first withdrawal. This prevents automated bot abuse and multi-account farming.
7. Fast Withdrawal Group Requirement: Users MUST join the official Telegram Fast Withdrawal group (${settings.fastGroupUsername || '@PremAdsGroup'}) to submit withdrawal requests and receive real-time approval status.
8. Payout Methods: UPI (Google Pay, PhonePe, Paytm, BHIM UPI) and Direct Bank Account Transfer (IFSC + Account Number).
9. Processing Time: Fast approval group processes requests within 1-2 hours.
10. Anti-Fraud Policy: Auto-clickers, bot scripts, multiple fake accounts, or VPN proxy usage will result in immediate permanent account suspension and earnings forfeiture.

Answer user questions accurately, politely, and concisely based on these policies. Highlight key rules using bullet points or clean text when applicable. Keep responses structured and clear.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: question.trim(),
        config: {
          systemInstruction,
          temperature: 0.3,
        }
      });

      const answer = response.text || "I'm sorry, I couldn't process your question at the moment. Please contact support via Telegram.";

      res.json({
        success: true,
        question: question.trim(),
        answer: answer
      });
    } catch (error: any) {
      console.error("Gemini AI FAQ Error:", error);
      res.status(500).json({
        error: error?.message?.includes("GEMINI_API_KEY")
          ? "AI Assistant is currently configuring key settings. Please try again or check Telegram support."
          : "Failed to generate AI policy response: " + (error?.message || "Please try again.")
      });
    }
  });

  // WATCH AD ENDPOINT
  app.post("/api/users/:id/watch-ad", (req, res) => {
    const userId = req.params.id;
    const { adId } = req.body || {};
    const user = users.find(u => u.id === userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.isBanned) {
      return res.status(403).json({ error: `Account is restricted (${user.banType || 'PERMANENT'}). Reason: ${user.banReason || 'Policy violation'}` });
    }

    // Ensure arrays and coin properties exist
    if (!user.watchedAdIds) user.watchedAdIds = [];
    if (user.coins === undefined) user.coins = Math.round(user.balance * 200);
    if (user.totalCoinsEarned === undefined) user.totalCoinsEarned = Math.round(user.totalEarned * 200);

    // Cooldown check
    const now = Date.now();
    const cooldownMs = (settings.adCooldownSec || 10) * 1000;
    if (user.lastAdWatchedAt && (now - user.lastAdWatchedAt) < cooldownMs) {
      const waitSec = Math.ceil((cooldownMs - (now - user.lastAdWatchedAt)) / 1000);
      return res.status(429).json({ error: `Please wait ${waitSec}s before watching the next ad.` });
    }

    // Credit ad reward: 1 Ad Watch = 10 Coins = ₹0.05 INR
    const coinsEarned = 10;
    const inrEarned = 0.05;

    user.coins = (user.coins || 0) + coinsEarned;
    user.totalCoinsEarned = (user.totalCoinsEarned || 0) + coinsEarned;
    user.balance = Number((user.coins / 200).toFixed(2));
    user.totalEarned = Number((user.totalCoinsEarned / 200).toFixed(2));
    user.adsWatchedToday += 1;
    user.totalAdsWatched = (user.totalAdsWatched || 0) + 1;
    user.lastAdWatchedAt = now;

    const currentAdId = adId || `AD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    user.watchedAdIds.push(currentAdId);

    // Add to transaction log
    addTransaction(user.id, 'AD_WATCH', 'Monetag Ad Watch Reward', coinsEarned, inrEarned, `Watched campaign ${currentAdId}`);

    // Log ad watch
    const log: AdWatchLog = {
      id: `log_${Date.now()}`,
      userId: user.id,
      adId: currentAdId,
      reward: inrEarned,
      adProvider: 'Monetag Official Ad SDK',
      timestamp: new Date().toISOString()
    };
    adWatchLogs.push(log);

    // DELAYED REFERRAL BONUS EVENT (Triggered exactly when referred user watches 50th ad)
    let referralBonusUnlocked = false;
    let refBonusAmount = 0;
    if (user.referredBy && !user.referralBonusCredited && user.totalAdsWatched >= 50) {
      const referrerUser = users.find(u => u.id === user.referredBy);
      if (referrerUser) {
        refBonusAmount = settings.referralReward || 5; // ₹5 = 1000 coins
        const refCoins = refBonusAmount * 200;
        
        referrerUser.coins = (referrerUser.coins || 0) + refCoins;
        referrerUser.totalCoinsEarned = (referrerUser.totalCoinsEarned || 0) + refCoins;
        referrerUser.balance = Number((referrerUser.coins / 200).toFixed(2));
        referrerUser.totalEarned = Number((referrerUser.totalCoinsEarned / 200).toFixed(2));
        referrerUser.referralCount = (referrerUser.referralCount || 0) + 1;
        referrerUser.referralEarnings += refBonusAmount;
        user.referralBonusCredited = true;
        referralBonusUnlocked = true;

        addTransaction(referrerUser.id, 'REFERRAL_BONUS', 'Referral Active Bonus', refCoins, refBonusAmount, `Referred friend @${user.username} completed 50 ads!`);

        // Add notification to inviter's inbox
        if (!referrerUser.notifications) referrerUser.notifications = [];
        referrerUser.notifications.unshift({
          id: `notif_${Date.now()}`,
          type: 'REFERRAL_SUCCESS',
          title: '🎉 Referral Bonus Credited!',
          message: `Your referred friend @${user.username} watched 50 ads! ₹${refBonusAmount} (${refCoins.toLocaleString()} Coins) bonus credited!`,
          amount: refBonusAmount,
          read: false,
          timestamp: new Date().toISOString()
        });

        sendTelegramMessage(referrerUser.id, `🎉 *Referral Bonus Credited!*\nYour friend @${user.username} watched 50 ads! ₹${refBonusAmount} (${refCoins.toLocaleString()} Coins) bonus credited to your balance!`);
      }
    }

    // Referral 10% Lifetime Commission check (10% of 10 coins = 1 coin)
    let commissionAwardedCoins = 0;
    if (user.referredBy) {
      const referrer = users.find(u => u.id === user.referredBy);
      if (referrer) {
        commissionAwardedCoins = 1; // 10% of 10 coins
        referrer.coins = (referrer.coins || 0) + commissionAwardedCoins;
        referrer.totalCoinsEarned = (referrer.totalCoinsEarned || 0) + commissionAwardedCoins;
        referrer.balance = Number((referrer.coins / 200).toFixed(2));
        referrer.totalEarned = Number((referrer.totalCoinsEarned / 200).toFixed(2));
        referrer.referralEarnings += 0.005;
        addTransaction(referrer.id, 'COMMISSION', 'Referral 10% Ad Commission', 1, 0.005, `10% commission from @${user.username} ad watch`);
      }
    }

    res.json({
      success: true,
      coinsEarned,
      rewardEarned: inrEarned,
      adId: currentAdId,
      commissionAwardedCoins,
      newCoins: user.coins,
      newBalance: user.balance,
      adsWatchedToday: user.adsWatchedToday,
      totalAdsWatched: user.totalAdsWatched,
      referralBonusUnlocked,
      refBonusAmount,
      remainingToday: (settings.dailyAdLimit || 50) - user.adsWatchedToday,
      watchedAdIds: user.watchedAdIds
    });
  });

  // WITHDRAWALS API
  app.get("/api/withdrawals", (req, res) => {
    res.json(withdrawalRequests);
  });

  app.post("/api/withdrawals", (req, res) => {
    const { userId, amount, method, upiId, bankDetails } = req.body;
    const user = users.find(u => u.id === userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.isBanned) {
      return res.status(403).json({ error: "Account is restricted" });
    }

    // STRICT ANTI-FRAUD RULE: Configurable min lifetime ad watch count
    const minReq = settings.minAdsWatchForWithdrawal || 100;
    const lifetimeAds = user.totalAdsWatched || user.watchedAdIds?.length || 0;
    if (lifetimeAds < minReq) {
      return res.status(400).json({
        error: `⚠️ Action Required: You must personally watch at least ${minReq} ads to unlock payouts. (Watched: ${lifetimeAds}/${minReq})`
      });
    }

    const minAmount = settings.minWithdrawal || 50;
    if (amount < minAmount) {
      return res.status(400).json({ error: `Minimum withdrawal amount is ₹${minAmount} (10,000 Coins)` });
    }

    if (user.balance < amount) {
      return res.status(400).json({ error: `Insufficient balance. Available balance is ₹${user.balance.toFixed(2)} (${(user.coins || 0).toLocaleString()} Coins)` });
    }

    if (method === 'UPI' && (!upiId || !upiId.includes('@'))) {
      return res.status(400).json({ error: "Please provide a valid UPI ID (e.g., user@upi)" });
    }

    if (method === 'BANK' && (!bankDetails || !bankDetails.accountNumber || !bankDetails.ifscCode)) {
      return res.status(400).json({ error: "Please provide complete Bank Account Number and IFSC Code" });
    }

    // Deduct balance and coins temporarily for request
    const coinsToDeduct = amount * 200;
    user.coins = Math.max(0, (user.coins || 0) - coinsToDeduct);
    user.balance = Number((user.coins / 200).toFixed(2));

    addTransaction(user.id, 'WITHDRAWAL_REQUEST', 'Withdrawal Payout Request', -coinsToDeduct, -amount, `Payout requested via ${method}`);

    const reqId = `${nextRequestId++}`;
    const newRequest: WithdrawalRequest = {
      id: reqId,
      userId: user.id,
      userName: user.firstName,
      userTelegram: user.username ? `@${user.username}` : `ID: ${user.id}`,
      amount,
      method,
      upiId: method === 'UPI' ? upiId : undefined,
      bankDetails: method === 'BANK' ? bankDetails : undefined,
      status: 'PENDING',
      requestedAt: new Date().toISOString(),
      fastApproved: false
    };

    withdrawalRequests.unshift(newRequest);

    // INSTANT NOTIFICATION TO FAST APPROVAL PRIVATE GROUP
    const methodDesc = method === 'UPI'
      ? `💳 **UPI:** \`${upiId}\``
      : `🏦 **BANK:** \`${bankDetails?.accountNumber}\` | IFSC: \`${bankDetails?.ifscCode}\` | Holder: \`${bankDetails?.accountHolder}\``;

    const groupAlert: GroupMessage = {
      id: `msg_${Date.now()}`,
      sender: "Withdrawal Engine Bot",
      senderRole: "SYSTEM",
      text: `🚨 **NEW WITHDRAWAL REQUEST** \`#${reqId}\`
👤 **User:** ${user.firstName} (${newRequest.userTelegram})
💰 **Amount:** ₹${amount.toFixed(2)}
${methodDesc}
🕒 **Time:** Just now

⚡ **Fast Approval Command:** \`${settings.fastApprovalHashtag} ${reqId} PASS\``,
      timestamp: new Date().toISOString(),
      isSystemNotification: true,
      withdrawalRequestId: reqId
    };

    groupMessages.push(groupAlert);

    res.json({
      success: true,
      request: newRequest,
      newBalance: user.balance
    });
  });

  // PROCESS WITHDRAWAL (Approve / Reject)
  app.post("/api/withdrawals/:id/process", (req, res) => {
    const reqId = req.params.id;
    const { action, processedBy, rejectionReason } = req.body; // action: 'PASS' | 'REJECT' | 'APPROVE'
    const request = withdrawalRequests.find(r => r.id === reqId);

    if (!request) {
      return res.status(404).json({ error: "Withdrawal request not found" });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({ error: `Request #${reqId} is already ${request.status}` });
    }

    const user = users.find(u => u.id === request.userId);

    if (action === 'PASS' || action === 'APPROVE') {
      request.status = 'APPROVED';
      request.processedAt = new Date().toISOString();
      request.processedBy = processedBy || 'Admin Fast Command';
      request.fastApproved = true;

      if (user) {
        user.totalWithdrawn += request.amount;
        if (!user.notifications) user.notifications = [];
        user.notifications.unshift({
          id: `notif_${Date.now()}`,
          type: 'WITHDRAWAL_APPROVED',
          title: '⚡ Withdrawal Approved & Paid!',
          message: `Your payout request #${reqId} of ₹${request.amount.toFixed(2)} has been successfully processed and paid via ${request.method}.`,
          amount: request.amount,
          read: false,
          timestamp: new Date().toISOString()
        });

        sendTelegramMessage(user.id, `⚡ *Withdrawal Approved & Paid!*\nYour payout request #${reqId} of ₹${request.amount.toFixed(2)} has been paid via ${request.method}!`);
      }

      // Send group confirmation
      groupMessages.push({
        id: `msg_${Date.now()}`,
        sender: processedBy || "Withdrawal Pass Admin",
        senderRole: "ADMIN",
        text: `✅ **WITHDRAWAL APPROVED!** \`#${reqId}\`
👤 User: ${request.userName}
💰 Amount: ₹${request.amount.toFixed(2)}
⚡ Executed by: ${processedBy || 'Pass Admin'} using fast command \`${settings.fastApprovalHashtag} ${reqId} PASS\``,
        timestamp: new Date().toISOString(),
        isSystemNotification: false,
        withdrawalRequestId: reqId
      });

      return res.json({ success: true, status: 'APPROVED', request });
    } else if (action === 'REJECT') {
      request.status = 'REJECTED';
      request.processedAt = new Date().toISOString();
      request.processedBy = processedBy || 'Admin';
      request.rejectionReason = rejectionReason || 'Details incorrect or policy review';

      // Refund user balance & add notification
      if (user) {
        const coinsRefund = Math.round(request.amount * 200);
        user.coins = (user.coins || 0) + coinsRefund;
        user.balance = Number((user.coins / 200).toFixed(2));
        addTransaction(user.id, 'WITHDRAWAL_REFUND', 'Withdrawal Refund', coinsRefund, request.amount, `Refund for rejected payout #${reqId}`);
        if (!user.notifications) user.notifications = [];
        user.notifications.unshift({
          id: `notif_${Date.now()}`,
          type: 'WITHDRAWAL_REJECTED',
          title: '❌ Withdrawal Request Rejected',
          message: `Your request #${reqId} of ₹${request.amount.toFixed(2)} (${coinsRefund.toLocaleString()} Coins) was rejected and refunded. Reason: ${rejectionReason || 'Invalid details'}`,
          amount: request.amount,
          reason: rejectionReason || 'Invalid details',
          read: false,
          timestamp: new Date().toISOString()
        });

        sendTelegramMessage(user.id, `❌ *Withdrawal Rejected*\nYour payout request #${reqId} of ₹${request.amount.toFixed(2)} was rejected and refunded to your balance. Reason: ${rejectionReason || 'Invalid details'}`);
      }

      groupMessages.push({
        id: `msg_${Date.now()}`,
        sender: processedBy || "Admin",
        senderRole: "ADMIN",
        text: `❌ **WITHDRAWAL REJECTED** \`#${reqId}\`
👤 User: ${request.userName}
💰 Refunded: ₹${request.amount.toFixed(2)}
📝 Reason: ${rejectionReason || 'Invalid payment details'}`,
        timestamp: new Date().toISOString(),
        isSystemNotification: false,
        withdrawalRequestId: reqId
      });

      return res.json({ success: true, status: 'REJECTED', request });
    } else {
      return res.status(400).json({ error: "Invalid action. Use PASS, APPROVE, or REJECT." });
    }
  });

  // ADMIN TEAM MANAGEMENT
  app.get("/api/admin/team", (req, res) => {
    res.json(adminTeam);
  });

  app.post("/api/admin/team", (req, res) => {
    const { name, telegramId, role, passPin } = req.body;
    if (!name || !role) {
      return res.status(400).json({ error: "Name and Role are required" });
    }

    const newAdmin: AdminMember = {
      id: `adm_${Date.now()}`,
      name,
      telegramId: telegramId || `${Math.floor(10000000 + Math.random() * 90000000)}`,
      role,
      passPin: passPin || '1234',
      addedAt: new Date().toISOString().split('T')[0],
      status: 'ACTIVE'
    };

    adminTeam.push(newAdmin);

    // If user exists, update role
    const existingUser = users.find(u => u.id === newAdmin.telegramId);
    if (existingUser) {
      existingUser.role = role;
    }

    res.json({ success: true, admin: newAdmin });
  });

  app.delete("/api/admin/team/:id", (req, res) => {
    adminTeam = adminTeam.filter(a => a.id !== req.params.id);
    res.json({ success: true });
  });

  // SUPPORT TICKETS ENDPOINTS
  app.get("/api/support-tickets", (req, res) => {
    const { userId } = req.query;
    if (userId) {
      const userTickets = supportTickets.filter(t => t.userId === String(userId));
      return res.json(userTickets);
    }
    res.json(supportTickets);
  });

  app.post("/api/support-tickets", (req, res) => {
    const { userId, issueType, message } = req.body;
    if (!userId || !message) {
      return res.status(400).json({ error: "User ID and Message are required" });
    }

    const user = users.find(u => u.id === String(userId));
    const userName = user ? user.firstName : 'User';
    const userTelegram = user ? (user.username ? `@${user.username}` : `ID: ${user.id}`) : `ID: ${userId}`;

    const newTicket: SupportTicket = {
      id: `ticket_${Date.now()}`,
      userId: String(userId),
      userName,
      userTelegram,
      issueType: issueType || 'General Inquiry',
      message: message.trim(),
      status: 'OPEN',
      createdAt: new Date().toISOString()
    };

    supportTickets.unshift(newTicket);

    // Alert Admin Telegram if owner Telegram ID is configured
    if (settings.ownerTelegramId) {
      sendTelegramMessage(
        settings.ownerTelegramId,
        `🎫 *NEW SUPPORT TICKET SUBMITTED*\n*User:* ${userName} (${userTelegram})\n*Issue:* ${newTicket.issueType}\n*Message:* ${newTicket.message}\n\n_Reply via Admin Panel Support section._`
      );
    }

    res.json({ success: true, ticket: newTicket });
  });

  app.post("/api/support-tickets/:id/reply", (req, res) => {
    const ticketId = req.params.id;
    const { reply, status, processedBy } = req.body;
    const ticket = supportTickets.find(t => t.id === ticketId);

    if (!ticket) {
      return res.status(404).json({ error: "Support ticket not found" });
    }

    ticket.reply = reply ? reply.trim() : ticket.reply;
    ticket.status = status || 'RESOLVED';
    ticket.updatedAt = new Date().toISOString();

    // Add user notification
    const user = users.find(u => u.id === ticket.userId);
    if (user) {
      if (!user.notifications) user.notifications = [];
      user.notifications.unshift({
        id: `notif_${Date.now()}`,
        type: 'SYSTEM_ALERT',
        title: '🎫 Support Ticket Responded',
        message: `Your ticket regarding "${ticket.issueType}" was updated by ${processedBy || 'Admin'}: "${reply || 'Resolved'}"`,
        read: false,
        timestamp: new Date().toISOString()
      });

      sendTelegramMessage(
        user.id,
        `📩 *Support Ticket Response*\nYour support query for *${ticket.issueType}* has been updated:\n\n*Admin Reply:* ${reply || 'Resolved'}\n*Status:* ${ticket.status}`
      );
    }

    res.json({ success: true, ticket });
  });

  // PRIVATE FAST GROUP MESSAGES & HASHTAG COMMAND SIMULATOR
  app.get("/api/admin/fast-group/messages", (req, res) => {
    res.json(groupMessages);
  });

  app.post("/api/admin/fast-group/messages", (req, res) => {
    const { sender, senderRole, text } = req.body;
    if (!text) return res.status(400).json({ error: "Message text required" });

    const trimmedText = text.trim();
    const hashtag = settings.fastApprovalHashtag || '#1';

    // Parse hashtag fast approval command e.g., "#1 1002 PASS" or "#1 1002 REJECT details bad"
    if (trimmedText.startsWith(hashtag)) {
      const parts = trimmedText.slice(hashtag.length).trim().split(/\s+/);
      const reqId = parts[0];
      const actionCmd = parts[1] ? parts[1].toUpperCase() : '';
      const reason = parts.slice(2).join(' ') || 'Processed via hashtag command';

      const userMsg: GroupMessage = {
        id: `msg_${Date.now()}`,
        sender: sender || 'Withdrawal Pass Admin',
        senderRole: senderRole || 'ADMIN',
        text: trimmedText,
        timestamp: new Date().toISOString(),
        isSystemNotification: false,
        withdrawalRequestId: reqId
      };
      groupMessages.push(userMsg);

      if (reqId && (actionCmd === 'PASS' || actionCmd === 'APPROVE' || actionCmd === 'REJECT')) {
        if (senderRole === 'USER') {
          groupMessages.push({
            id: `msg_${Date.now() + 1}`,
            sender: "Fast Approval Security Guard",
            senderRole: "SYSTEM",
            text: `⚠️ **ACCESS DENIED:** User \`${sender}\` is not authorized. Withdrawal pass commands can only be executed by Admins, CEO & Withdrawal Pass staff.`,
            timestamp: new Date().toISOString(),
            isSystemNotification: true
          });
          return res.json({ success: true, message: "Logged, command blocked for USER role." });
        }

        const reqItem = withdrawalRequests.find(r => r.id === reqId);
        if (!reqItem) {
          groupMessages.push({
            id: `msg_${Date.now() + 1}`,
            sender: "Fast Approval System",
            senderRole: "SYSTEM",
            text: `⚠️ Request \`#${reqId}\` not found. Please verify Request ID.`,
            timestamp: new Date().toISOString(),
            isSystemNotification: true
          });
        } else if (reqItem.status !== 'PENDING') {
          groupMessages.push({
            id: `msg_${Date.now() + 1}`,
            sender: "Fast Approval System",
            senderRole: "SYSTEM",
            text: `⚠️ Request \`#${reqId}\` is already ${reqItem.status}!`,
            timestamp: new Date().toISOString(),
            isSystemNotification: true
          });
        } else {
          // Execute processing
          const action = actionCmd === 'REJECT' ? 'REJECT' : 'PASS';
          const user = users.find(u => u.id === reqItem.userId);

          if (action === 'PASS') {
            reqItem.status = 'APPROVED';
            reqItem.processedAt = new Date().toISOString();
            reqItem.processedBy = sender || 'Pass Admin';
            reqItem.fastApproved = true;
            if (user) user.totalWithdrawn += reqItem.amount;

            groupMessages.push({
              id: `msg_${Date.now() + 2}`,
              sender: "Fast Approval Bot",
              senderRole: "SYSTEM",
              text: `⚡ **FAST APPROVED!** Request \`#${reqId}\` of ₹${reqItem.amount} for ${reqItem.userName} has been marked PAID!`,
              timestamp: new Date().toISOString(),
              isSystemNotification: true,
              withdrawalRequestId: reqId
            });
          } else {
            reqItem.status = 'REJECTED';
            reqItem.processedAt = new Date().toISOString();
            reqItem.processedBy = sender || 'Pass Admin';
            reqItem.rejectionReason = reason;
            if (user) {
              const coinsRefund = Math.round(reqItem.amount * 200);
              user.coins = (user.coins || 0) + coinsRefund;
              user.balance = Number((user.coins / 200).toFixed(2));
              addTransaction(user.id, 'WITHDRAWAL_REFUND', 'Withdrawal Refund', coinsRefund, reqItem.amount, `Refunded for rejected request #${reqId}`);
            }

            groupMessages.push({
              id: `msg_${Date.now() + 2}`,
              sender: "Fast Approval Bot",
              senderRole: "SYSTEM",
              text: `❌ Request \`#${reqId}\` REJECTED. Refunded ₹${reqItem.amount} to user balance.`,
              timestamp: new Date().toISOString(),
              isSystemNotification: true,
              withdrawalRequestId: reqId
            });
          }
        }
      }

      return res.json({ success: true, messages: groupMessages });
    }

    // Regular chat message in private group
    const msg: GroupMessage = {
      id: `msg_${Date.now()}`,
      sender: sender || 'Admin Member',
      senderRole: senderRole || 'ADMIN',
      text: trimmedText,
      timestamp: new Date().toISOString(),
      isSystemNotification: false
    };
    groupMessages.push(msg);

    res.json({ success: true, message: msg });
  });

  // RESET ALL DATA TO CLEAN ZERO STATE
  app.post("/api/admin/reset-data", (req, res) => {
    users = [...initialUsers];
    withdrawalRequests = [...initialWithdrawalRequests];
    groupMessages = [...initialGroupMessages];
    adWatchLogs = [...initialAdWatchLogs];
    adminTeam = [...initialAdminTeam];
    transactionsLog = [];
    res.json({ success: true, message: "System data reset to clean initial state" });
  });

  // USER MANAGEMENT ACTIONS
  app.post("/api/users/:id/action", (req, res) => {
    const { action, amount, reason, banType } = req.body;
    const user = users.find(u => u.id === req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (action === 'BAN') {
      user.isBanned = true;
      user.banType = banType || 'PERMANENT';
      user.banReason = reason || 'Violation of platform rules / suspicious activity detected';

      if (!user.notifications) user.notifications = [];
      user.notifications.unshift({
        id: `notif_${Date.now()}`,
        type: 'ACCOUNT_BANNED',
        title: '🚨 Account Restricted / Banned',
        message: `Your account has been restricted (${user.banType}). Reason: ${user.banReason}. Contact support @PremSargam88 if you believe this is an error.`,
        reason: user.banReason,
        read: false,
        timestamp: new Date().toISOString()
      });

      sendTelegramMessage(user.id, `🚨 *Account Restricted*\nYour AdEarn account has been banned (${user.banType}). Reason: ${user.banReason}`);
    } else if (action === 'UNBAN') {
      user.isBanned = false;
      user.banType = undefined;
      user.banReason = undefined;

      if (!user.notifications) user.notifications = [];
      user.notifications.unshift({
        id: `notif_${Date.now()}`,
        type: 'ACCOUNT_UNBANNED',
        title: '✅ Account Restored',
        message: 'Your account restrictions have been lifted by Admin. You can now watch ads and withdraw earnings normally!',
        read: false,
        timestamp: new Date().toISOString()
      });

      sendTelegramMessage(user.id, `✅ *Account Restored!*\nYour account access has been fully restored by Admin.`);
    } else if (action === 'ELEVATE_ROLE') {
      const newRole = req.body.role || 'ADMIN';
      user.role = newRole;
    } else if (action === 'ADD_BALANCE') {
      const addVal = Number(amount) || 0;
      const addCoins = addVal * 200;
      user.coins = (user.coins || 0) + addCoins;
      user.totalCoinsEarned = (user.totalCoinsEarned || 0) + addCoins;
      user.balance = Number((user.coins / 200).toFixed(2));
      user.totalEarned = Number((user.totalCoinsEarned / 200).toFixed(2));

      addTransaction(user.id, 'ADMIN_ADDITION', 'Admin Bonus Credit', addCoins, addVal, reason || 'Admin manual credit');
    } else if (action === 'DEDUCT_BALANCE') {
      const deductVal = Number(amount) || 0;
      const deductCoins = deductVal * 200;
      user.coins = Math.max(0, (user.coins || 0) - deductCoins);
      user.balance = Number((user.coins / 200).toFixed(2));

      addTransaction(user.id, 'ADMIN_DEDUCTION', 'Admin Balance Deduction', -deductCoins, -deductVal, reason || 'Policy violation / adjustment');

      if (!user.notifications) user.notifications = [];
      user.notifications.unshift({
        id: `notif_${Date.now()}`,
        type: 'BALANCE_DEDUCTED',
        title: '⚠️ Balance Deducted by Admin',
        message: `₹${deductVal.toFixed(2)} (${deductCoins.toLocaleString()} Coins) has been deducted from your balance. Reason: ${reason || 'System adjustment / violation of policy'}`,
        amount: deductVal,
        reason: reason || 'Policy violation / adjustment',
        read: false,
        timestamp: new Date().toISOString()
      });

      sendTelegramMessage(user.id, `⚠️ *Balance Adjustment*\n₹${deductVal.toFixed(2)} (${deductCoins.toLocaleString()} Coins) was deducted from your account. Reason: ${reason || 'System adjustment'}`);
    }

    res.json({ success: true, user });
  });

  // TELEGRAM WEBHOOK ENDPOINT
  app.post("/api/telegram-webhook", async (req, res) => {
    try {
      const update = req.body;
      if (update) {
        await handleTelegramUpdate(update);
      }
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: "Webhook failed" });
    }
  });

  // DISMISS / READ USER NOTIFICATION
  app.post("/api/users/:userId/notifications/:notificationId/read", (req, res) => {
    const user = users.find(u => u.id === req.params.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.notifications) {
      const target = user.notifications.find(n => n.id === req.params.notificationId);
      if (target) {
        target.read = true;
      }
    }

    res.json({ success: true, user });
  });

  // VITE MIDDLEWARE SETUP
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
    // Start background Telegram Bot polling loop
    pollTelegramUpdates().catch(console.error);
  });
}

startServer();
