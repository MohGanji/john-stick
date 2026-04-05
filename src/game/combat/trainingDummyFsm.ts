/**
 * WS-090 / WS-091 / GP §2.1.2, §6.1 — dummy reactions: idle → hit → stagger → idle, or ragdoll → recover (kinematic blend).
 */
export type TrainingDummyPhase =
  | "idle"
  | "hit"
  | "stagger"
  /** Light-hit reaction: kinematic blend upright **in place** (XZ + yaw kept) after stagger. */
  | "stand_up"
  | "ragdoll"
  | "recover";

export type TrainingDummyFsm = {
  phase: TrainingDummyPhase;
  /** Seconds since entering `phase` (fixed-step). */
  timeInPhaseSec: number;
  /** Planar direction of last strike impulse (XZ), for stagger lean; zero if unknown. */
  lastHitPlanarX: number;
  lastHitPlanarZ: number;
  recoverBlendFromPos: { x: number; y: number; z: number };
  recoverBlendFromQuat: { x: number; y: number; z: number; w: number };
  recoverTargetPos: { x: number; y: number; z: number };
  recoverTargetQuat: { x: number; y: number; z: number; w: number };
};

export type TrainingDummyFsmTiming = {
  hitPhaseSec: number;
  staggerPhaseSec: number;
  ragdollMinSecBeforeRecover: number;
  ragdollMaxSec: number;
  ragdollLinSpeedThreshold: number;
  ragdollAngSpeedThreshold: number;
  recoverBlendSec: number;
  /** After stagger: blend root back upright without teleporting to spawn. */
  standUpBlendSec: number;
};

export const TRAINING_DUMMY_FSM_DEFAULTS: TrainingDummyFsmTiming = {
  hitPhaseSec: 0.09,
  staggerPhaseSec: 0.52,
  ragdollMinSecBeforeRecover: 0.82,
  ragdollMaxSec: 4.6,
  ragdollLinSpeedThreshold: 0.42,
  ragdollAngSpeedThreshold: 0.62,
  recoverBlendSec: 0.55,
  standUpBlendSec: 0.38,
};

export type TrainingDummyFsmStepResult = {
  /** Set when ragdoll should hand off to kinematic recover; bootstrap calls `armTrainingDummyRecover`. */
  armRecover: boolean;
  /** Set when stagger ended below ragdoll threshold; bootstrap calls `armTrainingDummyStandUp`. */
  armStandUp: boolean;
};

export function createTrainingDummyFsm(): TrainingDummyFsm {
  return {
    phase: "idle",
    timeInPhaseSec: 0,
    lastHitPlanarX: 0,
    lastHitPlanarZ: 1,
    recoverBlendFromPos: { x: 0, y: 0, z: 0 },
    recoverBlendFromQuat: { x: 0, y: 0, z: 0, w: 1 },
    recoverTargetPos: { x: 0, y: 0, z: 0 },
    recoverTargetQuat: { x: 0, y: 0, z: 0, w: 1 },
  };
}

function setPlanarFromImpulse(
  fsm: TrainingDummyFsm,
  impulse: { x: number; y: number; z: number },
): void {
  let x = impulse.x;
  let z = impulse.z;
  const len = Math.hypot(x, z);
  if (len < 1e-5) {
    fsm.lastHitPlanarX = 0;
    fsm.lastHitPlanarZ = 1;
    return;
  }
  fsm.lastHitPlanarX = x / len;
  fsm.lastHitPlanarZ = z / len;
}

export type TrainingDummyFsmStepContext = {
  /** Lab damage total **after** the strike that just resolved (if any). */
  labDamageTotal: number;
  /** Planar linear speed and total angular speed from Rapier (only read in `ragdoll`). */
  ragdollLinPlanarSpeed: number;
  ragdollAngSpeed: number;
  /**
   * Knockdown when `labDamageTotal` ≥ this (from `gameplayTuning.combatBasics.baseEnemyHealth`).
   */
  basicEnemyMaxHealth: number;
};

/**
 * Call once per fixed step after hit resolution. When `strikeConnected` is true, `impulseWorld`
 * must be the same vector emitted on the combat bus (for consistent lean).
 */
export function stepTrainingDummyFsm(
  fsm: TrainingDummyFsm,
  fixedDt: number,
  strikeConnected: boolean,
  impulseWorld: { x: number; y: number; z: number } | null,
  ctx: TrainingDummyFsmStepContext,
  timing: TrainingDummyFsmTiming = TRAINING_DUMMY_FSM_DEFAULTS,
): TrainingDummyFsmStepResult {
  const none = { armRecover: false, armStandUp: false };

  if (fsm.phase === "recover" || fsm.phase === "stand_up") {
    return none;
  }

  if (fsm.phase === "ragdoll") {
    fsm.timeInPhaseSec += fixedDt;
    const settled =
      fsm.timeInPhaseSec >= timing.ragdollMinSecBeforeRecover &&
      ctx.ragdollLinPlanarSpeed <= timing.ragdollLinSpeedThreshold &&
      ctx.ragdollAngSpeed <= timing.ragdollAngSpeedThreshold;
    const timeout = fsm.timeInPhaseSec >= timing.ragdollMaxSec;
    if (settled || timeout) {
      return { armRecover: true, armStandUp: false };
    }
    return none;
  }

  if (strikeConnected && impulseWorld) {
    if (ctx.labDamageTotal >= ctx.basicEnemyMaxHealth) {
      setPlanarFromImpulse(fsm, impulseWorld);
      fsm.phase = "ragdoll";
      fsm.timeInPhaseSec = 0;
      return none;
    }
    setPlanarFromImpulse(fsm, impulseWorld);
    fsm.phase = "hit";
    fsm.timeInPhaseSec = 0;
    return none;
  }

  if (fsm.phase === "idle") {
    return none;
  }

  fsm.timeInPhaseSec += fixedDt;

  if (fsm.phase === "hit") {
    if (fsm.timeInPhaseSec >= timing.hitPhaseSec) {
      fsm.phase = "stagger";
      fsm.timeInPhaseSec = 0;
    }
    return none;
  }

  if (fsm.phase === "stagger") {
    if (fsm.timeInPhaseSec >= timing.staggerPhaseSec) {
      if (ctx.labDamageTotal >= ctx.basicEnemyMaxHealth) {
        fsm.phase = "ragdoll";
        fsm.timeInPhaseSec = 0;
      } else {
        return { armRecover: false, armStandUp: true };
      }
    }
  }

  return none;
}

/** Radians — small tilt for placeholder mesh (stronger during stagger). Ragdoll/recover/stand_up: root owns pose. */
export function trainingDummyLeanRad(phase: TrainingDummyPhase): number {
  if (phase === "hit") return 0.09;
  if (phase === "stagger") return 0.2;
  return 0;
}
