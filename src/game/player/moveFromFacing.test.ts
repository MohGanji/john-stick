import { describe, expect, it } from "vitest";

import {
  characterLeftUnitXZ,
  characterRightUnitXZ,
  facingRelativeMoveXZ,
} from "./moveFromFacing";

describe("facingRelativeMoveXZ", () => {
  it("yaw 0: forward is +Z, strafe right (D) is −X", () => {
    const f = facingRelativeMoveXZ(0, 1, 0);
    expect(f.wx).toBeCloseTo(0);
    expect(f.wz).toBeCloseTo(1);
    const r = facingRelativeMoveXZ(0, 0, 1);
    expect(r.wx).toBeCloseTo(-1);
    expect(r.wz).toBeCloseTo(0);
  });

  it("normalizes diagonals to unit length on XZ", () => {
    const d = facingRelativeMoveXZ(0, 1, 1);
    expect(Math.hypot(d.wx, d.wz)).toBeCloseTo(1);
  });

  it("character left/right XZ match strafe ±1 at yaw 0", () => {
    const l = characterLeftUnitXZ(0);
    const r = characterRightUnitXZ(0);
    expect(l.x).toBeCloseTo(1);
    expect(l.z).toBeCloseTo(0);
    expect(r.x).toBeCloseTo(-1);
    expect(r.z).toBeCloseTo(0);
  });
});
