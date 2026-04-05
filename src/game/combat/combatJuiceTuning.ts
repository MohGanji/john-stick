import type { CombatHit } from "./combatEventBus";

/** Mutable shape; defaults in `COMBAT_JUICE_TUNING`. */
export type CombatJuiceTuningValues = {
  /** Real-time sim freeze (seconds); tier 0 baseline. */
  hitStopBaseSec: number;
  /** Extra hit-stop per charge tier (multiplied by `chargeTierIndex`). */
  hitStopPerChargeTierSec: number;
  /** Cap for merged hit-stop (prevents mush on rapid hits). */
  hitStopMaxSec: number;
  /** Peak additive FOV (degrees). */
  fovPunchPeakDeg: number;
  /** Extra degrees per charge tier. */
  fovPunchPerChargeTierDeg: number;
  /** Exponential decay half-life for FOV offset (seconds). */
  fovPunchDecayHalfLifeSec: number;
};

/**
 * WS-071 / GP §6.3.1 — shipped defaults (Creative Director bounds).
 * Runtime copy lives on `createGameplayRuntimeTuning().juice`.
 */
export const COMBAT_JUICE_TUNING: CombatJuiceTuningValues = {
  hitStopBaseSec: 0.063,
  hitStopPerChargeTierSec: 0.012,
  hitStopMaxSec: 0.11,
  fovPunchPeakDeg: 2.4,
  fovPunchPerChargeTierDeg: 0.35,
  fovPunchDecayHalfLifeSec: 0.085,
};

export function combatHitStopDurationSec(
  hit: CombatHit,
  t: CombatJuiceTuningValues,
): number {
  const raw = t.hitStopBaseSec + t.hitStopPerChargeTierSec * hit.chargeTierIndex;
  return Math.min(t.hitStopMaxSec, raw);
}

export function combatFovPunchPeakDeg(
  hit: CombatHit,
  t: CombatJuiceTuningValues,
): number {
  return t.fovPunchPeakDeg + t.fovPunchPerChargeTierDeg * hit.chargeTierIndex;
}
