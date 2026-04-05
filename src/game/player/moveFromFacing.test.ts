import { describe, expect, it } from "vitest";

import {
  characterLeftUnitXZ,
  characterRightUnitXZ,
  facingRelativeMoveXZ,
  facingRelativePlanarVelocityXZ,
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

describe("facingRelativePlanarVelocityXZ", () => {
  it("matches facingRelativeMoveXZ * S when forward and strafe speeds equal S", () => {
    const yaw = 0.37;
    const pairs: [number, number][] = [
      [1, 0],
      [0, 1],
      [0.6, -0.8],
      [1, 1],
    ];
    const S = 7.35;
    for (const [f, s] of pairs) {
      const { wx, wz } = facingRelativeMoveXZ(yaw, f, s);
      const { vx, vz } = facingRelativePlanarVelocityXZ(yaw, f, s, S, S);
      expect(vx).toBeCloseTo(wx * S);
      expect(vz).toBeCloseTo(wz * S);
    }
  });

  it("uses separate axis speeds on pure strafe vs pure forward", () => {
    const vF = facingRelativePlanarVelocityXZ(0, 1, 0, 10, 3);
    expect(vF.vx).toBeCloseTo(0);
    expect(vF.vz).toBeCloseTo(10);
    const vS = facingRelativePlanarVelocityXZ(0, 0, 1, 10, 3);
    expect(vS.vx).toBeCloseTo(-3);
    expect(vS.vz).toBeCloseTo(0);
  });
});
