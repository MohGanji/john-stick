/**
 * WS-072 / GP §8.2.1 — single `AudioContext`, master + SFX_Combat / SFX_UI / Music buses.
 * Context starts suspended; `pointerdown` / `keydown` resume once (browser policy).
 */

export type JohnStickAudioMixer = {
  /** Routed to master; combat impacts and future strike SFX. */
  readonly sfxCombat: GainNode;
  readonly sfxUi: GainNode;
  readonly music: GainNode;
  getContext(): AudioContext;
  dispose(): void;
};

type AudioContextCtor = typeof AudioContext;

function resolveAudioContextCtor(): AudioContextCtor | null {
  const g = globalThis as unknown as {
    AudioContext?: AudioContextCtor;
    webkitAudioContext?: AudioContextCtor;
  };
  return g.AudioContext ?? g.webkitAudioContext ?? null;
}

export function createAudioMixer(target: Window = window): JohnStickAudioMixer | null {
  const Ctor = resolveAudioContextCtor();
  if (!Ctor) return null;

  const ctx = new Ctor();
  const master = ctx.createGain();
  master.gain.value = 0.78;

  const sfxCombat = ctx.createGain();
  sfxCombat.gain.value = 1;
  const sfxUi = ctx.createGain();
  sfxUi.gain.value = 1;
  const music = ctx.createGain();
  music.gain.value = 0.72;

  sfxCombat.connect(master);
  sfxUi.connect(master);
  music.connect(master);
  master.connect(ctx.destination);

  const resume = (): void => {
    void ctx.resume();
  };
  target.addEventListener("pointerdown", resume, { passive: true });
  target.addEventListener("keydown", resume, { passive: true });

  return {
    sfxCombat,
    sfxUi,
    music,
    getContext: () => ctx,
    dispose() {
      target.removeEventListener("pointerdown", resume);
      target.removeEventListener("keydown", resume);
      sfxCombat.disconnect();
      sfxUi.disconnect();
      music.disconnect();
      master.disconnect();
      void ctx.close();
    },
  };
}
