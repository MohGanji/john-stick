/**
 * Maps dev-tuned `TrainingDummyFeelScalars` → FSM timing and hit impulse split.
 * Intended as the **shared template** for all enemies’ hit-receive timing/spin; dummy is reference instance.
 * Size/mass scaling vs this reference can move to `docs/TODO.md` when we add more enemy types.
 */
import type { TrainingDummyFsmTiming } from "./trainingDummyFsm";
import type { TrainingDummyFeelScalars } from "../tuning/gameplayRuntimeTuning";

const clamp01 = (t: number): number => Math.min(1, Math.max(0, t));

/** `spinAmount` 0 → almost all impulse at COM; 1 → more at fist (more torque). */
export function trainingDummyImpulseShares(spinAmount: number): {
  com: number;
  point: number;
} {
  const s = clamp01(spinAmount);
  const point = 0.06 + s * 0.38;
  return { com: 1 - point, point };
}

/** Higher spin → lower angular damping so rotation persists. */
export function trainingDummyAngularDampingFromSpin(spinAmount: number): number {
  const s = clamp01(spinAmount);
  return 6.8 + (2.6 - 6.8) * s;
}

export function trainingDummyFsmTimingFromFeel(
  f: TrainingDummyFeelScalars,
): TrainingDummyFsmTiming {
  return {
    hitPhaseSec: f.hitReactSec,
    staggerPhaseSec: f.staggerHoldSec,
    ragdollMinSecBeforeRecover: f.ragdollDownBeforeRecoverSec,
    ragdollMaxSec: f.ragdollDownMaxSec,
    ragdollLinSpeedThreshold: f.ragdollSettlePlanarSpeed,
    ragdollAngSpeedThreshold: f.ragdollSettleAngSpeed,
    recoverBlendSec: f.ragdollStandUpBlendSec,
    standUpBlendSec: f.lightHitStandBlendSec,
  };
}
