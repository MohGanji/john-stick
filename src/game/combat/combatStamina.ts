/**
 * Strike **stamina** pool (GP §2.2.2) — depletes per strike start; regen is gated so it does not tick
 * during attack chains (each strike start pushes `staminaRegenResumeDelayAfterStrikeSec`).
 * Shown in the player HUD as a bar (`attachStaminaHud`).
 */
export type CombatStaminaTuning = {
  maxStamina: number;
  staminaCostPerStrike: number;
  staminaRegenPerSec: number;
  /**
   * After each strike **start**, regen is blocked until `simTime` passes this many seconds.
   * Chaining strikes keeps pushing the deadline forward, so the bar stays flat during a surge.
   */
  staminaRegenResumeDelayAfterStrikeSec: number;
  /** Extra forward displacement (m) along facing when a strike starts (one fixed step). */
  strikeLungeForwardMeters: number;
};

export const DEFAULT_COMBAT_STAMINA: CombatStaminaTuning = {
  maxStamina: 1,
  staminaCostPerStrike: 0.2,
  staminaRegenPerSec: 4.5,
  staminaRegenResumeDelayAfterStrikeSec: 0.38,
  strikeLungeForwardMeters: 0.075,
};

export type CombatStaminaState = {
  current: number;
};

export function createCombatStaminaState(initialMax: number): CombatStaminaState {
  return { current: initialMax };
}

export type CombatStaminaRegenGate = {
  /** Current combat sim time (seconds). */
  simTimeSec: number;
  /** Regen stays off while `simTimeSec < pausedUntilSimSec`. */
  pausedUntilSimSec: number;
};

export function regenCombatStamina(
  state: CombatStaminaState,
  tuning: CombatStaminaTuning,
  dtSec: number,
  gate: CombatStaminaRegenGate,
): void {
  if (gate.simTimeSec < gate.pausedUntilSimSec) return;
  const cap = Math.max(1e-6, tuning.maxStamina);
  if (state.current > cap) state.current = cap;
  state.current = Math.min(cap, state.current + tuning.staminaRegenPerSec * dtSec);
}

export function staminaAllowsStrike(
  state: CombatStaminaState,
  tuning: CombatStaminaTuning,
): boolean {
  return state.current + 1e-6 >= tuning.staminaCostPerStrike;
}

export function consumeStaminaForStrike(
  state: CombatStaminaState,
  tuning: CombatStaminaTuning,
): void {
  state.current = Math.max(0, state.current - tuning.staminaCostPerStrike);
}

/** Call when a strike starts at `strikeStartSimSec` — blocks regen until delay elapses. */
export function staminaRegenPauseDeadlineAfterStrike(
  strikeStartSimSec: number,
  tuning: CombatStaminaTuning,
): number {
  return (
    strikeStartSimSec + Math.max(0, tuning.staminaRegenResumeDelayAfterStrikeSec)
  );
}
