import type { PerspectiveCamera } from "three";

import type { CombatJuiceAccess } from "../accessibility/combatJuiceAccess";
import type { CombatJuiceTuningValues } from "./combatJuiceTuning";
import {
  combatFovPunchPeakDeg,
  combatHitStopDurationSec,
} from "./combatJuiceTuning";
import type { CombatEvent, CombatEventBus } from "./combatEventBus";

export type CombatJuiceController = {
  getAccumulatorTimeScale(): number;
  applyPerspectiveFov(camera: PerspectiveCamera, baseFovDeg: number): void;
  /** Wall-clock frame tail: hit-stop countdown + FOV decay (call once per frame, e.g. end of `lateUpdate`). */
  endFrame(dtSeconds: number): void;
  dispose(): void;
};

export function createCombatJuiceController(input: {
  combatEvents: CombatEventBus;
  getAccess: () => CombatJuiceAccess;
  getTuning: () => CombatJuiceTuningValues;
}): CombatJuiceController {
  let hitStopRemainingSec = 0;
  let fovPunchAdditiveDeg = 0;

  function onCombatEvent(event: CombatEvent): void {
    if (event.type !== "combat_hit") return;
    const access = input.getAccess();
    const tuning = input.getTuning();
    const { hit } = event;
    if (access.hitStopEnabled) {
      const d = combatHitStopDurationSec(hit, tuning);
      hitStopRemainingSec = Math.min(
        tuning.hitStopMaxSec,
        Math.max(hitStopRemainingSec, d),
      );
    }
    if (access.cameraEffectsEnabled) {
      const peak = combatFovPunchPeakDeg(hit, tuning);
      fovPunchAdditiveDeg = Math.max(fovPunchAdditiveDeg, peak);
    }
  }

  const off = input.combatEvents.subscribe(onCombatEvent);

  return {
    getAccumulatorTimeScale() {
      return hitStopRemainingSec > 0 ? 0 : 1;
    },

    applyPerspectiveFov(camera, baseFovDeg) {
      camera.fov = baseFovDeg + fovPunchAdditiveDeg;
      camera.updateProjectionMatrix();
    },

    endFrame(dtSeconds) {
      const tuning = input.getTuning();
      if (dtSeconds > 0 && hitStopRemainingSec > 0) {
        hitStopRemainingSec = Math.max(0, hitStopRemainingSec - dtSeconds);
      }
      if (dtSeconds > 0 && fovPunchAdditiveDeg > 0) {
        const hl = tuning.fovPunchDecayHalfLifeSec;
        const factor = Math.pow(0.5, dtSeconds / hl);
        fovPunchAdditiveDeg *= factor;
        if (fovPunchAdditiveDeg < 1e-4) fovPunchAdditiveDeg = 0;
      }
    },

    dispose() {
      off();
    },
  };
}
