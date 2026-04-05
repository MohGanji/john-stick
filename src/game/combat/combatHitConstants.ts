/**
 * WS-060 / GP §6.2.1 — hit probe + training hurt volume tuning (gameplay programmer).
 */
export const LEFT_PUNCH_HIT = {
  /** Rapier `Ball` radius for the fist probe (meters). */
  radius: 0.12,
  /** Forward reach from capsule origin along facing (meters). */
  reach: 0.52,
  /** Lateral offset along “player left” from facing (meters). */
  sideOffset: 0.22,
  /** Vertical offset from capsule translation (center) to fist height (meters). */
  heightFromCapsuleCenter: 0.18,
  /** Fixed-step active window after a clean left-punch press (60 Hz ticks). */
  activeFrames: 4,
} as const;

/** World-space AABB for the dojo training bag hurt sensor (shared: Rapier + debug draw). */
export const TRAINING_HURT_VOLUME = {
  center: { x: 0, y: 1.05, z: 6 },
  /** Default rest pose at spawn; hurt collider is on the swinging bag — center moves with it. */
  /** Wider x / larger z radius = fatter capsule; y sets overall vertical span with `punchingBagConfig` math. */
  halfExtents: { x: 0.54, y: 0.96, z: 0.34 },
} as const;
