import React from 'react';
import { CampaignLevel } from '../types/game';
import { CAMPAIGN_LEVELS } from '../data/levels';
import { soundEngine } from '../utils/audio';
import { Skull, Trophy, Coins, Lock, Play, Flame, X, ShieldAlert } from 'lucide-react';

interface Props {
  maxUnlockedLevel: number;
  selectedLevel: number;
  onSelectLevel: (lvl: CampaignLevel) => void;
  onClose: () => void;
}

export const LevelSelectModal: React.FC<Props> = ({
  maxUnlockedLevel,
  selectedLevel,
  onSelectLevel,
  onClose,
}) => {
  const getDifficultyBadge = (diff: CampaignLevel['difficulty']) => {
    switch (diff) {
      case 'Easy':
        return <span className="text-xs bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-bold font-rajdhani">EASY</span>;
      case 'Medium':
        return <span className="text-xs bg-amber-950/80 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded font-bold font-rajdhani">MEDIUM</span>;
      case 'Hard':
        return <span className="text-xs bg-orange-950/80 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded font-bold font-rajdhani">HARD</span>;
      case 'Insane':
        return <span className="text-xs bg-red-950/80 text-red-400 border border-red-500/30 px-2 py-0.5 rounded font-bold font-rajdhani">INSANE</span>;
      case 'Nightmare':
        return <span className="text-xs bg-purple-950/80 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded font-bold font-rajdhani">NIGHTMARE</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-neutral-900 border-2 border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-neutral-900 via-neutral-800 to-amber-950/40 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500 flex items-center justify-center text-amber-400 font-bold">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-chakra tracking-wider text-white uppercase">
                Survival Operations
              </h2>
              <p className="text-xs text-neutral-400">
                10 escalating battle royale levels. Each level increases hostile count and enemy intelligence.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="p-2 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Level List Grid */}
        <div className="flex-1 p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          {CAMPAIGN_LEVELS.map((lvl) => {
            const isUnlocked = lvl.level <= maxUnlockedLevel;
            const isCurrent = lvl.level === selectedLevel;
            const isBossLevel = !!lvl.boss;

            return (
              <div
                key={lvl.level}
                onClick={() => {
                  if (isUnlocked) {
                    soundEngine.playClick();
                    onSelectLevel(lvl);
                  }
                }}
                className={`p-4 rounded-xl border-2 transition relative flex flex-col justify-between ${
                  !isUnlocked
                    ? 'border-neutral-800/80 bg-neutral-950/60 opacity-60 cursor-not-allowed'
                    : isCurrent
                    ? 'border-amber-400 bg-neutral-800/90 shadow-lg shadow-amber-500/10 cursor-pointer'
                    : 'border-neutral-800 bg-neutral-900/90 hover:border-neutral-700 cursor-pointer'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-chakra font-bold text-amber-400 text-lg">
                        STAGE {lvl.level}
                      </span>
                      {getDifficultyBadge(lvl.difficulty)}
                      {isBossLevel && (
                        <span className="flex items-center gap-1 text-[10px] bg-red-600/30 text-red-400 border border-red-500/50 px-1.5 py-0.5 rounded font-bold uppercase animate-pulse">
                          <Skull className="w-3 h-3 text-red-400" /> BOSS FIGHT
                        </span>
                      )}
                    </div>

                    {!isUnlocked ? (
                      <span className="flex items-center gap-1 text-xs text-neutral-400 bg-neutral-900 px-2 py-1 rounded">
                        <Lock className="w-3.5 h-3.5 text-neutral-500" /> Locked
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-emerald-400">UNLOCKED</span>
                    )}
                  </div>

                  <h3 className="font-chakra font-bold text-white text-base">
                    {lvl.title}
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1 line-clamp-2">
                    {lvl.description}
                  </p>

                  {lvl.boss && (
                    <div className="mt-2 text-xs bg-red-950/40 border border-red-900/60 rounded p-2 text-red-300 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-red-400 flex-shrink-0" />
                      <span>
                        Target: <strong>{lvl.boss.name}</strong> ({lvl.boss.hp} HP + {lvl.boss.armor} Armor)
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs font-rajdhani text-neutral-400">
                    <span>Enemies: <strong className="text-white">{lvl.enemyCount}</strong></span>
                    <span className="flex items-center gap-1 text-amber-400 font-bold">
                      <Coins className="w-3.5 h-3.5" /> +{lvl.rewardCoins}
                    </span>
                  </div>

                  {isUnlocked && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        soundEngine.playClick();
                        onSelectLevel(lvl);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-chakra font-bold text-xs uppercase tracking-wider flex items-center gap-1 transition"
                    >
                      <Play className="w-3 h-3 fill-black" /> Deploy
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
