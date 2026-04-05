import * as THREE from "three";

/**
 * WS-030 / GP §3.1.1 — third-person follow: **fixed pitch** (orbit polar angle), **targets**
 * the player pivot. Horizontal orbit angle is `cameraYawRad` (keyboard yaw → WS-032).
 * Collision pull-in is **WS-031**.
 */
export const THIRD_PERSON_FOLLOW = {
  /** Camera–pivot distance (meters). */
  armLength: 5.2,
  /** Polar angle above the horizontal ring (radians); locked for v1 (no mouse look). */
  pitchFromHorizontal: THREE.MathUtils.degToRad(24),
  /** Pivot = body translation + this Y offset (meters). */
  pivotYOffset: 0.28,
  /** Position smoothing half-life (seconds); 0 = snap each frame. */
  smoothHalfLifeSec: 0.1,
} as const;

const pivot = new THREE.Vector3();
const desiredCam = new THREE.Vector3();

export type ThirdPersonFollowScratch = {
  /** Warm-started near `createJohnStickRenderSetup` default so first frame is stable. */
  smoothedCameraWorld: THREE.Vector3;
};

export function createThirdPersonFollowScratch(): ThirdPersonFollowScratch {
  return {
    smoothedCameraWorld: new THREE.Vector3(0, 7.0, 21.0),
  };
}

/**
 * Places `camera` to orbit `playerBodyPos` at fixed pitch; `camera.lookAt` hits the pivot.
 * Call from `lateUpdate` after sampling the player pose (GP §4.2.3).
 */
export function updateThirdPersonFollowCamera(
  camera: THREE.PerspectiveCamera,
  playerBodyPos: { x: number; y: number; z: number },
  cameraYawRad: number,
  dtSeconds: number,
  scratch: ThirdPersonFollowScratch,
): void {
  const { armLength, pitchFromHorizontal, pivotYOffset, smoothHalfLifeSec } =
    THIRD_PERSON_FOLLOW;

  const h = armLength * Math.cos(pitchFromHorizontal);
  const v = armLength * Math.sin(pitchFromHorizontal);
  const sy = Math.sin(cameraYawRad);
  const cy = Math.cos(cameraYawRad);

  pivot.set(
    playerBodyPos.x,
    playerBodyPos.y + pivotYOffset,
    playerBodyPos.z,
  );

  // Yaw 0 → camera on −Z of pivot (dojo +Z open); raised by fixed pitch.
  desiredCam.set(pivot.x - sy * h, pivot.y + v, pivot.z - cy * h);

  const alpha =
    smoothHalfLifeSec <= 0 || dtSeconds <= 0
      ? 1
      : 1 - Math.pow(0.5, dtSeconds / smoothHalfLifeSec);
  scratch.smoothedCameraWorld.lerp(desiredCam, alpha);

  camera.position.copy(scratch.smoothedCameraWorld);
  camera.up.set(0, 1, 0);
  camera.lookAt(pivot);
}
