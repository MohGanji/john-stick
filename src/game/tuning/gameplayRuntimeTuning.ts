import * as THREE from "three";

import { BAG_HIT_TUNING } from "../combat/bagHitTuning";
import type { CombatJuiceTuningValues } from "../combat/combatJuiceTuning";
import { COMBAT_JUICE_TUNING } from "../combat/combatJuiceTuning";
import { THIRD_PERSON_FOLLOW } from "../camera/thirdPersonFollowCamera";
import { KEYBOARD_LOCOMOTION } from "../input/keyboardLocomotion";
import { PLAYER_CAPSULE } from "../player/playerCapsuleConfig";
import { DEFAULT_PERSPECTIVE_FOV_DEG } from "../render/johnStickRenderSetup";
import type { TrainingBagSfxStyleId } from "../audio/trainingBagSfxPresets";
import type { CombatHitAttackKind } from "../combat/combatEventBus";
import {
  BASE_MOVE_TABLE,
  strikeInputCooldownAfterSec,
  type BaseAttackMoveId,
  type SphereStrikeProfile,
} from "../combat/baseMoveTable";
import {
  DEFAULT_HIT_BURST_VFX_STYLE_ID,
  type HitBurstVfxStyleId,
} from "../vfx/hitBurstVfxPresets";

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

/** Per base limb — procedural preset picked on `combat_hit` (WS-072+). */
export type TrainingBagSfxByAttackKind = Record<
  CombatHitAttackKind,
  TrainingBagSfxStyleId
>;

export type BaseStrikeTuningRow = {
  profile: SphereStrikeProfile;
  inputCooldownAfterStrikeSec: number;
};

export type AudioDevScalars = {
  trainingBagSfxByAttackKind: TrainingBagSfxByAttackKind;
};

export type VfxDevScalars = {
  /** Hit burst preset (dev HUD); WS-073 `Points` burst on `combat_hit`. */
  hitBurstStyle: HitBurstVfxStyleId;
};

export type GameplayRuntimeTuning = {
  juice: CombatJuiceTuningValues;
  bag: BagHitScalars;
  /** WS-080 — live hit probes + input cooldown (dev HUD overwrites shipped table defaults). */
  baseStrikes: Record<BaseAttackMoveId, BaseStrikeTuningRow>;
  player: PlayerLocomotionScalars;
  cameraFollow: CameraFollowScalars;
  camera: CameraRenderScalars;
  audio: AudioDevScalars;
  vfx: VfxDevScalars;
  resetJuice(): void;
  resetBag(): void;
  resetBaseStrikes(): void;
  resetPlayer(): void;
  resetCameraFollow(): void;
  resetCamera(): void;
  resetAudio(): void;
  resetVfx(): void;
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

function defaultTrainingBagSfxByAttackKind(): TrainingBagSfxByAttackKind {
  return {
    left_punch: "dojo_martial",
    right_punch: "arcade_bright",
    left_kick: "springy_rubber",
    right_kick: "gritty_thump",
  };
}

function defaultAudio(): AudioDevScalars {
  return {
    trainingBagSfxByAttackKind: defaultTrainingBagSfxByAttackKind(),
  };
}

function defaultBaseStrikes(): Record<BaseAttackMoveId, BaseStrikeTuningRow> {
  const ids = Object.keys(BASE_MOVE_TABLE) as BaseAttackMoveId[];
  const out = {} as Record<BaseAttackMoveId, BaseStrikeTuningRow>;
  for (const id of ids) {
    const row = BASE_MOVE_TABLE[id];
    out[id] = {
      profile: { ...row.profile },
      inputCooldownAfterStrikeSec: strikeInputCooldownAfterSec(id),
    };
  }
  return out;
}

function applyDefaultBaseStrikesInPlace(
  dst: Record<BaseAttackMoveId, BaseStrikeTuningRow>,
): void {
  const next = defaultBaseStrikes();
  for (const id of Object.keys(next) as BaseAttackMoveId[]) {
    const row = next[id]!;
    dst[id].profile = { ...row.profile };
    dst[id].inputCooldownAfterStrikeSec = row.inputCooldownAfterStrikeSec;
  }
}

function defaultVfx(): VfxDevScalars {
  return { hitBurstStyle: DEFAULT_HIT_BURST_VFX_STYLE_ID };
}

/**
 * Mutable gameplay scalars for dev tuning overlay and future settings.
 * Initialized from the same sources as module constants (`PLAYER_CAPSULE`, etc.).
 */
export function createGameplayRuntimeTuning(): GameplayRuntimeTuning {
  const juice = defaultJuice();
  const bag = defaultBag();
  const baseStrikes = defaultBaseStrikes();
  const player = defaultPlayer();
  const cameraFollow = defaultCameraFollow();
  const camera = defaultCamera();
  const audio = defaultAudio();
  const vfx = defaultVfx();

  return {
    juice,
    bag,
    baseStrikes,
    player,
    cameraFollow,
    camera,
    audio,
    vfx,
    resetJuice() {
      Object.assign(juice, defaultJuice());
    },
    resetBag() {
      Object.assign(bag, defaultBag());
    },
    resetBaseStrikes() {
      applyDefaultBaseStrikesInPlace(baseStrikes);
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
    resetAudio() {
      Object.assign(audio, defaultAudio());
    },
    resetVfx() {
      Object.assign(vfx, defaultVfx());
    },
    resetAll() {
      Object.assign(juice, defaultJuice());
      Object.assign(bag, defaultBag());
      Object.assign(player, defaultPlayer());
      Object.assign(cameraFollow, defaultCameraFollow());
      Object.assign(camera, defaultCamera());
      Object.assign(audio, defaultAudio());
      Object.assign(vfx, defaultVfx());
      applyDefaultBaseStrikesInPlace(baseStrikes);
    },
  };
}
