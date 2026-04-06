import { describe, expect, it } from "vitest";

import {
  hasNextLevel,
  LEVEL_ORDER,
  parseLevelIndexFromSearch,
} from "./levelOrder";

describe("levelOrder (WS-112)", () => {
  it("parses level query with clamping to shipped range", () => {
    expect(parseLevelIndexFromSearch("")).toBe(0);
    expect(parseLevelIndexFromSearch("?level=0")).toBe(0);
    expect(parseLevelIndexFromSearch("level=1&foo=1")).toBe(0);
    expect(parseLevelIndexFromSearch("?level=-3")).toBe(0);
    expect(parseLevelIndexFromSearch("?level=99")).toBe(LEVEL_ORDER.length - 1);
  });

  it("hasNextLevel is false while only the dojo ships", () => {
    expect(hasNextLevel(0)).toBe(false);
  });
});
