import * as THREE from 'three';
import { Gender, WeaponType } from '../types/game';

/**
 * Creates an articulated 3D human character (Boy or Girl) with:
 * - Head, Hair, Helmet/Headband
 * - Torso, Tactical Vest, Backpack
 * - Left/Right Arms holding weapon
 * - Left/Right Legs with military boots
 * Returns a character container with limbs accessible for walking/firing animation.
 */
export interface Character3DObject extends THREE.Group {
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  head: THREE.Group;
  torso: THREE.Group;
  weaponHolder: THREE.Group;
  muzzleFlash: THREE.Mesh;
  muzzleLight: THREE.PointLight;
  isGirl: boolean;
}

export function create3DHumanCharacter(
  gender: Gender,
  primaryColor: string = '#f97316',
  accentColor: string = '#3b82f6',
  weaponType: WeaponType = 'ar'
): Character3DObject {
  const root = new THREE.Group() as Character3DObject;
  root.isGirl = gender === 'girl';

  // Materials
  const skinMat = new THREE.MeshStandardMaterial({
    color: gender === 'girl' ? 0xffdfc4 : 0xddb896,
    roughness: 0.6,
  });
  const clothMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(primaryColor),
    roughness: 0.7,
  });
  const vestMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(accentColor),
    roughness: 0.5,
    metalness: 0.2,
  });
  const pantsMat = new THREE.MeshStandardMaterial({
    color: gender === 'girl' ? 0x27272a : 0x18181b,
    roughness: 0.8,
  });
  const bootMat = new THREE.MeshStandardMaterial({
    color: 0x09090b,
    roughness: 0.4,
  });
  const hairMat = new THREE.MeshStandardMaterial({
    color: gender === 'girl' ? 0x1c1917 : 0x292524,
    roughness: 0.9,
  });

  // Torso Group
  const torsoGroup = new THREE.Group();
  torsoGroup.position.y = 1.0;
  root.add(torsoGroup);
  root.torso = torsoGroup;

  // Chest & Upper body
  const chestGeo = new THREE.BoxGeometry(
    gender === 'girl' ? 0.48 : 0.56,
    0.55,
    gender === 'girl' ? 0.26 : 0.32
  );
  const chestMesh = new THREE.Mesh(chestGeo, clothMat);
  chestMesh.castShadow = true;
  torsoGroup.add(chestMesh);

  // Tactical Bulletproof Vest
  const vestGeo = new THREE.BoxGeometry(
    gender === 'girl' ? 0.5 : 0.58,
    0.42,
    gender === 'girl' ? 0.28 : 0.34
  );
  const vestMesh = new THREE.Mesh(vestGeo, vestMat);
  vestMesh.position.y = 0.04;
  vestMesh.castShadow = true;
  torsoGroup.add(vestMesh);

  // Tactical Military Backpack on back
  const backpackGeo = new THREE.BoxGeometry(0.36, 0.4, 0.18);
  const backpackMat = new THREE.MeshStandardMaterial({ color: 0x3f3f46, roughness: 0.8 });
  const backpackMesh = new THREE.Mesh(backpackGeo, backpackMat);
  backpackMesh.position.set(0, 0.05, -0.22);
  backpackMesh.castShadow = true;
  torsoGroup.add(backpackMesh);

  // Head Group
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.42, 0);
  torsoGroup.add(headGroup);
  root.head = headGroup;

  // Head mesh
  const headGeo = new THREE.BoxGeometry(0.26, 0.28, 0.26);
  const headMesh = new THREE.Mesh(headGeo, skinMat);
  headMesh.castShadow = true;
  headGroup.add(headMesh);

  // Hair / Helmet
  if (gender === 'girl') {
    // Girl stylish hair with ponytail
    const hairTopGeo = new THREE.BoxGeometry(0.28, 0.12, 0.28);
    const hairTop = new THREE.Mesh(hairTopGeo, hairMat);
    hairTop.position.y = 0.12;
    headGroup.add(hairTop);

    // Ponytail extending back
    const ponytailGeo = new THREE.CylinderGeometry(0.04, 0.08, 0.35, 8);
    const ponytail = new THREE.Mesh(ponytailGeo, hairMat);
    ponytail.position.set(0, 0.02, -0.2);
    ponytail.rotation.x = Math.PI / 4;
    headGroup.add(ponytail);
  } else {
    // Boy tactical commando haircut / cap
    const capGeo = new THREE.BoxGeometry(0.28, 0.1, 0.32);
    const capMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 });
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.set(0, 0.14, 0.02);
    headGroup.add(cap);
  }

  // Eyes / Tactical Visor
  const visorGeo = new THREE.BoxGeometry(0.2, 0.06, 0.04);
  const visorMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    roughness: 0.1,
  });
  const visor = new THREE.Mesh(visorGeo, visorMat);
  visor.position.set(0, 0.02, 0.14);
  headGroup.add(visor);

  // Left Leg Group (hinges at hip)
  const leftLegGroup = new THREE.Group();
  leftLegGroup.position.set(-0.16, 0.75, 0);
  root.add(leftLegGroup);
  root.leftLeg = leftLegGroup;

  const legGeo = new THREE.BoxGeometry(0.18, 0.72, 0.18);
  const leftLegMesh = new THREE.Mesh(legGeo, pantsMat);
  leftLegMesh.position.y = -0.36;
  leftLegMesh.castShadow = true;
  leftLegGroup.add(leftLegMesh);

  // Combat boot left
  const bootGeo = new THREE.BoxGeometry(0.2, 0.16, 0.28);
  const leftBoot = new THREE.Mesh(bootGeo, bootMat);
  leftBoot.position.set(0, -0.68, 0.04);
  leftLegGroup.add(leftBoot);

  // Right Leg Group (hinges at hip)
  const rightLegGroup = new THREE.Group();
  rightLegGroup.position.set(0.16, 0.75, 0);
  root.add(rightLegGroup);
  root.rightLeg = rightLegGroup;

  const rightLegMesh = new THREE.Mesh(legGeo, pantsMat);
  rightLegMesh.position.y = -0.36;
  rightLegMesh.castShadow = true;
  rightLegGroup.add(rightLegMesh);

  // Combat boot right
  const rightBoot = new THREE.Mesh(bootGeo, bootMat);
  rightBoot.position.set(0, -0.68, 0.04);
  rightLegGroup.add(rightBoot);

  // Right Arm (Weapon holding arm)
  const rightArmGroup = new THREE.Group();
  rightArmGroup.position.set(gender === 'girl' ? 0.32 : 0.36, 0.2, 0);
  torsoGroup.add(rightArmGroup);
  root.rightArm = rightArmGroup;

  const armGeo = new THREE.BoxGeometry(0.14, 0.6, 0.14);
  const rightArmMesh = new THREE.Mesh(armGeo, clothMat);
  rightArmMesh.position.y = -0.28;
  rightArmMesh.castShadow = true;
  rightArmGroup.add(rightArmMesh);

  // Left Arm (Foregrip support arm)
  const leftArmGroup = new THREE.Group();
  leftArmGroup.position.set(gender === 'girl' ? -0.32 : -0.36, 0.2, 0);
  torsoGroup.add(leftArmGroup);
  root.leftArm = leftArmGroup;

  const leftArmMesh = new THREE.Mesh(armGeo, clothMat);
  leftArmMesh.position.y = -0.28;
  leftArmMesh.castShadow = true;
  leftArmGroup.add(leftArmMesh);

  // Pose arms to hold weapon forward in firing posture
  rightArmGroup.rotation.x = -Math.PI / 2.3;
  rightArmGroup.rotation.y = -Math.PI / 10;
  leftArmGroup.rotation.x = -Math.PI / 2.4;
  leftArmGroup.rotation.y = Math.PI / 6;

  // Weapon Holder attached to Right Arm
  const weaponHolder = new THREE.Group();
  weaponHolder.position.set(0, -0.5, 0.1);
  rightArmGroup.add(weaponHolder);
  root.weaponHolder = weaponHolder;

  // Create 3D Weapon
  const gunMesh = create3DWeaponMesh(weaponType);
  weaponHolder.add(gunMesh);

  // Muzzle flash object at gun tip
  const flashGeo = new THREE.SphereGeometry(0.12, 8, 8);
  const flashMat = new THREE.MeshBasicMaterial({
    color: 0xffaa00,
    transparent: true,
    opacity: 0,
  });
  const muzzleFlash = new THREE.Mesh(flashGeo, flashMat);
  muzzleFlash.position.set(0, 0.08, 0.85); // at barrel tip
  weaponHolder.add(muzzleFlash);
  root.muzzleFlash = muzzleFlash;

  // Muzzle light
  const muzzleLight = new THREE.PointLight(0xffaa00, 0, 8);
  muzzleLight.position.set(0, 0.08, 0.85);
  weaponHolder.add(muzzleLight);
  root.muzzleLight = muzzleLight;

  return root;
}

/**
 * Creates 3D Gun (Assault Rifle, SMG, Shotgun, Sniper)
 */
export function create3DWeaponMesh(type: WeaponType = 'ar'): THREE.Group {
  const gunGroup = new THREE.Group();
  const gunMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.85,
    roughness: 0.3,
  });
  const detailMat = new THREE.MeshStandardMaterial({
    color: type === 'ar' ? 0xd97706 : type === 'smg' ? 0xdc2626 : 0x059669,
    metalness: 0.5,
    roughness: 0.4,
  });

  // Receiver / Body
  const receiverGeo = new THREE.BoxGeometry(0.08, 0.12, 0.5);
  const receiver = new THREE.Mesh(receiverGeo, gunMat);
  gunGroup.add(receiver);

  // Barrel
  const barrelLength = type === 'sniper' ? 0.75 : type === 'smg' ? 0.35 : 0.55;
  const barrelGeo = new THREE.CylinderGeometry(0.025, 0.025, barrelLength, 8);
  const barrel = new THREE.Mesh(barrelGeo, gunMat);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 0.03, 0.25 + barrelLength / 2);
  gunGroup.add(barrel);

  // Handguard / Detail
  const guardGeo = new THREE.BoxGeometry(0.09, 0.1, 0.25);
  const guard = new THREE.Mesh(guardGeo, detailMat);
  guard.position.set(0, 0.02, 0.32);
  gunGroup.add(guard);

  // Magazine Clip
  const magGeo = new THREE.BoxGeometry(0.06, 0.22, 0.1);
  const mag = new THREE.Mesh(magGeo, gunMat);
  mag.position.set(0, -0.12, 0.1);
  mag.rotation.x = Math.PI / 10;
  gunGroup.add(mag);

  // Pistol Grip
  const gripGeo = new THREE.BoxGeometry(0.06, 0.18, 0.08);
  const grip = new THREE.Mesh(gripGeo, gunMat);
  grip.position.set(0, -0.1, -0.15);
  grip.rotation.x = -Math.PI / 7;
  gunGroup.add(grip);

  // Stock (Shoulder rest)
  const stockGeo = new THREE.BoxGeometry(0.07, 0.14, 0.25);
  const stock = new THREE.Mesh(stockGeo, gunMat);
  stock.position.set(0, 0, -0.32);
  gunGroup.add(stock);

  // Tactical Scope / Sight on top
  const scopeGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.2, 8);
  const scope = new THREE.Mesh(scopeGeo, detailMat);
  scope.rotation.x = Math.PI / 2;
  scope.position.set(0, 0.1, 0.05);
  gunGroup.add(scope);

  gunGroup.scale.set(0.9, 0.9, 0.9);
  return gunGroup;
}

/**
 * Creates 3D House with interior floors, rooms, doorway (walkable inside), and windows.
 */
export function create3DHouse(
  width: number = 10,
  length: number = 12,
  height: number = 4.2,
  wallColor: number = 0xd4d4d8,
  roofColor: number = 0x991b1b
): { houseGroup: THREE.Group; bounds: { x: number; z: number; width: number; length: number }; doorZ: number } {
  const houseGroup = new THREE.Group();

  const wallMat = new THREE.MeshStandardMaterial({
    color: wallColor,
    roughness: 0.85,
  });
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x713f12,
    roughness: 0.9,
  });
  const roofMat = new THREE.MeshStandardMaterial({
    color: roofColor,
    roughness: 0.7,
  });

  const wallThickness = 0.35;
  const doorWidth = 2.4;
  const doorHeight = 2.8;

  // Floor
  const floorGeo = new THREE.BoxGeometry(width, 0.2, length);
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.position.y = 0.1;
  floor.receiveShadow = true;
  houseGroup.add(floor);

  // Back Wall (Solid)
  const backWallGeo = new THREE.BoxGeometry(width, height, wallThickness);
  const backWall = new THREE.Mesh(backWallGeo, wallMat);
  backWall.position.set(0, height / 2, -length / 2 + wallThickness / 2);
  backWall.castShadow = true;
  backWall.receiveShadow = true;
  houseGroup.add(backWall);

  // Left Wall (With window cutout)
  const leftWallGeo = new THREE.BoxGeometry(wallThickness, height, length);
  const leftWall = new THREE.Mesh(leftWallGeo, wallMat);
  leftWall.position.set(-width / 2 + wallThickness / 2, height / 2, 0);
  leftWall.castShadow = true;
  leftWall.receiveShadow = true;
  houseGroup.add(leftWall);

  // Right Wall (With window cutout)
  const rightWallGeo = new THREE.BoxGeometry(wallThickness, height, length);
  const rightWall = new THREE.Mesh(rightWallGeo, wallMat);
  rightWall.position.set(width / 2 - wallThickness / 2, height / 2, 0);
  rightWall.castShadow = true;
  rightWall.receiveShadow = true;
  houseGroup.add(rightWall);

  // Front Wall with Doorway (Split into left side, right side, and top lintel)
  const frontSideWidth = (width - doorWidth) / 2;

  // Front Left
  const frontLeftGeo = new THREE.BoxGeometry(frontSideWidth, height, wallThickness);
  const frontLeft = new THREE.Mesh(frontLeftGeo, wallMat);
  frontLeft.position.set(-doorWidth / 2 - frontSideWidth / 2, height / 2, length / 2 - wallThickness / 2);
  frontLeft.castShadow = true;
  houseGroup.add(frontLeft);

  // Front Right
  const frontRightGeo = new THREE.BoxGeometry(frontSideWidth, height, wallThickness);
  const frontRight = new THREE.Mesh(frontRightGeo, wallMat);
  frontRight.position.set(doorWidth / 2 + frontSideWidth / 2, height / 2, length / 2 - wallThickness / 2);
  frontRight.castShadow = true;
  houseGroup.add(frontRight);

  // Doorway top lintel
  const lintelHeight = height - doorHeight;
  const lintelGeo = new THREE.BoxGeometry(doorWidth, lintelHeight, wallThickness);
  const lintel = new THREE.Mesh(lintelGeo, wallMat);
  lintel.position.set(0, doorHeight + lintelHeight / 2, length / 2 - wallThickness / 2);
  lintel.castShadow = true;
  houseGroup.add(lintel);

  // Slanted Gable Roof
  const roofGeo = new THREE.ConeGeometry(Math.max(width, length) * 0.75, 2.2, 4);
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.set(0, height + 1.1, 0);
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  houseGroup.add(roof);

  // Interior Furniture / Supply Crates to take cover behind inside the house!
  const crateGeo = new THREE.BoxGeometry(1.2, 1.0, 1.2);
  const crateMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.8 });
  const crateInside = new THREE.Mesh(crateGeo, crateMat);
  crateInside.position.set(-width / 4, 0.5, -length / 4);
  crateInside.castShadow = true;
  houseGroup.add(crateInside);

  const bounds = {
    x: 0,
    z: 0,
    width,
    length,
  };

  return {
    houseGroup,
    bounds,
    doorZ: length / 2,
  };
}

/**
 * Creates 3D Tree
 */
export function create3DTree(): THREE.Group {
  const tree = new THREE.Group();

  const trunkGeo = new THREE.CylinderGeometry(0.3, 0.45, 3.5, 8);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x543d2b, roughness: 0.9 });
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = 1.75;
  trunk.castShadow = true;
  tree.add(trunk);

  const leavesGeo = new THREE.ConeGeometry(2.4, 4.5, 8);
  const leavesMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.8 });
  const leaves = new THREE.Mesh(leavesGeo, leavesMat);
  leaves.position.y = 4.8;
  leaves.castShadow = true;
  tree.add(leaves);

  const leavesTopGeo = new THREE.ConeGeometry(1.8, 3.2, 8);
  const leavesTop = new THREE.Mesh(leavesTopGeo, leavesMat);
  leavesTop.position.y = 6.2;
  leavesTop.castShadow = true;
  tree.add(leavesTop);

  return tree;
}

/**
 * Creates 3D Gloo Wall (Ice barricade)
 */
export function create3DGlooWall(): THREE.Group {
  const gw = new THREE.Group();
  const geo = new THREE.BoxGeometry(4.2, 2.4, 0.5);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    roughness: 0.15,
    metalness: 0.1,
    transparent: true,
    opacity: 0.85,
    emissive: 0x0284c7,
    emissiveIntensity: 0.3,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = 1.2;
  mesh.castShadow = true;
  gw.add(mesh);

  return gw;
}

/**
 * Creates 3D Explosive Barrel
 */
export function create3DBarrel(): THREE.Group {
  const barrel = new THREE.Group();
  const geo = new THREE.CylinderGeometry(0.5, 0.5, 1.4, 12);
  const mat = new THREE.MeshStandardMaterial({
    color: 0xdc2626,
    roughness: 0.4,
    metalness: 0.3,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = 0.7;
  mesh.castShadow = true;
  barrel.add(mesh);
  return barrel;
}
