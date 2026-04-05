import * as THREE from "three";
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
import { applyTrainingBagHitFromPunch } from "./combat/applyTrainingBagHit";
import {
  createCombatEventBus,
  type CombatEventBus,
} from "./combat/combatEventBus";
import {
  createLeftPunchStrikeState,
  stepLeftPunchHitFixed,
  type LeftPunchHitDebugSnapshot,
} from "./combat/leftPunchHit";
import { leftPunchAttackPressEdge } from "./combat/hitInputEdges";
import { createDojoPlaceholderLevel } from "./level/dojoBlockout";
import { createPunchingBagHangerVisual } from "./level/punchingBagHangerVisual";
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
import { getCombatJuiceAccess } from "./accessibility/combatJuiceAccess";
import { createCombatJuiceController } from "./combat/combatJuiceController";
import { createJohnStickRenderSetup } from "./render";
import { createGameplayRuntimeTuning } from "./tuning/gameplayRuntimeTuning";
import { attachCombatHitAudio } from "./audio/attachCombatHitAudio";
import { createAudioMixer } from "./audio/audioMixer";
import { playTrainingBagImpact } from "./audio/playTrainingBagImpact";

export type MountGameResult = {
  /** WS-070 / GP §4.3.3 — subscribe for hit-stop, SFX, VFX (WS-071+). */
  combatEvents: CombatEventBus;
};

export async function mountGame(
  root: HTMLElement,
): Promise<MountGameResult> {
  const physics = await createJohnStickPhysics();

  const { scene, camera, renderer } = createJohnStickRenderSetup(root);

  scene.add(createDojoPlaceholderLevel());

  const punchingBagHanger = createPunchingBagHangerVisual();
  scene.add(punchingBagHanger.group);

  const punchingBagVisual = createPunchingBagSwingMesh();
  scene.add(punchingBagVisual);

  const playerCharacter = await loadPlayerCharacter();
  scene.add(playerCharacter.root);

  const scratchPos = { x: 0, y: 0, z: 0 };
  const scratchQuat = { x: 0, y: 0, z: 0, w: 1 };
  const bagScratchPos = { x: 0, y: 0, z: 0 };
  const bagScratchQuat = { x: 0, y: 0, z: 0, w: 1 };
  const followCamScratch = createThirdPersonFollowScratch();
  const gameplayTuning = createGameplayRuntimeTuning();
  const keyboardLocomotion = attachKeyboardLocomotion(window, {
    getYawDegPerSec: () => gameplayTuning.player.yawDegPerSec,
  });
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
  /** WS-062 — abstract lab damage on the bag (no UI yet; tunable via `bagHitTuning`). */
  let punchingBagLabDamageTotal = 0;
  /** WS-070 / GP §4.3.3 — `CombatHit` → audio / VFX / hit-stop (WS-071+). */
  const combatEvents = createCombatEventBus();
  /** WS-071 / GP §6.3.1 — hit-stop (accumulator scale) + subtle FOV punch; see `getCombatJuiceAccess`. */
  const combatJuice = createCombatJuiceController({
    combatEvents,
    getAccess: () => getCombatJuiceAccess(window),
    getTuning: () => gameplayTuning.juice,
  });
  const audioMixer = createAudioMixer(window);
  const combatHitAudio = attachCombatHitAudio({
    combatEvents,
    mixer: audioMixer,
    getCamera: () => camera,
    getTrainingBagSfxStyle: () => gameplayTuning.audio.trainingBagSfxStyle,
  });
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

  if (import.meta.env.DEV) {
    void import("./dev/gameplayTuningOverlay").then(({ attachGameplayTuningOverlay }) => {
      attachGameplayTuningOverlay(root, gameplayTuning, {
        previewTrainingBagSfx() {
          if (!audioMixer) return;
          void audioMixer.getContext().resume();
          const camPos = new THREE.Vector3();
          camera.getWorldPosition(camPos);
          const fwd = new THREE.Vector3();
          camera.getWorldDirection(fwd);
          const contact = camPos.clone().addScaledVector(fwd, 2.5);
          playTrainingBagImpact(
            audioMixer,
            camera,
            {
              attackKind: "left_punch",
              targetKind: "training_bag",
              damageDealt: 1,
              impulseWorld: { x: 0, y: 0, z: 0 },
              contactWorld: {
                x: contact.x,
                y: contact.y,
                z: contact.z,
              },
              chargeTierIndex: 0,
            },
            gameplayTuning.audio.trainingBagSfxStyle,
          );
        },
      });
    });
  }

  runGameLoop({
    accumulatorTimeScale: () => combatJuice.getAccumulatorTimeScale(),
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
        gameplayTuning.player,
      );
      stepPhysicsWorld(physics.world);
      readRigidBodyTransform(
        physics.playerRigidBody,
        scratchPos,
        scratchQuat,
      );
      const punchHit = stepLeftPunchHitFixed(
        physics,
        leftPunchStrike,
        scratchPos,
        scratchQuat,
      );
      leftPunchHitDebug = punchHit.debug;
      if (punchHit.hitPunchingBag) {
        const { damageDealt, impulseWorld } = applyTrainingBagHitFromPunch(
          physics,
          {
            fistWorld: punchHit.debug.fistWorld,
            playerPos: scratchPos,
            playerFacingYawRad: facingYawRad,
            /** GP §6.2.2 — tier 0 until WS-080 passes hold/charge or `MoveId` multipliers. */
            chargeTierIndex: 0,
          },
          gameplayTuning.bag,
        );
        punchingBagLabDamageTotal += damageDealt;
        combatEvents.emit({
          type: "combat_hit",
          hit: {
            attackKind: "left_punch",
            targetKind: "training_bag",
            damageDealt,
            impulseWorld,
            contactWorld: punchHit.debug.fistWorld,
            chargeTierIndex: 0,
          },
        });
        if (import.meta.env.DEV) {
          console.debug(
            "[combat] bag hit — lab damage total",
            punchingBagLabDamageTotal,
            "(+",
            damageDealt,
            ")",
          );
        }
      }
    },
    /**
     * GP §4.2.3 — `runGameLoop` exposes `beforeFixedSteps` + `fixedStepAlpha` for dual-buffer rendering.
     * Player mesh reads integrated pose; interpolation buffers belong in a later polish pass.
     */
    lateUpdate(dtSeconds, _fixedStepAlpha) {
      combatHitAudio.flushQueuedCombatSounds();
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
      punchingBagHanger.sync(dtSeconds, bagScratchPos);
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
        {
          armLength: gameplayTuning.cameraFollow.armLength,
          smoothHalfLifeSec: gameplayTuning.cameraFollow.smoothHalfLifeSec,
          pivotYOffset: gameplayTuning.cameraFollow.pivotYOffset,
          pitchFromHorizontal: THREE.MathUtils.degToRad(
            gameplayTuning.cameraFollow.pitchDeg,
          ),
        },
      );
      combatJuice.applyPerspectiveFov(
        camera,
        gameplayTuning.camera.baseFovDeg,
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
      combatJuice.endFrame(dtSeconds);
    },
    render() {
      renderer.render(scene, camera);
    },
  });

  return { combatEvents };
}
