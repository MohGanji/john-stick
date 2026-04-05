import { describe, expect, it, vi } from "vitest";

import type { CombatJuiceAccess } from "../accessibility/combatJuiceAccess";
import {
  COMBAT_JUICE_TUNING,
  combatHitStopDurationSec,
} from "./combatJuiceTuning";
import { createCombatEventBus } from "./combatEventBus";
import { createCombatJuiceController } from "./combatJuiceController";

const sampleHit = {
  attackKind: "left_punch" as const,
  targetKind: "training_bag" as const,
  damageDealt: 2,
  impulseWorld: { x: 0, y: 1, z: 0 },
  contactWorld: { x: 0, y: 1, z: 0 },
  chargeTierIndex: 0,
};

function fullAccess(): CombatJuiceAccess {
  return { hitStopEnabled: true, cameraEffectsEnabled: true };
}

describe("WS-071 createCombatJuiceController", () => {
  it("sets accumulator scale to 0 while hit-stop time remains (GP §6.3.1)", () => {
    const bus = createCombatEventBus();
    const juice = createCombatJuiceController({
      combatEvents: bus,
      getAccess: fullAccess,
      getTuning: () => ({ ...COMBAT_JUICE_TUNING }),
    });

    expect(juice.getAccumulatorTimeScale()).toBe(1);

    bus.emit({ type: "combat_hit", hit: sampleHit });
    expect(juice.getAccumulatorTimeScale()).toBe(0);

    const dt = 0.016;
    juice.endFrame(dt);
    const d = combatHitStopDurationSec(sampleHit, COMBAT_JUICE_TUNING);
    if (d - dt > 1e-6) {
      expect(juice.getAccumulatorTimeScale()).toBe(0);
    }

    juice.dispose();
  });

  it("respects accessibility: no hit-stop or FOV when disabled", () => {
    const bus = createCombatEventBus();
    const getAccess = vi.fn((): CombatJuiceAccess => ({
      hitStopEnabled: false,
      cameraEffectsEnabled: false,
    }));
    const juice = createCombatJuiceController({
      combatEvents: bus,
      getAccess,
      getTuning: () => ({ ...COMBAT_JUICE_TUNING }),
    });

    bus.emit({ type: "combat_hit", hit: sampleHit });
    expect(juice.getAccumulatorTimeScale()).toBe(1);

    const cam = { fov: 50, updateProjectionMatrix: vi.fn() };
    juice.applyPerspectiveFov(cam as never, 50);
    expect(cam.fov).toBe(50);

    juice.dispose();
  });

  it("decays FOV punch over endFrame (subtle curve)", () => {
    const bus = createCombatEventBus();
    const juice = createCombatJuiceController({
      combatEvents: bus,
      getAccess: fullAccess,
      getTuning: () => ({ ...COMBAT_JUICE_TUNING }),
    });
    bus.emit({ type: "combat_hit", hit: sampleHit });

    const cam = { fov: 50, updateProjectionMatrix: vi.fn() };
    juice.applyPerspectiveFov(cam as never, 50);
    const peak = cam.fov - 50;
    expect(peak).toBeGreaterThan(0);

    juice.endFrame(0.05);
    juice.applyPerspectiveFov(cam as never, 50);
    expect(cam.fov - 50).toBeLessThan(peak);

    juice.dispose();
  });

  it("hit-stop releases after tuned real-time duration", () => {
    const bus = createCombatEventBus();
    const juice = createCombatJuiceController({
      combatEvents: bus,
      getAccess: fullAccess,
      getTuning: () => ({ ...COMBAT_JUICE_TUNING }),
    });
    bus.emit({ type: "combat_hit", hit: sampleHit });
    const duration = combatHitStopDurationSec(sampleHit, COMBAT_JUICE_TUNING);
    juice.endFrame(duration + 0.02);
    expect(juice.getAccumulatorTimeScale()).toBe(1);
    juice.dispose();
  });
});
