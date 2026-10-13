import React, { useRef, useEffect } from 'react';
import {
  Character,
  Weapon,
  GameMap,
  Entity,
  Bullet,
  Particle,
  DamageNumber,
  LootItem,
  GlooWall,
  SafeZone,
  KillEvent,
  Airdrop,
  CampaignLevel,
  GameMode,
} from '../types/game';
import { soundEngine } from '../utils/audio';

interface Props {
  character: Character;
  primaryWeapon: Weapon;
  secondaryWeapon?: Weapon;
  currentMap: GameMap;
  levelConfig?: CampaignLevel;
  gameMode: GameMode;
  onGameOver: (result: {
    isVictory: boolean;
    rank: number;
    totalPlayers: number;
    kills: number;
    headshots: number;
    damageDealt: number;
    coinsEarned: number;
  }) => void;
  onUpdateStats: (stats: {
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
  }) => void;
  triggerReload: boolean;
  onReloadComplete: () => void;
  triggerMedkit: boolean;
  onMedkitComplete: () => void;
  triggerGlooWall: boolean;
  onGlooWallComplete: () => void;
  triggerSkill: boolean;
  onSkillComplete: () => void;
  soundEnabled: boolean;
  isFiringFromTouch: boolean;
}

export const GameCanvas: React.FC<Props> = ({
  character,
  primaryWeapon,
  secondaryWeapon,
  currentMap,
  levelConfig,
  gameMode,
  onGameOver,
  onUpdateStats,
  triggerReload,
  onReloadComplete,
  triggerMedkit,
  onMedkitComplete,
  triggerGlooWall,
  onGlooWallComplete,
  triggerSkill,
  onSkillComplete,
  soundEnabled,
  isFiringFromTouch,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Use refs for full mutable 60fps game loop state
  const gameStateRef = useRef<{
    player: Entity;
    entities: Entity[];
    bullets: Bullet[];
    particles: Particle[];
    damageNumbers: DamageNumber[];
    lootItems: LootItem[];
    glooWalls: GlooWall[];
    airdrops: Airdrop[];
    safeZone: SafeZone | null;
    killEvents: KillEvent[];
    camera: { x: number; y: number };
    mouse: { x: number; y: number; worldX: number; worldY: number; isDown: boolean };
    keys: { [key: string]: boolean };
    medkitChannelTimer: number;
    isChannelingMedkit: boolean;
    skillCooldownRemaining: number;
    skillActive: boolean;
    skillDurationRemaining: number;
    kills: number;
    headshots: number;
    totalDamageDealt: number;
    coinsEarned: number;
    isOver: boolean;
    activeWeapon: Weapon;
    activeWeaponSlot: 'primary' | 'secondary';
  } | null>(null);

  // Initialize Game State
  useEffect(() => {
    soundEngine.enabled = soundEnabled;

    const initialWeapon = { ...primaryWeapon };
    const playerSpawn = currentMap.spawnPoints[0] || { x: 1200, y: 1200 };

    const playerEntity: Entity = {
      id: 'player',
      name: character.name,
      gender: character.gender,
      isPlayer: true,
      x: playerSpawn.x,
      y: playerSpawn.y,
      angle: 0,
      hp: character.maxHp,
      maxHp: character.maxHp,
      armor: character.maxArmor,
      maxArmor: character.maxArmor,
      speed: character.speed,
      weapon: initialWeapon,
      medkits: 3,
      glooWalls: 2,
      isReloading: false,
      reloadProgress: 0,
      lastShotTime: 0,
      isAlive: true,
      isInsideHouse: false,
      color: character.color,
      accentColor: character.accentColor,
      kills: 0,
    };

    // Generate Enemy Bots (Boys & Girls)
    const enemyCount = levelConfig ? levelConfig.enemyCount : 19;
    const botEntities: Entity[] = [];

    const botNames = [
      'Alok_Striker', 'Kelly_Rush', 'Shadow_Sniper', 'Moco_Vision',
      'Hayato_Ghost', 'Steffie_Rebel', 'Maxim_Speed', 'Laura_Aim',
      'Viper_King', 'Phoenix_Girl', 'Blaze_Hunter', 'Raven_Blade',
      'Cobra_Squad', 'Dragon_Lord', 'Frost_Bite', 'Scarlet_Witch',
      'Titan_Force', 'Neon_Reaper', 'Apex_Predator', 'Ghost_Rider',
    ];

    const botGenders: ('boy' | 'girl')[] = ['boy', 'girl', 'boy', 'girl', 'boy', 'girl'];
    const botWeapons = ['glock', 'deagle', 'mp40', 'ak47', 'm4a1', 'm1887', 'awm'];

    for (let i = 0; i < enemyCount; i++) {
      const spawn = currentMap.spawnPoints[(i + 1) % currentMap.spawnPoints.length] || {
        x: 400 + Math.random() * 1600,
        y: 400 + Math.random() * 1600,
      };

      const gender = botGenders[i % botGenders.length];
      const botName = botNames[i % botNames.length] + (i >= botNames.length ? `_${i}` : '');
      const assignedWeapon = { ...primaryWeapon }; // clone starter weapon template
      assignedWeapon.type = (botWeapons[i % botWeapons.length] as any) || 'ar';
      assignedWeapon.name = assignedWeapon.type.toUpperCase();
      assignedWeapon.baseDamage = Math.max(18, Math.round(primaryWeapon.baseDamage * (0.8 + (levelConfig?.enemyAggression || 1) * 0.1)));

      const bot: Entity = {
        id: `bot_${i}`,
        name: botName,
        gender: gender,
        isPlayer: false,
        x: spawn.x + (Math.random() * 120 - 60),
        y: spawn.y + (Math.random() * 120 - 60),
        angle: Math.random() * Math.PI * 2,
        hp: 100 + (levelConfig ? levelConfig.level * 10 : 0),
        maxHp: 100 + (levelConfig ? levelConfig.level * 10 : 0),
        armor: 50 + (levelConfig ? levelConfig.level * 8 : 0),
        maxArmor: 100,
        speed: 4.2 + Math.random() * 0.8,
        weapon: assignedWeapon,
        medkits: 1,
        glooWalls: 1,
        isReloading: false,
        reloadProgress: 0,
        lastShotTime: 0,
        isAlive: true,
        isInsideHouse: false,
        color: gender === 'boy' ? '#3b82f6' : '#ec4899',
        accentColor: gender === 'boy' ? '#60a5fa' : '#f472b6',
        kills: 0,
        aiState: 'patrol',
        aiReactionTimer: Math.random() * 1.5,
      };
      botEntities.push(bot);
    }

    // Add Boss if level has boss
    if (levelConfig?.boss) {
      const bossConfig = levelConfig.boss;
      const bossSpawn = { x: currentMap.width / 2 + 100, y: currentMap.height / 2 + 100 };
      const bossWeapon = { ...primaryWeapon };
      bossWeapon.type = bossConfig.weaponId === 'minigun' ? 'heavy' : 'sniper';
      bossWeapon.baseDamage = 35;
      bossWeapon.fireRate = bossConfig.weaponId === 'minigun' ? 12 : 1.2;

      botEntities.push({
        id: 'boss_unit',
        name: bossConfig.name,
        gender: bossConfig.gender,
        isPlayer: false,
        isBoss: true,
        x: bossSpawn.x,
        y: bossSpawn.y,
        angle: 0,
        hp: bossConfig.hp,
        maxHp: bossConfig.hp,
        armor: bossConfig.armor,
        maxArmor: bossConfig.armor,
        speed: bossConfig.speed,
        weapon: bossWeapon,
        medkits: 3,
        glooWalls: 3,
        isReloading: false,
        reloadProgress: 0,
        lastShotTime: 0,
        isAlive: true,
        isInsideHouse: false,
        color: '#dc2626',
        accentColor: '#fbbf24',
        kills: 0,
        aiState: 'chase',
      });
    }

    // Initialize Safe Zone
    const initialSafeZone: SafeZone | null = levelConfig?.safeZoneShrink !== false ? {
      currentRadius: 1100,
      targetRadius: 750,
      x: currentMap.width / 2,
      y: currentMap.height / 2,
      targetX: currentMap.width / 2,
      targetY: currentMap.height / 2,
      shrinkSpeed: 20,
      damagePerSec: 6,
      isShrinking: false,
      nextShrinkTime: Date.now() + 18000, // 18 seconds initial countdown
    } : null;

    // Seed house loot items
    const seededLoot: LootItem[] = [];
    currentMap.houses.forEach((h, hIdx) => {
      h.lootSpawns.forEach((spawn, sIdx) => {
        const types: ('ammo' | 'medkit' | 'armor' | 'gloo' | 'coins')[] = ['ammo', 'medkit', 'armor', 'gloo', 'coins'];
        const lootType = types[(hIdx + sIdx) % types.length];
        seededLoot.push({
          id: `loot_${hIdx}_${sIdx}`,
          x: spawn.x,
          y: spawn.y,
          type: lootType,
          amount: lootType === 'coins' ? 100 : lootType === 'ammo' ? 30 : 1,
          color: lootType === 'medkit' ? '#10b981' : lootType === 'gloo' ? '#06b6d4' : lootType === 'coins' ? '#f59e0b' : '#3b82f6',
          name: lootType.toUpperCase(),
        });
      });
    });

    gameStateRef.current = {
      player: playerEntity,
      entities: [playerEntity, ...botEntities],
      bullets: [],
      particles: [],
      damageNumbers: [],
      lootItems: seededLoot,
      glooWalls: [],
      airdrops: [],
      safeZone: initialSafeZone,
      killEvents: [],
      camera: { x: playerEntity.x, y: playerEntity.y },
      mouse: { x: 0, y: 0, worldX: playerEntity.x, worldY: playerEntity.y, isDown: false },
      keys: {},
      medkitChannelTimer: 0,
      isChannelingMedkit: false,
      skillCooldownRemaining: 0,
      skillActive: false,
      skillDurationRemaining: 0,
      kills: 0,
      headshots: 0,
      totalDamageDealt: 0,
      coinsEarned: 0,
      isOver: false,
      activeWeapon: initialWeapon,
      activeWeaponSlot: 'primary',
    };
  }, [character, primaryWeapon, currentMap, levelConfig, soundEnabled]);

  // Handle external trigger actions (Reload, Medkit, Gloo Wall, Skill)
  useEffect(() => {
    if (triggerReload && gameStateRef.current) {
      const state = gameStateRef.current;
      const w = state.activeWeapon;
      if (w.currentAmmo < w.capacity && w.reserveAmmo > 0 && !state.player.isReloading) {
        state.player.isReloading = true;
        state.player.reloadProgress = 0;
        soundEngine.playReload();
      }
      onReloadComplete();
    }
  }, [triggerReload, onReloadComplete]);

  useEffect(() => {
    if (triggerMedkit && gameStateRef.current) {
      const state = gameStateRef.current;
      if (state.player.medkits > 0 && state.player.hp < state.player.maxHp && !state.isChannelingMedkit) {
        state.isChannelingMedkit = true;
        state.medkitChannelTimer = 3.0; // 3 seconds channel
      }
      onMedkitComplete();
    }
  }, [triggerMedkit, onMedkitComplete]);

  useEffect(() => {
    if (triggerGlooWall && gameStateRef.current) {
      const state = gameStateRef.current;
      if (state.player.glooWalls > 0) {
        state.player.glooWalls--;
        // Place Gloo Wall 40 units in front of player
        const dist = 55;
        const wallX = state.player.x + Math.cos(state.player.angle) * dist;
        const wallY = state.player.y + Math.sin(state.player.angle) * dist;

        state.glooWalls.push({
          id: `gloo_${Date.now()}`,
          x: wallX,
          y: wallY,
          angle: state.player.angle + Math.PI / 2, // perpendicular to facing direction
          width: 80,
          height: 18,
          hp: 240,
          maxHp: 240,
          ownerId: state.player.id,
        });
        soundEngine.playGlooWall();

        // Ice particles
        for (let p = 0; p < 12; p++) {
          state.particles.push({
            id: `p_${Math.random()}`,
            x: wallX + (Math.random() * 40 - 20),
            y: wallY + (Math.random() * 40 - 20),
            vx: (Math.random() - 0.5) * 3,
            vy: (Math.random() - 0.5) * 3,
            life: 0.6,
            maxLife: 0.6,
            color: '#38bdf8',
            size: 4,
            type: 'spark',
          });
        }
      }
      onGlooWallComplete();
    }
  }, [triggerGlooWall, onGlooWallComplete]);

  useEffect(() => {
    if (triggerSkill && gameStateRef.current) {
      const state = gameStateRef.current;
      if (state.skillCooldownRemaining <= 0 && !state.skillActive) {
        state.skillActive = true;
        state.skillDurationRemaining = character.skillDuration;
        state.skillCooldownRemaining = character.skillCooldown;
        soundEngine.playHeal();

        // Skill activation effects
        if (character.id === 'maxim') {
          state.player.hp = Math.min(state.player.maxHp, state.player.hp + 40);
        }
      }
      onSkillComplete();
    }
  }, [triggerSkill, character, onSkillComplete]);

  // Main Canvas Render & Physics Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = performance.now();

    // Mouse and Keyboard Listeners
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameStateRef.current) return;
      gameStateRef.current.keys[e.key.toLowerCase()] = true;

      // Quick key shortcuts
      if (e.key.toLowerCase() === 'r') {
        const state = gameStateRef.current;
        const w = state.activeWeapon;
        if (w.currentAmmo < w.capacity && w.reserveAmmo > 0 && !state.player.isReloading) {
          state.player.isReloading = true;
          state.player.reloadProgress = 0;
          soundEngine.playReload();
        }
      } else if (e.key.toLowerCase() === 'e') {
        // Place Gloo Wall
        const state = gameStateRef.current;
        if (state.player.glooWalls > 0) {
          state.player.glooWalls--;
          const dist = 55;
          const wallX = state.player.x + Math.cos(state.player.angle) * dist;
          const wallY = state.player.y + Math.sin(state.player.angle) * dist;
          state.glooWalls.push({
            id: `gloo_${Date.now()}`,
            x: wallX,
            y: wallY,
            angle: state.player.angle + Math.PI / 2,
            width: 80,
            height: 18,
            hp: 240,
            maxHp: 240,
            ownerId: state.player.id,
          });
          soundEngine.playGlooWall();
        }
      } else if (e.key.toLowerCase() === 'f') {
        // Use Medkit
        const state = gameStateRef.current;
        if (state.player.medkits > 0 && state.player.hp < state.player.maxHp && !state.isChannelingMedkit) {
          state.isChannelingMedkit = true;
          state.medkitChannelTimer = 3.0;
        }
      } else if (e.key.toLowerCase() === 'q') {
        // Trigger Character Skill
        const state = gameStateRef.current;
        if (state.skillCooldownRemaining <= 0 && !state.skillActive) {
          state.skillActive = true;
          state.skillDurationRemaining = character.skillDuration;
          state.skillCooldownRemaining = character.skillCooldown;
          soundEngine.playHeal();
          if (character.id === 'maxim') {
            state.player.hp = Math.min(state.player.maxHp, state.player.hp + 40);
          }
        }
      } else if (e.key === '1' || e.key === '2') {
        // Switch Weapon
        const state = gameStateRef.current;
        if (secondaryWeapon) {
          if (e.key === '1') {
            state.activeWeapon = state.player.weapon;
            state.activeWeaponSlot = 'primary';
          } else {
            state.activeWeapon = secondaryWeapon;
            state.activeWeaponSlot = 'secondary';
          }
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!gameStateRef.current) return;
      gameStateRef.current.keys[e.key.toLowerCase()] = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!gameStateRef.current || !canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const state = gameStateRef.current;
      state.mouse.x = mouseX;
      state.mouse.y = mouseY;
      state.mouse.worldX = mouseX + state.camera.x;
      state.mouse.worldY = mouseY + state.camera.y;
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0 && gameStateRef.current) {
        gameStateRef.current.mouse.isDown = true;
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0 && gameStateRef.current) {
        gameStateRef.current.mouse.isDown = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    // Collision helper with walls, houses, obstacles
    const checkObstacleCollision = (x: number, y: number, radius: number): boolean => {
      // Bounds
      if (x - radius < 0 || x + radius > currentMap.width || y - radius < 0 || y + radius > currentMap.height) {
        return true;
      }

      // Obstacles
      for (const obs of currentMap.obstacles) {
        if (
          x + radius > obs.x &&
          x - radius < obs.x + obs.width &&
          y + radius > obs.y &&
          y - radius < obs.y + obs.height
        ) {
          return true;
        }
      }

      // Gloo Walls
      if (gameStateRef.current) {
        for (const gw of gameStateRef.current.glooWalls) {
          const dx = x - gw.x;
          const dy = y - gw.y;
          const dist = Math.hypot(dx, dy);
          if (dist < radius + gw.width / 2.5) {
            return true;
          }
        }
      }

      // House Outer Walls (Allow entering through doors!)
      for (const house of currentMap.houses) {
        const inOuterBox =
          x + radius > house.x &&
          x - radius < house.x + house.width &&
          y + radius > house.y &&
          y - radius < house.y + house.height;

        if (inOuterBox) {
          // Check if at any doorway
          let isAtDoor = false;
          for (const door of house.doors) {
            if (
              x + radius > door.x - 15 &&
              x - radius < door.x + door.width + 15 &&
              y + radius > door.y - 15 &&
              y - radius < door.y + door.height + 15
            ) {
              isAtDoor = true;
              break;
            }
          }

          // If completely inside the house, you can freely walk inside!
          const strictlyInside =
            x - radius > house.x + 20 &&
            x + radius < house.x + house.width - 20 &&
            y - radius > house.y + 20 &&
            y + radius < house.y + house.height - 20;

          if (!strictlyInside && !isAtDoor) {
            return true; // blocked by house perimeter wall
          }
        }
      }

      return false;
    };

    // Helper to spawn bullets
    const fireWeapon = (entity: Entity, targetAngle: number) => {
      if (!gameStateRef.current) return;
      const state = gameStateRef.current;
      const w = entity.isPlayer ? state.activeWeapon : entity.weapon;

      if (w.currentAmmo <= 0) {
        if (entity.isPlayer && !entity.isReloading && w.reserveAmmo > 0) {
          entity.isReloading = true;
          entity.reloadProgress = 0;
          soundEngine.playReload();
        }
        return;
      }

      const now = performance.now();
      const fireInterval = 1000 / w.fireRate;
      if (now - entity.lastShotTime < fireInterval) return;

      entity.lastShotTime = now;
      w.currentAmmo--;

      // Sound
      if (entity.isPlayer) {
        soundEngine.playGunshot(w.type);
      }

      // Recoil & spread
      const spreadAngle = (Math.random() - 0.5) * w.spread;
      const finalAngle = targetAngle + spreadAngle;

      const bulletSpeed = w.bulletSpeed;
      const vx = Math.cos(finalAngle) * bulletSpeed;
      const vy = Math.sin(finalAngle) * bulletSpeed;

      // Spawn bullet
      const muzzleDist = 28;
      const spawnX = entity.x + Math.cos(targetAngle) * muzzleDist;
      const spawnY = entity.y + Math.sin(targetAngle) * muzzleDist;

      // Apply skill damage bonus
      let damage = w.baseDamage;
      if (entity.isPlayer && state.skillActive) {
        if (character.id === 'hayato') damage *= 1.35;
        if (character.id === 'kelly') damage *= 1.5;
      }

      state.bullets.push({
        id: `b_${Date.now()}_${Math.random()}`,
        x: spawnX,
        y: spawnY,
        vx,
        vy,
        damage,
        headshotMultiplier: w.headshotMultiplier,
        rangeRemaining: w.range,
        shooterId: entity.id,
        isPlayer: entity.isPlayer,
        color: entity.isPlayer ? '#f59e0b' : '#ef4444',
        weaponType: w.type,
      });

      // Muzzle flash particle
      state.particles.push({
        id: `flash_${Math.random()}`,
        x: spawnX,
        y: spawnY,
        vx: vx * 0.1,
        vy: vy * 0.1,
        life: 0.1,
        maxLife: 0.1,
        color: '#fef08a',
        size: 8,
        type: 'spark',
      });
    };

    // Game loop tick
    const loop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.05); // delta time capped
      lastTime = currentTime;

      const state = gameStateRef.current;
      if (!state || !canvas) {
        animationFrameId = requestAnimationFrame(loop);
        return;
      }

      // Resize canvas to match display window
      if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }

      const player = state.player;

      // Update Skills & Cooldowns
      if (state.skillActive) {
        state.skillDurationRemaining -= dt;
        if (state.skillDurationRemaining <= 0) {
          state.skillActive = false;
        }
      }
      if (state.skillCooldownRemaining > 0) {
        state.skillCooldownRemaining = Math.max(0, state.skillCooldownRemaining - dt);
      }

      // Medkit Channeling
      if (state.isChannelingMedkit) {
        state.medkitChannelTimer -= dt;
        if (state.medkitChannelTimer <= 0) {
          state.isChannelingMedkit = false;
          player.medkits--;
          player.hp = Math.min(player.maxHp, player.hp + 75);
          soundEngine.playHeal();
          // Healing spark particles
          for (let p = 0; p < 15; p++) {
            state.particles.push({
              id: `heal_${Math.random()}`,
              x: player.x + (Math.random() * 40 - 20),
              y: player.y + (Math.random() * 40 - 20),
              vx: (Math.random() - 0.5) * 2,
              vy: -Math.random() * 3,
              life: 0.8,
              maxLife: 0.8,
              color: '#34d399',
              size: 4,
              type: 'heal',
            });
          }
        }
      }

      // Reloading
      if (player.isReloading) {
        player.reloadProgress += dt / state.activeWeapon.reloadTime;
        if (player.reloadProgress >= 1) {
          player.isReloading = false;
          const w = state.activeWeapon;
          const needed = w.capacity - w.currentAmmo;
          const reloadAmount = Math.min(needed, w.reserveAmmo);
          w.currentAmmo += reloadAmount;
          w.reserveAmmo -= reloadAmount;
        }
      }

      // Update Player Movement & Aim
      if (player.isAlive) {
        let moveX = 0;
        let moveY = 0;
        if (state.keys['w'] || state.keys['arrowup']) moveY -= 1;
        if (state.keys['s'] || state.keys['arrowdown']) moveY += 1;
        if (state.keys['a'] || state.keys['arrowleft']) moveX -= 1;
        if (state.keys['d'] || state.keys['arrowright']) moveX += 1;

        if (moveX !== 0 && moveY !== 0) {
          const norm = Math.SQRT1_2;
          moveX *= norm;
          moveY *= norm;
        }

        let speed = player.speed;
        if (state.skillActive && character.id === 'kelly') speed *= 1.4;
        if (state.skillActive && character.id === 'alok') speed *= 1.25;

        const nextX = player.x + moveX * speed * 60 * dt;
        const nextY = player.y + moveY * speed * 60 * dt;

        if (!checkObstacleCollision(nextX, player.y, 18)) {
          player.x = nextX;
        }
        if (!checkObstacleCollision(player.x, nextY, 18)) {
          player.y = nextY;
        }

        // Aim towards mouse world coordinates
        state.mouse.worldX = state.mouse.x + state.camera.x;
        state.mouse.worldY = state.mouse.y + state.camera.y;
        player.angle = Math.atan2(state.mouse.worldY - player.y, state.mouse.worldX - player.x);

        // Firing check
        if ((state.mouse.isDown || isFiringFromTouch) && !player.isReloading) {
          fireWeapon(player, player.angle);
        }

        // Check if inside any house
        player.isInsideHouse = currentMap.houses.some(
          (h) =>
            player.x >= h.x &&
            player.x <= h.x + h.width &&
            player.y >= h.y &&
            player.y <= h.y + h.height
        );
      }

      // Update AI Bots
      state.entities.forEach((ent) => {
        if (ent.isPlayer || !ent.isAlive) return;

        const distToPlayer = Math.hypot(player.x - ent.x, player.y - ent.y);

        // Check line of sight or proximity
        if (player.isAlive && distToPlayer < 650) {
          ent.aiState = 'chase';
          ent.angle = Math.atan2(player.y - ent.y, player.x - ent.x);

          // Move toward player or strafe
          if (distToPlayer > 220) {
            const moveVx = Math.cos(ent.angle) * ent.speed * 40 * dt;
            const moveVy = Math.sin(ent.angle) * ent.speed * 40 * dt;
            if (!checkObstacleCollision(ent.x + moveVx, ent.y, 18)) ent.x += moveVx;
            if (!checkObstacleCollision(ent.x, ent.y + moveVy, 18)) ent.y += moveVy;
          } else if (distToPlayer < 120) {
            // Back up slightly
            const backVx = -Math.cos(ent.angle) * ent.speed * 30 * dt;
            const backVy = -Math.sin(ent.angle) * ent.speed * 30 * dt;
            if (!checkObstacleCollision(ent.x + backVx, ent.y, 18)) ent.x += backVx;
            if (!checkObstacleCollision(ent.x, ent.y + backVy, 18)) ent.y += backVy;
          }

          // Bot shoot at player
          if (distToPlayer < 520 && Math.random() < 0.08) {
            fireWeapon(ent, ent.angle);
          }
        } else {
          // Patrol wander
          ent.aiReactionTimer = (ent.aiReactionTimer || 0) - dt;
          if (ent.aiReactionTimer <= 0) {
            ent.angle += (Math.random() - 0.5) * 1.5;
            ent.aiReactionTimer = 2.0 + Math.random() * 2.0;
          }
          const wanderVx = Math.cos(ent.angle) * (ent.speed * 0.4) * 40 * dt;
          const wanderVy = Math.sin(ent.angle) * (ent.speed * 0.4) * 40 * dt;
          if (!checkObstacleCollision(ent.x + wanderVx, ent.y, 18)) ent.x += wanderVx;
          if (!checkObstacleCollision(ent.x, ent.y + wanderVy, 18)) ent.y += wanderVy;
        }

        // Check if bot inside house
        ent.isInsideHouse = currentMap.houses.some(
          (h) =>
            ent.x >= h.x &&
            ent.x <= h.x + h.width &&
            ent.y >= h.y &&
            ent.y <= h.y + h.height
        );
      });

      // Update Safe Zone
      const safeZone = state.safeZone;
      if (safeZone) {
        if (!safeZone.isShrinking && Date.now() >= safeZone.nextShrinkTime) {
          safeZone.isShrinking = true;
          soundEngine.playZoneWarning();
        }

        if (safeZone.isShrinking) {
          safeZone.currentRadius = Math.max(
            safeZone.targetRadius,
            safeZone.currentRadius - safeZone.shrinkSpeed * dt
          );

          if (safeZone.currentRadius <= safeZone.targetRadius) {
            safeZone.isShrinking = false;
            safeZone.targetRadius = Math.max(200, safeZone.targetRadius - 300);
            safeZone.nextShrinkTime = Date.now() + 20000; // next shrink in 20s
          }
        }

        // Damage outside entities
        state.entities.forEach((ent) => {
          if (!ent.isAlive) return;
          const distToZone = Math.hypot(ent.x - safeZone.x, ent.y - safeZone.y);
          if (distToZone > safeZone.currentRadius) {
            const damage = safeZone.damagePerSec * dt;
            ent.hp -= damage;
            if (ent.hp <= 0) {
              ent.hp = 0;
              ent.isAlive = false;
              if (ent.isPlayer) {
                soundEngine.playHit(false);
              }
            }
          }
        });
      }

      // Update Bullets
      for (let i = state.bullets.length - 1; i >= 0; i--) {
        const b = state.bullets[i];
        b.x += b.vx * 60 * dt;
        b.y += b.vy * 60 * dt;
        const travelDist = Math.hypot(b.vx * 60 * dt, b.vy * 60 * dt);
        b.rangeRemaining -= travelDist;

        let bulletRemoved = false;

        // Collision with map boundary
        if (b.x < 0 || b.x > currentMap.width || b.y < 0 || b.y > currentMap.height || b.rangeRemaining <= 0) {
          state.bullets.splice(i, 1);
          continue;
        }

        // Collision with obstacles & Gloo Walls
        for (const obs of currentMap.obstacles) {
          if (
            b.x > obs.x &&
            b.x < obs.x + obs.width &&
            b.y > obs.y &&
            b.y < obs.y + obs.height
          ) {
            // Spark particle
            for (let p = 0; p < 4; p++) {
              state.particles.push({
                id: `sp_${Math.random()}`,
                x: b.x,
                y: b.y,
                vx: (Math.random() - 0.5) * 3,
                vy: (Math.random() - 0.5) * 3,
                life: 0.25,
                maxLife: 0.25,
                color: '#fbbf24',
                size: 3,
                type: 'spark',
              });
            }

            // Explosive red barrel check!
            if (obs.type === 'barrel' && obs.hp) {
              obs.hp -= b.damage;
              if (obs.hp <= 0) {
                // Blow up barrel
                soundEngine.playExplosion();
                // Explosion particles
                for (let p = 0; p < 25; p++) {
                  state.particles.push({
                    id: `exp_${Math.random()}`,
                    x: obs.x + obs.width / 2,
                    y: obs.y + obs.height / 2,
                    vx: (Math.random() - 0.5) * 8,
                    vy: (Math.random() - 0.5) * 8,
                    life: 0.6,
                    maxLife: 0.6,
                    color: p % 2 === 0 ? '#ef4444' : '#f59e0b',
                    size: 6 + Math.random() * 6,
                    type: 'fire',
                  });
                }
                // Area splash damage
                state.entities.forEach((ent) => {
                  if (!ent.isAlive) return;
                  const d = Math.hypot(ent.x - (obs.x + obs.width / 2), ent.y - (obs.y + obs.height / 2));
                  if (d < 180) {
                    const splashDmg = Math.round(100 * (1 - d / 180));
                    ent.hp -= splashDmg;
                    if (ent.hp <= 0) {
                      ent.hp = 0;
                      ent.isAlive = false;
                      state.kills++;
                    }
                  }
                });
                obs.x = -9999; // remove barrel
              }
            }

            state.bullets.splice(i, 1);
            bulletRemoved = true;
            break;
          }
        }
        if (bulletRemoved) continue;

        // Collision with Gloo walls
        for (const gw of state.glooWalls) {
          const d = Math.hypot(b.x - gw.x, b.y - gw.y);
          if (d < gw.width / 2) {
            gw.hp -= b.damage;
            state.bullets.splice(i, 1);
            bulletRemoved = true;
            break;
          }
        }
        if (bulletRemoved) continue;

        // Collision with Entities
        for (const target of state.entities) {
          if (!target.isAlive || target.id === b.shooterId) continue;

          const targetRadius = target.isBoss ? 28 : 20;
          const dist = Math.hypot(b.x - target.x, b.y - target.y);

          if (dist < targetRadius) {
            // Hit detected! Check if Headshot
            // If bullet hit in direction of target's head
            const hitAngle = Math.atan2(b.y - target.y, b.x - target.x);
            const angleDiff = Math.abs(hitAngle - target.angle);
            const isHeadshot = angleDiff < 0.8 || Math.random() < 0.25;

            let finalDamage = Math.round(isHeadshot ? b.damage * b.headshotMultiplier : b.damage);

            // Steffie damage reduction skill
            if (target.id === 'player' && state.skillActive && character.id === 'steffie') {
              finalDamage = Math.round(finalDamage * 0.55);
            }

            // Chrono shield invulnerability
            if (target.id === 'player' && state.skillActive && character.id === 'chrono') {
              finalDamage = 0;
            }

            // Armor absorbs 50% damage
            if (target.armor > 0 && finalDamage > 0) {
              const absorbed = Math.min(target.armor, Math.round(finalDamage * 0.5));
              target.armor -= absorbed;
              finalDamage -= absorbed;
            }

            target.hp -= finalDamage;

            // Stats tracking
            if (b.isPlayer) {
              state.totalDamageDealt += finalDamage;
              soundEngine.playHit(isHeadshot);
            } else if (target.isPlayer) {
              soundEngine.playHit(false);
            }

            // Floating Damage Number
            state.damageNumbers.push({
              id: `dmg_${Math.random()}`,
              x: target.x + (Math.random() * 20 - 10),
              y: target.y - 25,
              text: `${finalDamage}${isHeadshot ? '!' : ''}`,
              isHeadshot,
              life: 0.7,
              maxLife: 0.7,
              color: isHeadshot ? '#ef4444' : '#fbbf24',
            });

            // Blood/Sparks particles
            for (let p = 0; p < (isHeadshot ? 8 : 4); p++) {
              state.particles.push({
                id: `bld_${Math.random()}`,
                x: target.x,
                y: target.y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 0.4,
                maxLife: 0.4,
                color: isHeadshot ? '#ef4444' : '#f97316',
                size: 3.5,
                type: 'blood',
              });
            }

            // Elimination Check
            if (target.hp <= 0) {
              target.hp = 0;
              target.isAlive = false;

              // Elimination Sound
              if (b.isPlayer) {
                soundEngine.playElimination();
                state.kills++;
                if (isHeadshot) state.headshots++;
                state.coinsEarned += 80;
              }

              // Drop Loot Crate
              state.lootItems.push({
                id: `loot_drop_${Date.now()}_${target.id}`,
                x: target.x,
                y: target.y,
                type: 'medkit',
                amount: 1,
                color: '#10b981',
                name: 'MEDKIT',
              });
              state.lootItems.push({
                id: `loot_coins_${Date.now()}_${target.id}`,
                x: target.x + 15,
                y: target.y + 15,
                type: 'coins',
                amount: 60,
                color: '#f59e0b',
                name: 'COINS',
              });

              // Kill Feed Event
              const killer = state.entities.find((e) => e.id === b.shooterId);
              state.killEvents.push({
                id: `ke_${Date.now()}_${Math.random()}`,
                killerName: killer ? killer.name : 'Survivor',
                victimName: target.name,
                weaponName: b.weaponType.toUpperCase(),
                isHeadshot,
                isPlayerKiller: b.isPlayer,
                timestamp: Date.now(),
              });
            }

            state.bullets.splice(i, 1);
            bulletRemoved = true;
            break;
          }
        }
      }

      // Cleanup broken Gloo Walls
      state.glooWalls = state.glooWalls.filter((gw) => gw.hp > 0);

      // Player Loot Pickups
      if (player.isAlive) {
        for (let l = state.lootItems.length - 1; l >= 0; l--) {
          const item = state.lootItems[l];
          const dist = Math.hypot(player.x - item.x, player.y - item.y);
          if (dist < 42) {
            // Collect loot
            soundEngine.playClick();
            if (item.type === 'medkit') player.medkits += item.amount;
            if (item.type === 'gloo') player.glooWalls += item.amount;
            if (item.type === 'armor') player.armor = Math.min(player.maxArmor, player.armor + 50);
            if (item.type === 'ammo') state.activeWeapon.reserveAmmo += item.amount;
            if (item.type === 'coins') state.coinsEarned += item.amount;

            state.lootItems.splice(l, 1);
          }
        }
      }

      // Update Particles
      for (let p = state.particles.length - 1; p >= 0; p--) {
        const part = state.particles[p];
        part.x += part.vx;
        part.y += part.vy;
        part.life -= dt;
        if (part.life <= 0) {
          state.particles.splice(p, 1);
        }
      }

      // Update Floating Damage Numbers
      for (let d = state.damageNumbers.length - 1; d >= 0; d--) {
        const dn = state.damageNumbers[d];
        dn.y -= 35 * dt;
        dn.life -= dt;
        if (dn.life <= 0) {
          state.damageNumbers.splice(d, 1);
        }
      }

      // Smooth Camera Follow Player
      const targetCamX = player.x - canvas.width / 2;
      const targetCamY = player.y - canvas.height / 2;
      state.camera.x += (targetCamX - state.camera.x) * 0.12;
      state.camera.y += (targetCamY - state.camera.y) * 0.12;

      // Alive Count
      const aliveEntities = state.entities.filter((e) => e.isAlive);
      const aliveCount = aliveEntities.length;

      // Check Match Victory or Defeat
      if (!state.isOver) {
        if (!player.isAlive) {
          // Defeat!
          state.isOver = true;
          onGameOver({
            isVictory: false,
            rank: aliveCount + 1,
            totalPlayers: state.entities.length,
            kills: state.kills,
            headshots: state.headshots,
            damageDealt: state.totalDamageDealt,
            coinsEarned: state.coinsEarned + 50,
          });
        } else if (aliveCount === 1) {
          // Victory Royale / BOOYAH!
          state.isOver = true;
          const levelReward = levelConfig ? levelConfig.rewardCoins : 500;
          onGameOver({
            isVictory: true,
            rank: 1,
            totalPlayers: state.entities.length,
            kills: state.kills,
            headshots: state.headshots,
            damageDealt: state.totalDamageDealt,
            coinsEarned: state.coinsEarned + levelReward,
          });
        }
      }

      // Sync stats to HUD
      onUpdateStats({
        hp: player.hp,
        maxHp: player.maxHp,
        armor: player.armor,
        maxArmor: player.maxArmor,
        weapon: state.activeWeapon,
        aliveCount,
        totalEntities: state.entities.length,
        kills: state.kills,
        killEvents: state.killEvents,
        safeZone: state.safeZone,
        playerX: player.x,
        playerY: player.y,
        playerAngle: player.angle,
        medkitCount: player.medkits,
        isMedkitChanneling: state.isChannelingMedkit,
        medkitChannelProgress: 1 - Math.max(0, state.medkitChannelTimer / 3.0),
        glooWallCount: player.glooWalls,
        skillCooldownRemaining: state.skillCooldownRemaining,
        skillActive: state.skillActive,
        skillDurationRemaining: state.skillDurationRemaining,
      });

      // ==========================================
      // CANVAS RENDERING
      // ==========================================
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      // Apply Camera Translation
      ctx.translate(-state.camera.x, -state.camera.y);

      // 1. Draw Map Ground
      ctx.fillStyle = currentMap.groundColor;
      ctx.fillRect(0, 0, currentMap.width, currentMap.height);

      // Ground Grid Pattern
      ctx.strokeStyle = currentMap.groundAccentColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const gridSize = 120;
      for (let x = 0; x <= currentMap.width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, currentMap.height);
      }
      for (let y = 0; y <= currentMap.height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(currentMap.width, y);
      }
      ctx.stroke();

      // 2. Draw Safe Zone Ring
      if (safeZone) {
        ctx.save();
        ctx.lineWidth = 6;
        ctx.strokeStyle = '#06b6d4';
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(safeZone.x, safeZone.y, safeZone.currentRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Storm electric tint outside safe zone
        ctx.fillStyle = 'rgba(6, 182, 212, 0.08)';
        ctx.beginPath();
        ctx.rect(0, 0, currentMap.width, currentMap.height);
        ctx.arc(safeZone.x, safeZone.y, safeZone.currentRadius, 0, Math.PI * 2, true);
        ctx.fill();
        ctx.restore();
      }

      // 3. Draw Houses & Structures ("side ma house wagara ho")
      currentMap.houses.forEach((house) => {
        // Floor interior
        ctx.fillStyle = house.floorColor;
        ctx.fillRect(house.x, house.y, house.width, house.height);

        // Room partitions
        ctx.strokeStyle = house.wallColor;
        ctx.lineWidth = 8;
        house.rooms.forEach((room) => {
          ctx.strokeRect(room.x, room.y, room.width, room.height);
        });

        // House Doors (Draw gaps / green highlights)
        house.doors.forEach((door) => {
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(door.x, door.y, door.width, door.height);
        });

        // House Roof with Transparent Roof Mechanic!
        // When player is inside, roof becomes semi-transparent (0.15) so player can see interiors!
        const isPlayerInside =
          player.x >= house.x &&
          player.x <= house.x + house.width &&
          player.y >= house.y &&
          player.y <= house.y + house.height;

        ctx.save();
        ctx.fillStyle = house.roofColor;
        ctx.globalAlpha = isPlayerInside ? 0.2 : 0.95;
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 20;
        ctx.fillRect(house.x - 6, house.y - 6, house.width + 12, house.height + 12);

        // Roof ridge line
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(house.x, house.y + house.height / 2);
        ctx.lineTo(house.x + house.width, house.y + house.height / 2);
        ctx.stroke();

        // Label tag
        if (!isPlayerInside) {
          ctx.globalAlpha = 0.9;
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 14px "Chakra Petch", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(house.name, house.x + house.width / 2, house.y + house.height / 2);
        }
        ctx.restore();
      });

      // 4. Draw Obstacles (Crates, Barrels, Trees, Sandbags)
      currentMap.obstacles.forEach((obs) => {
        if (obs.x < -1000) return; // destroyed

        if (obs.type === 'crate') {
          ctx.fillStyle = '#78350f';
          ctx.strokeStyle = '#d97706';
          ctx.lineWidth = 3;
          ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
          ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);
          // Crate cross
          ctx.beginPath();
          ctx.moveTo(obs.x, obs.y);
          ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
          ctx.moveTo(obs.x + obs.width, obs.y);
          ctx.lineTo(obs.x, obs.y + obs.height);
          ctx.stroke();
        } else if (obs.type === 'barrel') {
          // Explosive Red Barrel
          ctx.fillStyle = '#dc2626';
          ctx.strokeStyle = '#fca5a5';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(obs.x + obs.width / 2, obs.y + obs.height / 2, obs.width / 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          // Skull icon on barrel
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('⚡', obs.x + obs.width / 2, obs.y + obs.height / 2);
        } else if (obs.type === 'sandbag') {
          ctx.fillStyle = '#ca8a04';
          ctx.strokeStyle = '#854d0e';
          ctx.lineWidth = 2;
          ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
          ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);
        } else if (obs.type === 'tree') {
          ctx.fillStyle = '#15803d';
          ctx.beginPath();
          ctx.arc(obs.x + obs.width / 2, obs.y + obs.height / 2, obs.width / 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#166534';
          ctx.beginPath();
          ctx.arc(obs.x + obs.width / 2, obs.y + obs.height / 2, obs.width / 3, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // 5. Draw Gloo Walls
      state.glooWalls.forEach((gw) => {
        ctx.save();
        ctx.translate(gw.x, gw.y);
        ctx.rotate(gw.angle);
        ctx.fillStyle = '#38bdf8';
        ctx.strokeStyle = '#bae6fd';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.roundRect(-gw.width / 2, -gw.height / 2, gw.width, gw.height, 8);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      });

      // 6. Draw Loot Items (Glowing Crates & Pickups)
      state.lootItems.forEach((loot) => {
        ctx.save();
        ctx.fillStyle = loot.color;
        ctx.shadowColor = loot.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(loot.x, loot.y, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px "Rajdhani", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(loot.name, loot.x, loot.y - 14);
        ctx.restore();
      });

      // 7. Draw Bullets & Tracers
      state.bullets.forEach((b) => {
        ctx.save();
        ctx.strokeStyle = b.color;
        ctx.lineWidth = b.weaponType === 'sniper' ? 4 : 2.5;
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(b.x - b.vx * 2.5, b.y - b.vy * 2.5);
        ctx.stroke();
        ctx.restore();
      });

      // 8. Draw Entities (Player, Boys, Girls, Bosses)
      state.entities.forEach((ent) => {
        if (!ent.isAlive) return;

        ctx.save();
        ctx.translate(ent.x, ent.y);

        // Health & Armor Bar above entity head
        const barW = ent.isBoss ? 56 : 38;
        const barH = 5;
        const hpPct = Math.max(0, ent.hp / ent.maxHp);
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(-barW / 2, -38, barW, barH);
        ctx.fillStyle = ent.isPlayer ? '#10b981' : ent.isBoss ? '#dc2626' : '#ef4444';
        ctx.fillRect(-barW / 2, -38, barW * hpPct, barH);

        // Name tag & Boss crown
        ctx.fillStyle = ent.isBoss ? '#facc15' : '#ffffff';
        ctx.font = `bold ${ent.isBoss ? 12 : 10}px "Rajdhani", sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(ent.isBoss ? `👑 ${ent.name}` : ent.name, 0, -42);

        // Body Rotation
        ctx.rotate(ent.angle);

        const radius = ent.isBoss ? 26 : 18;

        // Character Aura for active skills
        if (ent.isPlayer && state.skillActive) {
          ctx.beginPath();
          ctx.arc(0, 0, radius + 8, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(245, 158, 11, 0.3)';
          ctx.fill();
        }

        // Hands & Weapon Gun Barrel
        ctx.fillStyle = '#475569';
        ctx.fillRect(8, -4, 22, 8); // Gun barrel extended forward

        // Hands holding gun
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(12, -9, 4.5, 0, Math.PI * 2);
        ctx.arc(12, 9, 4.5, 0, Math.PI * 2);
        ctx.fill();

        // Main Body (Boy vs Girl styling)
        ctx.fillStyle = ent.color;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = ent.accentColor;
        ctx.lineWidth = 3;
        ctx.stroke();

        // Tactical Vest
        ctx.fillStyle = ent.accentColor;
        ctx.fillRect(-6, -8, 12, 16);

        // Head & Hair
        ctx.fillStyle = ent.gender === 'boy' ? '#1e293b' : '#be185d';
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.55, 0, Math.PI * 2);
        ctx.fill();

        // Hairstyle indicator (ponytail for girls, crew cut for boys)
        if (ent.gender === 'girl') {
          ctx.fillStyle = ent.accentColor;
          ctx.beginPath();
          ctx.arc(-radius * 0.7, 0, 5, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });

      // 9. Draw Particles
      state.particles.forEach((p) => {
        ctx.save();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // 10. Draw Damage Numbers
      state.damageNumbers.forEach((d) => {
        ctx.save();
        ctx.fillStyle = d.color;
        ctx.font = `bold ${d.isHeadshot ? 20 : 15}px "Chakra Petch", sans-serif`;
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 4;
        ctx.fillText(d.text, d.x, d.y);
        ctx.restore();
      });

      // Restore camera
      ctx.restore();

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [character, currentMap, levelConfig, isFiringFromTouch, onGameOver, onUpdateStats]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-neutral-950 cursor-crosshair">
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
};
