/**
 * WS-060 / GP §6.2.1 — **left punch** active frames: sphere **sweep** vs training hurt sensor.
 * Runs in `fixedStep` **after** `world.step()` so capsule pose matches colliders.
 */
import RAPIER from "@dimforge/rapier3d-compat";

import type { JohnStickPhysics } from "../physics/rapierWorld";
import { characterLeftUnitXZ, facingRelativeMoveXZ } from "../player/moveFromFacing";
import { LEFT_PUNCH_HIT } from "./combatHitConstants";

export type LeftPunchStrikeState = {
  /** Consumed on the first fixed substep after `update` queues a press. */
  pendingStart: boolean;
  activeFramesRemaining: number;
  /** At most one damage event per active window. */
  hitConsumed: boolean;
  lastFist: { x: number; y: number; z: number } | null;
};

export type LeftPunchHitDebugSnapshot = {
  active: boolean;
  fistWorld: { x: number; y: number; z: number };
  radius: number;
};

export function createLeftPunchStrikeState(): LeftPunchStrikeState {
  return {
    pendingStart: false,
    activeFramesRemaining: 0,
    hitConsumed: false,
    lastFist: null,
  };
}

let hitBallShape: RAPIER.Ball | null = null;

function ballShape(): RAPIER.Ball {
  if (!hitBallShape) hitBallShape = new RAPIER.Ball(LEFT_PUNCH_HIT.radius);
  return hitBallShape;
}

const shapeRotIdentity = { x: 0, y: 0, z: 0, w: 1 };

function yawFromPlayerRotation(q: { x: number; y: number; z: number; w: number }): number {
  return 2 * Math.atan2(q.y, q.w);
}

function fistWorldFromPose(
  pos: { x: number; y: number; z: number },
  yawRad: number,
): { x: number; y: number; z: number } {
  const fwd = facingRelativeMoveXZ(yawRad, 1, 0);
  const left = characterLeftUnitXZ(yawRad);
  const r = LEFT_PUNCH_HIT.reach;
  const s = LEFT_PUNCH_HIT.sideOffset;
  return {
    x: pos.x + fwd.wx * r + left.x * s,
    y: pos.y + LEFT_PUNCH_HIT.heightFromCapsuleCenter,
    z: pos.z + fwd.wz * r + left.z * s,
  };
}

function probeHitTraining(
  world: RAPIER.World,
  physics: JohnStickPhysics,
  fist: { x: number; y: number; z: number },
  last: { x: number; y: number; z: number } | null,
): boolean {
  const shape = ballShape();
  const hit = physics.trainingHurtCollider;
  const pred = (c: RAPIER.Collider) => c === hit;

  if (last === null) {
    return (
      world.intersectionWithShape(
        fist,
        shapeRotIdentity,
        shape,
        RAPIER.QueryFilterFlags.EXCLUDE_SOLIDS,
        undefined,
        physics.playerCollider,
        physics.playerRigidBody,
        pred,
      ) !== null
    );
  }

  const vx = fist.x - last.x;
  const vy = fist.y - last.y;
  const vz = fist.z - last.z;
  const cast = world.castShape(
    last,
    shapeRotIdentity,
    { x: vx, y: vy, z: vz },
    shape,
    0.0,
    1.0,
    true,
    RAPIER.QueryFilterFlags.EXCLUDE_SOLIDS,
    undefined,
    physics.playerCollider,
    physics.playerRigidBody,
    pred,
  );
  if (cast !== null) return true;

  return (
    world.intersectionWithShape(
      fist,
      shapeRotIdentity,
      shape,
      RAPIER.QueryFilterFlags.EXCLUDE_SOLIDS,
      undefined,
      physics.playerCollider,
      physics.playerRigidBody,
      pred,
    ) !== null
  );
}

export type LeftPunchFixedStepResult = {
  /** True once per strike window when the probe touches the training hurt sensor. */
  hitTrainingDummy: boolean;
  debug: LeftPunchHitDebugSnapshot;
};

/**
 * Call **after** `stepPhysicsWorld` with the player body’s **current** translation + rotation.
 */
export function stepLeftPunchHitFixed(
  physics: JohnStickPhysics,
  strike: LeftPunchStrikeState,
  playerPos: { x: number; y: number; z: number },
  playerRot: { x: number; y: number; z: number; w: number },
): LeftPunchFixedStepResult {
  const yaw = yawFromPlayerRotation(playerRot);
  const fist = fistWorldFromPose(playerPos, yaw);

  if (strike.pendingStart) {
    strike.pendingStart = false;
    strike.activeFramesRemaining = LEFT_PUNCH_HIT.activeFrames;
    strike.hitConsumed = false;
  }

  const activeThisStep = strike.activeFramesRemaining > 0;
  let hitTrainingDummy = false;

  if (activeThisStep) {
    const touch = probeHitTraining(
      physics.world,
      physics,
      fist,
      strike.lastFist,
    );
    if (touch && !strike.hitConsumed) {
      strike.hitConsumed = true;
      hitTrainingDummy = true;
      if (import.meta.env.DEV) {
        console.debug("[combat] left punch → training hurt (WS-060)");
      }
    }
    strike.activeFramesRemaining -= 1;
    strike.lastFist = fist;
  } else {
    strike.lastFist = null;
  }

  return {
    hitTrainingDummy,
    debug: {
      active: activeThisStep,
      fistWorld: fist,
      radius: LEFT_PUNCH_HIT.radius,
    },
  };
}

/** Exposed for tests — same pose math as the fixed step. */
export function fistWorldForTests(
  pos: { x: number; y: number; z: number },
  yawRad: number,
): { x: number; y: number; z: number } {
  return fistWorldFromPose(pos, yawRad);
}
