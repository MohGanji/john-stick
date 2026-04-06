/**
 * Global pause / modal state — **single place** to decide when simulation and presentation
 * should freeze (sign read today; **Esc pause menu** and other overlays later).
 *
 * Call `syncGamePause(...)` once per frame after sampling UI-driving input (e.g. `actionMap`).
 * Systems read `getGamePauseSnapshot()` instead of scattering `interactModeOpen` checks.
 *
 * **Combat** — `resolveCombatIntent` / `strikePressIntent` take **`pauseMenuOpen`** (WS-111) alongside
 * `ActionMapSnapshot.interactModeOpen` so limb attacks cannot fire while paused (same “modal owns
 * the moment” rule as interact).
 */

export type GamePauseReason = "none" | "interaction_ui" | "pause_menu";

export type GamePauseSnapshot = {
  reason: GamePauseReason;
  /** When true, fixed-step / physics / combat sim should not advance (`accumulatorTimeScale` 0). */
  simulationPaused: boolean;
  /** When true, locomotion mixers, camera smooth, procedural VFX, etc. use dt 0. */
  presentationPaused: boolean;
};

const IDLE: GamePauseSnapshot = {
  reason: "none",
  simulationPaused: false,
  presentationPaused: false,
};

let snapshot: GamePauseSnapshot = IDLE;

export type SyncGamePauseInput = {
  /** WS-050 — Enter toggled “read sign” / interact modal (and anything that shares that lane). */
  interactModalOpen: boolean;
  /** Future: WS-111 / title pause — when true, overrides nothing else; full pause. */
  pauseMenuOpen?: boolean;
};

/**
 * Recompute pause flags from authoritative UI state. Safe to call every `update()`.
 */
export function syncGamePause(input: SyncGamePauseInput): void {
  const pauseMenu = input.pauseMenuOpen ?? false;
  if (pauseMenu) {
    snapshot = {
      reason: "pause_menu",
      simulationPaused: true,
      presentationPaused: true,
    };
    return;
  }
  if (input.interactModalOpen) {
    snapshot = {
      reason: "interaction_ui",
      simulationPaused: true,
      presentationPaused: true,
    };
    return;
  }
  snapshot = IDLE;
}

export function getGamePauseSnapshot(): Readonly<GamePauseSnapshot> {
  return snapshot;
}

export function isGameSimulationPaused(): boolean {
  return snapshot.simulationPaused;
}

export function isGamePresentationPaused(): boolean {
  return snapshot.presentationPaused;
}
