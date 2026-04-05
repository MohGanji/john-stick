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
import { loadPlayerCharacter } from "./player/playerCharacter";
import { createJohnStickRenderSetup } from "./render";

export async function mountGame(root: HTMLElement): Promise<void> {
  const physics = await createJohnStickPhysics();

  const { scene, camera, renderer } = createJohnStickRenderSetup(root);

  scene.add(createDojoPlaceholderLevel());

  const playerCharacter = await loadPlayerCharacter();
  scene.add(playerCharacter.root);

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
      playerCharacter.root.position.set(scratchPos.x, scratchPos.y, scratchPos.z);
      playerCharacter.root.quaternion.set(
        scratchQuat.x,
        scratchQuat.y,
        scratchQuat.z,
        scratchQuat.w,
      );
      const { forward, strafe } = keyboardLocomotion.moveAxes();
      const planarInput = Math.min(1, Math.hypot(forward, strafe));
      playerCharacter.updateLocomotionAnim(dtSeconds, {
        planarInput,
        grounded: playerLocomotion.wasGrounded,
      });
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
