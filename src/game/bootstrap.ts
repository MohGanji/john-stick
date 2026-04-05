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
  type StrikeMoveId,
} from "./input/combatIntent";
import { strikePressIntent } from "./input/strikePressIntent";
import { attachKeyboardLocomotion } from "./input/keyboardLocomotion";
import { createCombatHitDebugDraw } from "./combat/combatHitDebugDraw";
import { applyTrainingBagHitFromPunch } from "./combat/applyTrainingBagHit";
import { applyTrainingDummyHitFromStrike } from "./combat/applyTrainingDummyHit";
import {
  combatHitAttackKindForStrike,
  createCombatEventBus,
  type CombatEventBus,
  type CombatHitAttackKind,
} from "./combat/combatEventBus";
import { strikeBagChargeTierIndex } from "./combat/compoundMoveTable";
import {
  consumeStaminaForStrike,
  createCombatStaminaState,
  regenCombatStamina,
  staminaAllowsStrike,
  staminaRegenPauseDeadlineAfterStrike,
  type CombatStaminaState,
} from "./combat/combatStamina";
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
import { createTrainingDummyFsm, stepTrainingDummyFsm } from "./combat/trainingDummyFsm";
import {
  trainingDummyAngularDampingFromSpin,
  trainingDummyFsmTimingFromFeel,
} from "./combat/trainingDummyFeel";
import { FIXED_DT } from "./gameLoop";
import { createDojoPlaceholderLevel } from "./level/dojoBlockout";
import { createPunchingBagHangerVisual } from "./level/punchingBagHangerVisual";
import { createPunchingBagSwingMesh } from "./level/punchingBagPlaceholder";
import {
  armTrainingDummyRecover,
  armTrainingDummyStandUp,
  prePhysicsTrainingDummy,
  rigidBodyPlanarSpeedLinAng,
} from "./physics/trainingDummyAuthority";
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
import { attachStaminaHud } from "./ui/attachStaminaHud";

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

  const [playerCharacter, trainingDummyCharacter] = await Promise.all([
    loadPlayerCharacter(),
    loadPlayerCharacter({ appearance: "training_dummy" }),
  ]);
  scene.add(playerCharacter.root);
  scene.add(trainingDummyCharacter.root);

  const scratchPos = { x: 0, y: 0, z: 0 };
  const scratchQuat = { x: 0, y: 0, z: 0, w: 1 };
  const bagScratchPos = { x: 0, y: 0, z: 0 };
  const bagScratchQuat = { x: 0, y: 0, z: 0, w: 1 };
  const dummyScratchPos = { x: 0, y: 0, z: 0 };
  const dummyScratchQuat = { x: 0, y: 0, z: 0, w: 1 };
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
  let strikeQueuedMoveId: StrikeMoveId | null = null;
  /** Move id for the in-flight window (active or just-queued pending start). */
  let activeStrikeMoveId: StrikeMoveId | null = null;
  /** Strike stamina — depletes on strike start, refills quickly (GP §2.2.2 HUD). */
  const staminaState: CombatStaminaState = createCombatStaminaState(
    gameplayTuning.combatStamina.maxStamina,
  );
  /** Stamina regen is off while `combatSimTimeSec < this` (extended on every strike start). */
  let staminaRegenPausedUntilSimSec = 0;
  /**
   * Lunge from a strike that **started** after `stepPlayerCapsule` this step (applied next fixed step).
   */
  let pendingStrikeLungeForwardMeters = 0;
  const staminaHud = attachStaminaHud(root);
  /** WS-062 — abstract lab damage on the bag (no UI yet; tunable via `bagHitTuning`). */
  let punchingBagLabDamageTotal = 0;
  /** WS-090 — lab damage on the fixed dummy (same idea as bag total). */
  let trainingDummyLabDamageTotal = 0;
  const trainingDummyFsm = createTrainingDummyFsm();
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
      const prevResolvedIntent = combatIntent;
      combatIntent = intentOut.resolved;
      strikeQueuedMoveId = null;
      const strikeBusy =
        sphereStrike.activeFramesRemaining > 0 || sphereStrike.pendingStart;
      const press = strikePressIntent(
        prevAction,
        actionSample,
        combatIntent,
        prevResolvedIntent,
      );
      if (
        press !== null &&
        !strikeBusy &&
        strikeCooldownAllowsStart(strikeCooldownGate, combatSimTimeSec) &&
        staminaAllowsStrike(staminaState, gameplayTuning.combatStamina)
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
      combatSimTimeSec += FIXED_DT;

      const dummyFeel = gameplayTuning.trainingDummyFeel;
      const dummyFsmTiming = trainingDummyFsmTimingFromFeel(dummyFeel);

      const dummyPrePhys = prePhysicsTrainingDummy(
        physics.trainingDummyRigidBody,
        trainingDummyFsm,
        FIXED_DT,
        dummyFsmTiming.recoverBlendSec,
        dummyFsmTiming.standUpBlendSec,
      );
      if (dummyPrePhys.resetLabDamageAfterRagdollRecover) {
        trainingDummyLabDamageTotal = 0;
      }

      const dummyBody = physics.trainingDummyRigidBody;
      dummyBody.setLinearDamping(dummyFeel.linearDamping);
      dummyBody.setAngularDamping(
        trainingDummyAngularDampingFromSpin(dummyFeel.spinAmount),
      );

      let lungeThisStep = pendingStrikeLungeForwardMeters;
      pendingStrikeLungeForwardMeters = 0;

      function tryConsumeStrikeQueue(lungeMode: "this" | "defer"): boolean {
        if (strikeQueuedMoveId === null) return false;
        const busy =
          sphereStrike.activeFramesRemaining > 0 || sphereStrike.pendingStart;
        if (busy) return false;
        if (!strikeCooldownAllowsStart(strikeCooldownGate, combatSimTimeSec)) {
          return false;
        }
        if (!staminaAllowsStrike(staminaState, gameplayTuning.combatStamina)) {
          return false;
        }
        activeStrikeMoveId = strikeQueuedMoveId;
        sphereStrike.pendingStart = true;
        strikeQueuedMoveId = null;
        consumeStaminaForStrike(staminaState, gameplayTuning.combatStamina);
        staminaRegenPausedUntilSimSec = staminaRegenPauseDeadlineAfterStrike(
          combatSimTimeSec,
          gameplayTuning.combatStamina,
        );
        playerCharacter.beginStrikePresentation(activeStrikeMoveId);
        const d = gameplayTuning.combatStamina.strikeLungeForwardMeters;
        if (lungeMode === "this") {
          lungeThisStep += d;
        } else {
          pendingStrikeLungeForwardMeters = d;
        }
        return true;
      }

      tryConsumeStrikeQueue("this");

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
        { strikeLungeForwardMeters: lungeThisStep },
      );
      stepPhysicsWorld(physics.world);
      readRigidBodyTransform(
        physics.playerRigidBody,
        scratchPos,
        scratchQuat,
      );

      const hadActiveStrikeWindow = sphereStrike.activeFramesRemaining > 0;
      const profileMoveId: StrikeMoveId = activeStrikeMoveId ?? "atk_lp";
      const strikeHit = stepSphereStrikeHitFixed(
        physics,
        sphereStrike,
        gameplayTuning.strikes[profileMoveId].profile,
        scratchPos,
        scratchQuat,
      );
      strikeHitDebug = strikeHit.debug;

      const moveIdForBagHit = activeStrikeMoveId;
      let dummyHitImpulseForFsm: {
        x: number;
        y: number;
        z: number;
      } | null = null;

      if (strikeHit.hitTarget === "training_bag" && moveIdForBagHit !== null) {
        const moveId = moveIdForBagHit;
        const tier = strikeBagChargeTierIndex(moveId);
        const { damageDealt, impulseWorld } = applyTrainingBagHitFromPunch(
          physics,
          {
            fistWorld: strikeHit.debug.contactWorld,
            playerPos: scratchPos,
            playerFacingYawRad: facingYawRad,
            chargeTierIndex: tier,
          },
          gameplayTuning.bag,
          gameplayTuning.combatBasics.basePunchDamage,
        );
        punchingBagLabDamageTotal += damageDealt;
        combatEvents.emit({
          type: "combat_hit",
          hit: {
            attackKind: combatHitAttackKindForStrike(moveId),
            targetKind: "training_bag",
            damageDealt,
            impulseWorld,
            contactWorld: strikeHit.debug.contactWorld,
            chargeTierIndex: tier,
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
      } else if (
        strikeHit.hitTarget === "training_dummy" &&
        moveIdForBagHit !== null &&
        trainingDummyFsm.phase !== "recover" &&
        trainingDummyFsm.phase !== "stand_up"
      ) {
        const moveId = moveIdForBagHit;
        const tier = strikeBagChargeTierIndex(moveId);
        const { damageDealt, impulseWorld } = applyTrainingDummyHitFromStrike(
          physics,
          {
            fistWorld: strikeHit.debug.contactWorld,
            playerPos: scratchPos,
            playerFacingYawRad: facingYawRad,
            chargeTierIndex: tier,
          },
          gameplayTuning.bag,
          gameplayTuning.combatBasics.basePunchDamage,
          gameplayTuning.trainingDummyFeel,
        );
        dummyHitImpulseForFsm = impulseWorld;
        trainingDummyLabDamageTotal += damageDealt;
        combatEvents.emit({
          type: "combat_hit",
          hit: {
            attackKind: combatHitAttackKindForStrike(moveId),
            targetKind: "training_dummy",
            damageDealt,
            impulseWorld,
            contactWorld: strikeHit.debug.contactWorld,
            chargeTierIndex: tier,
          },
        });
        if (import.meta.env.DEV) {
          console.debug(
            "[combat] dummy hit — damage total",
            trainingDummyLabDamageTotal,
            "/",
            gameplayTuning.combatBasics.baseEnemyHealth,
            "(+",
            damageDealt,
            ")",
          );
        }
      }

      const dummyMotion = rigidBodyPlanarSpeedLinAng(
        physics.trainingDummyRigidBody,
      );
      const dummyFsmStep = stepTrainingDummyFsm(
        trainingDummyFsm,
        FIXED_DT,
        dummyHitImpulseForFsm !== null,
        dummyHitImpulseForFsm,
        {
          labDamageTotal: trainingDummyLabDamageTotal,
          ragdollLinPlanarSpeed: dummyMotion.linPlanar,
          ragdollAngSpeed: dummyMotion.ang,
          basicEnemyMaxHealth: gameplayTuning.combatBasics.baseEnemyHealth,
        },
        dummyFsmTiming,
      );
      if (dummyFsmStep.armRecover) {
        armTrainingDummyRecover(physics.trainingDummyRigidBody, trainingDummyFsm);
      }
      if (dummyFsmStep.armStandUp) {
        armTrainingDummyStandUp(physics.trainingDummyRigidBody, trainingDummyFsm);
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
          gameplayTuning.strikes[activeStrikeMoveId]
            .inputCooldownAfterStrikeSec,
        );
        activeStrikeMoveId = null;
      }

      tryConsumeStrikeQueue("defer");

      regenCombatStamina(
        staminaState,
        gameplayTuning.combatStamina,
        FIXED_DT,
        {
          simTimeSec: combatSimTimeSec,
          pausedUntilSimSec: staminaRegenPausedUntilSimSec,
        },
      );
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

      readRigidBodyTransform(
        physics.trainingDummyRigidBody,
        dummyScratchPos,
        dummyScratchQuat,
      );
      trainingDummyCharacter.root.position.set(
        dummyScratchPos.x,
        dummyScratchPos.y,
        dummyScratchPos.z,
      );
      trainingDummyCharacter.root.quaternion.set(
        dummyScratchQuat.x,
        dummyScratchQuat.y,
        dummyScratchQuat.z,
        dummyScratchQuat.w,
      );
      trainingDummyCharacter.updateLocomotionAnim(dtSeconds, {
        planarInput: 0,
        grounded: true,
        freezePose:
          trainingDummyFsm.phase === "ragdoll" ||
          trainingDummyFsm.phase === "stand_up",
      });

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
      staminaHud.setFillRatio(
        staminaState.current /
          Math.max(1e-6, gameplayTuning.combatStamina.maxStamina),
      );
      actionMapDebugHud?.refresh();
      combatJuice.endFrame(dtSeconds);
    },
    render() {
      renderer.render(scene, camera);
    },
  });

  return { combatEvents };
}
