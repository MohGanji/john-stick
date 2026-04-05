import { describe, expect, it } from "vitest";

import {
  DEFAULT_COMBAT_STAMINA,
  consumeStaminaForStrike,
  createCombatStaminaState,
  regenCombatStamina,
  staminaAllowsStrike,
} from "./combatStamina";

const noPause = { simTimeSec: 1e6, pausedUntilSimSec: 0 };

describe("combatStamina", () => {
  it("regen clamps to max and refills from partial", () => {
    const s = createCombatStaminaState(1);
    s.current = 0.3;
    const t = { ...DEFAULT_COMBAT_STAMINA, maxStamina: 1, staminaRegenPerSec: 2 };
    regenCombatStamina(s, t, 0.25, noPause);
    expect(s.current).toBeCloseTo(0.8, 5);
    regenCombatStamina(s, t, 10, noPause);
    expect(s.current).toBe(1);
  });

  it("does not regen while sim time is before regen pause deadline", () => {
    const s = createCombatStaminaState(1);
    s.current = 0.2;
    const t = { ...DEFAULT_COMBAT_STAMINA, staminaRegenPerSec: 10 };
    regenCombatStamina(s, t, 0.1, {
      simTimeSec: 1.0,
      pausedUntilSimSec: 1.05,
    });
    expect(s.current).toBe(0.2);
    regenCombatStamina(s, t, 0.1, {
      simTimeSec: 1.06,
      pausedUntilSimSec: 1.05,
    });
    expect(s.current).toBeGreaterThan(0.2);
  });

  it("blocks strike when below cost", () => {
    const s = createCombatStaminaState(1);
    s.current = 0.05;
    const t = { ...DEFAULT_COMBAT_STAMINA, staminaCostPerStrike: 0.2 };
    expect(staminaAllowsStrike(s, t)).toBe(false);
  });

  it("consume reduces current", () => {
    const s = createCombatStaminaState(1);
    const t = { ...DEFAULT_COMBAT_STAMINA, staminaCostPerStrike: 0.25 };
    consumeStaminaForStrike(s, t);
    expect(s.current).toBeCloseTo(0.75, 5);
  });
});
