import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import {
  Character,
  Weapon,
  GameMap,
  CampaignLevel,
  GameMode,
  KillEvent,
  SafeZone,
} from '../types/game';
import {
  create3DHumanCharacter,
  create3DHouse,
  create3DTree,
  create3DBarrel,
  create3DGlooWall,
  Character3DObject,
} from '../utils/threeModels';
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

interface Bot3D {
  id: string;
  name: string;
  gender: 'boy' | 'girl';
  hp: number;
  maxHp: number;
  armor: number;
  mesh: Character3DObject;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  rotationY: number;
  isAlive: boolean;
  walkCycle: number;
  lastShotTime: number;
  aiState: 'patrol' | 'chase' | 'flee';
  patrolTimer: number;
  targetDir: THREE.Vector3;
}

interface Bullet3D {
  mesh: THREE.Mesh;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  damage: number;
  isPlayer: boolean;
  life: number;
}

interface Particle3D {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
}

interface DamagePopup {
  element: HTMLDivElement;
  position: THREE.Vector3;
  life: number;
}

export const ThreeGameCanvas: React.FC<Props> = ({
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
  const mountRef = useRef<HTMLDivElement | null>(null);
  const crosshairRef = useRef<HTMLDivElement | null>(null);
  const damageContainerRef = useRef<HTMLDivElement | null>(null);

  // References for mutable game state
  const stateRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    playerMesh: Character3DObject;
    playerPos: THREE.Vector3;
    playerRotY: number;
    playerPitch: number;
    playerHp: number;
    playerMaxHp: number;
    playerArmor: number;
    playerMaxArmor: number;
    playerSpeed: number;
    playerWalkCycle: number;
    activeWeapon: Weapon;
    isReloading: boolean;
    reloadProgress: number;
    medkitCount: number;
    isChannelingMedkit: boolean;
    medkitChannelTimer: number;
    glooWallCount: number;
    skillCooldownRemaining: number;
    skillActive: boolean;
    skillDurationRemaining: number;
    bots: Bot3D[];
    bullets: Bullet3D[];
    particles: Particle3D[];
    damagePopups: DamagePopup[];
    houses: { minX: number; maxX: number; minZ: number; maxZ: number; doorZ: number }[];
    glooWalls: THREE.Group[];
    barrels: { mesh: THREE.Group; hp: number; pos: THREE.Vector3 }[];
    safeZone: SafeZone | null;
    safeZoneMesh: THREE.Mesh | null;
    keys: { [key: string]: boolean };
    mouse: { x: number; y: number; isDown: boolean };
    kills: number;
    headshots: number;
    totalDamageDealt: number;
    coinsEarned: number;
    killEvents: KillEvent[];
    isOver: boolean;
    hitmarkerTimer: number;
  } | null>(null);

  // Initialize Three.js Scene and World
  useEffect(() => {
    soundEngine.enabled = soundEnabled;
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene & Lighting
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);
    scene.fog = new THREE.FogExp2(0x0f172a, 0.012);

    const camera = new THREE.PerspectiveCamera(
      65,
      window.innerWidth / window.innerHeight,
      0.1,
      500
    );

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Sunlight Directional Light
    const sunLight = new THREE.DirectionalLight(0xffedd5, 1.4);
    sunLight.position.set(40, 60, 30);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 200;
    const d = 50;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    scene.add(sunLight);

    // Ambient Sky Light
    const ambientLight = new THREE.AmbientLight(0x94a3b8, 0.6);
    scene.add(ambientLight);

    // Hemisphere Light
    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x1e293b, 0.5);
    scene.add(hemiLight);

    // 2. Realistic 3D Ground Terrain
    const terrainSize = 200;
    const groundGeo = new THREE.PlaneGeometry(terrainSize, terrainSize, 64, 64);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x223624, // rich grass military green
      roughness: 0.9,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Dirt Paths Grid Lines
    const gridHelper = new THREE.GridHelper(terrainSize, 40, 0xca8a04, 0x334155);
    gridHelper.position.y = 0.02;
    scene.add(gridHelper);

    // 3. Realistic 3D Houses ("gar ho us area ma jis ka under ja ka chup saka")
    const houseBoundsList: { minX: number; maxX: number; minZ: number; maxZ: number; doorZ: number }[] = [];
    const houseConfigs = [
      { x: 0, z: 20, w: 12, l: 14, h: 4.5, color: 0x78716c, roof: 0xb45309 }, // Central Command House
      { x: -35, z: -25, w: 10, l: 12, h: 4.2, color: 0x57534e, roof: 0x0f766e }, // West Outpost House
      { x: 40, z: -20, w: 11, l: 12, h: 4.2, color: 0x52525b, roof: 0x9333ea }, // East Villa House
      { x: -30, z: 45, w: 10, l: 10, h: 4.0, color: 0x44403c, roof: 0xdc2626 }, // South Barracks
      { x: 35, z: 40, w: 12, l: 14, h: 4.5, color: 0x3f3f46, roof: 0x0284c7 }, // Sniper Haven
    ];

    houseConfigs.forEach((cfg) => {
      const { houseGroup, doorZ } = create3DHouse(cfg.w, cfg.l, cfg.h, cfg.color, cfg.roof);
      houseGroup.position.set(cfg.x, 0, cfg.z);
      scene.add(houseGroup);

      houseBoundsList.push({
        minX: cfg.x - cfg.w / 2,
        maxX: cfg.x + cfg.w / 2,
        minZ: cfg.z - cfg.l / 2,
        maxZ: cfg.z + cfg.l / 2,
        doorZ: cfg.z + doorZ,
      });
    });

    // 4. Natural 3D Trees and Cover Elements
    const treePositions = [
      [-15, 12], [18, 15], [-20, -10], [25, -5], [-45, 10], [50, 15],
      [-10, 45], [20, 50], [0, -35], [-25, -45], [30, -45], [0, 60],
    ];
    treePositions.forEach(([tx, tz]) => {
      const tree = create3DTree();
      tree.position.set(tx, 0, tz);
      scene.add(tree);
    });

    // 5. Explosive Red Barrels (Near houses for tactical ambush)
    const barrelsList: { mesh: THREE.Group; hp: number; pos: THREE.Vector3 }[] = [];
    const barrelCoords = [
      [7, 18], [-7, 18], [-28, -20], [33, -15], [-24, 40],
    ];
    barrelCoords.forEach(([bx, bz]) => {
      const barrelMesh = create3DBarrel();
      barrelMesh.position.set(bx, 0, bz);
      scene.add(barrelMesh);
      barrelsList.push({
        mesh: barrelMesh,
        hp: 40,
        pos: new THREE.Vector3(bx, 0.7, bz),
      });
    });

    // 6. Player 3D Human Character (Boy or Girl)
    const playerMesh = create3DHumanCharacter(
      character.gender,
      character.bodyColor,
      character.accentColor,
      primaryWeapon.type
    );
    playerMesh.position.set(0, 0, 0);
    scene.add(playerMesh);

    // 7. Enemy 3D Bots (Boys & Girls)
    const enemyCount = levelConfig ? levelConfig.enemyCount : 15;
    const botList: Bot3D[] = [];
    const botNames = [
      'Kelly_Dash', 'Hayato_Fire', 'Moco_Vision', 'Alok_Beat',
      'Laura_Aim', 'Steffie_Rebel', 'Maxim_Rush', 'Chrono_Time',
      'Viper_Strike', 'Shadow_Hunter', 'Titan_Apex', 'Raven_Blade',
      'Phoenix_Girl', 'Blaze_Ghost', 'Frost_Bite',
    ];

    for (let i = 0; i < enemyCount; i++) {
      const gender: 'boy' | 'girl' = i % 2 === 0 ? 'boy' : 'girl';
      const botMesh = create3DHumanCharacter(
        gender,
        gender === 'boy' ? '#2563eb' : '#db2777',
        gender === 'boy' ? '#60a5fa' : '#f472b6',
        (i % 3 === 0 ? 'smg' : i % 3 === 1 ? 'ar' : 'sniper') as any
      );

      // Distribute bots around houses and perimeter
      const angle = (i / enemyCount) * Math.PI * 2;
      const dist = 30 + (i % 3) * 15;
      const bx = Math.cos(angle) * dist;
      const bz = Math.sin(angle) * dist;

      botMesh.position.set(bx, 0, bz);
      scene.add(botMesh);

      botList.push({
        id: `bot_${i}`,
        name: botNames[i % botNames.length] + (i >= botNames.length ? `_${i}` : ''),
        gender,
        hp: 100 + (levelConfig ? levelConfig.level * 8 : 0),
        maxHp: 100 + (levelConfig ? levelConfig.level * 8 : 0),
        armor: 50,
        mesh: botMesh,
        position: new THREE.Vector3(bx, 0, bz),
        velocity: new THREE.Vector3(),
        rotationY: Math.random() * Math.PI * 2,
        isAlive: true,
        walkCycle: 0,
        lastShotTime: 0,
        aiState: 'patrol',
        patrolTimer: Math.random() * 2,
        targetDir: new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize(),
      });
    }

    // 8. Safe Zone 3D Cylinder Dome
    const initialSafeZone: SafeZone | null = levelConfig?.safeZoneShrink !== false ? {
      currentRadius: 90,
      targetRadius: 45,
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
      shrinkSpeed: 2.2,
      damagePerSec: 8,
      isShrinking: false,
      nextShrinkTime: Date.now() + 15000,
    } : null;

    let safeZoneMesh: THREE.Mesh | null = null;
    if (initialSafeZone) {
      const zoneGeo = new THREE.CylinderGeometry(
        initialSafeZone.currentRadius,
        initialSafeZone.currentRadius,
        18,
        32,
        1,
        true
      );
      const zoneMat = new THREE.MeshBasicMaterial({
        color: 0x06b6d4,
        transparent: true,
        opacity: 0.22,
        side: THREE.DoubleSide,
      });
      safeZoneMesh = new THREE.Mesh(zoneGeo, zoneMat);
      safeZoneMesh.position.y = 9;
      scene.add(safeZoneMesh);
    }

    stateRef.current = {
      scene,
      camera,
      renderer,
      playerMesh,
      playerPos: new THREE.Vector3(0, 0, 0),
      playerRotY: 0,
      playerPitch: 0.1,
      playerHp: character.maxHp,
      playerMaxHp: character.maxHp,
      playerArmor: character.maxArmor,
      playerMaxArmor: character.maxArmor,
      playerSpeed: character.speed,
      playerWalkCycle: 0,
      activeWeapon: { ...primaryWeapon },
      isReloading: false,
      reloadProgress: 0,
      medkitCount: 3,
      isChannelingMedkit: false,
      medkitChannelTimer: 0,
      glooWallCount: 2,
      skillCooldownRemaining: 0,
      skillActive: false,
      skillDurationRemaining: 0,
      bots: botList,
      bullets: [],
      particles: [],
      damagePopups: [],
      houses: houseBoundsList,
      glooWalls: [],
      barrels: barrelsList,
      safeZone: initialSafeZone,
      safeZoneMesh,
      keys: {},
      mouse: { x: 0, y: 0, isDown: false },
      kills: 0,
      headshots: 0,
      totalDamageDealt: 0,
      coinsEarned: 0,
      killEvents: [],
      isOver: false,
      hitmarkerTimer: 0,
    };

    // Resize handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [character, primaryWeapon, currentMap, levelConfig, soundEnabled]);

  // Handle Controls & Firing Events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!stateRef.current) return;
      stateRef.current.keys[e.key.toLowerCase()] = true;

      // Reload
      if (e.key.toLowerCase() === 'r') {
        const state = stateRef.current;
        if (state.activeWeapon.currentAmmo < state.activeWeapon.capacity && state.activeWeapon.reserveAmmo > 0) {
          state.isReloading = true;
          state.reloadProgress = 0;
          soundEngine.playReload();
        }
      }

      // Gloo Wall [E]
      if (e.key.toLowerCase() === 'e') {
        const state = stateRef.current;
        if (state.glooWallCount > 0) {
          state.glooWallCount--;
          const gw = create3DGlooWall();
          const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), state.playerRotY);
          gw.position.copy(state.playerPos).add(forward.clone().multiplyScalar(3.5));
          gw.rotation.y = state.playerRotY;
          state.scene.add(gw);
          state.glooWalls.push(gw);
          soundEngine.playGlooWall();
        }
      }

      // Medkit [F]
      if (e.key.toLowerCase() === 'f') {
        const state = stateRef.current;
        if (state.medkitCount > 0 && state.playerHp < state.playerMaxHp && !state.isChannelingMedkit) {
          state.isChannelingMedkit = true;
          state.medkitChannelTimer = 3.0;
        }
      }

      // Skill [Q]
      if (e.key.toLowerCase() === 'q') {
        const state = stateRef.current;
        if (state.skillCooldownRemaining <= 0 && !state.skillActive) {
          state.skillActive = true;
          state.skillDurationRemaining = character.skillDuration;
          state.skillCooldownRemaining = character.skillCooldown;
          soundEngine.playHeal();
          if (character.id === 'maxim') {
            state.playerHp = Math.min(state.playerMaxHp, state.playerHp + 40);
          }
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!stateRef.current) return;
      stateRef.current.keys[e.key.toLowerCase()] = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!stateRef.current) return;
      // Camera rotation mouse look
      const sensitivity = 0.0035;
      stateRef.current.playerRotY -= e.movementX * sensitivity;
      stateRef.current.playerPitch = Math.max(
        -Math.PI / 4,
        Math.min(Math.PI / 4, stateRef.current.playerPitch - e.movementY * sensitivity)
      );
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0 && stateRef.current) {
        stateRef.current.mouse.isDown = true;
        // Request pointer lock for true Free Fire third person aim
        if (mountRef.current && document.pointerLockElement !== mountRef.current) {
          mountRef.current.requestPointerLock().catch(() => {});
        }
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0 && stateRef.current) {
        stateRef.current.mouse.isDown = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [character]);

  // Main 60fps Three.js Render & Physics Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const checkHouseCollision = (pos: THREE.Vector3): boolean => {
      if (!stateRef.current) return false;
      for (const h of stateRef.current.houses) {
        // If within house bounding box
        if (pos.x > h.minX && pos.x < h.maxX && pos.z > h.minZ && pos.z < h.maxZ) {
          // Check if at door opening
          const isAtDoor = Math.abs(pos.z - h.doorZ) < 1.4 && Math.abs(pos.x - (h.minX + h.maxX) / 2) < 1.4;
          // Check if strictly inside
          const inside = pos.x > h.minX + 0.8 && pos.x < h.maxX - 0.8 && pos.z > h.minZ + 0.8 && pos.z < h.maxZ - 0.8;
          if (!inside && !isAtDoor) {
            return true; // collided with outer house wall
          }
        }
      }
      return false;
    };

    const spawnBullet = (startPos: THREE.Vector3, direction: THREE.Vector3, isPlayer: boolean, damage: number) => {
      if (!stateRef.current) return;
      const bulletGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.8, 6);
      const bulletMat = new THREE.MeshBasicMaterial({
        color: isPlayer ? 0xf59e0b : 0xef4444,
      });
      const bulletMesh = new THREE.Mesh(bulletGeo, bulletMat);
      bulletMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
      bulletMesh.position.copy(startPos);
      stateRef.current.scene.add(bulletMesh);

      stateRef.current.bullets.push({
        mesh: bulletMesh,
        position: startPos.clone(),
        velocity: direction.clone().multiplyScalar(isPlayer ? 110 : 80),
        damage,
        isPlayer,
        life: 1.8,
      });
    };

    const loop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.05);
      lastTime = currentTime;

      const state = stateRef.current;
      if (!state) {
        animId = requestAnimationFrame(loop);
        return;
      }

      // 1. Player Movement & Animation
      let moveForward = 0;
      let moveRight = 0;
      if (state.keys['w'] || state.keys['arrowup']) moveForward += 1;
      if (state.keys['s'] || state.keys['arrowdown']) moveForward -= 1;
      if (state.keys['d'] || state.keys['arrowright']) moveRight += 1;
      if (state.keys['a'] || state.keys['arrowleft']) moveRight -= 1;

      const isMoving = moveForward !== 0 || moveRight !== 0;

      let speed = state.playerSpeed;
      if (state.skillActive && character.id === 'kelly') speed *= 1.4;
      if (state.skillActive && character.id === 'alok') speed *= 1.25;

      if (isMoving) {
        state.playerWalkCycle += dt * 12;
        // Move relative to player facing angle
        const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), state.playerRotY);
        const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), state.playerRotY);

        const moveDir = forward.multiplyScalar(moveForward).add(right.multiplyScalar(moveRight)).normalize();
        const nextPos = state.playerPos.clone().add(moveDir.multiplyScalar(speed * dt));

        if (!checkHouseCollision(nextPos)) {
          state.playerPos.copy(nextPos);
        }

        // Animate legs and arms walking
        const legAngle = Math.sin(state.playerWalkCycle) * 0.7;
        state.playerMesh.leftLeg.rotation.x = legAngle;
        state.playerMesh.rightLeg.rotation.x = -legAngle;
        state.playerMesh.torso.position.y = 1.0 + Math.abs(Math.sin(state.playerWalkCycle * 2)) * 0.05;
      } else {
        // Idle breath
        state.playerMesh.leftLeg.rotation.x *= 0.85;
        state.playerMesh.rightLeg.rotation.x *= 0.85;
        state.playerMesh.torso.position.y = 1.0 + Math.sin(currentTime * 0.003) * 0.02;
      }

      // Update Player Mesh Position & Rotation
      state.playerMesh.position.copy(state.playerPos);
      state.playerMesh.rotation.y = state.playerRotY;

      // 2. Third-Person Follow Camera (Free Fire / PUBG Over-The-Shoulder Perspective)
      // Camera sits behind right shoulder
      const camOffset = new THREE.Vector3(0.9, 2.0, -3.8);
      camOffset.applyAxisAngle(new THREE.Vector3(1, 0, 0), state.playerPitch);
      camOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), state.playerRotY);

      const desiredCamPos = state.playerPos.clone().add(camOffset);
      state.camera.position.lerp(desiredCamPos, 0.25);

      // Camera looks forward along aim direction
      const lookTarget = state.playerPos.clone().add(new THREE.Vector3(0, 1.6, 0));
      const lookDir = new THREE.Vector3(0, 0, 10)
        .applyAxisAngle(new THREE.Vector3(1, 0, 0), state.playerPitch)
        .applyAxisAngle(new THREE.Vector3(0, 1, 0), state.playerRotY);
      lookTarget.add(lookDir);
      state.camera.lookAt(lookTarget);

      // 3. Player Firing (Left Mouse Click or Touch Button)
      const now = performance.now();
      const fireInterval = 1000 / state.activeWeapon.fireRate;
      if (
        (state.mouse.isDown || isFiringFromTouch) &&
        !state.isReloading &&
        state.activeWeapon.currentAmmo > 0 &&
        now - state.playerMesh.position.x > 0 // dummy truthy check
      ) {
        if (now - (state.playerMesh as any).lastShotTime >= fireInterval) {
          (state.playerMesh as any).lastShotTime = now;
          state.activeWeapon.currentAmmo--;
          soundEngine.playGunshot(state.activeWeapon.type);

          // Flash light
          const flashMat = state.playerMesh.muzzleFlash.material as THREE.MeshBasicMaterial;
          flashMat.opacity = 1.0;
          state.playerMesh.muzzleLight.intensity = 4.0;
          setTimeout(() => {
            if (state.playerMesh && flashMat) {
              flashMat.opacity = 0;
              state.playerMesh.muzzleLight.intensity = 0;
            }
          }, 60);

          // Spawn Bullet Tracer
          const muzzleWorld = new THREE.Vector3();
          state.playerMesh.muzzleFlash.getWorldPosition(muzzleWorld);

          const aimDirection = lookDir.clone().normalize();
          // slight spread
          aimDirection.x += (Math.random() - 0.5) * state.activeWeapon.spread;
          aimDirection.y += (Math.random() - 0.5) * state.activeWeapon.spread;
          aimDirection.normalize();

          let bulletDmg = state.activeWeapon.baseDamage;
          if (state.skillActive && character.id === 'hayato') bulletDmg *= 1.35;
          if (state.skillActive && character.id === 'kelly') bulletDmg *= 1.5;

          spawnBullet(muzzleWorld, aimDirection, true, bulletDmg);
        }
      }

      // Auto-reload when clip empty
      if (state.activeWeapon.currentAmmo <= 0 && state.activeWeapon.reserveAmmo > 0 && !state.isReloading) {
        state.isReloading = true;
        state.reloadProgress = 0;
        soundEngine.playReload();
      }

      // Reload timer
      if (state.isReloading) {
        state.reloadProgress += dt / state.activeWeapon.reloadTime;
        if (state.reloadProgress >= 1) {
          state.isReloading = false;
          const needed = state.activeWeapon.capacity - state.activeWeapon.currentAmmo;
          const amt = Math.min(needed, state.activeWeapon.reserveAmmo);
          state.activeWeapon.currentAmmo += amt;
          state.activeWeapon.reserveAmmo -= amt;
        }
      }

      // Medkit channeling
      if (state.isChannelingMedkit) {
        state.medkitChannelTimer -= dt;
        if (state.medkitChannelTimer <= 0) {
          state.isChannelingMedkit = false;
          state.medkitCount--;
          state.playerHp = Math.min(state.playerMaxHp, state.playerHp + 75);
          soundEngine.playHeal();
        }
      }

      // Skills cooldown
      if (state.skillActive) {
        state.skillDurationRemaining -= dt;
        if (state.skillDurationRemaining <= 0) state.skillActive = false;
      }
      if (state.skillCooldownRemaining > 0) {
        state.skillCooldownRemaining = Math.max(0, state.skillCooldownRemaining - dt);
      }

      // 4. Update Enemy Bots (Boys & Girls)
      state.bots.forEach((bot) => {
        if (!bot.isAlive) return;

        const distToPlayer = bot.position.distanceTo(state.playerPos);

        // Turn towards player or patrol
        if (distToPlayer < 45) {
          bot.aiState = 'chase';
          const dir = state.playerPos.clone().sub(bot.position).normalize();
          bot.rotationY = Math.atan2(dir.x, dir.z);

          // Run towards player or maintain cover distance
          if (distToPlayer > 12) {
            const botStep = dir.multiplyScalar(3.8 * dt);
            bot.position.add(botStep);
            bot.walkCycle += dt * 10;
            bot.mesh.leftLeg.rotation.x = Math.sin(bot.walkCycle) * 0.6;
            bot.mesh.rightLeg.rotation.x = -Math.sin(bot.walkCycle) * 0.6;
          }

          // Bot shoot at player
          if (now - bot.lastShotTime > 1600 && Math.random() < 0.15) {
            bot.lastShotTime = now;
            const muzzleWorld = new THREE.Vector3();
            bot.mesh.muzzleFlash.getWorldPosition(muzzleWorld);
            const shootDir = state.playerPos.clone().add(new THREE.Vector3(0, 1.2, 0)).sub(muzzleWorld).normalize();
            spawnBullet(muzzleWorld, shootDir, false, 20);
          }
        } else {
          // Patrol wander
          bot.patrolTimer -= dt;
          if (bot.patrolTimer <= 0) {
            bot.targetDir = new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
            bot.rotationY = Math.atan2(bot.targetDir.x, bot.targetDir.z);
            bot.patrolTimer = 3 + Math.random() * 3;
          }
          bot.position.add(bot.targetDir.clone().multiplyScalar(2.0 * dt));
        }

        bot.mesh.position.copy(bot.position);
        bot.mesh.rotation.y = bot.rotationY;
      });

      // 5. Update Bullets & Collisions
      for (let i = state.bullets.length - 1; i >= 0; i--) {
        const b = state.bullets[i];
        const step = b.velocity.clone().multiplyScalar(dt);
        b.position.add(step);
        b.mesh.position.copy(b.position);
        b.life -= dt;

        let bulletRemoved = false;

        // Ground or life timeout
        if (b.position.y <= 0.1 || b.life <= 0) {
          state.scene.remove(b.mesh);
          state.bullets.splice(i, 1);
          continue;
        }

        // House walls collision
        for (const h of state.houses) {
          if (b.position.x > h.minX && b.position.x < h.maxX && b.position.z > h.minZ && b.position.z < h.maxZ && b.position.y < 4.5) {
            state.scene.remove(b.mesh);
            state.bullets.splice(i, 1);
            bulletRemoved = true;
            break;
          }
        }
        if (bulletRemoved) continue;

        // Player bullet hitting Bot
        if (b.isPlayer) {
          for (const bot of state.bots) {
            if (!bot.isAlive) return;
            const dist = b.position.distanceTo(bot.position.clone().add(new THREE.Vector3(0, 1.0, 0)));
            if (dist < 1.2) {
              // Hit! Check headshot
              const isHeadshot = b.position.y > 1.4;
              let dmg = Math.round(isHeadshot ? b.damage * state.activeWeapon.headshotMultiplier : b.damage);

              bot.hp -= dmg;
              state.totalDamageDealt += dmg;
              soundEngine.playHit(isHeadshot);

              // Flash hitmarker on HUD
              state.hitmarkerTimer = 0.2;

              // Elimination check
              if (bot.hp <= 0) {
                bot.hp = 0;
                bot.isAlive = false;
                soundEngine.playElimination();
                state.kills++;
                if (isHeadshot) state.headshots++;
                state.coinsEarned += 100;

                // Death animation: collapse mesh
                bot.mesh.rotation.x = -Math.PI / 2;
                bot.mesh.position.y = 0.2;

                // Kill feed event
                state.killEvents.push({
                  id: `k_${Date.now()}_${Math.random()}`,
                  killerName: character.name,
                  victimName: bot.name,
                  weaponName: state.activeWeapon.name,
                  isHeadshot,
                  isPlayerKiller: true,
                  timestamp: Date.now(),
                });
              }

              state.scene.remove(b.mesh);
              state.bullets.splice(i, 1);
              bulletRemoved = true;
              break;
            }
          }
        } else {
          // Bot bullet hitting Player
          const playerChestPos = state.playerPos.clone().add(new THREE.Vector3(0, 1.0, 0));
          if (b.position.distanceTo(playerChestPos) < 1.1) {
            let dmg = b.damage;
            if (state.skillActive && character.id === 'chrono') dmg = 0;
            if (state.playerArmor > 0 && dmg > 0) {
              const absorbed = Math.min(state.playerArmor, Math.round(dmg * 0.5));
              state.playerArmor -= absorbed;
              dmg -= absorbed;
            }
            state.playerHp = Math.max(0, state.playerHp - dmg);
            soundEngine.playHit(false);

            state.scene.remove(b.mesh);
            state.bullets.splice(i, 1);
            bulletRemoved = true;
          }
        }
      }

      // 6. Safe Zone Shrink
      if (state.safeZone && state.safeZoneMesh) {
        if (!state.safeZone.isShrinking && Date.now() >= state.safeZone.nextShrinkTime) {
          state.safeZone.isShrinking = true;
          soundEngine.playZoneWarning();
        }

        if (state.safeZone.isShrinking) {
          state.safeZone.currentRadius = Math.max(
            state.safeZone.targetRadius,
            state.safeZone.currentRadius - state.safeZone.shrinkSpeed * dt
          );
          state.safeZoneMesh.scale.set(
            state.safeZone.currentRadius / 90,
            1,
            state.safeZone.currentRadius / 90
          );
          if (state.safeZone.currentRadius <= state.safeZone.targetRadius) {
            state.safeZone.isShrinking = false;
            state.safeZone.targetRadius = Math.max(20, state.safeZone.targetRadius - 25);
            state.safeZone.nextShrinkTime = Date.now() + 20000;
          }
        }

        // Outside zone damage
        const playerDist = Math.hypot(state.playerPos.x, state.playerPos.z);
        if (playerDist > state.safeZone.currentRadius) {
          state.playerHp = Math.max(0, state.playerHp - state.safeZone.damagePerSec * dt);
        }
      }

      // Check Match Victory / Defeat
      const aliveBots = state.bots.filter((b) => b.isAlive);
      const totalAlive = aliveBots.length + (state.playerHp > 0 ? 1 : 0);

      if (!state.isOver) {
        if (state.playerHp <= 0) {
          state.isOver = true;
          onGameOver({
            isVictory: false,
            rank: totalAlive + 1,
            totalPlayers: state.bots.length + 1,
            kills: state.kills,
            headshots: state.headshots,
            damageDealt: state.totalDamageDealt,
            coinsEarned: state.coinsEarned + 50,
          });
        } else if (aliveBots.length === 0) {
          state.isOver = true;
          const reward = levelConfig ? levelConfig.rewardCoins : 500;
          onGameOver({
            isVictory: true,
            rank: 1,
            totalPlayers: state.bots.length + 1,
            kills: state.kills,
            headshots: state.headshots,
            damageDealt: state.totalDamageDealt,
            coinsEarned: state.coinsEarned + reward,
          });
        }
      }

      // Sync stats to HUD
      onUpdateStats({
        hp: state.playerHp,
        maxHp: state.playerMaxHp,
        armor: state.playerArmor,
        maxArmor: state.playerMaxArmor,
        weapon: state.activeWeapon,
        aliveCount: totalAlive,
        totalEntities: state.bots.length + 1,
        kills: state.kills,
        killEvents: state.killEvents,
        safeZone: state.safeZone,
        playerX: state.playerPos.x + 1200,
        playerY: state.playerPos.z + 1200,
        playerAngle: state.playerRotY,
        medkitCount: state.medkitCount,
        isMedkitChanneling: state.isChannelingMedkit,
        medkitChannelProgress: 1 - Math.max(0, state.medkitChannelTimer / 3.0),
        glooWallCount: state.glooWallCount,
        skillCooldownRemaining: state.skillCooldownRemaining,
        skillActive: state.skillActive,
        skillDurationRemaining: state.skillDurationRemaining,
      });

      // Render 3D Scene
      state.renderer.render(state.scene, state.camera);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [character, levelConfig, isFiringFromTouch, onGameOver, onUpdateStats]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-neutral-950">
      {/* Three.js WebGL Container */}
      <div ref={mountRef} className="w-full h-full cursor-crosshair" />

      {/* Center Tactical Crosshair */}
      <div
        ref={crosshairRef}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 flex items-center justify-center"
      >
        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,1)]" />
        <div className="absolute w-7 h-[2px] bg-white/70" />
        <div className="absolute h-7 w-[2px] bg-white/70" />
      </div>

      {/* Floating Damage Container */}
      <div ref={damageContainerRef} className="absolute inset-0 pointer-events-none z-20" />
    </div>
  );
};
