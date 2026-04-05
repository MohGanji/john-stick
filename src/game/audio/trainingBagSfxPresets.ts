/**
 * Dev-tunable procedural bag-hit voices — spectrum from subtle → cartoon → arcade → martial →
 * exaggerated → gritty / cinematic. Swap for authored Oggs later; IDs stay stable for saves / docs.
 */

export type TrainingBagSfxStyleId =
  | "subtle_foley"
  | "cartoon_boop"
  | "springy_rubber"
  | "arcade_bright"
  | "dojo_martial"
  | "anime_whip_crack"
  | "exaggerated_slam"
  | "gritty_thump"
  | "cinematic_heavy";

export type TrainingBagSfxPreset = {
  readonly id: TrainingBagSfxStyleId;
  /** Short label in the dev HUD `<select>`. */
  readonly title: string;
  /** One-line taste note (shown under the picker). */
  readonly tagline: string;
  /** Random pitch choices in cents (± applied around nominal layer Hz). */
  readonly pitchCents: readonly number[];
  readonly transient: {
    readonly bpHz: number;
    readonly q: number;
    readonly gain: number;
    readonly decaySec: number;
  };
  readonly body: {
    readonly startHz: number;
    readonly endHz: number;
    readonly gain: number;
    readonly decaySec: number;
    readonly sweepSec: number;
  };
  readonly sweet: {
    readonly lpHz: number;
    readonly gain: number;
    readonly decaySec: number;
  };
  /** Multiplies transient + body + sweet gains (not sub). */
  readonly gainScale: number;
  /** Optional sub bump (fourth layer). */
  readonly sub?: {
    readonly hz: number;
    readonly gain: number;
    readonly decaySec: number;
  };
};

export const DEFAULT_TRAINING_BAG_SFX_STYLE_ID: TrainingBagSfxStyleId =
  "exaggerated_slam";

export const TRAINING_BAG_SFX_PRESETS: Record<
  TrainingBagSfxStyleId,
  TrainingBagSfxPreset
> = {
  subtle_foley: {
    id: "subtle_foley",
    title: "Subtle foley",
    tagline: "Soft bag rustle; low transient — readable but gentle.",
    pitchCents: [-35, 0, 35],
    transient: { bpHz: 1750, q: 0.55, gain: 0.09, decaySec: 0.032 },
    body: {
      startHz: 148,
      endHz: 78,
      gain: 0.065,
      decaySec: 0.15,
      sweepSec: 0.1,
    },
    sweet: { lpHz: 780, gain: 0.2, decaySec: 0.26 },
    gainScale: 1,
  },
  cartoon_boop: {
    id: "cartoon_boop",
    title: "Cartoon boop",
    tagline: "High, round attack; bouncy mids — Saturday-morning friendly.",
    pitchCents: [-180, -60, 60, 180],
    transient: { bpHz: 3800, q: 1.1, gain: 0.42, decaySec: 0.018 },
    body: {
      startHz: 340,
      endHz: 220,
      gain: 0.2,
      decaySec: 0.09,
      sweepSec: 0.055,
    },
    sweet: { lpHz: 900, gain: 0.08, decaySec: 0.1 },
    gainScale: 1.05,
  },
  springy_rubber: {
    id: "springy_rubber",
    title: "Springy rubber",
    tagline: "Stretchy sweep + longer decay — toy / sandbag exaggeration.",
    pitchCents: [-100, 0, 100],
    transient: { bpHz: 2100, q: 1.4, gain: 0.28, decaySec: 0.022 },
    body: {
      startHz: 118,
      endHz: 165,
      gain: 0.22,
      decaySec: 0.2,
      sweepSec: 0.14,
    },
    sweet: { lpHz: 520, gain: 0.14, decaySec: 0.2 },
    gainScale: 1,
  },
  arcade_bright: {
    id: "arcade_bright",
    title: "Arcade bright",
    tagline: "Snappy tick + thin body — coin-op clarity, low mud.",
    pitchCents: [-80, 0, 80],
    transient: { bpHz: 4200, q: 0.95, gain: 0.48, decaySec: 0.014 },
    body: {
      startHz: 280,
      endHz: 160,
      gain: 0.14,
      decaySec: 0.07,
      sweepSec: 0.045,
    },
    sweet: { lpHz: 1200, gain: 0.06, decaySec: 0.08 },
    gainScale: 1,
  },
  dojo_martial: {
    id: "dojo_martial",
    title: "Dojo martial",
    tagline: "Dry snap + mid thump + cloth — original WS-072 balance (quieter than Exaggerated slam).",
    pitchCents: [-120, 0, 120],
    transient: { bpHz: 2600, q: 0.85, gain: 0.38, decaySec: 0.028 },
    body: {
      startHz: 215,
      endHz: 92,
      gain: 0.28,
      decaySec: 0.11,
      sweepSec: 0.085,
    },
    sweet: { lpHz: 520, gain: 0.11, decaySec: 0.16 },
    gainScale: 1,
  },
  anime_whip_crack: {
    id: "anime_whip_crack",
    title: "Anime whip crack",
    tagline: "Bright slash transient; quick decay — flashy screen-fx pairing.",
    pitchCents: [-140, 0, 140],
    transient: { bpHz: 5200, q: 2.8, gain: 0.44, decaySec: 0.011 },
    body: {
      startHz: 320,
      endHz: 155,
      gain: 0.2,
      decaySec: 0.085,
      sweepSec: 0.055,
    },
    sweet: { lpHz: 680, gain: 0.09, decaySec: 0.12 },
    gainScale: 1.02,
  },
  exaggerated_slam: {
    id: "exaggerated_slam",
    title: "Exaggerated slam (default)",
    tagline:
      "Longer bloom + hotter stack — big swing / hit-stop candy; current shipped default.",
    pitchCents: [-100, 0, 100],
    transient: { bpHz: 2150, q: 0.7, gain: 0.54, decaySec: 0.05 },
    body: {
      startHz: 165,
      endHz: 48,
      gain: 0.48,
      decaySec: 0.22,
      sweepSec: 0.15,
    },
    sweet: { lpHz: 380, gain: 0.22, decaySec: 0.34 },
    gainScale: 1.32,
  },
  gritty_thump: {
    id: "gritty_thump",
    title: "Gritty thump",
    tagline: "Duller edge, noisy midweight — street brawler, not clean dojo.",
    pitchCents: [-90, 0, 90],
    transient: { bpHz: 1350, q: 0.45, gain: 0.32, decaySec: 0.022 },
    body: {
      startHz: 185,
      endHz: 72,
      gain: 0.34,
      decaySec: 0.12,
      sweepSec: 0.09,
    },
    sweet: { lpHz: 420, gain: 0.2, decaySec: 0.18 },
    gainScale: 1.05,
  },
  cinematic_heavy: {
    id: "cinematic_heavy",
    title: "Cinematic heavy",
    tagline: "Sub weight + long tail — trailer punch; watch master bus headroom.",
    pitchCents: [-70, 0, 70],
    transient: { bpHz: 2200, q: 0.7, gain: 0.36, decaySec: 0.03 },
    body: {
      startHz: 155,
      endHz: 48,
      gain: 0.42,
      decaySec: 0.18,
      sweepSec: 0.12,
    },
    sweet: { lpHz: 380, gain: 0.12, decaySec: 0.32 },
    gainScale: 1.12,
    sub: { hz: 52, gain: 0.22, decaySec: 0.28 },
  },
};

/** HUD order: subtle → extreme / stylized. */
export const TRAINING_BAG_SFX_STYLE_ORDER: readonly TrainingBagSfxStyleId[] = [
  "subtle_foley",
  "cartoon_boop",
  "springy_rubber",
  "arcade_bright",
  "dojo_martial",
  "anime_whip_crack",
  "exaggerated_slam",
  "gritty_thump",
  "cinematic_heavy",
];

export function getTrainingBagSfxPreset(
  id: TrainingBagSfxStyleId,
): TrainingBagSfxPreset {
  return TRAINING_BAG_SFX_PRESETS[id];
}
