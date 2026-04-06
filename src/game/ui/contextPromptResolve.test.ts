import { describe, expect, it } from "vitest";

import { resolveContextPromptVariant } from "./contextPromptResolve";

describe("resolveContextPromptVariant", () => {
  it("hides when simulation paused", () => {
    expect(
      resolveContextPromptVariant({
        simulationPaused: true,
        signInRangeAndFacing: true,
        staminaBlockedStrike: true,
        guardHintActive: true,
      }),
    ).toBe("hidden");
  });

  it("prefers sign read over stamina and guard", () => {
    expect(
      resolveContextPromptVariant({
        simulationPaused: false,
        signInRangeAndFacing: true,
        staminaBlockedStrike: true,
        guardHintActive: true,
      }),
    ).toBe("sign_read");
  });

  it("shows stamina when no sign prompt", () => {
    expect(
      resolveContextPromptVariant({
        simulationPaused: false,
        signInRangeAndFacing: false,
        staminaBlockedStrike: true,
        guardHintActive: true,
      }),
    ).toBe("stamina_recover");
  });

  it("shows guard hint when stamina not blocked", () => {
    expect(
      resolveContextPromptVariant({
        simulationPaused: false,
        signInRangeAndFacing: false,
        staminaBlockedStrike: false,
        guardHintActive: true,
      }),
    ).toBe("guard_hint");
  });

  it("hidden when nothing applies", () => {
    expect(
      resolveContextPromptVariant({
        simulationPaused: false,
        signInRangeAndFacing: false,
        staminaBlockedStrike: false,
        guardHintActive: false,
      }),
    ).toBe("hidden");
  });
});
