import { describe, expect, it } from "vitest";

import { leftPunchAttackPressEdge } from "./hitInputEdges";

function snap(partial: {
  interactModeOpen?: boolean;
  shiftHeld?: boolean;
  attackLeftPunch?: boolean;
}) {
  return {
    interactModeOpen: partial.interactModeOpen ?? false,
    shiftHeld: partial.shiftHeld ?? false,
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
    attackLeftPunch: partial.attackLeftPunch ?? false,
    attackRightPunch: false,
    attackLeftKick: false,
    attackRightKick: false,
  };
}

describe("leftPunchAttackPressEdge", () => {
  it("fires when U becomes attack-left-punch", () => {
    expect(
      leftPunchAttackPressEdge(
        snap({ attackLeftPunch: false }),
        snap({ attackLeftPunch: true }),
      ),
    ).toBe(true);
  });

  it("does not fire when already held", () => {
    expect(
      leftPunchAttackPressEdge(
        snap({ attackLeftPunch: true }),
        snap({ attackLeftPunch: true }),
      ),
    ).toBe(false);
  });

  it("is false under Shift (guard path)", () => {
    expect(
      leftPunchAttackPressEdge(
        snap({ attackLeftPunch: false, shiftHeld: false }),
        snap({ attackLeftPunch: true, shiftHeld: true }),
      ),
    ).toBe(false);
  });

  it("is false in interact mode", () => {
    expect(
      leftPunchAttackPressEdge(
        snap({ attackLeftPunch: false }),
        snap({ attackLeftPunch: true, interactModeOpen: true }),
      ),
    ).toBe(false);
  });
});
