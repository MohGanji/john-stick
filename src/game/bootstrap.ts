import * as THREE from "three";

import {
  createThirdPersonFollowScratch,
  updateThirdPersonFollowCamera,
} from "./camera";
import { runGameLoop } from "./gameLoop";
import { attachKeyboardLocomotion } from "./input/keyboardLocomotion";
import { createDojoPlaceholderLevel } from "./level/dojoBlockout";
import {
  createJohnStickPhysics,
  readRigidBodyTransform,
  stepPhysicsWorld,
} from "./physics/rapierWorld";
import {
  createPlayerLocomotionState,
  stepPlayerCapsule,
  type JumpLatch,
} from "./player/stepPlayerCapsule";
import { PLAYER_CAPSULE } from "./player/playerCapsuleConfig";
import { createJohnStickRenderSetup } from "./render";

export async function mountGame(root: HTMLElement): Promise<void> {
  const physics = await createJohnStickPhysics();

  const { scene, camera, renderer } = createJohnStickRenderSetup(root);

  scene.add(createDojoPlaceholderLevel());

  const cylLen = PLAYER_CAPSULE.halfHeight * 2;
  const playerMesh = new THREE.Mesh(
    new THREE.CapsuleGeometry(
      PLAYER_CAPSULE.radius,
      cylLen,
      6,
      12,
    ),
    new THREE.MeshStandardMaterial({
      color: 0x66ccff,
      roughness: 0.45,
      metalness: 0.08,
    }),
  );
  playerMesh.castShadow = true;
  playerMesh.receiveShadow = true;
  scene.add(playerMesh);

  const scratchPos = { x: 0, y: 0, z: 0 };
  const scratchQuat = { x: 0, y: 0, z: 0, w: 1 };
  const followCamScratch = createThirdPersonFollowScratch();
  const keyboardLocomotion = attachKeyboardLocomotion(window);
  const playerLocomotion = createPlayerLocomotionState();
  const jumpLatch: JumpLatch = { latched: false };

  /**
   * Shared **facing** yaw (radians, +Y): **A** and **D** hold-to-yaw (WS-032 + WS-040) + follow cam.
   */
  let facingYawRad = 0;

  runGameLoop({
    update(dtSeconds) {
      facingYawRad += keyboardLocomotion.facingYawDeltaRad(dtSeconds);
    },
    beforeFixedSteps() {
      jumpLatch.latched = keyboardLocomotion.takeJumpLatch();
    },
    fixedStep(_fixedDtSeconds) {
      const { forward, strafe } = keyboardLocomotion.moveAxes();
      stepPlayerCapsule(
        physics,
        playerLocomotion,
        facingYawRad,
        forward,
        strafe,
        jumpLatch,
      );
      stepPhysicsWorld(physics.world);
    },
    /**
     * GP §4.2.3 — `runGameLoop` exposes `beforeFixedSteps` + `fixedStepAlpha` for dual-buffer rendering.
     * Player mesh reads integrated pose; interpolation buffers belong in a later polish pass.
     */
    lateUpdate(dtSeconds, _fixedStepAlpha) {
      readRigidBodyTransform(
        physics.playerRigidBody,
        scratchPos,
        scratchQuat,
      );
      playerMesh.position.set(scratchPos.x, scratchPos.y, scratchPos.z);
      playerMesh.quaternion.set(
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
          excludeRigidBody: physics.playerRigidBody,
        },
      );
    },
    render() {
      renderer.render(scene, camera);
    },
  });
}
