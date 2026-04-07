import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";
import * as THREE from "three";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

import {
  PLAYER_ANIM_IDLE,
  PLAYER_ANIM_WALK,
  STICKMAN_BASE_GLTF_URL,
  resolveIdleWalkClips,
} from "./playerCharacter";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const publicModel = (viteModelsUrl: string) =>
  join(repoRoot, "public", "models", viteModelsUrl.replace(/^\/models\//, ""));

const heroGlb = publicModel(STICKMAN_BASE_GLTF_URL);

describe("resolveIdleWalkClips", () => {
  it("Mixamo base hero glb: Idle + Walk among exported clips", async () => {
    const buf = readFileSync(heroGlb);
    const gltf = await new GLTFLoader().parseAsync(buf.buffer, "");
    const names = gltf.animations.map((a) => a.name);
    expect(names).toContain(PLAYER_ANIM_IDLE);
    expect(names).toContain(PLAYER_ANIM_WALK);

    const { idle, walk } = resolveIdleWalkClips(gltf, heroGlb);
    expect(walk.name).toBe(PLAYER_ANIM_WALK);
    expect(idle.name).toBe(PLAYER_ANIM_IDLE);
    expect(idle).not.toBe(walk);
  });

  it("Walk-only glTF: runtime builds synthetic Idle (hold first keyframe)", () => {
    const walk = new THREE.AnimationClip(PLAYER_ANIM_WALK, 1, [
      new THREE.NumberKeyframeTrack("Armature.foo.x", [0, 1], [0, 1]),
    ]);
    const gltf = { animations: [walk] } as unknown as GLTF;
    const { idle, walk: w } = resolveIdleWalkClips(gltf, "mock://walk-only.glb");
    expect(w).toBe(walk);
    expect(idle.name).toBe(PLAYER_ANIM_IDLE);
    expect(idle).not.toBe(walk);
  });
});
