/**
 * WS-093 — harmless dojo sparring partner: same capsule / hurt footprint as the training dummy,
 * different spawn so bag + dummy + partner can coexist for lab hits on a moving target.
 */
import { TRAINING_DUMMY_HURT_VOLUME } from "../combat/combatHitConstants";
import { PLAYER_CAPSULE } from "../player/playerCapsuleConfig";
import { DOJO_BLOCKOUT } from "./dojoBlockout";
import { PUNCHING_BAG } from "./punchingBagConfig";
import { TRAINING_DUMMY_PHYSICS } from "./trainingDummyConfig";

const he = TRAINING_DUMMY_HURT_VOLUME.halfExtents;

/** Hurt sensor center (world); same half extents as training dummy torso box. */
export const SPARRING_NPC_HURT_VOLUME = {
  center: { x: -3.6, y: TRAINING_DUMMY_HURT_VOLUME.center.y, z: 0.9 },
  halfExtents: { x: he.x, y: he.y, z: he.z },
} as const;

export const SPARRING_NPC_PHYSICS = {
  centerX: SPARRING_NPC_HURT_VOLUME.center.x,
  centerY: SPARRING_NPC_HURT_VOLUME.center.y,
  centerZ: SPARRING_NPC_HURT_VOLUME.center.z,
  capsuleHalfHeight: PLAYER_CAPSULE.halfHeight,
  capsuleRadius: PLAYER_CAPSULE.radius,
  linearDamping: TRAINING_DUMMY_PHYSICS.linearDamping,
  angularDamping: TRAINING_DUMMY_PHYSICS.angularDamping,
  colliderMassKg: TRAINING_DUMMY_PHYSICS.colliderMassKg,
  friction: TRAINING_DUMMY_PHYSICS.friction,
  restitution: TRAINING_DUMMY_PHYSICS.restitution,
} as const;

export const SPARRING_NPC_SPAWN_TRANSFORM = {
  x: SPARRING_NPC_PHYSICS.centerX,
  y: SPARRING_NPC_PHYSICS.centerY,
  z: SPARRING_NPC_PHYSICS.centerZ,
  qx: 0,
  qy: 0,
  qz: 0,
  qw: 1,
} as const;

/** Inset from dojo walls for wander waypoints (meters). */
export const SPARRING_NPC_WANDER_MARGIN = 1.35;

/** Planar speed cap while wandering (m/s). */
export const SPARRING_NPC_WANDER_SPEED = 1.15;

/** Pick a new goal when within this radius of the current goal (meters). */
export const SPARRING_NPC_WANDER_GOAL_RADIUS = 0.45;

/** Seconds between forced goal repicks (avoids hugging walls). */
export const SPARRING_NPC_WANDER_REPICK_SEC = 4.2;

/** Circular keep-outs (XZ) so the partner does not orbit the bag or static dummy. */
export const SPARRING_NPC_WANDER_EXCLUSIONS: readonly {
  x: number;
  z: number;
  radius: number;
}[] = [
  { x: PUNCHING_BAG.centerX, z: PUNCHING_BAG.centerZ, radius: 1.85 },
  { x: TRAINING_DUMMY_PHYSICS.centerX, z: TRAINING_DUMMY_PHYSICS.centerZ, radius: 1.35 },
];

export function sparringNpcWanderBounds(): {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
} {
  const m = SPARRING_NPC_WANDER_MARGIN;
  const { floorHalfWidth, floorHalfDepth } = DOJO_BLOCKOUT;
  return {
    minX: -floorHalfWidth + m,
    maxX: floorHalfWidth - m,
    minZ: -floorHalfDepth + m,
    maxZ: floorHalfDepth - m,
  };
}
