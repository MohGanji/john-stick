import { describe, expect, it } from "vitest";

import {
  fillHitBurstVertexColors,
  HIT_BURST_VFX_MAX_PARTICLES,
  HIT_BURST_VFX_PRESETS,
  HIT_BURST_VFX_STYLE_ORDER,
} from "./hitBurstVfxPresets";

describe("hitBurstVfxPresets", () => {
  it("keeps particle counts within pool max", () => {
    for (const id of HIT_BURST_VFX_STYLE_ORDER) {
      const p = HIT_BURST_VFX_PRESETS[id];
      expect(p.particleCount).toBeGreaterThan(0);
      expect(p.particleCount).toBeLessThanOrEqual(HIT_BURST_VFX_MAX_PARTICLES);
    }
  });

  it("fillHitBurstVertexColors writes in-range RGB", () => {
    const arr = new Float32Array(9);
    const c = HIT_BURST_VFX_PRESETS.dojo_ember.colorRand;
    fillHitBurstVertexColors(arr, 3, c);
    for (let i = 0; i < 3; i++) {
      expect(arr[i * 3]).toBeGreaterThanOrEqual(c.rMin);
      expect(arr[i * 3]).toBeLessThanOrEqual(c.rMax);
      expect(arr[i * 3 + 1]).toBeGreaterThanOrEqual(c.gMin);
      expect(arr[i * 3 + 1]).toBeLessThanOrEqual(c.gMax);
      expect(arr[i * 3 + 2]).toBeGreaterThanOrEqual(c.bMin);
      expect(arr[i * 3 + 2]).toBeLessThanOrEqual(c.bMax);
    }
  });
});
