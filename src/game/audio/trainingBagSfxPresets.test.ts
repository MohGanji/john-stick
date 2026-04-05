import { describe, expect, it } from "vitest";
import {
  TRAINING_BAG_SFX_PRESETS,
  TRAINING_BAG_SFX_STYLE_ORDER,
  type TrainingBagSfxStyleId,
} from "./trainingBagSfxPresets";

describe("trainingBagSfxPresets", () => {
  it("lists every style id exactly once in HUD order", () => {
    const ids = Object.keys(TRAINING_BAG_SFX_PRESETS) as TrainingBagSfxStyleId[];
    expect(TRAINING_BAG_SFX_STYLE_ORDER.length).toBe(ids.length);
    const seen = new Set<TrainingBagSfxStyleId>();
    for (const id of TRAINING_BAG_SFX_STYLE_ORDER) {
      expect(seen.has(id)).toBe(false);
      seen.add(id);
    }
    for (const id of ids) {
      expect(seen.has(id)).toBe(true);
    }
  });
});
