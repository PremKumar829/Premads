import React, { useState } from 'react';
import { User } from '../types';
import { Sparkles, Trophy, X, Play, RefreshCw, Zap, Gift, Flame } from 'lucide-react';
import { audioSynth } from '../utils/audio';

interface SpinWheelProps {
  user: User;
  onSpinCompleted: (prizeCoins: number, label: string) => Promise<any>;
  onClose: () => void;
}

const PRIZES = [
  { coins: 10, label: '10 Coins', inr: '₹0.05', color: 'from-amber-500 to-yellow-600', text: 'text-slate-950' },
  { coins: 25, label: '25 Coins', inr: '₹0.12', color: 'from-cyan-500 to-blue-600', text: 'text-white' },
  { coins: 50, label: '50 Coins', inr: '₹0.25', color: 'from-emerald-500 to-teal-600', text: 'text-white' },
  { coins: 100, label: '100 Coins', inr: '₹0.50', color: 'from-purple-600 to-indigo-700', text: 'text-white' },
  { coins: 200, label: '200 Coins', inr: '₹1.00', color: 'from-amber-400 to-orange-500', text: 'text-slate-950' },
  { coins: 500, label: '500 Coins', inr: '₹2.50', color: 'from-rose-500 to-pink-600', text: 'text-white' },
];

export const SpinWheel: React.FC<SpinWheelProps> = ({ user, onSpinCompleted, onClose }) => {
  const [spinning, setSpinning] = useState(false);
  const [rotationDegree, setRotationDegree] = useState(0);
  const [wonPrize, setWonPrize] = useState<{ coins: number; label: string; inr: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 12-hour cooldown check
  const now = Date.now();
  const twelveHours = 12 * 3600 * 1000;
  const timeSinceLastSpin = (user as any).lastSpinAt ? (now - (user as any).lastSpinAt) : twelveHours + 1;
  const isFreeSpinAvailable = timeSinceLastSpin >= twelveHours;

  const msRemaining = Math.max(0, twelveHours - timeSinceLastSpin);
  const hoursRemaining = Math.floor(msRemaining / (3600 * 1000));
  const minsRemaining = Math.floor((msRemaining % (3600 * 1000)) / (60 * 1000));

  const handleSpin = async () => {
    if (spinning) return;
    setErrorMsg(null);
    setWonPrize(null);

    if (!isFreeSpinAvailable && (user.coins || 0) < 10) {
      setErrorMsg('Free spin on cooldown. You need at least 10 Coins to spin again!');
      return;
    }

    setSpinning(true);
    audioSynth.playDailyCheckInSound();

    // Calculate random prize index
    const prizeIndex = Math.floor(Math.random() * PRIZES.length);
    const selected = PRIZES[prizeIndex];

    // Each segment is 360 / 6 = 60 deg
    const segmentDegree = 360 / PRIZES.length;
    // Extra full spins (5 to 8 rotations) + segment offset
    const extraRotations = (5 + Math.floor(Math.random() * 3)) * 360;
    const targetDegree = rotationDegree + extraRotations + (360 - (prizeIndex * segmentDegree + segmentDegree / 2));

    setRotationDegree(targetDegree);

    setTimeout(async () => {
      setSpinning(false);
      setWonPrize({ coins: selected.coins, label: selected.label, inr: selected.inr });
      audioSynth.playCoinSound();

      try {
        await onSpinCompleted(selected.coins, selected.label);
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to claim spin prize.');
      }
    }, 4500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-amber-500/40 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl relative overflow-hidden text-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={spinning}
          className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 flex items-center justify-center border border-slate-700 transition-all z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title */}
        <div>
          <div className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Lucky Spin Wheel</span>
          </div>
          <h2 className="text-xl font-black text-white">Spin & Win Free Coins!</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {isFreeSpinAvailable
              ? '🎉 1 Free Daily Spin Available Now!'
              : `Next Free Spin in ${hoursRemaining}h ${minsRemaining}m or spin for 10 Coins!`}
          </p>
        </div>

        {/* Wheel Graphic Container */}
        <div className="relative w-64 h-64 mx-auto my-2 flex items-center justify-center">
          {/* Top Indicator Arrow */}
          <div className="absolute -top-3 z-20 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-amber-400 filter drop-shadow-md animate-bounce" />

          {/* Rotating Canvas Wheel */}
          <div
            className="w-full h-full rounded-full border-4 border-amber-400/80 shadow-2xl relative overflow-hidden transition-all duration-[4500ms] ease-[cubic-bezier(0.15,0.85,0.35,1.0)]"
            style={{ transform: `rotate(${rotationDegree}deg)` }}
          >
            {PRIZES.map((prize, idx) => {
              const rotateAngle = idx * (360 / PRIZES.length);
              return (
                <div
                  key={idx}
                  className="absolute w-1/2 h-1/2 top-0 right-0 origin-bottom-left flex items-center justify-center"
                  style={{
                    transform: `rotate(${rotateAngle}deg)`,
                    clipPath: 'polygon(0 100%, 100% 0, 100% 100%)',
                  }}
                >
                  <div
                    className={`w-full h-full bg-gradient-to-br ${prize.color} flex items-center justify-center p-2 text-center shadow-inner`}
                  >
                    <div
                      className={`text-[11px] font-black ${prize.text} transform rotate-45 -translate-y-2 translate-x-2`}
                    >
                      {prize.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Center Wheel Hub */}
          <div className="absolute z-10 w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 border-4 border-slate-950 flex items-center justify-center shadow-xl">
            <Trophy className="w-6 h-6 text-slate-950" />
          </div>
        </div>

        {/* Won Prize Notice */}
        {wonPrize && (
          <div className="bg-emerald-950/90 border border-emerald-500/80 text-emerald-200 p-3 rounded-2xl text-xs font-bold animate-in zoom-in-95 duration-300 space-y-1 shadow-lg">
            <div className="flex items-center justify-center gap-1 text-amber-300 text-sm font-black">
              <span>🎉 YOU WON {wonPrize.label.toUpperCase()} ({wonPrize.inr})!</span>
            </div>
            <p className="text-[11px] text-slate-300">
              Prize credited to your coin balance instantly!
            </p>
          </div>
        )}

        {errorMsg && (
          <div className="bg-rose-950/80 border border-rose-800 text-rose-300 p-2.5 rounded-xl text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {/* Spin CTA Button */}
        <button
          disabled={spinning}
          onClick={handleSpin}
          className="w-full bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black py-3.5 px-4 rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60 text-sm cursor-pointer"
        >
          {spinning ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Spinning Lucky Wheel...</span>
            </>
          ) : isFreeSpinAvailable ? (
            <>
              <Gift className="w-5 h-5 text-slate-950" />
              <span>SPIN FREE NOW! 🎁</span>
            </>
          ) : (
            <>
              <Zap className="w-5 h-5 text-slate-950" />
              <span>Spin for 10 Coins (🪙)</span>
            </>
          )}
        </button>

        <p className="text-[10px] text-slate-400 font-medium">
          Daily Lucky Wheel • Guaranteed Coins on every spin!
        </p>
      </div>
    </div>
  );
};
