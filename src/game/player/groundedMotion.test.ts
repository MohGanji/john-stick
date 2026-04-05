import { describe, expect, it } from "vitest";

import { clampVerticalVelocityWhenGrounded } from "./groundedMotion";

describe("clampVerticalVelocityWhenGrounded", () => {
  it("leaves airborne velocity unchanged", () => {
    expect(clampVerticalVelocityWhenGrounded(-4.2, false)).toBeCloseTo(-4.2);
    expect(clampVerticalVelocityWhenGrounded(3, false)).toBeCloseTo(3);
  });

  it("zeros downward velocity when grounded", () => {
    expect(clampVerticalVelocityWhenGrounded(-0.01, true)).toBe(0);
  });

  it("keeps upward velocity when grounded (e.g. jump frame)", () => {
    expect(clampVerticalVelocityWhenGrounded(6, true)).toBeCloseTo(6);
  });
});
