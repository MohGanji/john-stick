import type * as THREE from "three";
import type { CombatEventBus, CombatHit } from "../combat/combatEventBus";
import type { JohnStickAudioMixer } from "./audioMixer";
import { playTrainingBagImpact } from "./playTrainingBagImpact";
import type { TrainingBagSfxStyleId } from "./trainingBagSfxPresets";

/**
 * WS-072 — queue `combat_hit` from the bus (fixed step) and play in `lateUpdate` so Web Audio
 * work stays off the combat stack (`combatEventBus` doc).
 */
export function attachCombatHitAudio(input: {
  combatEvents: CombatEventBus;
  mixer: JohnStickAudioMixer | null;
  getCamera: () => THREE.PerspectiveCamera;
  getTrainingBagSfxStyle: () => TrainingBagSfxStyleId;
}): {
  flushQueuedCombatSounds: () => void;
  dispose: () => void;
} {
  const queue: CombatHit[] = [];

  const off = input.combatEvents.subscribe((ev) => {
    if (ev.type !== "combat_hit") return;
    if (ev.hit.targetKind !== "training_bag") return;
    queue.push(ev.hit);
  });

  return {
    flushQueuedCombatSounds() {
      if (queue.length === 0) return;
      const mixer = input.mixer;
      if (!mixer) {
        queue.length = 0;
        return;
      }
      const cam = input.getCamera();
      while (queue.length > 0) {
        const hit = queue.shift()!;
        playTrainingBagImpact(mixer, cam, hit, input.getTrainingBagSfxStyle());
      }
    },
    dispose() {
      off();
      queue.length = 0;
    },
  };
}
