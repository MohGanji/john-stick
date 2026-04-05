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
  combatHitAttackKindForBaseMove,
  createCombatEventBus,
  type CombatEventBus,
  type CombatHitAttackKind,
} from "./combat/combatEventBus";
import type { BaseAttackMoveId } from "./combat/baseMoveTable";
import {
  applyStrikeCooldownAfterWindow,
  createStrikeCooldownGateState,
  strikeCooldownAllowsStart,
  type StrikeCooldownGateState,
} from "./combat/strikeCooldownGate";
import {
  createSphereStrikeState,
  stepSphereStrikeHitFixed,
  type SphereStrikeHitDebugSnapshot,
} from "./combat/sphereStrikeHit";
import { baseStrikePressIntent } from "./input/baseStrikeInput";
import { FIXED_DT } from "./gameLoop";
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
import { attachCombatHitBurstVfx } from "./vfx/attachCombatHitBurstVfx";

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

  /** WS-060 / WS-080 — one active sphere strike slot + designer table profiles. */
  let sphereStrike = createSphereStrikeState();
  /** Sim time (seconds) for strike cooldown gate — advances in `fixedStep` only. */
  let combatSimTimeSec = 0;
  let strikeCooldownGate: StrikeCooldownGateState = createStrikeCooldownGateState();
  /** Queued on a clean base-attack press in `update`; consumed in `fixedStep` when allowed. */
  let strikeQueuedMoveId: BaseAttackMoveId | null = null;
  /** Move id for the in-flight window (active or just-queued pending start). */
  let activeStrikeMoveId: BaseAttackMoveId | null = null;
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
    getTrainingBagSfxStyleForHit: (hit) =>
      gameplayTuning.audio.trainingBagSfxByAttackKind[hit.attackKind],
  });
  /** WS-073 / GP §6.3.2 — burst particles on `combat_hit` (queue + integrate in `lateUpdate`). */
  const combatHitBurstVfx = attachCombatHitBurstVfx({
    scene,
    combatEvents,
    getJuiceAccess: () => getCombatJuiceAccess(window),
    getHitBurstStyle: () => gameplayTuning.vfx.hitBurstStyle,
  });
  let strikeHitDebug: SphereStrikeHitDebugSnapshot = {
    active: false,
    contactWorld: { x: 0, y: 0, z: 0 },
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
        previewTrainingBagSfx(attackKind: CombatHitAttackKind) {
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
              attackKind,
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
            gameplayTuning.audio.trainingBagSfxByAttackKind[attackKind],
          );
        },
        previewHitBurstVfx() {
          const camPos = new THREE.Vector3();
          camera.getWorldPosition(camPos);
          const fwd = new THREE.Vector3();
          camera.getWorldDirection(fwd);
          const contact = camPos.clone().addScaledVector(fwd, 2.5);
          combatHitBurstVfx.enqueuePreviewHit({
            attackKind: "left_punch",
            targetKind: "training_bag",
            damageDealt: 1,
            impulseWorld: {
              x: fwd.x * 4,
              y: fwd.y * 4,
              z: fwd.z * 4,
            },
            contactWorld: {
              x: contact.x,
              y: contact.y,
              z: contact.z,
            },
            chargeTierIndex: 0,
          });
          combatHitBurstVfx.flushQueuedSpawns();
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
      strikeQueuedMoveId = null;
      const strikeBusy =
        sphereStrike.activeFramesRemaining > 0 || sphereStrike.pendingStart;
      const press = baseStrikePressIntent(
        prevAction,
        actionSample,
        combatIntent,
      );
      if (
        press !== null &&
        !strikeBusy &&
        strikeCooldownAllowsStart(strikeCooldownGate, combatSimTimeSec)
      ) {
        strikeQueuedMoveId = press;
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

      combatSimTimeSec += FIXED_DT;

      function tryConsumeStrikeQueue(): void {
        if (strikeQueuedMoveId === null) return;
        const busy =
          sphereStrike.activeFramesRemaining > 0 || sphereStrike.pendingStart;
        if (busy) return;
        if (!strikeCooldownAllowsStart(strikeCooldownGate, combatSimTimeSec)) {
          return;
        }
        activeStrikeMoveId = strikeQueuedMoveId;
        sphereStrike.pendingStart = true;
        strikeQueuedMoveId = null;
      }

      tryConsumeStrikeQueue();

      const hadActiveStrikeWindow = sphereStrike.activeFramesRemaining > 0;
      const profileMoveId: BaseAttackMoveId = activeStrikeMoveId ?? "atk_lp";
      const strikeHit = stepSphereStrikeHitFixed(
        physics,
        sphereStrike,
        gameplayTuning.baseStrikes[profileMoveId].profile,
        scratchPos,
        scratchQuat,
      );
      strikeHitDebug = strikeHit.debug;

      const moveIdForBagHit = activeStrikeMoveId;

      if (strikeHit.hitPunchingBag && moveIdForBagHit !== null) {
        const moveId = moveIdForBagHit;
        const { damageDealt, impulseWorld } = applyTrainingBagHitFromPunch(
          physics,
          {
            fistWorld: strikeHit.debug.contactWorld,
            playerPos: scratchPos,
            playerFacingYawRad: facingYawRad,
            /** GP §6.2.2 — higher tiers when hold/charge or compound rows wire in (WS-081+). */
            chargeTierIndex: 0,
          },
          gameplayTuning.bag,
        );
        punchingBagLabDamageTotal += damageDealt;
        combatEvents.emit({
          type: "combat_hit",
          hit: {
            attackKind: combatHitAttackKindForBaseMove(moveId),
            targetKind: "training_bag",
            damageDealt,
            impulseWorld,
            contactWorld: strikeHit.debug.contactWorld,
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

      if (
        hadActiveStrikeWindow &&
        sphereStrike.activeFramesRemaining === 0 &&
        activeStrikeMoveId !== null
      ) {
        applyStrikeCooldownAfterWindow(
          strikeCooldownGate,
          combatSimTimeSec,
          activeStrikeMoveId,
          gameplayTuning.baseStrikes[activeStrikeMoveId]
            .inputCooldownAfterStrikeSec,
        );
        activeStrikeMoveId = null;
      }

      tryConsumeStrikeQueue();
    },
    /**
     * GP §4.2.3 — `runGameLoop` exposes `beforeFixedSteps` + `fixedStepAlpha` for dual-buffer rendering.
     * Player mesh reads integrated pose; interpolation buffers belong in a later polish pass.
     */
    lateUpdate(dtSeconds, _fixedStepAlpha) {
      combatHitAudio.flushQueuedCombatSounds();
      combatHitBurstVfx.flushQueuedSpawns();
      combatHitBurstVfx.update(dtSeconds);
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
      combatHitDebugDraw?.sync(strikeHitDebug, {
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
