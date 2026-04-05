import RAPIER from "@dimforge/rapier3d-compat";
import * as THREE from "three";

import { CAMERA_PROBE_GROUPS } from "../physics/collisionLayers";

/**
 * WS-030 / GP §3.1.1 — third-person follow: **fixed pitch** (orbit polar angle), **targets**
 * the player pivot. Horizontal orbit angle is `cameraYawRad` (keyboard yaw → WS-032).
 * WS-031 — spherecast pull-in via Rapier `World.castShape` (Ball).
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
  /** WS-031 — sweep sphere radius for camera obstruction (meters). */
  collisionSphereRadius: 0.16,
  /** Extra slack toward pivot after a hit (meters); reduces view clipping / precision pops. */
  collisionSkin: 0.05,
  /** Minimum camera–pivot distance when obstructed (meters). */
  collisionMinArm: 0.48,
} as const;

const pivot = new THREE.Vector3();
const desiredCam = new THREE.Vector3();
const idealCamScratch = new THREE.Vector3();
const pullRayDir = new THREE.Vector3();
const shapeVel = { x: 0, y: 0, z: 0 };
const pivotRapier = { x: 0, y: 0, z: 0 };

const cameraProbeBall = new RAPIER.Ball(THIRD_PERSON_FOLLOW.collisionSphereRadius);
const cameraProbeRot = RAPIER.RotationOps.identity();

export type ThirdPersonFollowScratch = {
  /** Warm-started near `createJohnStickRenderSetup` default so first frame is stable. */
  smoothedCameraWorld: THREE.Vector3;
};

/** WS-031 — optional Rapier pull-in; excludes the followed body so the probe does not hit self. */
export type ThirdPersonCameraCollision = {
  world: RAPIER.World;
  excludeRigidBody: RAPIER.RigidBody;
};

export function createThirdPersonFollowScratch(): ThirdPersonFollowScratch {
  return {
    smoothedCameraWorld: new THREE.Vector3(0, 7.0, 21.0),
  };
}

function applyPullIn(
  world: RAPIER.World,
  excludeRigidBody: RAPIER.RigidBody,
  idealCam: THREE.Vector3,
): void {
  const { collisionSkin, collisionMinArm, armLength } = THIRD_PERSON_FOLLOW;

  pullRayDir.copy(idealCam).sub(pivot);
  const chord = pullRayDir.length();
  if (chord < 1e-4) {
    desiredCam.copy(idealCam);
    return;
  }
  pullRayDir.multiplyScalar(1 / chord);

  pivotRapier.x = pivot.x;
  pivotRapier.y = pivot.y;
  pivotRapier.z = pivot.z;

  const castLen = Math.min(chord, armLength + 0.25);
  shapeVel.x = pullRayDir.x * castLen;
  shapeVel.y = pullRayDir.y * castLen;
  shapeVel.z = pullRayDir.z * castLen;

  const hit = world.castShape(
    pivotRapier,
    cameraProbeRot,
    shapeVel,
    cameraProbeBall,
    0,
    1,
    false,
    undefined,
    CAMERA_PROBE_GROUPS,
    undefined,
    excludeRigidBody,
  );

  if (!hit) {
    desiredCam.copy(idealCam);
    return;
  }

  const along = Math.max(
    collisionMinArm,
    hit.time_of_impact * castLen - collisionSkin,
  );
  desiredCam.copy(pivot).addScaledVector(pullRayDir, along);
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
  collision?: ThirdPersonCameraCollision,
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
  const idealCamX = pivot.x - sy * h;
  const idealCamY = pivot.y + v;
  const idealCamZ = pivot.z - cy * h;

  if (collision) {
    idealCamScratch.set(idealCamX, idealCamY, idealCamZ);
    applyPullIn(collision.world, collision.excludeRigidBody, idealCamScratch);
  } else {
    desiredCam.set(idealCamX, idealCamY, idealCamZ);
  }

  const alpha =
    smoothHalfLifeSec <= 0 || dtSeconds <= 0
      ? 1
      : 1 - Math.pow(0.5, dtSeconds / smoothHalfLifeSec);
  scratch.smoothedCameraWorld.lerp(desiredCam, alpha);

  camera.position.copy(scratch.smoothedCameraWorld);
  camera.up.set(0, 1, 0);
  camera.lookAt(pivot);
}
