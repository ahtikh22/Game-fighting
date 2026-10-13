import React from 'react';
import { Character, Weapon, KillEvent, SafeZone, GameMap } from '../types/game';
import { Shield, Heart, Zap, Crosshair, Skull, RotateCcw, Volume2, VolumeX, ShieldAlert, Sparkles, Navigation } from 'lucide-react';

interface Props {
  playerHp: number;
  maxHp: number;
  playerArmor: number;
  maxArmor: number;
  character: Character;
  weapon: Weapon;
  secondaryWeapon?: Weapon;
  onSwitchWeapon: () => void;
  onReload: () => void;
  onUseMedkit: () => void;
  medkitCount: number;
  isMedkitChanneling: boolean;
  medkitChannelProgress: number;
  onPlaceGlooWall: () => void;
  glooWallCount: number;
  onTriggerSkill: () => void;
  skillCooldownRemaining: number;
  skillActive: boolean;
  skillDurationRemaining: number;
  aliveCount: number;
  totalEntities: number;
  playerKills: number;
  killEvents: KillEvent[];
  safeZone: SafeZone | null;
  currentMap: GameMap;
  playerX: number;
  playerY: number;
  playerAngle: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  isTouchDevice: boolean;
  onFireTouchStart?: () => void;
  onFireTouchEnd?: () => void;
  levelTitle?: string;
}

export const HUD: React.FC<Props> = ({
  playerHp,
  maxHp,
  playerArmor,
  maxArmor,
  character,
  weapon,
  secondaryWeapon,
  onSwitchWeapon,
  onReload,
  onUseMedkit,
  medkitCount,
  isMedkitChanneling,
  medkitChannelProgress,
  onPlaceGlooWall,
  glooWallCount,
  onTriggerSkill,
  skillCooldownRemaining,
  skillActive,
  skillDurationRemaining,
  aliveCount,
  totalEntities,
  playerKills,
  killEvents,
  safeZone,
  currentMap,
  playerX,
  playerY,
  playerAngle,
  soundEnabled,
  onToggleSound,
  isTouchDevice,
  onFireTouchStart,
  onFireTouchEnd,
  levelTitle,
}) => {
  const hpPercent = Math.max(0, Math.min(100, (playerHp / maxHp) * 100));
  const armorPercent = Math.max(0, Math.min(100, (playerArmor / (maxArmor || 100)) * 100));

  // Calculate minimap scaling (2400x2400 mapped to 120x120 canvas)
  const mapScale = 120 / currentMap.width;

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-20 flex flex-col justify-between p-3 md:p-6 font-rajdhani">
      {/* TOP BAR */}
      <div className="flex items-start justify-between w-full">
        {/* Left: Minimap & Level Title */}
        <div className="flex items-start gap-3">
          <div className="relative w-28 h-28 md:w-36 md:h-36 rounded-2xl bg-neutral-950/80 border-2 border-neutral-700/80 backdrop-blur-md shadow-2xl overflow-hidden pointer-events-auto">
            {/* Minimap rendering */}
            <div className="relative w-full h-full">
              {/* House outlines on minimap */}
              {currentMap.houses.map((h) => (
                <div
                  key={h.id}
                  className="absolute bg-neutral-600/70 border border-neutral-400/50"
                  style={{
                    left: `${(h.x / currentMap.width) * 100}%`,
                    top: `${(h.y / currentMap.height) * 100}%`,
                    width: `${(h.width / currentMap.width) * 100}%`,
                    height: `${(h.height / currentMap.height) * 100}%`,
                  }}
                />
              ))}

              {/* Safe zone circle on minimap */}
              {safeZone && (
                <div
                  className="absolute rounded-full border border-cyan-400 bg-cyan-400/10 pointer-events-none"
                  style={{
                    left: `${((safeZone.x - safeZone.currentRadius) / currentMap.width) * 100}%`,
                    top: `${((safeZone.y - safeZone.currentRadius) / currentMap.height) * 100}%`,
                    width: `${((safeZone.currentRadius * 2) / currentMap.width) * 100}%`,
                    height: `${((safeZone.currentRadius * 2) / currentMap.height) * 100}%`,
                  }}
                />
              )}

              {/* Player marker arrow */}
              <div
                className="absolute w-3.5 h-3.5 -ml-1.5 -mt-1.5 flex items-center justify-center pointer-events-none"
                style={{
                  left: `${(playerX / currentMap.width) * 100}%`,
                  top: `${(playerY / currentMap.height) * 100}%`,
                  transform: `rotate(${playerAngle + Math.PI / 2}rad)`,
                }}
              >
                <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[9px] border-b-amber-400 drop-shadow" />
              </div>
            </div>

            <div className="absolute bottom-1 right-2 text-[10px] text-neutral-400 font-bold uppercase tracking-wider bg-black/60 px-1 rounded">
              {currentMap.name}
            </div>
          </div>

          {/* Level Info */}
          {levelTitle && (
            <div className="hidden sm:flex flex-col bg-neutral-900/80 border border-neutral-800 px-3 py-1.5 rounded-xl backdrop-blur-md">
              <span className="text-[10px] text-amber-400 uppercase font-bold tracking-wider">
                Active Mission
              </span>
              <span className="text-sm font-chakra font-bold text-white leading-tight">
                {levelTitle}
              </span>
            </div>
          )}
        </div>

        {/* Center: Alive & Kills Counter */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 bg-neutral-950/90 border-2 border-neutral-800 px-4 py-1.5 rounded-2xl backdrop-blur-md shadow-2xl">
            {/* Alive count */}
            <div className="flex items-center gap-1.5 text-white pr-3 border-r border-neutral-800">
              <div className="w-6 h-6 rounded-lg bg-red-600/20 text-red-400 flex items-center justify-center">
                <Skull className="w-4 h-4" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[9px] text-neutral-400 uppercase font-bold tracking-wider">Alive</span>
                <span className="text-base font-chakra font-bold leading-none text-white">
                  {aliveCount} <span className="text-xs text-neutral-500 font-normal">/ {totalEntities}</span>
                </span>
              </div>
            </div>

            {/* Kills count */}
            <div className="flex items-center gap-1.5 text-white pl-2">
              <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Crosshair className="w-4 h-4" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[9px] text-neutral-400 uppercase font-bold tracking-wider">Kills</span>
                <span className="text-base font-chakra font-bold leading-none text-amber-400">
                  {playerKills}
                </span>
              </div>
            </div>
          </div>

          {/* Safe zone warning banner */}
          {safeZone && safeZone.isShrinking && (
            <div className="mt-1.5 bg-red-600/90 text-white text-[11px] font-chakra font-bold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-lg animate-pulse flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" />
              <span>Safe Zone Shrinking!</span>
            </div>
          )}
        </div>

        {/* Right: Sound & Kill Feed */}
        <div className="flex flex-col items-end gap-2 max-w-[240px]">
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={onToggleSound}
              className="p-2 rounded-xl bg-neutral-900/80 border border-neutral-800 text-neutral-300 hover:text-white backdrop-blur-md transition"
              title="Toggle Audio"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-neutral-500" />}
            </button>
          </div>

          {/* Kill Feed Ticker */}
          <div className="space-y-1 w-full flex flex-col items-end">
            {killEvents.slice(-4).map((k) => (
              <div
                key={k.id}
                className={`text-[11px] px-2.5 py-1 rounded-lg backdrop-blur-md border animate-in slide-in-from-right duration-200 flex items-center gap-1.5 ${
                  k.isPlayerKiller
                    ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 font-bold'
                    : 'bg-neutral-900/70 border-neutral-800/80 text-neutral-300'
                }`}
              >
                <span className={k.isPlayerKiller ? 'text-amber-400' : 'text-neutral-200'}>
                  {k.killerName}
                </span>
                <span className="text-[10px] text-neutral-400 uppercase px-1 rounded bg-black/40">
                  {k.weaponName}
                </span>
                {k.isHeadshot && (
                  <span className="text-red-400 text-[10px] font-bold">⚡ HEADSHOT</span>
                )}
                <span className="text-neutral-400">» {k.victimName}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BOTTOM BAR: Player Status & Weapons & Actions */}
      <div className="flex items-end justify-between w-full pointer-events-auto">
        {/* Left Actions: Medkit & Gloo Wall */}
        <div className="flex items-center gap-2.5 mb-1">
          {/* Medkit Action */}
          <button
            onClick={onUseMedkit}
            disabled={medkitCount <= 0 || playerHp >= maxHp || isMedkitChanneling}
            className={`relative p-3 rounded-2xl border-2 flex flex-col items-center justify-center transition active:scale-95 ${
              medkitCount > 0 && playerHp < maxHp
                ? 'bg-neutral-900/90 border-emerald-500 text-emerald-400 hover:bg-emerald-950/40 shadow-lg shadow-emerald-500/10'
                : 'bg-neutral-950/70 border-neutral-800 text-neutral-600 cursor-not-allowed'
            }`}
          >
            {isMedkitChanneling && (
              <div
                className="absolute inset-0 bg-emerald-500/30 rounded-2xl overflow-hidden pointer-events-none"
                style={{
                  clipPath: `inset(${100 - medkitChannelProgress * 100}% 0 0 0)`,
                }}
              />
            )}
            <Heart className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-bold font-chakra mt-0.5">
              {isMedkitChanneling ? `${Math.round(medkitChannelProgress * 100)}%` : `[F] MED (${medkitCount})`}
            </span>
          </button>

          {/* Gloo Wall Action */}
          <button
            onClick={onPlaceGlooWall}
            disabled={glooWallCount <= 0}
            className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center transition active:scale-95 ${
              glooWallCount > 0
                ? 'bg-neutral-900/90 border-cyan-500 text-cyan-400 hover:bg-cyan-950/40 shadow-lg shadow-cyan-500/10'
                : 'bg-neutral-950/70 border-neutral-800 text-neutral-600 cursor-not-allowed'
            }`}
          >
            <Shield className="w-5 h-5 text-cyan-400" />
            <span className="text-xs font-bold font-chakra mt-0.5">
              [E] GLOO ({glooWallCount})
            </span>
          </button>

          {/* Active Skill */}
          <button
            onClick={onTriggerSkill}
            disabled={skillCooldownRemaining > 0 || skillActive}
            className={`relative p-3 rounded-2xl border-2 flex flex-col items-center justify-center transition active:scale-95 ${
              skillActive
                ? 'bg-amber-500/30 border-amber-400 text-amber-300 animate-pulse'
                : skillCooldownRemaining <= 0
                ? 'bg-neutral-900/90 border-amber-500 text-amber-400 hover:bg-amber-950/40 shadow-lg shadow-amber-500/10'
                : 'bg-neutral-950/70 border-neutral-800 text-neutral-600 cursor-not-allowed'
            }`}
          >
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span className="text-xs font-bold font-chakra mt-0.5">
              {skillActive
                ? `${skillDurationRemaining.toFixed(1)}s`
                : skillCooldownRemaining > 0
                ? `${Math.ceil(skillCooldownRemaining)}s`
                : '[Q] SKILL'}
            </span>
          </button>
        </div>

        {/* Center: Health & Armor & Character info */}
        <div className="flex flex-col items-center w-full max-w-xs md:max-w-md mx-2">
          {/* Character Tag */}
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs text-neutral-400 font-bold uppercase tracking-wider">
              {character.name} ({character.gender === 'boy' ? 'Boy' : 'Girl'})
            </span>
            <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/30 font-bold">
              {character.skillName}
            </span>
          </div>

          {/* Armor Bar */}
          <div className="w-full bg-neutral-950/80 border border-blue-900/60 rounded-lg p-1 mb-1">
            <div className="flex justify-between items-center text-[10px] text-blue-300 font-bold px-1 mb-0.5">
              <span className="flex items-center gap-1">
                <Shield className="w-3 h-3 text-blue-400" /> VEST ARMOR
              </span>
              <span>{Math.round(playerArmor)} / {maxArmor}</span>
            </div>
            <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden">
              <div
                className="bg-blue-500 h-full rounded-full transition-all duration-150"
                style={{ width: `${armorPercent}%` }}
              />
            </div>
          </div>

          {/* Health Bar */}
          <div className="w-full bg-neutral-950/80 border border-red-950 rounded-lg p-1">
            <div className="flex justify-between items-center text-[11px] text-red-300 font-bold px-1 mb-0.5">
              <span className="flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" /> HEALTH (HP)
              </span>
              <span className="font-mono text-white text-xs">{Math.round(playerHp)} / {maxHp}</span>
            </div>
            <div className="w-full bg-neutral-900 h-3 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-150 ${
                  hpPercent > 40 ? 'bg-gradient-to-r from-red-600 to-emerald-500' : 'bg-red-600 animate-pulse'
                }`}
                style={{ width: `${hpPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right: Weapon & Ammo Card */}
        <div className="flex items-center gap-2 mb-1">
          {/* Weapon Slot */}
          <div
            onClick={onSwitchWeapon}
            className="p-3.5 rounded-2xl bg-neutral-900/90 border-2 border-amber-500/80 backdrop-blur-md shadow-2xl flex flex-col items-end cursor-pointer hover:border-amber-400 transition"
          >
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.2 rounded font-bold uppercase">
                Tier {weapon.level}
              </span>
              <span className="text-sm font-chakra font-bold text-white uppercase">
                {weapon.name}
              </span>
            </div>

            {/* Ammo Count */}
            <div className="flex items-baseline gap-1 mt-1 font-chakra">
              <span className="text-3xl font-extrabold text-amber-400 leading-none">
                {weapon.currentAmmo}
              </span>
              <span className="text-sm font-bold text-neutral-400">
                / {weapon.reserveAmmo}
              </span>
            </div>

            <span className="text-[10px] text-neutral-400 uppercase tracking-wider mt-0.5 font-bold">
              {secondaryWeapon ? 'Click to swap [1/2]' : 'Main Gun'}
            </span>
          </div>

          {/* Reload Button */}
          <button
            onClick={onReload}
            disabled={weapon.currentAmmo === weapon.capacity || weapon.reserveAmmo <= 0}
            className="p-3.5 rounded-2xl bg-neutral-900/90 border-2 border-neutral-700 text-white hover:border-amber-500 hover:text-amber-400 transition flex flex-col items-center justify-center active:scale-95 shadow-xl"
            title="Reload [R]"
          >
            <RotateCcw className="w-5 h-5" />
            <span className="text-[10px] font-chakra font-bold mt-1 uppercase">
              [R] Reload
            </span>
          </button>
        </div>
      </div>

      {/* MOBILE TOUCH CONTROLS (If touch screen detected) */}
      {isTouchDevice && (
        <div className="fixed bottom-24 right-8 pointer-events-auto flex items-center gap-4">
          <button
            onTouchStart={onFireTouchStart}
            onTouchEnd={onFireTouchEnd}
            className="w-20 h-20 rounded-full bg-red-600/80 border-4 border-red-400 active:scale-95 flex items-center justify-center shadow-2xl active:bg-red-500 text-white font-chakra font-bold"
          >
            FIRE
          </button>
        </div>
      )}
    </div>
  );
};
