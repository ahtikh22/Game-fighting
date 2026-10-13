import React, { useState, useEffect } from 'react';
import {
  Character,
  Weapon,
  GameMap,
  CampaignLevel,
  GameMode,
  KillEvent,
  SafeZone,
} from './types/game';
import { CHARACTERS } from './data/characters';
import { INITIAL_WEAPONS, getUpgradedWeapon, getUpgradeCost } from './data/weapons';
import { MAPS } from './data/maps';
import { CAMPAIGN_LEVELS } from './data/levels';
import { soundEngine } from './utils/audio';

import { GameCanvas } from './components/GameCanvas';
import { ThreeGameCanvas } from './components/ThreeGameCanvas';
import { HUD } from './components/HUD';
import { CharacterSelectModal } from './components/CharacterSelectModal';
import { ArmoryModal } from './components/ArmoryModal';
import { LevelSelectModal } from './components/LevelSelectModal';
import { MultiplayerModal } from './components/MultiplayerModal';
import { BooyahModal } from './components/BooyahModal';

import {
  Flame,
  Users,
  Trophy,
  Volume2,
  VolumeX,
  Play,
  HelpCircle,
  Coins,
  Shield,
  Zap,
  Target,
  Sparkles,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

export default function App() {
  // Persistent state with localStorage
  const [coins, setCoins] = useState<number>(() => {
    const saved = localStorage.getItem('ff_coins');
    return saved ? parseInt(saved, 10) : 1500;
  });

  const [unlockedCharacterIds, setUnlockedCharacterIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('ff_unlocked_chars');
    return saved ? JSON.parse(saved) : ['hayato', 'kelly', 'alok', 'moco'];
  });

  const [selectedCharacterId, setSelectedCharacterId] = useState<string>(() => {
    return localStorage.getItem('ff_selected_char') || 'hayato';
  });

  const [weapons, setWeapons] = useState<Weapon[]>(() => {
    const saved = localStorage.getItem('ff_weapons');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_WEAPONS;
      }
    }
    return INITIAL_WEAPONS;
  });

  const [primaryWeaponId, setPrimaryWeaponId] = useState<string>(() => {
    return localStorage.getItem('ff_primary_weapon') || 'ak47';
  });

  const [maxUnlockedLevel, setMaxUnlockedLevel] = useState<number>(() => {
    const saved = localStorage.getItem('ff_max_level');
    return saved ? parseInt(saved, 10) : 1;
  });

  const [activeLevelNumber, setActiveLevelNumber] = useState<number>(1);
  const [gameMode, setGameMode] = useState<GameMode>('campaign');
  const [selectedMapId, setSelectedMapId] = useState<string>('bermuda');

  // UI state
  const [inGame, setInGame] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showCharacterModal, setShowCharacterModal] = useState<boolean>(false);
  const [showArmoryModal, setShowArmoryModal] = useState<boolean>(false);
  const [showLevelModal, setShowLevelModal] = useState<boolean>(false);
  const [showMultiplayerModal, setShowMultiplayerModal] = useState<boolean>(false);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);

  // In-Game HUD & Triggers
  const [playerStats, setPlayerStats] = useState<{
    hp: number;
    maxHp: number;
    armor: number;
    maxArmor: number;
    weapon: Weapon;
    aliveCount: number;
    totalEntities: number;
    kills: number;
    killEvents: KillEvent[];
    safeZone: SafeZone | null;
    playerX: number;
    playerY: number;
    playerAngle: number;
    medkitCount: number;
    isMedkitChanneling: boolean;
    medkitChannelProgress: number;
    glooWallCount: number;
    skillCooldownRemaining: number;
    skillActive: boolean;
    skillDurationRemaining: number;
  } | null>(null);

  const [triggerReload, setTriggerReload] = useState(false);
  const [triggerMedkit, setTriggerMedkit] = useState(false);
  const [triggerGlooWall, setTriggerGlooWall] = useState(false);
  const [triggerSkill, setTriggerSkill] = useState(false);
  const [isFiringTouch, setIsFiringTouch] = useState(false);

  // Game Over Results
  const [matchResult, setMatchResult] = useState<{
    isVictory: boolean;
    rank: number;
    totalPlayers: number;
    kills: number;
    headshots: number;
    damageDealt: number;
    coinsEarned: number;
  } | null>(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('ff_coins', coins.toString());
  }, [coins]);

  useEffect(() => {
    localStorage.setItem('ff_unlocked_chars', JSON.stringify(unlockedCharacterIds));
  }, [unlockedCharacterIds]);

  useEffect(() => {
    localStorage.setItem('ff_selected_char', selectedCharacterId);
  }, [selectedCharacterId]);

  useEffect(() => {
    localStorage.setItem('ff_weapons', JSON.stringify(weapons));
  }, [weapons]);

  useEffect(() => {
    localStorage.setItem('ff_primary_weapon', primaryWeaponId);
  }, [primaryWeaponId]);

  useEffect(() => {
    localStorage.setItem('ff_max_level', maxUnlockedLevel.toString());
  }, [maxUnlockedLevel]);

  // Derived objects
  const selectedCharacter =
    CHARACTERS.find((c) => c.id === selectedCharacterId) || CHARACTERS[0];
  const primaryWeapon =
    weapons.find((w) => w.id === primaryWeaponId) || weapons[0];
  const currentMap =
    MAPS.find((m) => m.id === selectedMapId) || MAPS[0];
  const currentLevel =
    CAMPAIGN_LEVELS.find((l) => l.level === activeLevelNumber) || CAMPAIGN_LEVELS[0];

  // Weapon Upgrade Handler
  const handleUpgradeWeapon = (weaponId: string): boolean => {
    const targetWeapon = weapons.find((w) => w.id === weaponId);
    if (!targetWeapon || targetWeapon.level >= targetWeapon.maxLevel) return false;

    const cost = getUpgradeCost(targetWeapon);
    if (coins < cost) return false;

    setCoins((prev) => prev - cost);
    const upgraded = getUpgradedWeapon(targetWeapon, targetWeapon.level + 1);
    setWeapons((prev) => prev.map((w) => (w.id === weaponId ? upgraded : w)));
    return true;
  };

  // Weapon Unlock Handler
  const handleUnlockWeapon = (weaponId: string): boolean => {
    const targetWeapon = weapons.find((w) => w.id === weaponId);
    if (!targetWeapon || targetWeapon.unlocked) return false;

    if (coins < targetWeapon.cost) return false;

    setCoins((prev) => prev - targetWeapon.cost);
    setWeapons((prev) =>
      prev.map((w) => (w.id === weaponId ? { ...w, unlocked: true } : w))
    );
    return true;
  };

  // Character Unlock Handler
  const handleUnlockCharacter = (char: Character): boolean => {
    if (unlockedCharacterIds.includes(char.id)) return true;
    if (coins < char.cost) return false;

    setCoins((prev) => prev - char.cost);
    setUnlockedCharacterIds((prev) => [...prev, char.id]);
    return true;
  };

  // Launch Game
  const handleStartGame = (mode: GameMode = 'campaign', mapId?: string) => {
    soundEngine.playClick();
    setGameMode(mode);
    if (mapId) setSelectedMapId(mapId);
    setMatchResult(null);
    setInGame(true);
  };

  // Match Complete Handler
  const handleGameOver = (result: {
    isVictory: boolean;
    rank: number;
    totalPlayers: number;
    kills: number;
    headshots: number;
    damageDealt: number;
    coinsEarned: number;
  }) => {
    setMatchResult(result);
    setCoins((prev) => prev + result.coinsEarned);

    if (result.isVictory && gameMode === 'campaign') {
      if (activeLevelNumber >= maxUnlockedLevel && maxUnlockedLevel < 10) {
        setMaxUnlockedLevel((prev) => Math.min(10, prev + 1));
      }
    }
  };

  const [renderEngine, setRenderEngine] = useState<'3d' | '2d'>('3d');

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-neutral-950 text-white font-rajdhani select-none">
      {/* ============================================================ */}
      {/* IN-GAME VIEW */}
      {/* ============================================================ */}
      {inGame ? (
        <div className="relative w-full h-full">
          {renderEngine === '3d' ? (
            <ThreeGameCanvas
              character={selectedCharacter}
              primaryWeapon={primaryWeapon}
              secondaryWeapon={weapons.find((w) => w.id !== primaryWeapon.id)}
              currentMap={currentMap}
              levelConfig={gameMode === 'campaign' ? currentLevel : undefined}
              gameMode={gameMode}
              onGameOver={handleGameOver}
              onUpdateStats={setPlayerStats}
              triggerReload={triggerReload}
              onReloadComplete={() => setTriggerReload(false)}
              triggerMedkit={triggerMedkit}
              onMedkitComplete={() => setTriggerMedkit(false)}
              triggerGlooWall={triggerGlooWall}
              onGlooWallComplete={() => setTriggerGlooWall(false)}
              triggerSkill={triggerSkill}
              onSkillComplete={() => setTriggerSkill(false)}
              soundEnabled={soundEnabled}
              isFiringFromTouch={isFiringTouch}
            />
          ) : (
            <GameCanvas
              character={selectedCharacter}
              primaryWeapon={primaryWeapon}
              secondaryWeapon={weapons.find((w) => w.id !== primaryWeapon.id)}
              currentMap={currentMap}
              levelConfig={gameMode === 'campaign' ? currentLevel : undefined}
              gameMode={gameMode}
              onGameOver={handleGameOver}
              onUpdateStats={setPlayerStats}
              triggerReload={triggerReload}
              onReloadComplete={() => setTriggerReload(false)}
              triggerMedkit={triggerMedkit}
              onMedkitComplete={() => setTriggerMedkit(false)}
              triggerGlooWall={triggerGlooWall}
              onGlooWallComplete={() => setTriggerGlooWall(false)}
              triggerSkill={triggerSkill}
              onSkillComplete={() => setTriggerSkill(false)}
              soundEnabled={soundEnabled}
              isFiringFromTouch={isFiringTouch}
            />
          )}

          {playerStats && (
            <HUD
              playerHp={playerStats.hp}
              maxHp={playerStats.maxHp}
              playerArmor={playerStats.armor}
              maxArmor={playerStats.maxArmor}
              character={selectedCharacter}
              weapon={playerStats.weapon}
              onSwitchWeapon={() => {}}
              onReload={() => setTriggerReload(true)}
              onUseMedkit={() => setTriggerMedkit(true)}
              medkitCount={playerStats.medkitCount}
              isMedkitChanneling={playerStats.isMedkitChanneling}
              medkitChannelProgress={playerStats.medkitChannelProgress}
              onPlaceGlooWall={() => setTriggerGlooWall(true)}
              glooWallCount={playerStats.glooWallCount}
              onTriggerSkill={() => setTriggerSkill(true)}
              skillCooldownRemaining={playerStats.skillCooldownRemaining}
              skillActive={playerStats.skillActive}
              skillDurationRemaining={playerStats.skillDurationRemaining}
              aliveCount={playerStats.aliveCount}
              totalEntities={playerStats.totalEntities}
              playerKills={playerStats.kills}
              killEvents={playerStats.killEvents}
              safeZone={playerStats.safeZone}
              currentMap={currentMap}
              playerX={playerStats.playerX}
              playerY={playerStats.playerY}
              playerAngle={playerStats.playerAngle}
              soundEnabled={soundEnabled}
              onToggleSound={() => setSoundEnabled(!soundEnabled)}
              isTouchDevice={false}
              onFireTouchStart={() => setIsFiringTouch(true)}
              onFireTouchEnd={() => setIsFiringTouch(false)}
              levelTitle={
                gameMode === 'campaign'
                  ? currentLevel.title
                  : gameMode === 'battle_royale'
                  ? 'BATTLE ROYALE ARENA'
                  : '4v4 SQUAD CLASH'
              }
            />
          )}

          {/* Victory / Defeat Modal */}
          {matchResult && (
            <BooyahModal
              isVictory={matchResult.isVictory}
              rank={matchResult.rank}
              totalPlayers={matchResult.totalPlayers}
              kills={matchResult.kills}
              headshots={matchResult.headshots}
              damageDealt={matchResult.damageDealt}
              coinsEarned={matchResult.coinsEarned}
              levelNumber={gameMode === 'campaign' ? activeLevelNumber : undefined}
              hasNextLevel={gameMode === 'campaign' && activeLevelNumber < 10}
              onNextLevel={() => {
                setActiveLevelNumber((prev) => Math.min(10, prev + 1));
                setMatchResult(null);
                handleStartGame('campaign');
              }}
              onRetry={() => {
                setMatchResult(null);
                handleStartGame(gameMode);
              }}
              onHome={() => {
                setMatchResult(null);
                setInGame(false);
              }}
            />
          )}
        </div>
      ) : (
        /* ============================================================ */
        /* MAIN MENU / LOBBY */
        /* ============================================================ */
        <div className="relative w-full h-full flex flex-col justify-between p-6 md:p-10 bg-radial from-neutral-900 via-neutral-950 to-black overflow-y-auto">
          {/* Ambient battle fire glow background */}
          <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-amber-500/15 via-orange-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-cyan-500/10 via-blue-600/5 to-transparent rounded-full blur-3xl pointer-events-none" />

          {/* TOP HEADER */}
          <div className="relative z-10 flex items-center justify-between">
            {/* Game Branding */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30 border border-amber-300">
                <Flame className="w-7 h-7 text-black fill-black" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-teko font-extrabold tracking-wider uppercase leading-none bg-gradient-to-r from-amber-400 via-yellow-200 to-orange-500 bg-clip-text text-transparent drop-shadow-md">
                  FREE FIRE: STRIKE ROYALE
                </h1>
                <p className="text-xs text-neutral-400 tracking-widest font-chakra uppercase">
                  Battle Royale Survival • Houses • Weapon Upgrades • Boys & Girls
                </p>
              </div>
            </div>

            {/* Battle Coins & Settings */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  soundEngine.playClick();
                  setRenderEngine(renderEngine === '3d' ? '2d' : '3d');
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-chakra font-bold uppercase tracking-wider border transition flex items-center gap-1.5 ${
                  renderEngine === '3d'
                    ? 'bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/20'
                    : 'bg-neutral-900 text-neutral-300 border-neutral-700 hover:text-white'
                }`}
              >
                <span>{renderEngine === '3d' ? '🎮 3D Third-Person View' : '🗺️ 2D Tactical View'}</span>
              </button>

              <div className="flex items-center gap-2 bg-neutral-900/90 border border-amber-500/40 px-4 py-2 rounded-xl text-amber-400 font-bold text-lg shadow-inner">
                <Coins className="w-5 h-5 text-amber-400" />
                <span className="font-mono">{coins.toLocaleString()}</span>
              </div>

              <button
                onClick={() => {
                  soundEngine.playClick();
                  setSoundEnabled(!soundEnabled);
                }}
                className="p-3 rounded-xl bg-neutral-900/90 border border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800 transition"
                title="Toggle Sound"
              >
                {soundEnabled ? <Volume2 className="w-5 h-5 text-amber-400" /> : <VolumeX className="w-5 h-5 text-neutral-500" />}
              </button>

              <button
                onClick={() => {
                  soundEngine.playClick();
                  setShowHelpModal(true);
                }}
                className="p-3 rounded-xl bg-neutral-900/90 border border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800 transition"
                title="Controls & Instructions"
              >
                <HelpCircle className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* CENTER DISPLAY: Hero Character & Loadout Card */}
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 my-auto items-center py-6">
            {/* Left: Survivor Presentation */}
            <div className="lg:col-span-7 flex flex-col md:flex-row items-center gap-8 bg-neutral-900/40 border border-neutral-800/80 backdrop-blur-xl p-6 md:p-8 rounded-3xl">
              {/* Character Avatar Stand */}
              <div className="relative flex flex-col items-center">
                <div
                  className="w-48 h-48 md:w-56 md:h-56 rounded-full flex items-center justify-center relative shadow-2xl border-4 transition-all"
                  style={{
                    backgroundColor: selectedCharacter.bodyColor,
                    borderColor: selectedCharacter.accentColor,
                    boxShadow: `0 0 40px ${selectedCharacter.color}40`,
                  }}
                >
                  {/* Hair & Face */}
                  <div
                    className="w-24 h-24 rounded-full relative"
                    style={{ backgroundColor: selectedCharacter.hairColor }}
                  >
                    {selectedCharacter.gender === 'girl' && (
                      <div
                        className="absolute -left-3 top-2 w-8 h-16 rounded-full"
                        style={{ backgroundColor: selectedCharacter.accentColor }}
                      />
                    )}
                  </div>

                  {/* Character Gender Badge */}
                  <div
                    className={`absolute bottom-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      selectedCharacter.gender === 'boy'
                        ? 'bg-blue-600 text-white'
                        : 'bg-pink-600 text-white'
                    }`}
                  >
                    {selectedCharacter.gender === 'boy' ? 'BOY COMMANDO' : 'GIRL STRIKER'}
                  </div>
                </div>

                <button
                  onClick={() => {
                    soundEngine.playClick();
                    setShowCharacterModal(true);
                  }}
                  className="mt-4 px-5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-chakra font-bold uppercase tracking-wider border border-neutral-700 flex items-center gap-2 transition"
                >
                  <Users className="w-4 h-4 text-amber-400" />
                  <span>Switch Character</span>
                </button>
              </div>

              {/* Character Info & Equipped Weapon */}
              <div className="flex-1 space-y-4 text-center md:text-left">
                <div>
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <span className="text-3xl font-chakra font-bold text-white">
                      {selectedCharacter.name}
                    </span>
                    <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/40 px-2 py-0.5 rounded font-bold uppercase">
                      Active
                    </span>
                  </div>
                  <p className="text-sm text-amber-400/90 font-semibold">
                    {selectedCharacter.title}
                  </p>
                  <p className="text-xs text-neutral-400 mt-1 max-w-sm">
                    {selectedCharacter.description}
                  </p>
                </div>

                {/* Skill badge */}
                <div className="p-3 bg-neutral-950/70 border border-neutral-800 rounded-xl">
                  <div className="flex items-center gap-2 text-xs font-chakra font-bold text-amber-400 uppercase">
                    <Sparkles className="w-4 h-4" />
                    <span>Skill: {selectedCharacter.skillName}</span>
                  </div>
                  <p className="text-xs text-neutral-300 mt-1">
                    {selectedCharacter.skillDescription}
                  </p>
                </div>

                {/* Equipped Weapon Preview */}
                <div className="p-3 bg-neutral-950/70 border border-neutral-800 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center">
                      <Flame className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs text-neutral-400 uppercase font-bold">
                        Equipped Gun
                      </div>
                      <div className="text-sm font-chakra font-bold text-white">
                        {primaryWeapon.name} (LVL {primaryWeapon.level})
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      soundEngine.playClick();
                      setShowArmoryModal(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-chakra font-bold uppercase text-amber-400 border border-neutral-700"
                  >
                    Armory
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Mode Launch Cards */}
            <div className="lg:col-span-5 space-y-4">
              {/* Campaign Level Mode Card */}
              <div
                onClick={() => {
                  soundEngine.playClick();
                  setShowLevelModal(true);
                }}
                className="p-5 rounded-3xl bg-neutral-900/60 hover:bg-neutral-800/80 border-2 border-amber-500/40 hover:border-amber-400 transition cursor-pointer group shadow-xl"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500 flex items-center justify-center text-amber-400">
                      <Trophy className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs text-amber-400 font-bold uppercase tracking-wider">
                        CAMPAIGN MISSIONS
                      </span>
                      <h3 className="text-xl font-chakra font-bold text-white group-hover:text-amber-300 transition">
                        Stage {activeLevelNumber}: {currentLevel.title}
                      </h3>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        {currentLevel.enemyCount} Hostile Survivors • {currentLevel.difficulty} Difficulty
                      </p>
                    </div>
                  </div>

                  <ChevronRight className="w-6 h-6 text-neutral-500 group-hover:text-amber-400 group-hover:translate-x-1 transition" />
                </div>
              </div>

              {/* Multiplayer Battle Royale Arena Card */}
              <div
                onClick={() => {
                  soundEngine.playClick();
                  setShowMultiplayerModal(true);
                }}
                className="p-5 rounded-3xl bg-neutral-900/60 hover:bg-neutral-800/80 border-2 border-cyan-500/40 hover:border-cyan-400 transition cursor-pointer group shadow-xl"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500 flex items-center justify-center text-cyan-400">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs text-cyan-400 font-bold uppercase tracking-wider">
                        MULTIPLAYER ROOM
                      </span>
                      <h3 className="text-xl font-chakra font-bold text-white group-hover:text-cyan-300 transition">
                        Online Battle Arena & 4v4 Squad
                      </h3>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        Custom room codes • 20 Survivors Battle Royale
                      </p>
                    </div>
                  </div>

                  <ChevronRight className="w-6 h-6 text-neutral-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition" />
                </div>
              </div>

              {/* Weapon Armory Quick Access */}
              <div
                onClick={() => {
                  soundEngine.playClick();
                  setShowArmoryModal(true);
                }}
                className="p-4 rounded-2xl bg-neutral-900/40 hover:bg-neutral-800/60 border border-neutral-800 hover:border-orange-500/60 transition cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Flame className="w-5 h-5 text-orange-400" />
                  <div>
                    <span className="text-sm font-chakra font-bold text-white">
                      Weapon Upgrades & Skins
                    </span>
                    <p className="text-xs text-neutral-400">
                      Upgrade AK47, MP40, AWM, Shotguns & Minigun
                    </p>
                  </div>
                </div>
                <span className="text-xs text-amber-400 font-bold uppercase">
                  Upgrade &raquo;
                </span>
              </div>
            </div>
          </div>

          {/* BOTTOM BAR: Big Start Button & Quick Actions */}
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-neutral-800/80">
            <div className="flex items-center gap-3 text-xs text-neutral-400">
              <span className="bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-lg">
                Controls: <strong>WASD</strong> to Move • <strong>Mouse</strong> to Aim & Fire • <strong>[R]</strong> Reload
              </span>
              <span className="hidden md:inline bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-lg">
                <strong>[E]</strong> Gloo Wall • <strong>[F]</strong> Medkit • <strong>[Q]</strong> Skill
              </span>
            </div>

            <button
              onClick={() => handleStartGame('campaign')}
              className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 hover:from-amber-400 hover:to-orange-500 text-black font-chakra font-extrabold text-xl uppercase tracking-wider shadow-2xl shadow-orange-500/30 flex items-center justify-center gap-3 transition active:scale-95 fire-glow"
            >
              <Play className="w-6 h-6 fill-black" />
              <span>START MISSION {activeLevelNumber}</span>
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODALS */}
      {/* ============================================================ */}
      {showCharacterModal && (
        <CharacterSelectModal
          selectedCharacter={selectedCharacter}
          onSelectCharacter={(c) => {
            setSelectedCharacterId(c.id);
            setShowCharacterModal(false);
          }}
          unlockedCharacterIds={unlockedCharacterIds}
          onUnlockCharacter={handleUnlockCharacter}
          coins={coins}
          onClose={() => setShowCharacterModal(false)}
        />
      )}

      {showArmoryModal && (
        <ArmoryModal
          weapons={weapons}
          primaryWeapon={primaryWeapon}
          onSelectPrimary={(w) => {
            setPrimaryWeaponId(w.id);
            setShowArmoryModal(false);
          }}
          onUpgradeWeapon={handleUpgradeWeapon}
          onUnlockWeapon={handleUnlockWeapon}
          coins={coins}
          onClose={() => setShowArmoryModal(false)}
        />
      )}

      {showLevelModal && (
        <LevelSelectModal
          maxUnlockedLevel={maxUnlockedLevel}
          selectedLevel={activeLevelNumber}
          onSelectLevel={(lvl) => {
            setActiveLevelNumber(lvl.level);
            setSelectedMapId(lvl.mapId);
            setShowLevelModal(false);
            handleStartGame('campaign');
          }}
          onClose={() => setShowLevelModal(false)}
        />
      )}

      {showMultiplayerModal && (
        <MultiplayerModal
          playerName={selectedCharacter.name}
          onStartMultiplayer={(mode, roomCode, mapId) => {
            setShowMultiplayerModal(false);
            handleStartGame(mode, mapId);
          }}
          onClose={() => setShowMultiplayerModal(false)}
        />
      )}

      {/* Help & Controls Modal (English & Urdu Guide) */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl bg-neutral-900 border-2 border-amber-500/40 rounded-2xl shadow-2xl p-6">
            <h3 className="text-2xl font-bold font-chakra text-amber-400 uppercase tracking-wider mb-2">
              Game Guide & Controls (گیم کھیلنے کا طریقہ)
            </h3>
            <p className="text-xs text-neutral-400 mb-4">
              Free Fire Style Battle Royale Survival Mechanics
            </p>

            <div className="space-y-3 text-sm text-neutral-300">
              <div className="flex justify-between p-2.5 rounded-lg bg-neutral-950 border border-neutral-800">
                <span className="font-bold text-amber-400">[W, A, S, D]</span>
                <span>Move character / حرکت کریں</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-neutral-950 border border-neutral-800">
                <span className="font-bold text-amber-400">[Left Click / Fire]</span>
                <span>Aim & Shoot bullets / نشانہ باندھ کر گولی چلائیں</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-neutral-950 border border-neutral-800">
                <span className="font-bold text-amber-400">[R]</span>
                <span>Reload gun / گن ری لوڈ کریں</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-neutral-950 border border-neutral-800">
                <span className="font-bold text-cyan-400">[E] Gloo Wall</span>
                <span>Deploy ice barrier to block enemy bullets / دشمن کی گولی روکیں</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-neutral-950 border border-neutral-800">
                <span className="font-bold text-emerald-400">[F] Medkit</span>
                <span>Use health kit to heal +75 HP / خون بڑھائیں</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-neutral-950 border border-neutral-800">
                <span className="font-bold text-amber-400">[Q] Special Skill</span>
                <span>Active Hero Ability (Dash / Bushido / Heal Aura)</span>
              </div>
              <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-lg text-xs text-amber-200">
                🏠 <strong>Houses (گھر):</strong> Enter houses to take cover behind walls and collect medkits, ammo, and battle coins. Roofs automatically become transparent when you enter!
              </div>
              <div className="p-3 bg-red-950/20 border border-red-500/30 rounded-lg text-xs text-red-300">
                🎯 <strong>Headshots:</strong> Shoot opponents in the head for devastating 2x to 2.5x critical damage to take them down quickly!
              </div>
            </div>

            <button
              onClick={() => {
                soundEngine.playClick();
                setShowHelpModal(false);
              }}
              className="mt-6 w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-chakra font-bold uppercase tracking-wider transition"
            >
              Got It, Let's Play!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
