import { describe, expect, it, vi } from "vitest";

import { createCombatEventBus } from "./combatEventBus";

describe("WS-070 createCombatEventBus", () => {
  it("notifies subscribers with combat_hit payload (GP §4.3.3)", () => {
    const bus = createCombatEventBus();
    const spy = vi.fn();
    bus.subscribe(spy);

    const hit = {
      attackKind: "left_punch" as const,
      targetKind: "training_bag" as const,
      damageDealt: 3,
      impulseWorld: { x: 1, y: 0.5, z: 0 },
      contactWorld: { x: 0.1, y: 1, z: 5.9 },
      chargeTierIndex: 0,
    };
    bus.emit({ type: "combat_hit", hit });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith({ type: "combat_hit", hit });
  });

  it("unsubscribe stops delivery", () => {
    const bus = createCombatEventBus();
    const spy = vi.fn();
    const off = bus.subscribe(spy);
    off();

    bus.emit({
      type: "combat_hit",
      hit: {
        attackKind: "left_punch",
        targetKind: "training_bag",
        damageDealt: 1,
        impulseWorld: { x: 0, y: 0, z: 0 },
        contactWorld: { x: 0, y: 0, z: 0 },
        chargeTierIndex: 0,
      },
    });

    expect(spy).not.toHaveBeenCalled();
  });
});
