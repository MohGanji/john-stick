/**
 * WS-080 / WS-081 — gate new strikes from sim time + last completed `StrikeMoveId` (WS-051 deferral).
 * Cooldown duration is supplied by the caller (live dev HUD / designer table).
 */
import type { StrikeMoveId } from "../input/combatIntent";

export type StrikeCooldownGateState = {
  /** Next sim time (seconds) at which a new strike may start. */
  blockedUntilSimSec: number;
  /** Last move whose recovery was applied (designer tuning / debug). */
  lastCompletedStrikeMoveId: StrikeMoveId | null;
};

export function createStrikeCooldownGateState(): StrikeCooldownGateState {
  return {
    blockedUntilSimSec: 0,
    lastCompletedStrikeMoveId: null,
  };
}

export function strikeCooldownAllowsStart(
  gate: StrikeCooldownGateState,
  simTimeSec: number,
): boolean {
  return simTimeSec >= gate.blockedUntilSimSec;
}

/** Call when a strike’s active window has just ended (last active fixed step completed). */
export function applyStrikeCooldownAfterWindow(
  gate: StrikeCooldownGateState,
  simTimeSec: number,
  completedMoveId: StrikeMoveId,
  cooldownAfterStrikeSec: number,
): void {
  gate.blockedUntilSimSec = simTimeSec + cooldownAfterStrikeSec;
  gate.lastCompletedStrikeMoveId = completedMoveId;
}
