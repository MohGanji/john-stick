import { describe, expect, it } from "vitest";

import {
  createTrainingDummyFsm,
  stepTrainingDummyFsm,
  trainingDummyLeanRad,
  type TrainingDummyFsmTiming,
} from "./trainingDummyFsm";

const FAST: TrainingDummyFsmTiming = {
  hitPhaseSec: 0.05,
  staggerPhaseSec: 0.1,
  ragdollMinSecBeforeRecover: 0.06,
  ragdollMaxSec: 2,
  ragdollLinSpeedThreshold: 0.5,
  ragdollAngSpeedThreshold: 0.5,
  recoverBlendSec: 0.2,
  standUpBlendSec: 0.12,
};

const ctxStill = {
  labDamageTotal: 0,
  ragdollLinPlanarSpeed: 0,
  ragdollAngSpeed: 0,
  basicEnemyMaxHealth: 50,
};

describe("WS-090 / WS-091 trainingDummyFsm", () => {
  it("idle → hit → stagger → armStandUp (below ragdoll damage); mount arms stand_up same frame", () => {
    const fsm = createTrainingDummyFsm();
    expect(fsm.phase).toBe("idle");

    stepTrainingDummyFsm(
      fsm,
      0.016,
      true,
      { x: 0, y: 1, z: 10 },
      { ...ctxStill, labDamageTotal: 10 },
      FAST,
    );
    expect(fsm.phase).toBe("hit");
    expect(fsm.timeInPhaseSec).toBe(0);

    stepTrainingDummyFsm(fsm, FAST.hitPhaseSec + 0.01, false, null, ctxStill, FAST);
    expect(fsm.phase).toBe("stagger");

    const endStagger = stepTrainingDummyFsm(
      fsm,
      FAST.staggerPhaseSec + 0.01,
      false,
      null,
      { ...ctxStill, labDamageTotal: 10 },
      FAST,
    );
    expect(endStagger).toEqual({ armRecover: false, armStandUp: true });
    expect(fsm.phase).toBe("stagger");
  });

  it("stores planar impulse direction for lean", () => {
    const fsm = createTrainingDummyFsm();
    stepTrainingDummyFsm(
      fsm,
      0.016,
      true,
      { x: 3, y: 0, z: 4 },
      { ...ctxStill, labDamageTotal: 10 },
      FAST,
    );
    const len = 5;
    expect(fsm.lastHitPlanarX).toBeCloseTo(3 / len);
    expect(fsm.lastHitPlanarZ).toBeCloseTo(4 / len);
  });

  it("trainingDummyLeanRad is zero in idle/ragdoll/recover/stand_up and positive in hit/stagger", () => {
    expect(trainingDummyLeanRad("idle")).toBe(0);
    expect(trainingDummyLeanRad("ragdoll")).toBe(0);
    expect(trainingDummyLeanRad("recover")).toBe(0);
    expect(trainingDummyLeanRad("stand_up")).toBe(0);
    expect(trainingDummyLeanRad("hit")).toBeGreaterThan(0);
    expect(trainingDummyLeanRad("stagger")).toBeGreaterThan(
      trainingDummyLeanRad("hit"),
    );
  });

  it("enters ragdoll when lab damage crosses threshold on strike", () => {
    const fsm = createTrainingDummyFsm();
    const out = stepTrainingDummyFsm(
      fsm,
      0.016,
      true,
      { x: 0, y: 1, z: 5 },
      { ...ctxStill, labDamageTotal: 55 },
      FAST,
    );
    expect(fsm.phase).toBe("ragdoll");
    expect(out).toEqual({ armRecover: false, armStandUp: false });
  });

  it("stagger exit goes to ragdoll when lab damage at threshold", () => {
    const fsm = createTrainingDummyFsm();
    stepTrainingDummyFsm(
      fsm,
      0.016,
      true,
      { x: 1, y: 0, z: 0 },
      { ...ctxStill, labDamageTotal: 10 },
      FAST,
    );
    stepTrainingDummyFsm(fsm, FAST.hitPhaseSec + 0.01, false, null, ctxStill, FAST);
    expect(fsm.phase).toBe("stagger");
    stepTrainingDummyFsm(
      fsm,
      FAST.staggerPhaseSec + 0.01,
      false,
      null,
      { ...ctxStill, labDamageTotal: 55 },
      FAST,
    );
    expect(fsm.phase).toBe("ragdoll");
  });

  it("signals armRecover when ragdoll settles", () => {
    const fsm = createTrainingDummyFsm();
    fsm.phase = "ragdoll";
    fsm.timeInPhaseSec = 0.2;
    const out = stepTrainingDummyFsm(
      fsm,
      0.016,
      false,
      null,
      { ...ctxStill, labDamageTotal: 99, ragdollLinPlanarSpeed: 0.1, ragdollAngSpeed: 0.1 },
      FAST,
    );
    expect(out).toEqual({ armRecover: true, armStandUp: false });
  });

  it("ignores FSM strike handling while in recover", () => {
    const fsm = createTrainingDummyFsm();
    fsm.phase = "recover";
    stepTrainingDummyFsm(
      fsm,
      0.016,
      true,
      { x: 0, y: 1, z: 1 },
      { ...ctxStill, labDamageTotal: 999 },
      FAST,
    );
    expect(fsm.phase).toBe("recover");
  });

  it("ignores FSM strike handling while in stand_up", () => {
    const fsm = createTrainingDummyFsm();
    fsm.phase = "stand_up";
    stepTrainingDummyFsm(
      fsm,
      0.016,
      true,
      { x: 0, y: 1, z: 1 },
      { ...ctxStill, labDamageTotal: 999 },
      FAST,
    );
    expect(fsm.phase).toBe("stand_up");
  });
});
