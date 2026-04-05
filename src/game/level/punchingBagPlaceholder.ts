import * as THREE from "three";

import { PUNCHING_BAG } from "./punchingBagConfig";

const BAG_MATERIAL = new THREE.MeshStandardMaterial({
  color: 0x9a8265,
  roughness: 0.86,
  metalness: 0.04,
});

/**
 * WS-061 — dynamic bag mesh (sync pose from `punchingBagRigidBody` each frame).
 * `CapsuleGeometry` cylindrical section length = full segment between hemisphere centers.
 */
export function createPunchingBagSwingMesh(): THREE.Group {
  const g = new THREE.Group();
  g.name = "punching_bag_swing_placeholder";
  const cylLen = PUNCHING_BAG.capsuleHalfHeight * 2;
  const geo = new THREE.CapsuleGeometry(
    PUNCHING_BAG.capsuleRadius,
    cylLen,
    6,
    12,
  );
  const mesh = new THREE.Mesh(geo, BAG_MATERIAL);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  g.add(mesh);
  return g;
}
