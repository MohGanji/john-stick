import { describe, expect, it } from "vitest";

import {
  BAG_HIT_TUNING,
  bagDamageTierMultiplier,
} from "../combat/bagHitTuning";
import { createGameplayRuntimeTuning } from "./gameplayRuntimeTuning";

describe("WS-092 / GP §6.1.2 — stagger → ragdoll tuning defaults", () => {
  it("bag tier-0 damage matches combat baseline (bag + dummy lab parity)", () => {
    const t = createGameplayRuntimeTuning();
    expect(t.combatBasics.basePunchDamage).toBe(BAG_HIT_TUNING.baseDamage);
  });

  it("authored knockdown budget is a whole number of tier-0 jabs", () => {
    const t = createGameplayRuntimeTuning();
    const { basePunchDamage, baseEnemyHealth } = t.combatBasics;
    expect(baseEnemyHealth % basePunchDamage).toBe(0);
    expect(baseEnemyHealth / basePunchDamage).toBe(8);
  });

  it("charge tiers deal strictly more lab damage (so KD comes sooner than tier-0 count)", () => {
    const d0 = BAG_HIT_TUNING.baseDamage * bagDamageTierMultiplier(0);
    const d1 = BAG_HIT_TUNING.baseDamage * bagDamageTierMultiplier(1);
    const d2 = BAG_HIT_TUNING.baseDamage * bagDamageTierMultiplier(2);
    expect(d1).toBeGreaterThan(d0);
    expect(d2).toBeGreaterThan(d1);
  });
});
