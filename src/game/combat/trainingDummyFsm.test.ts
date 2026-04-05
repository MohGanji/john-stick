import { describe, expect, it } from "vitest";

import {
  createTrainingDummyFsm,
  stepTrainingDummyFsm,
  trainingDummyLeanRad,
} from "./trainingDummyFsm";

const FAST = { hitPhaseSec: 0.05, staggerPhaseSec: 0.1 };

describe("WS-090 trainingDummyFsm", () => {
  it("idle → hit → stagger → idle on strike + time", () => {
    const fsm = createTrainingDummyFsm();
    expect(fsm.phase).toBe("idle");

    stepTrainingDummyFsm(fsm, 0.016, true, { x: 0, y: 1, z: 10 }, FAST);
    expect(fsm.phase).toBe("hit");
    expect(fsm.timeInPhaseSec).toBe(0);

    stepTrainingDummyFsm(fsm, FAST.hitPhaseSec + 0.01, false, null, FAST);
    expect(fsm.phase).toBe("stagger");

    stepTrainingDummyFsm(fsm, FAST.staggerPhaseSec + 0.01, false, null, FAST);
    expect(fsm.phase).toBe("idle");
  });

  it("stores planar impulse direction for lean", () => {
    const fsm = createTrainingDummyFsm();
    stepTrainingDummyFsm(fsm, 0.016, true, { x: 3, y: 0, z: 4 }, FAST);
    const len = 5;
    expect(fsm.lastHitPlanarX).toBeCloseTo(3 / len);
    expect(fsm.lastHitPlanarZ).toBeCloseTo(4 / len);
  });

  it("trainingDummyLeanRad is zero in idle and positive in hit/stagger", () => {
    expect(trainingDummyLeanRad("idle")).toBe(0);
    expect(trainingDummyLeanRad("hit")).toBeGreaterThan(0);
    expect(trainingDummyLeanRad("stagger")).toBeGreaterThan(
      trainingDummyLeanRad("hit"),
    );
  });
});
