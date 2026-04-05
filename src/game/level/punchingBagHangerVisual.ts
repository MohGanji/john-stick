/**
 * Visual cord from ceiling to fixed physics pivot: top attachment **lags** bag planar motion so the
 * line tilts on swings (reads as flexible cable vs rigid rod). Bottom stays at the joint (Rapier).
 */
import * as THREE from "three";

import { DOJO_BLOCKOUT } from "./dojoBlockout";
import { PUNCHING_BAG, punchingBagPivotWorldY } from "./punchingBagConfig";

const _yAxis = new THREE.Vector3(0, 1, 0);
const _dir = new THREE.Vector3();

export type PunchingBagHangerVisual = {
  group: THREE.Group;
  sync(dtSeconds: number, bagWorldPos: { x: number; y: number; z: number }): void;
  dispose(): void;
};

export function createPunchingBagHangerVisual(): PunchingBagHangerVisual {
  const group = new THREE.Group();
  group.name = "punching_bag_hanger_visual";

  const geom = new THREE.CylinderGeometry(
    PUNCHING_BAG.ceilingHangerRadius,
    PUNCHING_BAG.ceilingHangerRadius,
    1,
    8,
  );
  /** WS-100 — cable trim reads with cool walls; slight metal for ring light. */
  const mat = new THREE.MeshStandardMaterial({
    color: 0x4f5565,
    roughness: 0.72,
    metalness: 0.26,
  });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);

  const pivotY = punchingBagPivotWorldY();
  /** Slightly under slab so the cord meets the ceiling patch, not inside it. */
  const ceilingAttachY = DOJO_BLOCKOUT.wallHeight - 0.04;
  const restX = PUNCHING_BAG.centerX;
  const restZ = PUNCHING_BAG.centerZ;

  /** Ceiling anchor offset (XZ); follows bag with lower gain + spring so motion < bag. */
  let swayX = 0;
  let swayZ = 0;
  let velX = 0;
  let velZ = 0;

  return {
    group,
    sync(dtSeconds: number, bagWorldPos: { x: number; y: number; z: number }) {
      const bx = bagWorldPos.x - restX;
      const bz = bagWorldPos.z - restZ;
      const maxSway = 0.15;
      const followGain = 0.34;
      const targetX = THREE.MathUtils.clamp(bx * followGain, -maxSway, maxSway);
      const targetZ = THREE.MathUtils.clamp(bz * followGain, -maxSway, maxSway);

      const dt = Math.min(Math.max(dtSeconds, 0), 0.05);
      const k = 48;
      const d = 12;
      velX += (k * (targetX - swayX) - d * velX) * dt;
      velZ += (k * (targetZ - swayZ) - d * velZ) * dt;
      swayX += velX * dt;
      swayZ += velZ * dt;

      const topX = restX + swayX;
      const topZ = restZ + swayZ;
      const bottomX = restX;
      const bottomZ = restZ;

      _dir.set(bottomX - topX, pivotY - ceilingAttachY, bottomZ - topZ);
      const len = _dir.length();
      if (len < 1e-5) {
        return;
      }
      _dir.multiplyScalar(1 / len);

      mesh.position.set(
        (topX + bottomX) * 0.5,
        (ceilingAttachY + pivotY) * 0.5,
        (topZ + bottomZ) * 0.5,
      );
      mesh.quaternion.setFromUnitVectors(_yAxis, _dir);
      mesh.scale.set(1, len, 1);
    },
    dispose() {
      geom.dispose();
      mat.dispose();
    },
  };
}
