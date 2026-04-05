import { describe, expect, it } from "vitest";

import {
  DEFAULT_STRIKE_INPUT_COOLDOWN_BY_KIND,
  strikeInputCooldownAfterSec,
} from "./baseMoveTable";

describe("baseMoveTable strikeInputCooldownAfterSec", () => {
  it("uses kind default for punches", () => {
    expect(strikeInputCooldownAfterSec("atk_lp")).toBe(
      DEFAULT_STRIKE_INPUT_COOLDOWN_BY_KIND.punch,
    );
  });

  it("uses per-row override for atk_rk", () => {
    expect(strikeInputCooldownAfterSec("atk_rk")).toBe(0.3);
  });
});
