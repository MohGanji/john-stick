/**
 * WS-060 / GP §6.2.1 — dev-only visualization for fist probe + training hurt AABB.
 */
import * as THREE from "three";

import { TRAINING_HURT_VOLUME } from "./combatHitConstants";
import type { SphereStrikeHitDebugSnapshot } from "./sphereStrikeHit";

const FIST_COLOR = 0xff8844;
const HURT_COLOR = 0x44aaff;

/**
 * Off by default: the hurt AABB tracks the swinging bag and reads as a distracting cyan box
 * over the bag cylinder. Flip to `true` when aligning WS-060 probe vs Rapier sensor.
 */
const SHOW_TRAINING_HURT_AABB = false;

export type TrainingHurtVolumeWorldPose = {
  x: number;
  y: number;
  z: number;
  qx: number;
  qy: number;
  qz: number;
  qw: number;
};

export function createCombatHitDebugDraw(scene: THREE.Scene): {
  sync(
    snapshot: SphereStrikeHitDebugSnapshot,
    hurtWorldPose?: TrainingHurtVolumeWorldPose,
  ): void;
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
  fistMesh.name = "sphere_strike_hit_probe";
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
    sync(
      snapshot: SphereStrikeHitDebugSnapshot,
      hurtWorldPose?: TrainingHurtVolumeWorldPose,
    ): void {
      fistMesh.visible = snapshot.active;
      if (snapshot.active) {
        const r = snapshot.radius;
        fistMesh.scale.set(r, r, r);
        fistMesh.position.set(
          snapshot.contactWorld.x,
          snapshot.contactWorld.y,
          snapshot.contactWorld.z,
        );
      }
      hurtMesh.visible = SHOW_TRAINING_HURT_AABB;
      if (SHOW_TRAINING_HURT_AABB) {
        if (hurtWorldPose) {
          hurtMesh.position.set(
            hurtWorldPose.x,
            hurtWorldPose.y,
            hurtWorldPose.z,
          );
          hurtMesh.quaternion.set(
            hurtWorldPose.qx,
            hurtWorldPose.qy,
            hurtWorldPose.qz,
            hurtWorldPose.qw,
          );
        } else {
          hurtMesh.position.set(
            TRAINING_HURT_VOLUME.center.x,
            TRAINING_HURT_VOLUME.center.y,
            TRAINING_HURT_VOLUME.center.z,
          );
          hurtMesh.quaternion.set(0, 0, 0, 1);
        }
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
