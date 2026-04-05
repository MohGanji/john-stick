import { describe, expect, it } from "vitest";

import {
  KEY_ACTION_MAP,
  computeActionMapFromHeld,
} from "./actionMap";

describe("computeActionMapFromHeld", () => {
  it("maps bare limb keys to attacks, not guard/dock", () => {
    const held = new Set<string>([
      KEY_ACTION_MAP.leftPunch,
      KEY_ACTION_MAP.rightKick,
    ]);
    const s = computeActionMapFromHeld(held);
    expect(s.shiftHeld).toBe(false);
    expect(s.attackLeftPunch).toBe(true);
    expect(s.attackRightKick).toBe(true);
    expect(s.guardLeft).toBe(false);
    expect(s.dockRight).toBe(false);
  });

  it("Shift + punches → guard; attacks off for those limbs", () => {
    const held = new Set<string>([
      KEY_ACTION_MAP.shift[0],
      KEY_ACTION_MAP.leftPunch,
      KEY_ACTION_MAP.rightPunch,
    ]);
    const s = computeActionMapFromHeld(held);
    expect(s.shiftHeld).toBe(true);
    expect(s.guardLeft).toBe(true);
    expect(s.guardRight).toBe(true);
    expect(s.attackLeftPunch).toBe(false);
    expect(s.attackRightPunch).toBe(false);
  });

  it("Shift + kicks → dock; ShiftRight also counts", () => {
    const held = new Set<string>([
      KEY_ACTION_MAP.shift[1],
      KEY_ACTION_MAP.leftKick,
    ]);
    const s = computeActionMapFromHeld(held);
    expect(s.dockLeft).toBe(true);
    expect(s.attackLeftKick).toBe(false);
  });

  it("Shift + punch does not set dock; Shift + kick does not set guard", () => {
    const held = new Set<string>([
      "ShiftLeft",
      KEY_ACTION_MAP.leftPunch,
      KEY_ACTION_MAP.rightKick,
    ]);
    const s = computeActionMapFromHeld(held);
    expect(s.guardLeft).toBe(true);
    expect(s.dockRight).toBe(true);
    expect(s.dockLeft).toBe(false);
    expect(s.guardRight).toBe(false);
  });
});
