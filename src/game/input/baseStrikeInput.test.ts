import { describe, expect, it } from "vitest";

import type { ActionMapSnapshot } from "./actionMap";
import { baseStrikePressIntent } from "./baseStrikeInput";
import type { ResolvedCombatIntent } from "./combatIntent";

function snap(partial: Partial<ActionMapSnapshot>): ActionMapSnapshot {
  return {
    shiftHeld: false,
    interactModeOpen: false,
    limb: {
      leftPunch: false,
      rightPunch: false,
      leftKick: false,
      rightKick: false,
    },
    guardLeft: false,
    guardRight: false,
    dockLeft: false,
    dockRight: false,
    attackLeftPunch: false,
    attackRightPunch: false,
    attackLeftKick: false,
    attackRightKick: false,
    ...partial,
  };
}

const idleIntent: ResolvedCombatIntent = {
  priority: "idle",
  guardLeft: false,
  guardRight: false,
  dockLeft: false,
  dockRight: false,
  attackMoveId: "none",
};

describe("baseStrikePressIntent", () => {
  it("returns atk_lp on left punch attack edge when intent is attack_base", () => {
    const intent: ResolvedCombatIntent = {
      ...idleIntent,
      priority: "attack_base",
      attackMoveId: "atk_lp",
    };
    expect(
      baseStrikePressIntent(
        snap({ attackLeftPunch: false }),
        snap({ attackLeftPunch: true }),
        intent,
      ),
    ).toBe("atk_lp");
  });

  it("returns null when two limbs rise the same frame and intent is a chord (not attack_base)", () => {
    const intent: ResolvedCombatIntent = {
      ...idleIntent,
      priority: "attack_hold_chord",
      attackMoveId: "chord_dual_punch",
    };
    expect(
      baseStrikePressIntent(
        snap({ attackLeftPunch: false, attackRightPunch: false }),
        snap({ attackLeftPunch: true, attackRightPunch: true }),
        intent,
      ),
    ).toBeNull();
  });

  it("returns atk_rk for right kick edge + attack_base", () => {
    const intent: ResolvedCombatIntent = {
      ...idleIntent,
      priority: "attack_base",
      attackMoveId: "atk_rk",
    };
    expect(
      baseStrikePressIntent(
        snap({ attackRightKick: false }),
        snap({ attackRightKick: true }),
        intent,
      ),
    ).toBe("atk_rk");
  });

  it("returns null in interact mode even with edge", () => {
    const intent: ResolvedCombatIntent = {
      ...idleIntent,
      priority: "attack_base",
      attackMoveId: "atk_lp",
    };
    expect(
      baseStrikePressIntent(
        snap({ attackLeftPunch: false, interactModeOpen: true }),
        snap({ attackLeftPunch: true, interactModeOpen: true }),
        intent,
      ),
    ).toBeNull();
  });
});
