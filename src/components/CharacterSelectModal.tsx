import React, { useState } from 'react';
import { Character } from '../types/game';
import { CHARACTERS } from '../data/characters';
import { soundEngine } from '../utils/audio';
import { Shield, Zap, Heart, Check, Lock, Coins, Sparkles, X } from 'lucide-react';

interface Props {
  selectedCharacter: Character;
  onSelectCharacter: (char: Character) => void;
  unlockedCharacterIds: string[];
  onUnlockCharacter: (char: Character) => boolean;
  coins: number;
  onClose: () => void;
}

export const CharacterSelectModal: React.FC<Props> = ({
  selectedCharacter,
  onSelectCharacter,
  unlockedCharacterIds,
  onUnlockCharacter,
  coins,
  onClose,
}) => {
  const [filter, setFilter] = useState<'all' | 'boy' | 'girl'>('all');
  const [activePreview, setActivePreview] = useState<Character>(selectedCharacter);

  const filtered = CHARACTERS.filter((c) => {
    if (filter === 'boy') return c.gender === 'boy';
    if (filter === 'girl') return c.gender === 'girl';
    return true;
  });

  const isUnlocked = (c: Character) => unlockedCharacterIds.includes(c.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-neutral-900 border-2 border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-neutral-900 via-neutral-800 to-amber-950/40 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500 flex items-center justify-center text-amber-400 font-bold">
              ★
            </div>
            <div>
              <h2 className="text-2xl font-bold font-chakra tracking-wider text-white uppercase">
                Survivors Roster
              </h2>
              <p className="text-xs text-neutral-400">
                Choose Boys & Girls with unique combat skills and agility
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-amber-950/60 border border-amber-500/40 px-3 py-1.5 rounded-lg text-amber-400 font-rajdhani font-bold text-lg">
              <Coins className="w-5 h-5 text-amber-400" />
              <span>{coins.toLocaleString()}</span>
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
        </div>

        {/* Filter Tabs */}
        <div className="px-6 py-3 bg-neutral-950 border-b border-neutral-800 flex items-center gap-2">
          {(['all', 'boy', 'girl'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                soundEngine.playClick();
                setFilter(tab);
              }}
              className={`px-4 py-1.5 rounded-lg text-sm font-rajdhani font-bold uppercase transition tracking-wider ${
                filter === tab
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              {tab === 'all' ? 'All Characters' : tab === 'boy' ? 'Boys (Commandos)' : 'Girls (Strikers)'}
            </button>
          ))}
        </div>

        {/* Body Split */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          {/* Character Grid */}
          <div className="md:col-span-7 p-6 overflow-y-auto grid grid-cols-2 gap-3 max-h-[500px]">
            {filtered.map((char) => {
              const unlocked = isUnlocked(char);
              const isSelected = selectedCharacter.id === char.id;
              const isPreview = activePreview.id === char.id;

              return (
                <div
                  key={char.id}
                  onClick={() => {
                    soundEngine.playClick();
                    setActivePreview(char);
                  }}
                  className={`cursor-pointer rounded-xl p-3 border-2 transition relative flex flex-col justify-between ${
                    isPreview
                      ? 'border-amber-400 bg-neutral-800 shadow-lg shadow-amber-500/10'
                      : 'border-neutral-800 bg-neutral-900/80 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                        char.gender === 'boy'
                          ? 'bg-blue-900/60 text-blue-300 border border-blue-600/40'
                          : 'bg-rose-900/60 text-rose-300 border border-rose-600/40'
                      }`}
                    >
                      {char.gender === 'boy' ? 'BOY' : 'GIRL'}
                    </span>
                    {isSelected ? (
                      <span className="flex items-center gap-1 text-[11px] bg-green-500 text-black px-2 py-0.5 rounded-full font-bold">
                        <Check className="w-3 h-3" /> EQUIPPED
                      </span>
                    ) : !unlocked ? (
                      <span className="flex items-center gap-1 text-[11px] text-neutral-400">
                        <Lock className="w-3 h-3 text-amber-500" /> {char.cost}
                      </span>
                    ) : null}
                  </div>

                  {/* Character Avatar Icon preview */}
                  <div className="my-3 flex items-center justify-center">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center relative shadow-inner border-2"
                      style={{
                        backgroundColor: char.bodyColor,
                        borderColor: char.accentColor,
                      }}
                    >
                      <div
                        className="w-8 h-8 rounded-full"
                        style={{ backgroundColor: char.hairColor }}
                      />
                      <div
                        className="absolute bottom-0 right-0 w-5 h-5 rounded-full border border-black flex items-center justify-center text-[10px] font-bold text-white"
                        style={{ backgroundColor: char.color }}
                      >
                        {char.name[0]}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-chakra font-bold text-white text-base leading-tight">
                      {char.name}
                    </h3>
                    <p className="text-xs text-amber-400/90 font-rajdhani">{char.title}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Character Details & Equip Panel */}
          <div className="md:col-span-5 bg-neutral-950 p-6 border-t md:border-t-0 md:border-l border-neutral-800 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center gap-3">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center border-2 shadow-lg"
                  style={{
                    backgroundColor: activePreview.bodyColor,
                    borderColor: activePreview.accentColor,
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-full"
                    style={{ backgroundColor: activePreview.hairColor }}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-2xl font-bold font-chakra text-white">
                      {activePreview.name}
                    </h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-bold uppercase ${
                        activePreview.gender === 'boy'
                          ? 'bg-blue-900/60 text-blue-300'
                          : 'bg-rose-900/60 text-rose-300'
                      }`}
                    >
                      {activePreview.gender}
                    </span>
                  </div>
                  <p className="text-sm text-amber-400 font-rajdhani font-semibold">
                    {activePreview.title}
                  </p>
                </div>
              </div>

              <p className="text-xs text-neutral-400 mt-3 leading-relaxed">
                {activePreview.description}
              </p>

              {/* Stats */}
              <div className="space-y-3 mt-5 bg-neutral-900/70 p-4 rounded-xl border border-neutral-800">
                <div>
                  <div className="flex justify-between text-xs font-rajdhani font-bold mb-1">
                    <span className="text-neutral-400 flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5 text-red-500" /> Max Health
                    </span>
                    <span className="text-white">{activePreview.maxHp} HP</span>
                  </div>
                  <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-red-500 h-full rounded-full"
                      style={{ width: `${(activePreview.maxHp / 130) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-rajdhani font-bold mb-1">
                    <span className="text-neutral-400 flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5 text-blue-500" /> Max Armor
                    </span>
                    <span className="text-white">{activePreview.maxArmor} AP</span>
                  </div>
                  <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-500 h-full rounded-full"
                      style={{ width: `${(activePreview.maxArmor / 100) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-rajdhani font-bold mb-1">
                    <span className="text-neutral-400 flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-amber-500" /> Sprint Velocity
                    </span>
                    <span className="text-white">{activePreview.speed} m/s</span>
                  </div>
                  <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full"
                      style={{ width: `${(activePreview.speed / 6.0) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Special Skill */}
              <div className="mt-4 p-4 rounded-xl bg-amber-950/20 border border-amber-500/30">
                <div className="flex items-center gap-2 text-amber-400 font-chakra font-bold text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>SPECIAL SKILL: {activePreview.skillName}</span>
                </div>
                <p className="text-xs text-neutral-300 mt-1">
                  {activePreview.skillDescription}
                </p>
                <div className="mt-2 text-[11px] text-amber-400/80 font-rajdhani font-bold">
                  Cooldown: {activePreview.skillCooldown}s | Duration: {activePreview.skillDuration}s
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="mt-6 pt-4 border-t border-neutral-800">
              {selectedCharacter.id === activePreview.id ? (
                <button
                  disabled
                  className="w-full py-3 rounded-xl bg-neutral-800 text-neutral-400 font-chakra font-bold uppercase tracking-wider cursor-not-allowed"
                >
                  Already Equipped
                </button>
              ) : isUnlocked(activePreview) ? (
                <button
                  onClick={() => {
                    soundEngine.playClick();
                    onSelectCharacter(activePreview);
                  }}
                  className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-chakra font-bold uppercase tracking-wider shadow-lg shadow-amber-500/20 transition active:scale-95"
                >
                  Equip Character
                </button>
              ) : (
                <button
                  onClick={() => {
                    soundEngine.playClick();
                    const success = onUnlockCharacter(activePreview);
                    if (success) {
                      onSelectCharacter(activePreview);
                    }
                  }}
                  disabled={coins < activePreview.cost}
                  className={`w-full py-3 rounded-xl font-chakra font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition active:scale-95 ${
                    coins >= activePreview.cost
                      ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20'
                      : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                  }`}
                >
                  <Lock className="w-4 h-4" />
                  <span>Unlock for {activePreview.cost.toLocaleString()} Coins</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
