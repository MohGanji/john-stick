import { describe, expect, it } from "vitest";

import {
  applyStrikeCooldownAfterWindow,
  createStrikeCooldownGateState,
  strikeCooldownAllowsStart,
} from "./strikeCooldownGate";

describe("strikeCooldownGate", () => {
  it("blocks starts until sim time passes recovery", () => {
    const g = createStrikeCooldownGateState();
    expect(strikeCooldownAllowsStart(g, 0)).toBe(true);
    applyStrikeCooldownAfterWindow(g, 1.0, "atk_lp", 0.22);
    expect(strikeCooldownAllowsStart(g, 1.0)).toBe(false);
    expect(strikeCooldownAllowsStart(g, 1.22)).toBe(true);
  });
});
