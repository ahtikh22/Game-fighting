export type GameMode = 'campaign' | 'battle_royale' | 'squad_tdm';

export type Gender = 'boy' | 'girl';

export interface Character {
  id: string;
  name: string;
  gender: Gender;
  title: string;
  description: string;
  color: string;
  hairColor: string;
  bodyColor: string;
  accentColor: string;
  speed: number;
  maxHp: number;
  maxArmor: number;
  skillName: string;
  skillDescription: string;
  skillCooldown: number; // in seconds
  skillDuration: number;
  unlocked: boolean;
  cost: number;
}

export type WeaponType = 'pistol' | 'smg' | 'ar' | 'shotgun' | 'sniper' | 'heavy';

export interface WeaponUpgrade {
  level: number;
  damageMultiplier: number;
  fireRateMultiplier: number;
  capacityBonus: number;
  reloadTimeMultiplier: number;
  upgradeCost: number;
}

export interface Weapon {
  id: string;
  name: string;
  type: WeaponType;
  baseDamage: number;
  fireRate: number; // shots per second
  capacity: number;
  currentAmmo: number;
  reserveAmmo: number;
  reloadTime: number; // in seconds
  bulletSpeed: number;
  spread: number; // in radians
  range: number;
  color: string;
  iconName: string;
  level: number;
  maxLevel: number;
  headshotMultiplier: number;
  unlocked: boolean;
  cost: number;
}

export interface Obstacle {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'wall' | 'crate' | 'barrel' | 'tree' | 'gloo_wall' | 'sandbag';
  hp?: number;
  maxHp?: number;
  isDestructible?: boolean;
}

export interface HouseRoom {
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
}

export interface Door {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface House {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  roofColor: string;
  wallColor: string;
  floorColor: string;
  rooms: HouseRoom[];
  doors: Door[];
  lootSpawns: { x: number; y: number }[];
}

export interface GameMap {
  id: string;
  name: string;
  description: string;
  theme: 'bermuda' | 'desert' | 'cyber' | 'snow';
  width: number;
  height: number;
  groundColor: string;
  groundAccentColor: string;
  houses: House[];
  obstacles: Obstacle[];
  spawnPoints: { x: number; y: number }[];
  airdropLocations: { x: number; y: number }[];
}

export interface CampaignLevel {
  level: number;
  title: string;
  subtitle: string;
  description: string;
  mapId: string;
  enemyCount: number;
  boss?: {
    name: string;
    gender: Gender;
    hp: number;
    armor: number;
    weaponId: string;
    speed: number;
    scale: number;
  };
  rewardCoins: number;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Insane' | 'Nightmare';
  safeZoneShrink: boolean;
  enemyAggression: number; // 1 to 5
}

export interface Bullet {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  headshotMultiplier: number;
  rangeRemaining: number;
  shooterId: string;
  isPlayer: boolean;
  color: string;
  weaponType: WeaponType;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type: 'spark' | 'blood' | 'smoke' | 'fire' | 'heal' | 'zone';
}

export interface DamageNumber {
  id: string;
  x: number;
  y: number;
  text: string;
  isHeadshot: boolean;
  life: number;
  maxLife: number;
  color: string;
}

export interface LootItem {
  id: string;
  x: number;
  y: number;
  type: 'ammo' | 'medkit' | 'armor' | 'weapon' | 'coins' | 'gloo';
  weaponId?: string;
  amount: number;
  color: string;
  name: string;
}

export interface Airdrop {
  id: string;
  x: number;
  y: number;
  targetY: number;
  currentHeight: number;
  landed: boolean;
  lootItems: LootItem[];
  smokeTimer: number;
}

export interface GlooWall {
  id: string;
  x: number;
  y: number;
  angle: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  ownerId: string;
}

export interface Entity {
  id: string;
  name: string;
  gender: Gender;
  isPlayer: boolean;
  isBoss?: boolean;
  x: number;
  y: number;
  angle: number; // radians
  hp: number;
  maxHp: number;
  armor: number;
  maxArmor: number;
  speed: number;
  weapon: Weapon;
  secondaryWeapon?: Weapon;
  medkits: number;
  glooWalls: number;
  isReloading: boolean;
  reloadProgress: number;
  lastShotTime: number;
  isAlive: boolean;
  isInsideHouse: boolean;
  color: string;
  accentColor: string;
  kills: number;
  // Bot AI fields
  targetId?: string;
  aiState?: 'patrol' | 'chase' | 'flee' | 'loot' | 'take_cover';
  aiWaypoints?: { x: number; y: number }[];
  currentWaypointIdx?: number;
  aiReactionTimer?: number;
  skillActive?: boolean;
  skillTimeRemaining?: number;
  skillCooldownRemaining?: number;
}

export interface KillEvent {
  id: string;
  killerName: string;
  victimName: string;
  weaponName: string;
  isHeadshot: boolean;
  isPlayerKiller: boolean;
  timestamp: number;
}

export interface SafeZone {
  currentRadius: number;
  targetRadius: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  shrinkSpeed: number;
  damagePerSec: number;
  isShrinking: boolean;
  nextShrinkTime: number;
}

export interface MultiplayerPlayer {
  id: string;
  name: string;
  gender: Gender;
  characterId: string;
  weaponId: string;
  isHost: boolean;
  isReady: boolean;
  isBot: boolean;
  ping: number;
  score: number;
  kills: number;
  deaths: number;
}
