import type * as THREE from "three";
import type { CombatHit } from "../combat/combatEventBus";
import type { JohnStickAudioMixer } from "./audioMixer";
import { computeImpactPan } from "./computeImpactPan";
import {
  getTrainingBagSfxPreset,
  type TrainingBagSfxPreset,
  type TrainingBagSfxStyleId,
} from "./trainingBagSfxPresets";

const EPS = 0.0001;

function centsToRatio(cents: number): number {
  return Math.pow(2, cents / 1200);
}

function pickPitchRatio(preset: TrainingBagSfxPreset): number {
  const choices = preset.pitchCents;
  const i = Math.floor(Math.random() * choices.length);
  return centsToRatio(choices[i]!);
}

function buildNoiseBuffer(ctx: AudioContext, durationSec: number): AudioBuffer {
  const rate = ctx.sampleRate;
  const frames = Math.max(1, Math.floor(durationSec * rate));
  const buf = ctx.createBuffer(1, frames, rate);
  const ch = buf.getChannelData(0);
  for (let i = 0; i < frames; i++) {
    ch[i] = Math.random() * 2 - 1;
  }
  return buf;
}

let cachedNoise: AudioBuffer | null = null;
let cachedNoiseRate = 0;

function noiseForContext(ctx: AudioContext): AudioBuffer {
  if (!cachedNoise || cachedNoiseRate !== ctx.sampleRate) {
    cachedNoise = buildNoiseBuffer(ctx, 0.09);
    cachedNoiseRate = ctx.sampleRate;
  }
  return cachedNoise;
}

/**
 * Procedural training-bag hit; timbre driven by `TrainingBagSfxPreset` (dev HUD + future asset IDs).
 */
export function playTrainingBagImpact(
  mixer: JohnStickAudioMixer,
  camera: THREE.PerspectiveCamera,
  hit: CombatHit,
  styleId: TrainingBagSfxStyleId,
): void {
  const preset = getTrainingBagSfxPreset(styleId);
  playTrainingBagImpactWithPreset(mixer, camera, hit, preset);
}

export function playTrainingBagImpactWithPreset(
  mixer: JohnStickAudioMixer,
  camera: THREE.PerspectiveCamera,
  hit: CombatHit,
  preset: TrainingBagSfxPreset,
): void {
  const ctx = mixer.getContext();
  if (ctx.state !== "running") return;

  const t = ctx.currentTime + 0.001;
  const pitch = pickPitchRatio(preset);
  const pan = computeImpactPan(hit.contactWorld, camera);
  const panner = ctx.createStereoPanner();
  panner.pan.value = pan;
  panner.connect(mixer.sfxCombat);

  const noise = noiseForContext(ctx);
  const sc = preset.gainScale;

  const tr = preset.transient;
  const g1v = tr.gain * sc;
  const n1 = ctx.createBufferSource();
  n1.buffer = noise;
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = tr.bpHz * pitch;
  bp.Q.value = tr.q;
  const g1 = ctx.createGain();
  g1.gain.setValueAtTime(g1v, t);
  g1.gain.exponentialRampToValueAtTime(EPS, t + tr.decaySec);
  n1.connect(bp).connect(g1).connect(panner);
  n1.start(t);
  n1.stop(t + tr.decaySec + 0.02);

  const bd = preset.body;
  const g2v = bd.gain * sc;
  const osc = ctx.createOscillator();
  osc.type = "sine";
  const f0 = Math.max(EPS, bd.startHz * pitch);
  const f1 = Math.max(EPS, bd.endHz * pitch);
  osc.frequency.setValueAtTime(f0, t);
  osc.frequency.exponentialRampToValueAtTime(f1, t + bd.sweepSec);
  const g2 = ctx.createGain();
  g2.gain.setValueAtTime(g2v, t);
  g2.gain.exponentialRampToValueAtTime(EPS, t + bd.decaySec);
  osc.connect(g2).connect(panner);
  osc.start(t);
  osc.stop(t + Math.max(bd.decaySec, bd.sweepSec) + 0.05);

  const sw = preset.sweet;
  const g3v = sw.gain * sc;
  const n2 = ctx.createBufferSource();
  n2.buffer = noise;
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = sw.lpHz * pitch;
  const g3 = ctx.createGain();
  g3.gain.setValueAtTime(g3v, t);
  g3.gain.exponentialRampToValueAtTime(EPS, t + sw.decaySec);
  n2.connect(lp).connect(g3).connect(panner);
  n2.start(t);
  n2.stop(t + sw.decaySec + 0.02);

  const sub = preset.sub;
  if (sub) {
    const sgv = sub.gain * sc;
    const subOsc = ctx.createOscillator();
    subOsc.type = "sine";
    subOsc.frequency.setValueAtTime(Math.max(EPS, sub.hz * pitch), t);
    const sg = ctx.createGain();
    sg.gain.setValueAtTime(sgv, t);
    sg.gain.exponentialRampToValueAtTime(EPS, t + sub.decaySec);
    subOsc.connect(sg).connect(panner);
    subOsc.start(t);
    subOsc.stop(t + sub.decaySec + 0.04);
  }
}
