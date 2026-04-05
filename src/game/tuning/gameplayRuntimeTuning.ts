import * as THREE from "three";

import { BAG_HIT_TUNING } from "../combat/bagHitTuning";
import type { CombatJuiceTuningValues } from "../combat/combatJuiceTuning";
import { COMBAT_JUICE_TUNING } from "../combat/combatJuiceTuning";
import { THIRD_PERSON_FOLLOW } from "../camera/thirdPersonFollowCamera";
import { KEYBOARD_LOCOMOTION } from "../input/keyboardLocomotion";
import { PLAYER_CAPSULE } from "../player/playerCapsuleConfig";
import { DEFAULT_PERSPECTIVE_FOV_DEG } from "../render/johnStickRenderSetup";

/** Live bag scalars (tier multiplier tables stay on `BAG_HIT_TUNING`). */
export type BagHitScalars = {
  basePlanarImpulse: number;
  upwardImpulse: number;
  baseDamage: number;
};

export type PlayerLocomotionScalars = {
  /** W/S max planar speed (m/s). */
  forwardMoveSpeed: number;
  /** A/D strafe max planar speed (m/s). */
  strafeMoveSpeed: number;
  /** A/D hold-to-yaw (degrees per second; same keys as strafe). */
  yawDegPerSec: number;
  jumpVelocity: number;
  gravityY: number;
};

export type CameraFollowScalars = {
  armLength: number;
  smoothHalfLifeSec: number;
  pivotYOffset: number;
  /** Degrees above horizontal for orbit pitch (drives `pitchFromHorizontal`). */
  pitchDeg: number;
};

export type CameraRenderScalars = {
  baseFovDeg: number;
};

export type GameplayRuntimeTuning = {
  juice: CombatJuiceTuningValues;
  bag: BagHitScalars;
  player: PlayerLocomotionScalars;
  cameraFollow: CameraFollowScalars;
  camera: CameraRenderScalars;
  resetJuice(): void;
  resetBag(): void;
  resetPlayer(): void;
  resetCameraFollow(): void;
  resetCamera(): void;
  resetAll(): void;
};

function defaultJuice(): CombatJuiceTuningValues {
  return { ...COMBAT_JUICE_TUNING };
}

function defaultBag(): BagHitScalars {
  return {
    basePlanarImpulse: BAG_HIT_TUNING.basePlanarImpulse,
    upwardImpulse: BAG_HIT_TUNING.upwardImpulse,
    baseDamage: BAG_HIT_TUNING.baseDamage,
  };
}

function defaultPlayer(): PlayerLocomotionScalars {
  return {
    forwardMoveSpeed: PLAYER_CAPSULE.moveSpeed,
    strafeMoveSpeed: PLAYER_CAPSULE.strafeMoveSpeed,
    yawDegPerSec: KEYBOARD_LOCOMOTION.yawDegPerSec,
    jumpVelocity: PLAYER_CAPSULE.jumpVelocity,
    gravityY: PLAYER_CAPSULE.gravityY,
  };
}

function defaultCameraFollow(): CameraFollowScalars {
  return {
    armLength: THIRD_PERSON_FOLLOW.armLength,
    smoothHalfLifeSec: THIRD_PERSON_FOLLOW.smoothHalfLifeSec,
    pivotYOffset: THIRD_PERSON_FOLLOW.pivotYOffset,
    pitchDeg: THREE.MathUtils.radToDeg(THIRD_PERSON_FOLLOW.pitchFromHorizontal),
  };
}

function defaultCamera(): CameraRenderScalars {
  return { baseFovDeg: DEFAULT_PERSPECTIVE_FOV_DEG };
}

/**
 * Mutable gameplay scalars for dev tuning overlay and future settings.
 * Initialized from the same sources as module constants (`PLAYER_CAPSULE`, etc.).
 */
export function createGameplayRuntimeTuning(): GameplayRuntimeTuning {
  const juice = defaultJuice();
  const bag = defaultBag();
  const player = defaultPlayer();
  const cameraFollow = defaultCameraFollow();
  const camera = defaultCamera();

  return {
    juice,
    bag,
    player,
    cameraFollow,
    camera,
    resetJuice() {
      Object.assign(juice, defaultJuice());
    },
    resetBag() {
      Object.assign(bag, defaultBag());
    },
    resetPlayer() {
      Object.assign(player, defaultPlayer());
    },
    resetCameraFollow() {
      Object.assign(cameraFollow, defaultCameraFollow());
    },
    resetCamera() {
      Object.assign(camera, defaultCamera());
    },
    resetAll() {
      Object.assign(juice, defaultJuice());
      Object.assign(bag, defaultBag());
      Object.assign(player, defaultPlayer());
      Object.assign(cameraFollow, defaultCameraFollow());
      Object.assign(camera, defaultCamera());
    },
  };
}
