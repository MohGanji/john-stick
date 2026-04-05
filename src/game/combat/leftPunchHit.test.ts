import { describe, expect, it } from "vitest";

import { LEFT_PUNCH_HIT } from "./combatHitConstants";
import { fistWorldForTests } from "./leftPunchHit";

describe("fistWorldForTests", () => {
  it("places fist forward +Z at yaw 0 and on character left (+X)", () => {
    const p = fistWorldForTests({ x: 0, y: 1, z: 0 }, 0);
    expect(p.y).toBeCloseTo(1 + LEFT_PUNCH_HIT.heightFromCapsuleCenter);
    expect(p.z).toBeCloseTo(LEFT_PUNCH_HIT.reach);
    expect(p.x).toBeCloseTo(LEFT_PUNCH_HIT.sideOffset);
  });

  it("rotates with yaw so forward tracks sin/cos", () => {
    const p = fistWorldForTests({ x: 0, y: 0, z: 0 }, Math.PI / 2);
    // yaw π/2 → forward +X; character left is −Z (same as strafe A)
    expect(p.x).toBeCloseTo(LEFT_PUNCH_HIT.reach);
    expect(p.z).toBeCloseTo(-LEFT_PUNCH_HIT.sideOffset);
  });
});
