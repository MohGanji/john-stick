import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

import { computeArticulatedBindWorldTransforms } from "../physics/trainingDummyArticulatedRagdoll";
import { STICKMAN_BASE_GLTF_URL } from "./playerCharacter";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const pathFromPublicUrl = (url: string) =>
  join(repoRoot, "public", "models", url.replace(/^\/models\//, ""));

describe("stickman GLB + WS-094 bind", () => {
  it("Mixamo base hero glb: bone fallbacks resolve for ragdoll bind capture", async () => {
    const loader = new GLTFLoader();
    const buf = readFileSync(pathFromPublicUrl(STICKMAN_BASE_GLTF_URL));
    const gltf = await loader.parseAsync(buf.buffer, "");
    const group = new THREE.Group();
    group.add(gltf.scene);
    const tos = computeArticulatedBindWorldTransforms(group);
    expect(tos.length).toBe(12);
  });
});
