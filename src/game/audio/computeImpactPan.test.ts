import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { computeImpactPan } from "./computeImpactPan";

describe("computeImpactPan", () => {
  it("returns positive pan when contact is to the camera's right", () => {
    const cam = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
    cam.position.set(0, 1.5, 0);
    cam.lookAt(0, 1.5, -5);
    cam.updateMatrixWorld(true);
    const pan = computeImpactPan({ x: 2.5, y: 1.5, z: -5 }, cam);
    expect(pan).toBeGreaterThan(0.15);
  });

  it("clamps to [-1, 1]", () => {
    const cam = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
    cam.position.set(0, 0, 0);
    cam.lookAt(0, 0, -1);
    cam.updateMatrixWorld(true);
    expect(computeImpactPan({ x: 1e6, y: 0, z: -1 }, cam, 1)).toBe(1);
    expect(computeImpactPan({ x: -1e6, y: 0, z: -1 }, cam, 1)).toBe(-1);
  });
});
