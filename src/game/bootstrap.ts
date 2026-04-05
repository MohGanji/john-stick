import * as THREE from "three";

import {
  createThirdPersonFollowScratch,
  updateThirdPersonFollowCamera,
} from "./camera";
import { runGameLoop } from "./gameLoop";
import { attachKeyboardYaw } from "./input/keyboardYaw";
import { createDojoPlaceholderLevel } from "./level/dojoBlockout";
import {
  createJohnStickPhysics,
  readRigidBodyTransform,
  stepPhysicsWorld,
  syncRigidBodyYawFromFacing,
} from "./physics/rapierWorld";
import { createJohnStickRenderSetup } from "./render";

export async function mountGame(root: HTMLElement): Promise<void> {
  const physics = await createJohnStickPhysics();

  const { scene, camera, renderer } = createJohnStickRenderSetup(root);

  scene.add(createDojoPlaceholderLevel());

  const demoMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.44, 0.44, 0.44),
    new THREE.MeshStandardMaterial({
      color: 0x66ccff,
      roughness: 0.45,
      metalness: 0.08,
    }),
  );
  demoMesh.castShadow = true;
  demoMesh.receiveShadow = true;
  scene.add(demoMesh);

  const scratchPos = { x: 0, y: 0, z: 0 };
  const scratchQuat = { x: 0, y: 0, z: 0, w: 1 };
  const followCamScratch = createThirdPersonFollowScratch();
  const keyboardYaw = attachKeyboardYaw(window);
  /**
   * WS-032 — shared **facing** yaw (radians, +Y): demo body + follow camera use the same angle
   * so the camera stays behind the player’s forward (+Z mesh axis at yaw 0).
   */
  let facingYawRad = 0;

  runGameLoop({
    update(dtSeconds) {
      facingYawRad += keyboardYaw.consumeYawDeltaRad(dtSeconds);
    },
    fixedStep(_fixedDtSeconds) {
      syncRigidBodyYawFromFacing(physics.demoRigidBody, facingYawRad);
      stepPhysicsWorld(physics.world);
    },
    /**
     * GP §4.2.3 — `runGameLoop` exposes `beforeFixedSteps` + `fixedStepAlpha` for dual-buffer rendering.
     * Demo mesh uses the integrated pose directly; per-substep prev/curr buffers belong in WS-040+.
     */
    lateUpdate(dtSeconds, _fixedStepAlpha) {
      readRigidBodyTransform(
        physics.demoRigidBody,
        scratchPos,
        scratchQuat,
      );
      demoMesh.position.set(scratchPos.x, scratchPos.y, scratchPos.z);
      demoMesh.quaternion.set(
        scratchQuat.x,
        scratchQuat.y,
        scratchQuat.z,
        scratchQuat.w,
      );
      updateThirdPersonFollowCamera(
        camera,
        scratchPos,
        facingYawRad,
        dtSeconds,
        followCamScratch,
        {
          world: physics.world,
          excludeRigidBody: physics.demoRigidBody,
        },
      );
    },
    render() {
      renderer.render(scene, camera);
    },
  });
}
