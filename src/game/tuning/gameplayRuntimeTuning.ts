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
  type BaseAttackMoveId,
  type SphereStrikeProfile,
} from "../combat/baseMoveTable";
import {
  COMPOUND_MOVE_TABLE,
  resolveStrikeInputCooldownSec,
  type CompoundStrikeMoveId,
} from "../combat/compoundMoveTable";
import type { StrikeMoveId } from "../input/combatIntent";
import {
  DEFAULT_HIT_BURST_VFX_STYLE_ID,
  type HitBurstVfxStyleId,
} from "../vfx/hitBurstVfxPresets";
import {
  DEFAULT_COMBAT_STAMINA,
  type CombatStaminaTuning,
} from "../combat/combatStamina";

/** Live bag scalars — impulses only; damage uses `combatBasics.basePunchDamage` × tier table. */
export type BagHitScalars = {
  basePlanarImpulse: number;
  upwardImpulse: number;
};

/**
 * Global combat baseline for tuning (dev HUD).
 * **`baseEnemyHealth`** is authored for the **reference enemy** (training dummy today); other enemies multiply from these (×N later).
 * @see `docs/FUTURE_DESIGN_NOTES.md` — “Enemies: training dummy as canonical feel + size scaling”
 */
export type CombatBasicsScalars = {
  /** Tier-0 punch damage before `bagDamageTierMultiplier` (GP §6.2.2). */
  basePunchDamage: number;
  /** Max “lab HP” for a basic target (training dummy ragdoll when cumulative damage ≥ this). */
  baseEnemyHealth: number;
};

/**
 * **Canonical enemy hit-receive feel** (dev HUD): kickback, spin, reaction timing, ragdoll get-up.
 * The training dummy is the first instance; future enemies should reuse these curves/scalars before adding per-archetype overrides.
 * **Size scaling** (mass/height vs reference) is deferred — see `docs/FUTURE_DESIGN_NOTES.md`.
 */
export type TrainingDummyFeelScalars = {
  /** Multiplier on planar + upward strike impulse vs bag-tuned base. */
  kickbackScale: number;
  /**
   * 0 = mostly center-of-mass push, high angular damping; 1 = more fist impulse + spinier.
   */
  spinAmount: number;
  /** Rapier linear damping while dynamic (slide distance after shove). */
  linearDamping: number;
  /** Pre-ragdoll hit flash length. */
  hitReactSec: number;
  /** Pre-ragdoll stagger before stand-up or ragdoll threshold exit. */
  staggerHoldSec: number;
  /** Ragdoll: minimum time down before recover can start (if settled). */
  ragdollDownBeforeRecoverSec: number;
  /** Ragdoll: kinematic blend duration back to spawn (longer = slower stand-up). */
  ragdollStandUpBlendSec: number;
  /** Ragdoll: force recover after this long if still down. */
  ragdollDownMaxSec: number;
  /** Below knockdown: in-place stand blend after stagger. */
  lightHitStandBlendSec: number;
  /** Ragdoll exit: max planar speed to count as “settled”. */
  ragdollSettlePlanarSpeed: number;
  /** Ragdoll exit: max angular speed to count as “settled”. */
  ragdollSettleAngSpeed: number;
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
  combatBasics: CombatBasicsScalars;
  trainingDummyFeel: TrainingDummyFeelScalars;
  /**
   * WS-080 + WS-081 — sphere probes + input cooldown (dev HUD overwrites shipped table defaults).
   */
  strikes: Record<StrikeMoveId, BaseStrikeTuningRow>;
  /** GP §2.2.2 — strike stamina pool + regen (HUD bar); also drives strike lunge scalar. */
  combatStamina: CombatStaminaTuning;
  player: PlayerLocomotionScalars;
  cameraFollow: CameraFollowScalars;
  camera: CameraRenderScalars;
  audio: AudioDevScalars;
  vfx: VfxDevScalars;
  resetJuice(): void;
  resetBag(): void;
  resetCombatBasics(): void;
  resetTrainingDummyFeel(): void;
  resetStrikes(): void;
  resetCombatStamina(): void;
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
  };
}

function defaultCombatBasics(): CombatBasicsScalars {
  return {
    basePunchDamage: BAG_HIT_TUNING.baseDamage,
    baseEnemyHealth: 100,
  };
}

export function defaultTrainingDummyFeel(): TrainingDummyFeelScalars {
  return {
    kickbackScale: 2,
    spinAmount: 0.22,
    linearDamping: 0.95,
    hitReactSec: 0.09,
    staggerHoldSec: 0.52,
    ragdollDownBeforeRecoverSec: 0.82,
    ragdollStandUpBlendSec: 0.55,
    ragdollDownMaxSec: 4.6,
    lightHitStandBlendSec: 0.38,
    ragdollSettlePlanarSpeed: 0.42,
    ragdollSettleAngSpeed: 0.62,
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
    compound_dual_punch: "exaggerated_slam",
    compound_dual_kick: "cinematic_heavy",
    compound_mixed: "anime_whip_crack",
    compound_multi: "cinematic_heavy",
    sequence_strike: "dojo_martial",
  };
}

function defaultAudio(): AudioDevScalars {
  return {
    trainingBagSfxByAttackKind: defaultTrainingBagSfxByAttackKind(),
  };
}

function defaultStrikes(): Record<StrikeMoveId, BaseStrikeTuningRow> {
  const out = {} as Record<StrikeMoveId, BaseStrikeTuningRow>;
  for (const id of Object.keys(BASE_MOVE_TABLE) as BaseAttackMoveId[]) {
    const row = BASE_MOVE_TABLE[id];
    out[id] = {
      profile: { ...row.profile },
      inputCooldownAfterStrikeSec: resolveStrikeInputCooldownSec(id),
    };
  }
  for (const id of Object.keys(COMPOUND_MOVE_TABLE) as CompoundStrikeMoveId[]) {
    const row = COMPOUND_MOVE_TABLE[id];
    out[id] = {
      profile: { ...row.profile },
      inputCooldownAfterStrikeSec: resolveStrikeInputCooldownSec(id),
    };
  }
  return out;
}

function applyDefaultStrikesInPlace(
  dst: Record<StrikeMoveId, BaseStrikeTuningRow>,
): void {
  const next = defaultStrikes();
  for (const id of Object.keys(next) as StrikeMoveId[]) {
    const row = next[id]!;
    dst[id].profile = { ...row.profile };
    dst[id].inputCooldownAfterStrikeSec = row.inputCooldownAfterStrikeSec;
  }
}

function defaultVfx(): VfxDevScalars {
  return { hitBurstStyle: DEFAULT_HIT_BURST_VFX_STYLE_ID };
}

function defaultCombatStamina(): CombatStaminaTuning {
  return { ...DEFAULT_COMBAT_STAMINA };
}

/**
 * Mutable gameplay scalars for dev tuning overlay and future settings.
 * Initialized from the same sources as module constants (`PLAYER_CAPSULE`, etc.).
 */
export function createGameplayRuntimeTuning(): GameplayRuntimeTuning {
  const juice = defaultJuice();
  const bag = defaultBag();
  const combatBasics = defaultCombatBasics();
  const trainingDummyFeel = defaultTrainingDummyFeel();
  const strikes = defaultStrikes();
  const player = defaultPlayer();
  const cameraFollow = defaultCameraFollow();
  const camera = defaultCamera();
  const audio = defaultAudio();
  const vfx = defaultVfx();
  const combatStamina = defaultCombatStamina();

  return {
    juice,
    bag,
    combatBasics,
    trainingDummyFeel,
    strikes,
    combatStamina,
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
    resetCombatBasics() {
      Object.assign(combatBasics, defaultCombatBasics());
    },
    resetTrainingDummyFeel() {
      Object.assign(trainingDummyFeel, defaultTrainingDummyFeel());
    },
    resetStrikes() {
      applyDefaultStrikesInPlace(strikes);
    },
    resetCombatStamina() {
      Object.assign(combatStamina, defaultCombatStamina());
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
      Object.assign(combatBasics, defaultCombatBasics());
      Object.assign(trainingDummyFeel, defaultTrainingDummyFeel());
      Object.assign(player, defaultPlayer());
      Object.assign(cameraFollow, defaultCameraFollow());
      Object.assign(camera, defaultCamera());
      Object.assign(audio, defaultAudio());
      Object.assign(vfx, defaultVfx());
      applyDefaultStrikesInPlace(strikes);
      Object.assign(combatStamina, defaultCombatStamina());
    },
  };
}
