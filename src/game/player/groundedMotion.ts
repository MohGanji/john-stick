/**
 * WS-040 — small pure helpers for vertical velocity when the KCC reports grounded.
 */

/** Drop downward velocity when grounded so gravity does not integrate into the floor. */
export function clampVerticalVelocityWhenGrounded(
  verticalVelocity: number,
  grounded: boolean,
): number {
  if (!grounded) return verticalVelocity;
  return verticalVelocity < 0 ? 0 : verticalVelocity;
}
