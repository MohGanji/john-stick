/**
 * WS-060 / GP §6.2.1 — dev-only visualization for fist probe + training hurt AABB.
 */
import * as THREE from "three";

import { TRAINING_HURT_VOLUME } from "./combatHitConstants";
import type { LeftPunchHitDebugSnapshot } from "./leftPunchHit";

const FIST_COLOR = 0xff8844;
const HURT_COLOR = 0x44aaff;

export function createCombatHitDebugDraw(scene: THREE.Scene): {
  sync(snapshot: LeftPunchHitDebugSnapshot): void;
  dispose(): void;
} {
  const root = new THREE.Group();
  root.name = "combat_hit_debug_ws060";
  scene.add(root);

  const fistGeom = new THREE.SphereGeometry(1, 16, 12);
  const fistMat = new THREE.MeshBasicMaterial({
    color: FIST_COLOR,
    wireframe: true,
    transparent: true,
    opacity: 0.9,
    depthTest: true,
  });
  const fistMesh = new THREE.Mesh(fistGeom, fistMat);
  fistMesh.name = "left_punch_hit_sphere";
  root.add(fistMesh);

  const hurtGeom = new THREE.BoxGeometry(
    TRAINING_HURT_VOLUME.halfExtents.x * 2,
    TRAINING_HURT_VOLUME.halfExtents.y * 2,
    TRAINING_HURT_VOLUME.halfExtents.z * 2,
  );
  const hurtMat = new THREE.MeshBasicMaterial({
    color: HURT_COLOR,
    wireframe: true,
    transparent: true,
    opacity: 0.55,
    depthTest: true,
  });
  const hurtMesh = new THREE.Mesh(hurtGeom, hurtMat);
  hurtMesh.name = "training_hurt_aabb";
  hurtMesh.position.set(
    TRAINING_HURT_VOLUME.center.x,
    TRAINING_HURT_VOLUME.center.y,
    TRAINING_HURT_VOLUME.center.z,
  );
  root.add(hurtMesh);

  return {
    sync(snapshot: LeftPunchHitDebugSnapshot): void {
      fistMesh.visible = snapshot.active;
      if (snapshot.active) {
        const r = snapshot.radius;
        fistMesh.scale.set(r, r, r);
        fistMesh.position.set(
          snapshot.fistWorld.x,
          snapshot.fistWorld.y,
          snapshot.fistWorld.z,
        );
      }
    },
    dispose(): void {
      scene.remove(root);
      fistGeom.dispose();
      fistMat.dispose();
      hurtGeom.dispose();
      hurtMat.dispose();
    },
  };
}
