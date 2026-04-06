import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

import { computeArticulatedBindWorldTransforms } from "../physics/trainingDummyArticulatedRagdoll";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const kaisoonGlb = join(repoRoot, "public/models/stickman_fighting_kaisoon.glb");

describe("stickman GLB + WS-094 bind", () => {
  it("kaisoon glb: Mixamo bone names (no colon) resolve for ragdoll bind capture", async () => {
    const loader = new GLTFLoader();
    const buf = readFileSync(kaisoonGlb);
    const gltf = await loader.parseAsync(buf.buffer, "");
    const group = new THREE.Group();
    group.add(gltf.scene);
    const tos = computeArticulatedBindWorldTransforms(group);
    expect(tos.length).toBe(12);
  });
});
