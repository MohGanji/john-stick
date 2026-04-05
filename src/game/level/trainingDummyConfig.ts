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
  linearDamping: 1.12,
  angularDamping: 1.9,
  colliderMassKg: 64,
  friction: 0.82,
  restitution: 0.05,
} as const;
