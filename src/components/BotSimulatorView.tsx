import React, { useState, useRef, useEffect } from 'react';
import { User, SystemSettings, BotChatMessage } from '../types';
import { Send, Bot, Smartphone, CheckCircle2, ChevronUp } from 'lucide-react';

interface BotSimulatorViewProps {
  user: User;
  settings: SystemSettings;
  onOpenMiniAppTab: (tab: 'home' | 'watch' | 'refer' | 'withdraw' | 'admin') => void;
  onSendBotCommand: (command: string) => void;
}

export const BotSimulatorView: React.FC<BotSimulatorViewProps> = ({
  user,
  settings,
  onOpenMiniAppTab,
  onSendBotCommand
}) => {
  const [inputText, setInputText] = useState('');
  const [showCommandsMenu, setShowCommandsMenu] = useState(false);
  const [messages, setMessages] = useState<BotChatMessage[]>([
    {
      id: 'm1',
      sender: 'bot',
      text: `👋 *Welcome to @${settings.botUsername || 'PrimeAdsEbot'}!*\n\n✨ *Welcome Bonus:* ₹${settings.welcomeBonus || 5}.00 (${((settings.welcomeBonus || 5) * 200).toLocaleString()} Coins) credited to your balance!\n\n💰 *Conversion Rate:* 10,000 Coins = ₹50 (10 Coins per Ad)\n📺 *Watch Ads:* Earn 10 Coins (₹0.05) per ad watch.\n👥 *Referral Program:* Earn ₹5 (${(5 * 200).toLocaleString()} Coins) after 50 ads watched + 10% lifetime commission!\n💳 *Withdrawal:* Min ₹50 (10,000 Coins) via Instant UPI / Bank (Requires 100 ads watched).\n\nTap below to launch the Mini App and start earning!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      inlineButtons: [
        { text: '🚀 Open AdEarn Mini App', action: 'OPEN_MINIAPP' },
        { text: '📺 Watch Ads (+10)', action: 'OPEN_WATCH' },
        { text: '💸 Withdraw (UPI)', action: 'OPEN_WITHDRAW' },
        { text: '👥 Refer & Earn (10%)', action: 'OPEN_REFER' },
        { text: '📊 My Balance', action: 'OPEN_HOME' },
        { text: '💬 Join VIP Channel', action: 'OPEN_CHANNEL' }
      ]
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (customText?: string) => {
    const txt = customText || inputText;
    if (!txt.trim()) return;

    const userMsg: BotChatMessage = {
      id: `u_${Date.now()}`,
      sender: 'user',
      text: txt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customText) setInputText('');
    setShowCommandsMenu(false);

    setTimeout(() => {
      let botReply = '';
      let buttons: BotChatMessage['inlineButtons'] = [];

      const cleanCmd = txt.trim().toLowerCase();

      if (cleanCmd.startsWith('/start')) {
        botReply = `🎉 *Welcome to @${settings.botUsername || 'PrimeAdsEbot'}!*\n\nYour account is active. Available Balance: *${(user.coins || 0).toLocaleString()} Coins (≈ ₹${user.balance.toFixed(2)})*.\n\nUse the Mini App interface below to watch ads and request instant UPI withdrawals.`;
        buttons = [
          { text: '🚀 Open AdEarn Mini App', action: 'OPEN_MINIAPP' },
          { text: '📺 Watch Ads (+10)', action: 'OPEN_WATCH' },
          { text: '💸 Withdraw (UPI)', action: 'OPEN_WITHDRAW' },
          { text: '👥 Refer & Earn (10%)', action: 'OPEN_REFER' },
          { text: '📊 My Balance', action: 'OPEN_HOME' },
          { text: '💬 Join VIP Channel', action: 'OPEN_CHANNEL' }
        ];
      } else if (cleanCmd === '/dashboard' || cleanCmd === '/balance') {
        botReply = `📊 *AdEarn User Balance*\n\n👤 *User:* ${user.firstName} (@${user.username})\n🪙 *Coin Balance:* ${(user.coins || 0).toLocaleString()} Coins (≈ ₹${user.balance.toFixed(2)})\n💵 *Total Earned:* ${(user.totalCoinsEarned || 0).toLocaleString()} Coins (≈ ₹${user.totalEarned.toFixed(2)})\n💸 *Total Withdrawn:* ₹${user.totalWithdrawn.toFixed(2)}\n📺 *Ads Watched:* ${user.totalAdsWatched || 0} / 100 Minimum Required`;
        buttons = [
          { text: '🚀 Open Mini App', action: 'OPEN_MINIAPP' },
          { text: '💸 Request Withdrawal', action: 'OPEN_WITHDRAW' }
        ];
      } else if (cleanCmd === '/watch') {
        botReply = `📺 *Watch Ads Zone*\nEarn 10 Coins (₹0.05) per ad watched. Tap below to start:`;
        buttons = [{ text: '📺 Launch Ad Player (+10)', action: 'OPEN_WATCH' }];
      } else if (cleanCmd === '/withdraw') {
        const adsLeft = Math.max(0, 100 - (user.totalAdsWatched || 0));
        botReply = `💳 *Withdrawal Center*\n\nAvailable Balance: ${(user.coins || 0).toLocaleString()} Coins (≈ ₹${user.balance.toFixed(2)})\nMinimum Payout: 10,000 Coins (₹50)\nAds Watched Progress: ${user.totalAdsWatched || 0} / 100\n\n${adsLeft === 0 ? '✅ Status: UNLOCKED! Ready for instant UPI payout.' : `⚠️ Status: LOCKED. Need ${adsLeft} more ads.`}`;
        buttons = [{ text: '💸 Open Withdrawal Page', action: 'OPEN_WITHDRAW' }];
      } else if (cleanCmd === '/refer' || cleanCmd.startsWith('#2') || cleanCmd.startsWith('/2')) {
        const cleanedText = txt.replace(/#2/gi, '').replace(/\/2/gi, '').trim();
        if (cleanedText) {
          botReply = `🎉 <b>REFERRAL BONUS CLAIMED SUCCESSFULLY! (#2)</b>\n------------------------------------\n👤 <b>User:</b> ${user.firstName}\n🎁 <b>Bonus Credited:</b> ₹${settings.referralReward || 5}.00 (${((settings.referralReward || 5) * 200).toLocaleString()} Coins)\n📢 <b>Group Join Status:</b> VERIFIED ✅ (@${settings.fastGroupUsername || 'AdEarn_FastWithdrawals'})`;
        } else {
          botReply = `🎁 <b>REFERRAL & GROUP VERIFICATION (#2)</b>\n------------------------------------\n✅ <b>Channel Join Status:</b> VERIFIED (@${settings.fastGroupUsername || 'AdEarn_FastWithdrawals'})\n👥 <b>Claim Bonus Command:</b> <code>#2 &lt;INVITER_ID_OR_USERNAME&gt;</code>\n💡 <b>Example:</b> <code>#2 @PremSargam88</code> or <code>#2 ${user.id}</code>\n💰 <b>Bonus Reward:</b> ₹${settings.referralReward || 5}.00 (${((settings.referralReward || 5) * 200).toLocaleString()} Coins)\n\n🔗 <b>Your Referral Link:</b>\nhttps://t.me/${settings.botUsername}?start=ref_${user.id}`;
        }
        buttons = [
          { text: '🚀 Open Mini App', action: 'OPEN_MINIAPP' },
          { text: '👥 View Referrals', action: 'OPEN_REFER' }
        ];
      } else if (txt.startsWith(settings.fastApprovalHashtag || '#1')) {
        onSendBotCommand(txt);
        botReply = `⚡ *Fast Hashtag Command Dispatched!*\nCommand \`${txt}\` forwarded to system engine.`;
      } else {
        botReply = `🤖 I am *@${settings.botUsername}*. Select a command below or tap to open the Mini App:`;
        buttons = [
          { text: '🚀 Open Mini App', action: 'OPEN_MINIAPP' },
          { text: '📊 Dashboard & Stats', action: 'OPEN_HOME' }
        ];
      }

      setMessages(prev => [
        ...prev,
        {
          id: `b_${Date.now()}`,
          sender: 'bot',
          text: botReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          inlineButtons: buttons
        }
      ]);
    }, 300);
  };

  const handleButtonClick = (action: string) => {
    if (action === 'OPEN_MINIAPP' || action === 'OPEN_HOME') {
      onOpenMiniAppTab('home');
    } else if (action === 'OPEN_WATCH') {
      onOpenMiniAppTab('watch');
    } else if (action === 'OPEN_WITHDRAW') {
      onOpenMiniAppTab('withdraw');
    } else if (action === 'OPEN_REFER') {
      onOpenMiniAppTab('refer');
    } else if (action === 'OPEN_CHANNEL') {
      window.open(settings.fastGroupUsername ? `https://t.me/${settings.fastGroupUsername.replace(/^@/, '')}` : 'https://t.me/AdEarn_FastWithdrawals', '_blank');
    }
  };

  return (
    <div className="flex flex-col h-full min-h-[450px] bg-[#0e1621] rounded-2xl border border-slate-800 overflow-hidden shadow-2xl font-sans">
      {/* Telegram Chat Header */}
      <div className="bg-[#17212b] border-b border-[#0e1621] px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-md">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
              <span>{settings.botUsername ? `@${settings.botUsername}` : 'PrimeAdsEbot'}</span>
              <CheckCircle2 className="w-4 h-4 text-sky-400 fill-sky-400/20" />
            </div>
            <div className="text-[11px] text-sky-400">bot</div>
          </div>
        </div>

        <button
          onClick={() => onOpenMiniAppTab('home')}
          className="bg-[#2ea8ef] hover:bg-[#2895d4] text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow transition-all active:scale-95"
        >
          <Smartphone className="w-4 h-4" />
          <span>Launch Mini App</span>
        </button>
      </div>

      {/* Messages Scroll Area - Native Telegram Dark Chat BG */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0e1621]">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col max-w-[88%] sm:max-w-[75%] ${
              m.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
            }`}
          >
            {/* Chat Bubble */}
            <div
              className={`p-3.5 rounded-2xl text-xs leading-relaxed relative ${
                m.sender === 'user'
                  ? 'bg-[#2b5278] text-white rounded-tr-none shadow-md'
                  : 'bg-[#182533] text-slate-100 rounded-tl-none border border-[#233142] shadow-md'
              }`}
            >
              <div className="whitespace-pre-wrap font-sans text-[13px]">{m.text}</div>
              <div className="text-[10px] text-slate-400 text-right mt-1.5 flex items-center justify-end gap-1 select-none">
                <span>{m.timestamp}</span>
                {m.sender === 'user' && <span className="text-sky-300 font-bold">✓✓</span>}
              </div>
            </div>

            {/* Telegram Inline Buttons Attached directly under Bot message */}
            {m.inlineButtons && m.inlineButtons.length > 0 && (
              <div className="mt-2 w-full bg-[#17212b]/95 p-2 rounded-2xl border border-[#2b3b4e] space-y-2 shadow-xl backdrop-blur-md">
                <div className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-400 px-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>⚡ Telegram 8.0 Colored Keyboards</span>
                  </span>
                  <span className="text-[9px] bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-600 text-white px-2 py-0.5 rounded-full font-black shadow-lg shadow-cyan-500/30 border border-white/20">
                    NEW TG COLOR UPDATE
                  </span>
                </div>

                {/* 1st button: Primary Open App - Vibrant Cyan/Blue Gradient */}
                {m.inlineButtons.find(b => b.action === 'OPEN_MINIAPP') && (
                  <button
                    onClick={() => handleButtonClick('OPEN_MINIAPP')}
                    className="w-full bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 active:scale-95 text-white font-black py-3 px-4 rounded-xl text-xs shadow-xl shadow-cyan-500/40 border-2 border-cyan-300 transition-all flex items-center justify-center gap-2 group cursor-pointer"
                  >
                    <span className="text-sm group-hover:scale-125 transition-transform animate-bounce">💎</span>
                    <span className="tracking-wide">🚀 Open AdEarn Mini App</span>
                    <span className="text-sm group-hover:scale-125 transition-transform animate-pulse">⚡</span>
                  </button>
                )}

                {/* 2nd Row: Watch Ads (Vivid Green) & Withdraw (Vivid Red) */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleButtonClick('OPEN_WATCH')}
                    className="bg-gradient-to-r from-emerald-500 via-green-600 to-teal-600 hover:from-emerald-400 hover:to-teal-500 active:scale-95 text-white font-black py-3 px-2 rounded-xl text-xs shadow-lg shadow-green-500/40 border-2 border-emerald-300 transition-all flex items-center justify-center gap-1.5 truncate cursor-pointer"
                  >
                    <span className="text-base animate-bounce">🟢</span>
                    <span>Watch Ads (+10)</span>
                  </button>

                  <button
                    onClick={() => handleButtonClick('OPEN_WITHDRAW')}
                    className="bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 hover:from-red-500 hover:to-rose-500 active:scale-95 text-white font-black py-3 px-2 rounded-xl text-xs shadow-lg shadow-red-600/40 border-2 border-red-300 transition-all flex items-center justify-center gap-1.5 truncate cursor-pointer"
                  >
                    <span className="text-base animate-pulse">🔴</span>
                    <span>Withdraw (UPI)</span>
                  </button>
                </div>

                {/* 3rd Row: Refer & Earn (Amber/Gold) & My Balance (Purple/Violet) */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleButtonClick('OPEN_REFER')}
                    className="bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 hover:from-amber-300 hover:to-yellow-400 active:scale-95 text-slate-950 font-black py-3 px-2 rounded-xl text-xs shadow-lg shadow-amber-500/40 border-2 border-amber-200 transition-all flex items-center justify-center gap-1.5 truncate cursor-pointer"
                  >
                    <span className="animate-pulse text-sm">🌟</span>
                    <span>👥 Refer & Earn (10%)</span>
                  </button>

                  <button
                    onClick={() => handleButtonClick('OPEN_HOME')}
                    className="bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 hover:from-purple-500 hover:to-fuchsia-500 active:scale-95 text-white font-black py-3 px-2 rounded-xl text-xs shadow-lg shadow-purple-600/40 border-2 border-purple-300 transition-all flex items-center justify-center gap-1.5 truncate cursor-pointer"
                  >
                    <span className="text-sm">📊</span>
                    <span>My Balance</span>
                  </button>
                </div>

                {/* 4th Row: VIP Channel (Sky/Cyan) */}
                {m.inlineButtons.find(b => b.action === 'OPEN_CHANNEL') && (
                  <button
                    onClick={() => handleButtonClick('OPEN_CHANNEL')}
                    className="w-full bg-gradient-to-r from-sky-500 via-cyan-600 to-blue-600 hover:from-sky-400 hover:to-blue-500 active:scale-95 text-white font-black py-3 px-3 rounded-xl text-xs shadow-lg shadow-sky-500/40 border-2 border-sky-300 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span className="text-sm">💬</span>
                    <span>Join VIP Fast Approvals Group</span>
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Command Selector Popup */}
      {showCommandsMenu && (
        <div className="bg-[#17212b] border-t border-[#233142] p-2 space-y-1 text-xs animate-in slide-in-from-bottom-2 shrink-0">
          <div className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1 flex items-center justify-between">
            <span>Bot Quick Commands</span>
            <button onClick={() => setShowCommandsMenu(false)} className="text-slate-500 hover:text-slate-300">✕</button>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => handleSendMessage('/start')}
              className="bg-[#242f3d] hover:bg-[#2b384a] text-slate-200 p-2 rounded-lg text-left font-medium flex items-center gap-2"
            >
              <span className="text-sky-400 font-bold">/start</span>
              <span className="text-[11px] text-slate-400">Launch & Bonus</span>
            </button>
            <button
              onClick={() => handleSendMessage('/balance')}
              className="bg-[#242f3d] hover:bg-[#2b384a] text-slate-200 p-2 rounded-lg text-left font-medium flex items-center gap-2"
            >
              <span className="text-sky-400 font-bold">/balance</span>
              <span className="text-[11px] text-slate-400">Check Wallet</span>
            </button>
            <button
              onClick={() => handleSendMessage('/withdraw')}
              className="bg-[#242f3d] hover:bg-[#2b384a] text-slate-200 p-2 rounded-lg text-left font-medium flex items-center gap-2"
            >
              <span className="text-sky-400 font-bold">/withdraw</span>
              <span className="text-[11px] text-slate-400">Payout Status</span>
            </button>
            <button
              onClick={() => handleSendMessage('/refer')}
              className="bg-[#242f3d] hover:bg-[#2b384a] text-slate-200 p-2 rounded-lg text-left font-medium flex items-center gap-2"
            >
              <span className="text-sky-400 font-bold">/refer</span>
              <span className="text-[11px] text-slate-400">Referral Link</span>
            </button>
          </div>
        </div>
      )}

      {/* Native Telegram Chat Input Bar */}
      <div className="bg-[#17212b] border-t border-[#0e1621] p-3 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCommandsMenu(!showCommandsMenu)}
            className={`px-2.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
              showCommandsMenu ? 'bg-sky-500 text-white' : 'bg-[#242f3d] text-sky-400 hover:bg-[#2d3a4b]'
            }`}
          >
            <span>/</span>
            <span>Menu</span>
            <ChevronUp className={`w-3.5 h-3.5 transition-transform ${showCommandsMenu ? 'rotate-180' : ''}`} />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Send a message or /command..."
            className="flex-1 bg-[#242f3d] border border-[#2d3a4b] rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-500"
          />

          <button
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim()}
            className="bg-[#2ea8ef] hover:bg-[#2895d4] disabled:opacity-40 disabled:hover:bg-[#2ea8ef] text-white p-2 rounded-xl transition-all active:scale-95 shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
