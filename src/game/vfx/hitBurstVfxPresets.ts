/**
 * Dev-tunable hit burst presets (WS-073) — spectrum from subtle → stylized → heavy, mirroring
 * `trainingBagSfxPresets` for the gameplay tuning HUD.
 */

export type HitBurstVfxStyleId =
  | "subtle_glint"
  | "cartoon_pop"
  | "arcade_sparks"
  | "dojo_ember"
  | "anime_streak"
  | "heavy_bloom"
  | "gritty_ash";

/** Pool geometry is sized to this max; each preset uses `particleCount` ≤ this. */
export const HIT_BURST_VFX_MAX_PARTICLES = 24;

export type HitBurstVfxColorRand = {
  readonly rMin: number;
  readonly rMax: number;
  readonly gMin: number;
  readonly gMax: number;
  readonly bMin: number;
  readonly bMax: number;
};

export type HitBurstVfxPreset = {
  readonly id: HitBurstVfxStyleId;
  readonly title: string;
  readonly tagline: string;
  readonly particleCount: number;
  readonly lifetimeSec: number;
  readonly speedMin: number;
  readonly speedMax: number;
  readonly particleSize: number;
  readonly gravityY: number;
  /** Cone spread scale for velocity randomization (baseline ~0.62). */
  readonly spread: number;
  readonly spawnJitter: number;
  readonly colorRand: HitBurstVfxColorRand;
};

export const DEFAULT_HIT_BURST_VFX_STYLE_ID: HitBurstVfxStyleId = "dojo_ember";

export const HIT_BURST_VFX_PRESETS: Record<
  HitBurstVfxStyleId,
  HitBurstVfxPreset
> = {
  subtle_glint: {
    id: "subtle_glint",
    title: "Subtle glint",
    tagline: "Few, small, fast-fade sparks — readable but minimal.",
    particleCount: 12,
    lifetimeSec: 0.22,
    speedMin: 0.55,
    speedMax: 1.85,
    particleSize: 0.044,
    gravityY: -1.15,
    spread: 0.38,
    spawnJitter: 0.012,
    colorRand: {
      rMin: 0.88,
      rMax: 1,
      gMin: 0.82,
      gMax: 0.95,
      bMin: 0.55,
      bMax: 0.75,
    },
  },
  cartoon_pop: {
    id: "cartoon_pop",
    title: "Cartoon pop",
    tagline: "Big, wide, bouncy burst — Saturday-morning punch.",
    particleCount: 22,
    lifetimeSec: 0.3,
    speedMin: 2.2,
    speedMax: 5.6,
    particleSize: 0.11,
    gravityY: -3.4,
    spread: 0.88,
    spawnJitter: 0.032,
    colorRand: {
      rMin: 0.95,
      rMax: 1,
      gMin: 0.35,
      gMax: 0.72,
      bMin: 0.15,
      bMax: 0.45,
    },
  },
  arcade_sparks: {
    id: "arcade_sparks",
    title: "Arcade sparks",
    tagline: "Cool white-cyan chips — coin-op clarity.",
    particleCount: 20,
    lifetimeSec: 0.28,
    speedMin: 2.4,
    speedMax: 6.2,
    particleSize: 0.062,
    gravityY: -1.45,
    spread: 0.52,
    spawnJitter: 0.018,
    colorRand: {
      rMin: 0.72,
      rMax: 1,
      gMin: 0.88,
      gMax: 1,
      bMin: 0.95,
      bMax: 1,
    },
  },
  dojo_ember: {
    id: "dojo_ember",
    title: "Dojo ember (default)",
    tagline: "Warm ember cone along impulse — shipped WS-073 baseline.",
    particleCount: 18,
    lifetimeSec: 0.38,
    speedMin: 1.15,
    speedMax: 3.9,
    particleSize: 0.082,
    gravityY: -2.1,
    spread: 0.62,
    spawnJitter: 0.025,
    colorRand: {
      rMin: 0.82,
      rMax: 1,
      gMin: 0.48,
      gMax: 0.78,
      bMin: 0.12,
      bMax: 0.22,
    },
  },
  anime_streak: {
    id: "anime_streak",
    title: "Anime streak",
    tagline: "Tight forward cone, high speed — slashy impact read.",
    particleCount: 16,
    lifetimeSec: 0.25,
    speedMin: 3.2,
    speedMax: 7.2,
    particleSize: 0.054,
    gravityY: -0.85,
    spread: 0.34,
    spawnJitter: 0.015,
    colorRand: {
      rMin: 0.92,
      rMax: 1,
      gMin: 0.55,
      gMax: 0.88,
      bMin: 0.75,
      bMax: 1,
    },
  },
  heavy_bloom: {
    id: "heavy_bloom",
    title: "Heavy bloom",
    tagline:
      "Long ember rays, thinner quads — extended life + reach, lighter gravity for streak read.",
    particleCount: 24,
    lifetimeSec: 0.78,
    speedMin: 1.05,
    speedMax: 3.45,
    particleSize: 0.081,
    gravityY: -1.28,
    spread: 0.62,
    spawnJitter: 0.022,
    colorRand: {
      rMin: 0.95,
      rMax: 1,
      gMin: 0.35,
      gMax: 0.62,
      bMin: 0.08,
      bMax: 0.18,
    },
  },
  gritty_ash: {
    id: "gritty_ash",
    title: "Gritty ash",
    tagline: "Desaturated, heavier gravity — street brawler dust.",
    particleCount: 20,
    lifetimeSec: 0.48,
    speedMin: 0.95,
    speedMax: 3.15,
    particleSize: 0.068,
    gravityY: -3.25,
    spread: 0.78,
    spawnJitter: 0.03,
    colorRand: {
      rMin: 0.45,
      rMax: 0.68,
      gMin: 0.4,
      gMax: 0.58,
      bMin: 0.38,
      bMax: 0.52,
    },
  },
};

export const HIT_BURST_VFX_STYLE_ORDER: readonly HitBurstVfxStyleId[] = [
  "subtle_glint",
  "cartoon_pop",
  "arcade_sparks",
  "dojo_ember",
  "anime_streak",
  "heavy_bloom",
  "gritty_ash",
];

export function getHitBurstVfxPreset(id: HitBurstVfxStyleId): HitBurstVfxPreset {
  return HIT_BURST_VFX_PRESETS[id];
}

export function fillHitBurstVertexColors(
  arr: Float32Array,
  particleCount: number,
  c: HitBurstVfxColorRand,
): void {
  for (let p = 0; p < particleCount; p++) {
    const o = p * 3;
    arr[o] = c.rMin + Math.random() * (c.rMax - c.rMin);
    arr[o + 1] = c.gMin + Math.random() * (c.gMax - c.gMin);
    arr[o + 2] = c.bMin + Math.random() * (c.bMax - c.bMin);
  }
}
