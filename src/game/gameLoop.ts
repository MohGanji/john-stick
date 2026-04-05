import * as THREE from "three";

/** Simulation tick rate (Hz). WS-010 / GP §4.3.1 */
export const FIXED_STEP_HZ = 60;
export const FIXED_DT = 1 / FIXED_STEP_HZ;

/** Cap catch-up substeps when the tab stalls (avoids spiral-of-death). */
const MAX_FIXED_SUBSTEPS = 5;

/** Ignore single-frame spikes (e.g. resume from background) for accumulator stability. */
const MAX_FRAME_DT_SEC = 0.1;

export type GameLoopHooks = {
  /**
   * Variable timestep, once per display frame. Sample input here; no physics.
   * GP: gameplay programmer — fixed sim belongs in `fixedStep`.
   */
  update: (dtSeconds: number) => void;
  /**
   * WS-071 — scales real-time delta added to the fixed-step accumulator (0 = sim paused / hit-stop).
   * Evaluated once per frame with the same `dt` as the accumulator (before `update`). Default 1.
   */
  accumulatorTimeScale?: () => number;
  /**
   * Once per display frame, **before** the fixed-step accumulator runs.
   * Snapshot physics (or kinematic) state for render interpolation — GP §4.2.3.
   */
  beforeFixedSteps?: () => void;
  /**
   * Fixed timestep (~`FIXED_STEP_HZ`). Physics and deterministic combat resolution
   * will run here (WS-011+).
   */
  fixedStep: (fixedDtSeconds: number) => void;
  /**
   * After fixed steps, before draw: blend factor `fixedStepAlpha` = remainder /
   * `FIXED_DT` in [0,1) for interpolating last sim state toward the next.
   */
  lateUpdate?: (dtSeconds: number, fixedStepAlpha: number) => void;
  /** WebGL / Three.js only — must not mutate gameplay or physics state. */
  render: () => void;
};

/**
 * Browser rAF driver: `update` → N×`fixedStep` → optional `lateUpdate` → `render`.
 * GP §4.3.1 — no simulation inside `render`.
 */
export function runGameLoop(hooks: GameLoopHooks): () => void {
  const clock = new THREE.Clock();
  let accumulator = 0;
  let running = true;
  let rafId = 0;

  function frame(): void {
    if (!running) return;

    const dt = Math.min(clock.getDelta(), MAX_FRAME_DT_SEC);
    const accScale = hooks.accumulatorTimeScale?.() ?? 1;
    accumulator += dt * accScale;

    hooks.update(dt);

    hooks.beforeFixedSteps?.();

    let substeps = 0;
    while (accumulator >= FIXED_DT && substeps < MAX_FIXED_SUBSTEPS) {
      hooks.fixedStep(FIXED_DT);
      accumulator -= FIXED_DT;
      substeps += 1;
    }
    if (substeps === MAX_FIXED_SUBSTEPS && accumulator >= FIXED_DT) {
      accumulator = 0;
    }

    const fixedStepAlpha =
      FIXED_DT > 0 ? Math.min(1, Math.max(0, accumulator / FIXED_DT)) : 0;
    hooks.lateUpdate?.(dt, fixedStepAlpha);

    hooks.render();

    rafId = requestAnimationFrame(frame);
  }

  rafId = requestAnimationFrame(frame);

  return () => {
    running = false;
    cancelAnimationFrame(rafId);
  };
}
