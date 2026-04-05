import { describe, expect, it } from "vitest";

import type { ActionMapSnapshot } from "./actionMap";
import type { ResolvedCombatIntent } from "./combatIntent";
import { strikePressIntent } from "./strikePressIntent";

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

describe("strikePressIntent", () => {
  it("queues chord on transition into attack_hold_chord", () => {
    const chordIntent: ResolvedCombatIntent = {
      ...idleIntent,
      priority: "attack_hold_chord",
      attackMoveId: "chord_dual_punch",
    };
    expect(
      strikePressIntent(
        snap({ attackLeftPunch: false, attackRightPunch: false }),
        snap({ attackLeftPunch: true, attackRightPunch: true }),
        chordIntent,
        idleIntent,
      ),
    ).toBe("chord_dual_punch");
  });

  it("does not re-queue chord while already in attack_hold_chord", () => {
    const chordIntent: ResolvedCombatIntent = {
      ...idleIntent,
      priority: "attack_hold_chord",
      attackMoveId: "chord_dual_punch",
    };
    expect(
      strikePressIntent(
        snap({ attackLeftPunch: true, attackRightPunch: true }),
        snap({ attackLeftPunch: true, attackRightPunch: true }),
        chordIntent,
        chordIntent,
      ),
    ).toBeNull();
  });

  it("queues sequence move when WS-051 emits attack_sequence", () => {
    const seqIntent: ResolvedCombatIntent = {
      ...idleIntent,
      priority: "attack_sequence",
      attackMoveId: "seq_lp_rp",
    };
    expect(
      strikePressIntent(
        snap({ attackLeftPunch: false, attackRightPunch: false }),
        snap({ attackLeftPunch: false, attackRightPunch: false }),
        seqIntent,
        idleIntent,
      ),
    ).toBe("seq_lp_rp");
  });

  it("still prefers base limb edge when intent is attack_base", () => {
    const baseIntent: ResolvedCombatIntent = {
      ...idleIntent,
      priority: "attack_base",
      attackMoveId: "atk_lp",
    };
    expect(
      strikePressIntent(
        snap({ attackLeftPunch: false }),
        snap({ attackLeftPunch: true }),
        baseIntent,
        idleIntent,
      ),
    ).toBe("atk_lp");
  });
});
