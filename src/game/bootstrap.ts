import {
  createThirdPersonFollowScratch,
  updateThirdPersonFollowCamera,
} from "./camera";
import { runGameLoop } from "./gameLoop";
import { attachActionMap } from "./input/actionMap";
import { attachActionMapDebugHud } from "./input/actionMapDebugHud";
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
  const actionMap = attachActionMap(window);
  const playerLocomotion = createPlayerLocomotionState();
  const jumpLatch: JumpLatch = { latched: false };

  /**
   * Shared **facing** yaw (radians, +Y): **A** and **D** hold-to-yaw (WS-032 + WS-040) + follow cam.
   */
  let facingYawRad = 0;

  /** Sampled at start of `update`; locomotion freezes while **interact** mode is open (WS-050). */
  let actionSample = actionMap.snapshot();

  const actionMapDebugHud = import.meta.env.DEV
    ? attachActionMapDebugHud(root, () => actionSample)
    : null;

  runGameLoop({
    update(dtSeconds) {
      actionSample = actionMap.snapshot();
      if (!actionSample.interactModeOpen) {
        facingYawRad += keyboardLocomotion.facingYawDeltaRad(dtSeconds);
      }
    },
    beforeFixedSteps() {
      void actionMap.takeInteractEnterLatch();
      if (!actionSample.interactModeOpen) {
        jumpLatch.latched = keyboardLocomotion.takeJumpLatch();
      } else {
        void keyboardLocomotion.takeJumpLatch();
        jumpLatch.latched = false;
      }
    },
    fixedStep(_fixedDtSeconds) {
      const { forward, strafe } = actionSample.interactModeOpen
        ? { forward: 0, strafe: 0 }
        : keyboardLocomotion.moveAxes();
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
      const { forward, strafe } = actionSample.interactModeOpen
        ? { forward: 0, strafe: 0 }
        : keyboardLocomotion.moveAxes();
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
      actionMapDebugHud?.refresh();
    },
    render() {
      renderer.render(scene, camera);
    },
  });
}
