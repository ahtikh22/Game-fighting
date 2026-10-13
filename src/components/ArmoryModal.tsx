import React, { useState } from 'react';
import { Weapon } from '../types/game';
import { getUpgradeCost } from '../data/weapons';
import { soundEngine } from '../utils/audio';
import { Crosshair, Zap, ShieldAlert, Target, Sparkles, Flame, Eye, Coins, Check, ArrowUp, Volume2, X } from 'lucide-react';

interface Props {
  weapons: Weapon[];
  primaryWeapon: Weapon;
  onSelectPrimary: (weapon: Weapon) => void;
  onUpgradeWeapon: (weaponId: string) => boolean;
  onUnlockWeapon: (weaponId: string) => boolean;
  coins: number;
  onClose: () => void;
}

export const ArmoryModal: React.FC<Props> = ({
  weapons,
  primaryWeapon,
  onSelectPrimary,
  onUpgradeWeapon,
  onUnlockWeapon,
  coins,
  onClose,
}) => {
  const [selectedWeaponId, setSelectedWeaponId] = useState<string>(primaryWeapon.id);

  const selected = weapons.find((w) => w.id === selectedWeaponId) || weapons[0];
  const upgradeCost = getUpgradeCost(selected);
  const isMaxLevel = selected.level >= selected.maxLevel;

  const getWeaponIcon = (name: string) => {
    switch (name) {
      case 'Flame': return <Flame className="w-5 h-5 text-orange-400" />;
      case 'Zap': return <Zap className="w-5 h-5 text-red-400" />;
      case 'Target': return <Target className="w-5 h-5 text-purple-400" />;
      case 'Eye': return <Eye className="w-5 h-5 text-emerald-400" />;
      case 'Sparkles': return <Sparkles className="w-5 h-5 text-rose-400" />;
      case 'ShieldAlert': return <ShieldAlert className="w-5 h-5 text-yellow-400" />;
      default: return <Crosshair className="w-5 h-5 text-cyan-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-neutral-900 border-2 border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-neutral-900 via-neutral-800 to-amber-950/40 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500 flex items-center justify-center text-orange-400 font-bold">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-chakra tracking-wider text-white uppercase">
                Weapon Armory & Upgrades
              </h2>
              <p className="text-xs text-neutral-400">
                Upgrade firepower, magazine capacity, and fire rate
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

        {/* Content */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          {/* Weapons List */}
          <div className="md:col-span-7 p-6 overflow-y-auto space-y-3 max-h-[500px]">
            {weapons.map((w) => {
              const isEquipped = primaryWeapon.id === w.id;
              const isSelected = selected.id === w.id;

              return (
                <div
                  key={w.id}
                  onClick={() => {
                    soundEngine.playClick();
                    setSelectedWeaponId(w.id);
                  }}
                  className={`p-4 rounded-xl border-2 transition cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'border-amber-400 bg-neutral-800 shadow-lg shadow-amber-500/10'
                      : 'border-neutral-800 bg-neutral-900/80 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center border shadow-inner"
                      style={{
                        backgroundColor: `${w.color}20`,
                        borderColor: w.color,
                      }}
                    >
                      {getWeaponIcon(w.iconName)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-chakra font-bold text-white text-base">
                          {w.name}
                        </h4>
                        <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
                          {w.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-neutral-400 mt-1 font-rajdhani">
                        <span>DMG: <strong className="text-white">{w.baseDamage}</strong></span>
                        <span>•</span>
                        <span>AMMO: <strong className="text-white">{w.capacity}</strong></span>
                        <span>•</span>
                        <span className="text-amber-400 font-bold">
                          LVL {w.level}/{w.maxLevel}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isEquipped ? (
                      <span className="flex items-center gap-1 text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2.5 py-1 rounded-full font-bold">
                        <Check className="w-3.5 h-3.5" /> EQUIPPED
                      </span>
                    ) : !w.unlocked ? (
                      <span className="text-xs text-neutral-400 bg-neutral-800 px-2.5 py-1 rounded-lg">
                        {w.cost.toLocaleString()} Coins
                      </span>
                    ) : (
                      <span className="text-xs text-neutral-400">Ready</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Weapon Details & Upgrade Stats */}
          <div className="md:col-span-5 bg-neutral-950 p-6 border-t md:border-t-0 md:border-l border-neutral-800 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-2xl font-bold font-chakra text-white">
                      {selected.name}
                    </h3>
                    <span className="text-xs uppercase px-2 py-0.5 rounded bg-neutral-800 text-amber-400 font-bold border border-neutral-700">
                      Tier {selected.level}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-1 uppercase tracking-wider font-rajdhani">
                    Classification: {selected.type} Rifle
                  </p>
                </div>

                <button
                  title="Test Fire Audio"
                  onClick={() => soundEngine.playGunshot(selected.type)}
                  className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-700 text-amber-400 hover:bg-neutral-800 transition"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>

              {/* Stat Bars */}
              <div className="space-y-4 mt-6 bg-neutral-900/60 p-4 rounded-xl border border-neutral-800">
                <div>
                  <div className="flex justify-between text-xs font-rajdhani font-bold mb-1">
                    <span className="text-neutral-400">Impact Damage</span>
                    <span className="text-white font-mono">{selected.baseDamage}</span>
                  </div>
                  <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-red-500 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, (selected.baseDamage / 150) * 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-rajdhani font-bold mb-1">
                    <span className="text-neutral-400">Fire Rate (Shots/Sec)</span>
                    <span className="text-white font-mono">{selected.fireRate}/s</span>
                  </div>
                  <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, (selected.fireRate / 15) * 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-rajdhani font-bold mb-1">
                    <span className="text-neutral-400">Magazine Clip</span>
                    <span className="text-white font-mono">{selected.capacity} Rounds</span>
                  </div>
                  <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-cyan-500 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, (selected.capacity / 80) * 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-rajdhani font-bold mb-1">
                    <span className="text-neutral-400">Reload Time</span>
                    <span className="text-white font-mono">{selected.reloadTime}s</span>
                  </div>
                  <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all"
                      style={{ width: `${Math.max(10, 100 - (selected.reloadTime / 3.5) * 80)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-rajdhani font-bold mb-1">
                    <span className="text-neutral-400">Headshot Lethality</span>
                    <span className="text-purple-400 font-mono">
                      x{selected.headshotMultiplier.toFixed(1)} DMG
                    </span>
                  </div>
                </div>
              </div>

              {/* Upgrade preview bonus */}
              {!isMaxLevel && selected.unlocked && (
                <div className="mt-4 p-3 bg-amber-950/20 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ArrowUp className="w-4 h-4 text-amber-400" />
                    <span>Next Level {selected.level + 1} Bonus:</span>
                  </div>
                  <span className="font-bold font-mono">+18% DMG, +15% Ammo</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-6 pt-4 border-t border-neutral-800 space-y-3">
              {/* Unlock Button if locked */}
              {!selected.unlocked ? (
                <button
                  onClick={() => {
                    soundEngine.playClick();
                    onUnlockWeapon(selected.id);
                  }}
                  disabled={coins < selected.cost}
                  className={`w-full py-3 rounded-xl font-chakra font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition active:scale-95 ${
                    coins >= selected.cost
                      ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20'
                      : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                  }`}
                >
                  <Coins className="w-4 h-4" />
                  <span>Unlock for {selected.cost.toLocaleString()} Coins</span>
                </button>
              ) : (
                <>
                  {/* Upgrade Button */}
                  <button
                    onClick={() => {
                      soundEngine.playClick();
                      onUpgradeWeapon(selected.id);
                    }}
                    disabled={isMaxLevel || coins < upgradeCost}
                    className={`w-full py-3 rounded-xl font-chakra font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition active:scale-95 ${
                      isMaxLevel
                        ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                        : coins >= upgradeCost
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold shadow-lg shadow-orange-500/20'
                        : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                    }`}
                  >
                    <ArrowUp className="w-4 h-4" />
                    <span>
                      {isMaxLevel
                        ? 'MAX LEVEL REACHED'
                        : `Upgrade to LVL ${selected.level + 1} (${upgradeCost} Coins)`}
                    </span>
                  </button>

                  {/* Equip as Primary */}
                  {primaryWeapon.id === selected.id ? (
                    <button
                      disabled
                      className="w-full py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 font-chakra font-semibold text-sm cursor-not-allowed"
                    >
                      Currently Equipped
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        soundEngine.playClick();
                        onSelectPrimary(selected);
                      }}
                      className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-chakra font-bold text-sm uppercase tracking-wider border border-neutral-700 transition"
                    >
                      Equip as Primary Gun
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
