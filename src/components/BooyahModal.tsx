import React, { useEffect } from 'react';
import { soundEngine } from '../utils/audio';
import { Trophy, Skull, Target, Coins, RotateCcw, ArrowRight, Home, Sparkles } from 'lucide-react';

interface Props {
  isVictory: boolean;
  rank: number;
  totalPlayers: number;
  kills: number;
  headshots: number;
  damageDealt: number;
  coinsEarned: number;
  levelNumber?: number;
  hasNextLevel: boolean;
  onNextLevel: () => void;
  onRetry: () => void;
  onHome: () => void;
}

export const BooyahModal: React.FC<Props> = ({
  isVictory,
  rank,
  totalPlayers,
  kills,
  headshots,
  damageDealt,
  coinsEarned,
  levelNumber,
  hasNextLevel,
  onNextLevel,
  onRetry,
  onHome,
}) => {
  useEffect(() => {
    if (isVictory) {
      soundEngine.playBooyah();
    }
  }, [isVictory]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg bg-neutral-900 border-2 rounded-3xl shadow-2xl overflow-hidden p-6 text-center flex flex-col items-center border-amber-500/50">
        {/* Glow ambient background */}
        <div
          className={`absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl opacity-30 pointer-events-none ${
            isVictory ? 'bg-amber-500' : 'bg-red-600'
          }`}
        />

        {/* Title Banner */}
        {isVictory ? (
          <div className="mt-2 mb-4 animate-bounce">
            <div className="inline-block relative">
              <span className="text-6xl md:text-7xl font-teko font-extrabold tracking-wider bg-gradient-to-b from-yellow-300 via-amber-400 to-red-600 bg-clip-text text-transparent drop-shadow-[0_10px_25px_rgba(245,158,11,0.8)] uppercase">
                BOOYAH!
              </span>
              <div className="flex items-center justify-center gap-1 text-amber-400 font-chakra text-xs tracking-widest uppercase font-bold mt-[-8px]">
                <Sparkles className="w-4 h-4 text-yellow-300" />
                <span>VICTORY ROYALE • #1 CHAMPION</span>
                <Sparkles className="w-4 h-4 text-yellow-300" />
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-2 mb-4">
            <span className="text-5xl md:text-6xl font-teko font-bold tracking-wider text-red-500 uppercase drop-shadow-[0_8px_20px_rgba(239,68,68,0.7)]">
              ELIMINATED
            </span>
            <div className="text-neutral-400 font-chakra text-xs tracking-widest uppercase font-semibold">
              Rank #{rank} of {totalPlayers} Survivors
            </div>
          </div>
        )}

        {/* Rank Badge */}
        <div className="flex items-center gap-3 bg-neutral-950/80 border border-neutral-800 px-6 py-2.5 rounded-2xl my-2">
          <Trophy className={`w-6 h-6 ${isVictory ? 'text-amber-400' : 'text-neutral-400'}`} />
          <div className="text-left font-rajdhani">
            <div className="text-[11px] text-neutral-400 uppercase font-bold">Final Placement</div>
            <div className="text-xl font-bold font-chakra text-white">
              #{rank} <span className="text-xs text-neutral-400 font-normal">/ {totalPlayers}</span>
            </div>
          </div>
        </div>

        {/* Match Statistics */}
        <div className="w-full grid grid-cols-3 gap-2 my-4">
          <div className="bg-neutral-950/90 border border-neutral-800 p-3 rounded-xl flex flex-col items-center">
            <Skull className="w-5 h-5 text-red-400 mb-1" />
            <span className="text-[11px] text-neutral-400 uppercase font-rajdhani font-bold">Kills</span>
            <span className="text-xl font-chakra font-bold text-white">{kills}</span>
          </div>

          <div className="bg-neutral-950/90 border border-neutral-800 p-3 rounded-xl flex flex-col items-center">
            <Target className="w-5 h-5 text-amber-400 mb-1" />
            <span className="text-[11px] text-neutral-400 uppercase font-rajdhani font-bold">Headshots</span>
            <span className="text-xl font-chakra font-bold text-white">{headshots}</span>
          </div>

          <div className="bg-neutral-950/90 border border-neutral-800 p-3 rounded-xl flex flex-col items-center">
            <Coins className="w-5 h-5 text-yellow-400 mb-1" />
            <span className="text-[11px] text-neutral-400 uppercase font-rajdhani font-bold">Battle Coins</span>
            <span className="text-xl font-chakra font-bold text-amber-400">+{coinsEarned}</span>
          </div>
        </div>

        <div className="text-xs text-neutral-400 font-rajdhani mb-6">
          Total Combat Damage Dealt: <strong className="text-white font-mono">{damageDealt} HP</strong>
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-2.5">
          {isVictory && hasNextLevel && (
            <button
              onClick={() => {
                soundEngine.playClick();
                onNextLevel();
              }}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-chakra font-bold text-base uppercase tracking-wider shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 transition active:scale-95"
            >
              <span>Next Mission: Level {(levelNumber || 1) + 1}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          )}

          <button
            onClick={() => {
              soundEngine.playClick();
              onRetry();
            }}
            className="w-full py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-chakra font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 border border-neutral-700 transition active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Play Again</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playClick();
              onHome();
            }}
            className="w-full py-2.5 rounded-xl text-neutral-400 hover:text-white font-chakra font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition"
          >
            <Home className="w-4 h-4" />
            <span>Return to Lobby</span>
          </button>
        </div>
      </div>
    </div>
  );
};
