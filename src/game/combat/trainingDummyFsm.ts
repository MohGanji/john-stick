/**
 * WS-090 / GP §2.1.2 — pre-ragdoll dummy reactions: idle → short hit → longer stagger → idle.
 */
export type TrainingDummyPhase = "idle" | "hit" | "stagger";

export type TrainingDummyFsm = {
  phase: TrainingDummyPhase;
  /** Seconds since entering `phase` (fixed-step). */
  timeInPhaseSec: number;
  /** Planar direction of last strike impulse (XZ), for stagger lean; zero if unknown. */
  lastHitPlanarX: number;
  lastHitPlanarZ: number;
};

export type TrainingDummyFsmTiming = {
  hitPhaseSec: number;
  staggerPhaseSec: number;
};

export const TRAINING_DUMMY_FSM_DEFAULTS: TrainingDummyFsmTiming = {
  hitPhaseSec: 0.09,
  staggerPhaseSec: 0.52,
};

export function createTrainingDummyFsm(): TrainingDummyFsm {
  return {
    phase: "idle",
    timeInPhaseSec: 0,
    lastHitPlanarX: 0,
    lastHitPlanarZ: 1,
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

/**
 * Call once per fixed step after hit resolution. When `strikeConnected` is true, `impulseWorld`
 * must be the same vector emitted on the combat bus (for consistent lean).
 */
export function stepTrainingDummyFsm(
  fsm: TrainingDummyFsm,
  fixedDt: number,
  strikeConnected: boolean,
  impulseWorld: { x: number; y: number; z: number } | null,
  timing: TrainingDummyFsmTiming = TRAINING_DUMMY_FSM_DEFAULTS,
): void {
  if (strikeConnected && impulseWorld) {
    setPlanarFromImpulse(fsm, impulseWorld);
    fsm.phase = "hit";
    fsm.timeInPhaseSec = 0;
    return;
  }

  if (fsm.phase === "idle") {
    return;
  }

  fsm.timeInPhaseSec += fixedDt;

  if (fsm.phase === "hit") {
    if (fsm.timeInPhaseSec >= timing.hitPhaseSec) {
      fsm.phase = "stagger";
      fsm.timeInPhaseSec = 0;
    }
    return;
  }

  if (fsm.phase === "stagger") {
    if (fsm.timeInPhaseSec >= timing.staggerPhaseSec) {
      fsm.phase = "idle";
      fsm.timeInPhaseSec = 0;
    }
  }
}

/** Radians — small tilt for placeholder mesh (stronger during stagger). */
export function trainingDummyLeanRad(phase: TrainingDummyPhase): number {
  if (phase === "hit") return 0.09;
  if (phase === "stagger") return 0.2;
  return 0;
}
