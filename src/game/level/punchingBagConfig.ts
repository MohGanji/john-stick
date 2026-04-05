import { TRAINING_HURT_VOLUME } from "../combat/combatHitConstants";

/**
 * WS-061 / GP §7.1.2 — heavy bag blockout + Rapier capsule (role-level-designer + physics).
 * Geometry is locked to `TRAINING_HURT_VOLUME` so WS-060 hit probes stay aligned; hurt sensor is parented to this body.
 */
const c = TRAINING_HURT_VOLUME.center;
const he = TRAINING_HURT_VOLUME.halfExtents;

export const PUNCHING_BAG = {
  centerX: c.x,
  centerY: c.y,
  centerZ: c.z,
  /** Vertical capsule; radius uses hurt depth (z) so the solid fits inside the hurt AABB on xz. */
  capsuleRadius: he.z,
  capsuleHalfHeight: he.y - he.z,
  linearDamping: 1.55,
  angularDamping: 2.35,
  /** Collider-only mass (kg-ish scale); density disabled via `setMass`. */
  colliderMassKg: 52,
  friction: 0.62,
  restitution: 0.05,
  /** Placeholder stand (m). */
  standRadius: 0.045,
} as const;

/** World-space Y of the top mount (spherical joint anchors meet here at rest). */
export function punchingBagPivotWorldY(): number {
  return (
    PUNCHING_BAG.centerY +
    PUNCHING_BAG.capsuleHalfHeight +
    PUNCHING_BAG.capsuleRadius
  );
}

/** Local +Y from bag body origin to the pivot (same world point at rest). */
export function punchingBagPivotLocalAnchorY(): number {
  return PUNCHING_BAG.capsuleHalfHeight + PUNCHING_BAG.capsuleRadius;
}
