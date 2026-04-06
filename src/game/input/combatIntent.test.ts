import { describe, expect, it } from "vitest";

import type { ActionMapSnapshot } from "./actionMap";
import {
  createCombatIntentState,
  resolveCombatIntent,
} from "./combatIntent";

function baseSnapshot(): ActionMapSnapshot {
  return {
    shiftHeld: false,
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
    interactModeOpen: false,
  };
}

describe("resolveCombatIntent", () => {
  it("interact mode clears combat intent and sequence buffer", () => {
    const prev = baseSnapshot();
    const curr: ActionMapSnapshot = {
      ...baseSnapshot(),
      interactModeOpen: true,
      limb: { ...baseSnapshot().limb, leftPunch: true },
      attackLeftPunch: true,
    };
    const state = createCombatIntentState();
    state.sequencePending = { limb: "rightPunch", timeSec: 1 };
    const { resolved, nextState } = resolveCombatIntent(state, prev, curr, 2);
    expect(resolved.priority).toBe("interact");
    expect(resolved.attackMoveId).toBe("none");
    expect(resolved.guardLeft).toBe(false);
    expect(nextState.sequencePending).toBeNull();
  });

  it("pause menu clears combat intent like interact (WS-111)", () => {
    const prev = baseSnapshot();
    const curr: ActionMapSnapshot = {
      ...baseSnapshot(),
      limb: { ...baseSnapshot().limb, leftPunch: true },
      attackLeftPunch: true,
    };
    const state = createCombatIntentState();
    state.sequencePending = { limb: "rightPunch", timeSec: 1 };
    const { resolved, nextState } = resolveCombatIntent(state, prev, curr, 0, {
      pauseMenuOpen: true,
    });
    expect(resolved.priority).toBe("interact");
    expect(resolved.attackMoveId).toBe("none");
    expect(nextState.sequencePending).toBeNull();
  });

  it("Shift defensive path clears sequence buffer and exposes guards", () => {
    const prev = baseSnapshot();
    const curr: ActionMapSnapshot = {
      ...baseSnapshot(),
      shiftHeld: true,
      limb: {
        leftPunch: true,
        rightPunch: false,
        leftKick: false,
        rightKick: false,
      },
      guardLeft: true,
      guardRight: false,
      dockLeft: false,
      dockRight: false,
      attackLeftPunch: false,
      attackRightPunch: false,
      attackLeftKick: false,
      attackRightKick: false,
    };
    const state = createCombatIntentState();
    state.sequencePending = { limb: "leftKick", timeSec: 0 };
    const { resolved, nextState } = resolveCombatIntent(state, prev, curr, 1);
    expect(resolved.priority).toBe("defensive");
    expect(resolved.guardLeft).toBe(true);
    expect(resolved.attackMoveId).toBe("none");
    expect(nextState.sequencePending).toBeNull();
  });

  it("two attack holds resolve to simultaneous chord (dual punch)", () => {
    const prev = baseSnapshot();
    const curr: ActionMapSnapshot = {
      ...baseSnapshot(),
      limb: {
        leftPunch: true,
        rightPunch: true,
        leftKick: false,
        rightKick: false,
      },
      attackLeftPunch: true,
      attackRightPunch: true,
      attackLeftKick: false,
      attackRightKick: false,
    };
    const { resolved } = resolveCombatIntent(
      createCombatIntentState(),
      prev,
      curr,
      0,
    );
    expect(resolved.priority).toBe("attack_hold_chord");
    expect(resolved.attackMoveId).toBe("chord_dual_punch");
  });

  it("hold chord beats sequence when both keys appear same frame", () => {
    const prev = baseSnapshot();
    const curr: ActionMapSnapshot = {
      ...baseSnapshot(),
      limb: {
        leftPunch: true,
        rightPunch: true,
        leftKick: false,
        rightKick: false,
      },
      attackLeftPunch: true,
      attackRightPunch: true,
      attackLeftKick: false,
      attackRightKick: false,
    };
    const state = createCombatIntentState();
    state.sequencePending = { limb: "leftKick", timeSec: 0 };
    const { resolved, nextState } = resolveCombatIntent(state, prev, curr, 0.1);
    expect(resolved.priority).toBe("attack_hold_chord");
    expect(nextState.sequencePending).toBeNull();
  });

  it("sequence: tap LP then RP without overlap uses edges (second within chain)", () => {
    const idle = baseSnapshot();
    const lpPress: ActionMapSnapshot = {
      ...baseSnapshot(),
      limb: {
        leftPunch: true,
        rightPunch: false,
        leftKick: false,
        rightKick: false,
      },
      attackLeftPunch: true,
      attackRightPunch: false,
      attackLeftKick: false,
      attackRightKick: false,
    };
    const lpRelease: ActionMapSnapshot = {
      ...lpPress,
      limb: { ...lpPress.limb, leftPunch: false },
      attackLeftPunch: false,
    };
    const rpPress: ActionMapSnapshot = {
      ...baseSnapshot(),
      limb: {
        leftPunch: false,
        rightPunch: true,
        leftKick: false,
        rightKick: false,
      },
      attackLeftPunch: false,
      attackRightPunch: true,
      attackLeftKick: false,
      attackRightKick: false,
    };

    let state = createCombatIntentState();
    const s1 = resolveCombatIntent(state, idle, lpPress, 0);
    state = s1.nextState;
    const s2 = resolveCombatIntent(state, lpPress, lpRelease, 0.02);
    state = s2.nextState;
    const s3 = resolveCombatIntent(state, lpRelease, rpPress, 0.04);
    expect(s3.resolved.priority).toBe("attack_sequence");
    expect(s3.resolved.attackMoveId).toBe("seq_lp_rp");
  });

  it("single attack hold yields base move id", () => {
    const prev = baseSnapshot();
    const curr: ActionMapSnapshot = {
      ...baseSnapshot(),
      limb: {
        leftPunch: false,
        rightPunch: false,
        leftKick: true,
        rightKick: false,
      },
      attackLeftKick: true,
      attackLeftPunch: false,
      attackRightPunch: false,
      attackRightKick: false,
    };
    const { resolved } = resolveCombatIntent(
      createCombatIntentState(),
      prev,
      curr,
      0,
    );
    expect(resolved.priority).toBe("attack_base");
    expect(resolved.attackMoveId).toBe("atk_lk");
  });
});
