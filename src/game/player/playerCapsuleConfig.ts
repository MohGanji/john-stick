/**
 * WS-040 / GP §3.3.1 — capsule character tuning (gameplay + physics).
 * Single source for Rapier collider, render mesh, and locomotion constants.
 */
export const PLAYER_CAPSULE = {
  halfHeight: 0.52,
  radius: 0.22,
  /** Rapier KCC skin; must be > 0 (see Rapier character controller docs). */
  characterControllerOffset: 0.02,
  /** W/S max planar speed (m/s); brisk “almost run” until walk/run split if we add one. */
  moveSpeed: 7.35,
  /** A/D strafe max planar speed (m/s); lower than forward so turn-heavy A/D reads cleaner. */
  strafeMoveSpeed: 0.35,
  jumpVelocity: 7.85,
  /** Matches `World` gravity in `rapierWorld.ts` for consistent falls. */
  gravityY: -28,
  /** Spawn slightly above dojo floor top (y = 0). */
  spawnClearance: 0.05,
} as const;

export function playerCapsuleCenterY(): number {
  return (
    PLAYER_CAPSULE.halfHeight +
    PLAYER_CAPSULE.radius +
    PLAYER_CAPSULE.spawnClearance
  );
}
