/**
 * WS-040 / REPO_CONVENTIONS — **facing-relative** XZ move: yaw 0 → forward = **+Z**
 * (camera sits on −Z at yaw 0; see `thirdPersonFollowCamera.ts`).
 */
export function facingRelativeMoveXZ(
  facingYawRad: number,
  forwardSigned: number,
  strafeSigned: number,
): { wx: number; wz: number } {
  const sy = Math.sin(facingYawRad);
  const cy = Math.cos(facingYawRad);
  let wx = sy * forwardSigned - cy * strafeSigned;
  let wz = cy * forwardSigned + sy * strafeSigned;
  const len = Math.hypot(wx, wz);
  if (len > 1e-8 && len > 1) {
    wx /= len;
    wz /= len;
  }
  return { wx, wz };
}

/**
 * Unit direction in XZ for the character’s **left** (matches **KeyA** / strafe −1 at this yaw).
 * Use for limb offsets (punches/kicks) so hit probes stay consistent with locomotion handedness.
 */
export function characterLeftUnitXZ(facingYawRad: number): { x: number; z: number } {
  const { wx, wz } = facingRelativeMoveXZ(facingYawRad, 0, -1);
  return { x: wx, z: wz };
}

/** Character’s **right** (strafe +1 / **KeyD**). */
export function characterRightUnitXZ(facingYawRad: number): { x: number; z: number } {
  const { wx, wz } = facingRelativeMoveXZ(facingYawRad, 0, 1);
  return { x: wx, z: wz };
}
