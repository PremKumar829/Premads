import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import {
  initialSettings,
  initialUsers,
  initialAdminTeam,
  initialWithdrawalRequests,
  initialGroupMessages,
  initialAdWatchLogs
} from "./src/mockData.js";
import { SystemSettings, User, WithdrawalRequest, AdminMember, GroupMessage, AdWatchLog } from "./src/types.js";

// In-Memory Data Store (Persisted across API calls during runtime)
let settings: SystemSettings = {
  ...initialSettings,
  botToken: process.env.TELEGRAM_BOT_TOKEN || initialSettings.botToken,
  ownerTelegramId: process.env.OWNER_TELEGRAM_ID || initialSettings.ownerTelegramId
};
let users: User[] = [...initialUsers];
let adminTeam: AdminMember[] = [...initialAdminTeam];
let withdrawalRequests: WithdrawalRequest[] = [...initialWithdrawalRequests];
let groupMessages: GroupMessage[] = [...initialGroupMessages];
let adWatchLogs: AdWatchLog[] = [...initialAdWatchLogs];
let nextRequestId = 1004;

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
  } else {
    if (settings.ownerTelegramId && telegramId === settings.ownerTelegramId) {
      user.role = 'CEO';
    }
  }

  const appUrl = process.env.APP_URL || 'https://ais-dev-mqwiqyelwqvwrnf4hmgmfw-826258444941.asia-southeast1.run.app';

  const keyboard = {
    inline_keyboard: [
      [
        {
          text: "🚀 Open AdEarn Mini App",
          web_app: { url: appUrl }
        }
      ],
      [
        { text: "📺 Watch Ads (+10)", web_app: { url: appUrl } },
        { text: "💸 Withdraw (UPI)", web_app: { url: appUrl } }
      ],
      [
        { text: "👥 Refer & Earn (10%)", web_app: { url: appUrl } },
        { text: "📊 My Balance", web_app: { url: appUrl } }
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
      `📺 *Watch Ads:* Earn 10 Coins (₹0.05) per ad watch.\n` +
      `👥 *Referral Program:* Earn ₹5 (${(5 * 200).toLocaleString()} Coins) after 50 ads watched + 10% lifetime commission!\n` +
      `💳 *Withdrawal:* Min ₹50 (10,000 Coins) via Instant UPI / Bank (Requires 100 ads watched).\n\n` +
      `Tap below to launch the Mini App and start earning!`;
    await sendTelegramMessage(chatId, welcomeText, keyboard);
  } else if (text === '/balance' || text === '/dashboard') {
    const dashText = `📊 *AdEarn User Balance*\n\n` +
      `👤 *User:* ${user.firstName} (@${user.username})\n` +
      `🪙 *Coin Balance:* ${(user.coins || 0).toLocaleString()} Coins (≈ ₹${(user.balance || 0).toFixed(2)})\n` +
      `💵 *Total Earned:* ${(user.totalCoinsEarned || 0).toLocaleString()} Coins (≈ ₹${(user.totalEarned || 0).toFixed(2)})\n` +
      `💸 *Total Withdrawn:* ₹${(user.totalWithdrawn || 0).toFixed(2)}\n` +
      `📺 *Ads Watched:* ${user.totalAdsWatched || 0} / 100 Minimum Required`;
    await sendTelegramMessage(chatId, dashText, keyboard);
  } else if (text === '/withdraw') {
    const adsLeft = Math.max(0, 100 - (user.totalAdsWatched || 0));
    const isUnlocked = adsLeft === 0;
    const withdrawText = `💳 *Withdrawal Center*\n\n` +
      `🪙 *Available Balance:* ${(user.coins || 0).toLocaleString()} Coins (≈ ₹${(user.balance || 0).toFixed(2)})\n` +
      `🎯 *Minimum Payout:* 10,000 Coins (₹50)\n` +
      `📊 *Ads Progress:* ${user.totalAdsWatched || 0} / 100 Watched\n\n` +
      (isUnlocked 
        ? `✅ *Status:* UNLOCKED! Open the Mini App to request instant UPI payout.`
        : `⚠️ *Status:* LOCKED. Watch ${adsLeft} more ads to unlock payout.`);
    await sendTelegramMessage(chatId, withdrawText, keyboard);
  } else if (text === '/refer') {
    const refText = `👥 *AdEarn Referral Program*\n\n` +
      `Earn bonus when your friend watches 50 ads + get 10% lifetime commission!\n\n` +
      `🔗 *Your Referral Link:*\nhttps://t.me/${settings.botUsername || 'PrimeAdsEbot'}?start=ref_${user.id}`;
    await sendTelegramMessage(chatId, refText, keyboard);
  } else {
    const helpText = `🤖 *AdEarn Telegram Bot*\n\nAvailable commands:\n` +
      `/start - Launch Mini App & Welcome Bonus\n` +
      `/balance - Check Coin Balance & Stats\n` +
      `/withdraw - Check Withdrawal Status\n` +
      `/refer - Get Referral Link\n\n` +
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
    if (!settings.botToken || settings.botToken === 'YOUR_BOT_TOKEN_HERE') {
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
      text: `⚙️ **SYSTEM SETTINGS UPDATED BY ADMIN**\n• Welcome Bonus: ₹${settings.welcomeBonus}\n• Per Ad Reward: ₹${settings.perAdReward}\n• Referral Reward: ₹${settings.referralReward}\n• Min Withdrawal: ₹${settings.minWithdrawal}\n• Commission: ${settings.referralCommissionPct}%`,
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
      const welcomeBonus = settings.welcomeBonus || 20;
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
        coins: (settings.welcomeBonus || 5) * 200,
        totalCoinsEarned: (settings.welcomeBonus || 5) * 200,
        balance: settings.welcomeBonus || 5,
        totalEarned: settings.welcomeBonus || 5,
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

      // DELAYED REFERRAL BONUS RULE (50+ Ads Watched):
      // Do NOT credit the referrer immediately upon registration.
      // The bonus will automatically be credited when this new user completes watching 50 Monetag ads.
      if (referrerUser) {
        const refReward = settings.referralReward || 5;
        groupMessages.push({
          id: `msg_${Date.now()}`,
          sender: "Anti-Fraud Referral Engine",
          senderRole: "SYSTEM",
          text: `👥 **NEW REFERRAL REGISTERED!**\nUser @${user.username} joined via referral link from @${referrerUser.username}.\n⏳ **Delayed Bonus Anti-Fraud:** ₹${refReward} (${refReward * 200} Coins) referral bonus will be credited to @${referrerUser.username} as soon as @${user.username} watches 50 Monetag ads! (Progress: 0/50)`,
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

  // WATCH AD ENDPOINT
  app.post("/api/users/:id/watch-ad", (req, res) => {
    const userId = req.params.id;
    const { adId } = req.body || {};
    const user = users.find(u => u.id === userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.isBanned) {
      return res.status(403).json({ error: "User is banned" });
    }

    // Ensure arrays and coin properties exist
    if (!user.watchedAdIds) user.watchedAdIds = [];
    if (user.coins === undefined) user.coins = Math.round(user.balance * 200);
    if (user.totalCoinsEarned === undefined) user.totalCoinsEarned = Math.round(user.totalEarned * 200);

    // DUPLICATE CLAIM CHECK: Prevent user from claiming reward for the exact same ad twice!
    if (adId && user.watchedAdIds.includes(adId)) {
      return res.status(400).json({
        error: `Duplicate ad claim blocked! You have already watched ad campaign (${adId}) and received 10 Coins (₹0.05). Please select another active ad.`
      });
    }

    // Cooldown check
    const now = Date.now();
    const cooldownMs = (settings.adCooldownSec || 10) * 1000;
    if (user.lastAdWatchedAt && (now - user.lastAdWatchedAt) < cooldownMs) {
      const waitSec = Math.ceil((cooldownMs - (now - user.lastAdWatchedAt)) / 1000);
      return res.status(429).json({ error: `Please wait ${waitSec}s before watching the next ad.` });
    }

    // Daily limit check
    if (user.adsWatchedToday >= (settings.dailyAdLimit || 50)) {
      return res.status(400).json({ error: `Daily ad limit (${settings.dailyAdLimit || 50} ads) reached. Come back tomorrow!` });
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

    const currentAdId = adId || `AD-AUTO-${Date.now()}`;
    user.watchedAdIds.push(currentAdId);

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

        // Add notification to inviter's inbox
        if (!referrerUser.notifications) referrerUser.notifications = [];
        referrerUser.notifications.unshift({
          id: `notif_${Date.now()}`,
          type: 'REFERRAL_SUCCESS',
          title: '🎉 Referral Bonus Credited!',
          message: '🎉 Your referred friend is now active! Referral bonus credited.',
          amount: refBonusAmount,
          read: false,
          timestamp: new Date().toISOString()
        });

        // Broadcast notification to group
        groupMessages.push({
          id: `msg_${Date.now()}`,
          sender: "Referral Reward Engine",
          senderRole: "SYSTEM",
          text: `🎉 Your referred friend is now active! Referral bonus credited. (@${user.username} reached 50 ads!)`,
          timestamp: new Date().toISOString(),
          isSystemNotification: true
        });
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

    // STRICT ANTI-FRAUD RULE: Personal lifetime ad watch count >= 100
    const lifetimeAds = user.totalAdsWatched || user.watchedAdIds?.length || 0;
    if (lifetimeAds < 100) {
      return res.status(400).json({
        error: `⚠️ Action Required: You must personally watch at least 100 ads to unlock payouts. (Watched: ${lifetimeAds}/100)`
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
            if (user) user.balance += reqItem.amount;

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

  // USER MANAGEMENT ACTIONS
  app.post("/api/users/:id/action", (req, res) => {
    const { action, amount, reason } = req.body;
    const user = users.find(u => u.id === req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (action === 'BAN') {
      user.isBanned = true;
    } else if (action === 'UNBAN') {
      user.isBanned = false;
    } else if (action === 'ADD_BALANCE') {
      user.balance += Number(amount) || 0;
      user.totalEarned += Number(amount) || 0;
    } else if (action === 'DEDUCT_BALANCE') {
      const deductVal = Number(amount) || 0;
      user.balance = Math.max(0, user.balance - deductVal);

      if (!user.notifications) user.notifications = [];
      user.notifications.unshift({
        id: `notif_${Date.now()}`,
        type: 'BALANCE_DEDUCTED',
        title: '⚠️ Balance Deducted by Admin',
        message: `₹${deductVal.toFixed(2)} has been deducted from your account balance. Reason: ${reason || 'System adjustment / violation of policy'}`,
        amount: deductVal,
        reason: reason || 'Policy violation / adjustment',
        read: false,
        timestamp: new Date().toISOString()
      });
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
