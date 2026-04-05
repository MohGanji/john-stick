import { describe, expect, it, vi } from "vitest";
import * as THREE from "three";
import { createCombatEventBus } from "../combat/combatEventBus";
import { attachCombatHitAudio } from "./attachCombatHitAudio";

vi.mock("./playTrainingBagImpact", () => ({
  playTrainingBagImpact: vi.fn(),
}));

import { playTrainingBagImpact } from "./playTrainingBagImpact";

const sampleHit = {
  attackKind: "left_punch" as const,
  targetKind: "training_bag" as const,
  damageDealt: 1,
  impulseWorld: { x: 0, y: 0, z: 0 },
  contactWorld: { x: 0, y: 1, z: 0 },
  chargeTierIndex: 0,
};

describe("attachCombatHitAudio", () => {
  it("does not call play when mixer is null", () => {
    vi.mocked(playTrainingBagImpact).mockClear();
    const bus = createCombatEventBus();
    const audio = attachCombatHitAudio({
      combatEvents: bus,
      mixer: null,
      getCamera: () => new THREE.PerspectiveCamera(),
      getTrainingBagSfxStyleForHit: () => "dojo_martial",
    });
    bus.emit({ type: "combat_hit", hit: sampleHit });
    audio.flushQueuedCombatSounds();
    expect(playTrainingBagImpact).not.toHaveBeenCalled();
    audio.dispose();
  });
});
