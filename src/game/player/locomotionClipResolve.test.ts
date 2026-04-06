import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

import { PLAYER_ANIM_IDLE, PLAYER_ANIM_WALK, resolveIdleWalkClips } from "./playerCharacter";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const kaisoonGlb = join(repoRoot, "public/models/stickman_fighting_kaisoon.glb");

describe("resolveIdleWalkClips", () => {
  it("kaisoon glb: only Walk in file — idle must be a separate clip (hold) so standing does not play walk cycle", async () => {
    const buf = readFileSync(kaisoonGlb);
    const gltf = await new GLTFLoader().parseAsync(buf.buffer, "");
    expect(gltf.animations.map((a) => a.name)).toEqual(["Walk"]);

    const { idle, walk } = resolveIdleWalkClips(gltf, kaisoonGlb);
    expect(walk.name).toBe(PLAYER_ANIM_WALK);
    expect(idle.name).toBe(PLAYER_ANIM_IDLE);
    expect(idle).not.toBe(walk);
  });
});
