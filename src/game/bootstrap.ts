import * as THREE from "three";

import {
  createThirdPersonFollowScratch,
  updateThirdPersonFollowCamera,
} from "./camera";
import { runGameLoop } from "./gameLoop";
import { createDojoPlaceholderLevel } from "./level/dojoBlockout";
import {
  createJohnStickPhysics,
  readRigidBodyTransform,
  stepPhysicsWorld,
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
  /** WS-032: drive with Q/E (keyboard yaw). */
  let cameraYawRad = 0;

  runGameLoop({
    update(_dtSeconds) {
      // Input sampling (WS-050+). No physics.
    },
    fixedStep(_fixedDtSeconds) {
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
        cameraYawRad,
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
