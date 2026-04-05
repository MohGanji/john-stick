import {
  createThirdPersonFollowScratch,
  updateThirdPersonFollowCamera,
} from "./camera";
import { runGameLoop } from "./gameLoop";
import { attachActionMap } from "./input/actionMap";
import { attachActionMapDebugHud } from "./input/actionMapDebugHud";
import {
  createCombatIntentState,
  resolveCombatIntent,
  type ResolvedCombatIntent,
} from "./input/combatIntent";
import { attachKeyboardLocomotion } from "./input/keyboardLocomotion";
import { createCombatHitDebugDraw } from "./combat/combatHitDebugDraw";
import {
  createLeftPunchStrikeState,
  stepLeftPunchHitFixed,
  type LeftPunchHitDebugSnapshot,
} from "./combat/leftPunchHit";
import { leftPunchAttackPressEdge } from "./combat/hitInputEdges";
import { createDojoPlaceholderLevel } from "./level/dojoBlockout";
import { createPunchingBagSwingMesh } from "./level/punchingBagPlaceholder";
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

  const punchingBagVisual = createPunchingBagSwingMesh();
  scene.add(punchingBagVisual);

  const playerCharacter = await loadPlayerCharacter();
  scene.add(playerCharacter.root);

  const scratchPos = { x: 0, y: 0, z: 0 };
  const scratchQuat = { x: 0, y: 0, z: 0, w: 1 };
  const bagScratchPos = { x: 0, y: 0, z: 0 };
  const bagScratchQuat = { x: 0, y: 0, z: 0, w: 1 };
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
  let combatIntentState = createCombatIntentState();
  const initIntent = resolveCombatIntent(
    combatIntentState,
    actionSample,
    actionSample,
    performance.now() * 0.001,
  );
  combatIntentState = initIntent.nextState;
  /** WS-051 — priority + chord/sequence resolution (GP §3.2.3–3.2.4). */
  let combatIntent: ResolvedCombatIntent = initIntent.resolved;

  /** WS-060 — left punch active frames + Rapier probe (after physics step). */
  let leftPunchStrike = createLeftPunchStrikeState();
  let leftPunchHitDebug: LeftPunchHitDebugSnapshot = {
    active: false,
    fistWorld: { x: 0, y: 0, z: 0 },
    radius: 0.12,
  };

  const combatHitDebugDraw = import.meta.env.DEV
    ? createCombatHitDebugDraw(scene)
    : null;

  const actionMapDebugHud = import.meta.env.DEV
    ? attachActionMapDebugHud(root, () => ({
        snapshot: actionSample,
        combat: combatIntent,
      }))
    : null;

  runGameLoop({
    update(dtSeconds) {
      const prevAction = actionSample;
      actionSample = actionMap.snapshot();
      const intentOut = resolveCombatIntent(
        combatIntentState,
        prevAction,
        actionSample,
        performance.now() * 0.001,
      );
      combatIntentState = intentOut.nextState;
      combatIntent = intentOut.resolved;
      if (leftPunchAttackPressEdge(prevAction, actionSample)) {
        leftPunchStrike.pendingStart = true;
      }
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
      readRigidBodyTransform(
        physics.playerRigidBody,
        scratchPos,
        scratchQuat,
      );
      leftPunchHitDebug = stepLeftPunchHitFixed(
        physics,
        leftPunchStrike,
        scratchPos,
        scratchQuat,
      ).debug;
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
      readRigidBodyTransform(
        physics.punchingBagRigidBody,
        bagScratchPos,
        bagScratchQuat,
      );
      punchingBagVisual.position.set(
        bagScratchPos.x,
        bagScratchPos.y,
        bagScratchPos.z,
      );
      punchingBagVisual.quaternion.set(
        bagScratchQuat.x,
        bagScratchQuat.y,
        bagScratchQuat.z,
        bagScratchQuat.w,
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
      combatHitDebugDraw?.sync(leftPunchHitDebug, {
        x: bagScratchPos.x,
        y: bagScratchPos.y,
        z: bagScratchPos.z,
        qx: bagScratchQuat.x,
        qy: bagScratchQuat.y,
        qz: bagScratchQuat.z,
        qw: bagScratchQuat.w,
      });
      actionMapDebugHud?.refresh();
    },
    render() {
      renderer.render(scene, camera);
    },
  });
}
