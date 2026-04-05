/**
 * WS-090 — dynamic training dummy: same capsule footprint as the hero (`PLAYER_CAPSULE`) so the
 * shared stick glTF lines up with Rapier; tuning separate from the heavy bag (`punchingBagConfig`).
 */
import { TRAINING_DUMMY_HURT_VOLUME } from "../combat/combatHitConstants";
import { PLAYER_CAPSULE } from "../player/playerCapsuleConfig";

export const TRAINING_DUMMY_PHYSICS = {
  centerX: TRAINING_DUMMY_HURT_VOLUME.center.x,
  centerY: TRAINING_DUMMY_HURT_VOLUME.center.y,
  centerZ: TRAINING_DUMMY_HURT_VOLUME.center.z,
  capsuleHalfHeight: PLAYER_CAPSULE.halfHeight,
  capsuleRadius: PLAYER_CAPSULE.radius,
  /** Slightly lower than before so a strong shove carries farther after COM-heavy hits. */
  linearDamping: 0.95,
  /** High spin decay — point impulse is small; collisions still get damped quickly. */
  angularDamping: 5.5,
  colliderMassKg: 64,
  friction: 0.82,
  restitution: 0.05,
} as const;

/** WS-091 — upright spawn pose for recover blend (GP §6.1.3); keep in sync with `TRAINING_DUMMY_PHYSICS`. */
export const TRAINING_DUMMY_SPAWN_TRANSFORM = {
  x: TRAINING_DUMMY_PHYSICS.centerX,
  y: TRAINING_DUMMY_PHYSICS.centerY,
  z: TRAINING_DUMMY_PHYSICS.centerZ,
  qx: 0,
  qy: 0,
  qz: 0,
  qw: 1,
} as const;
