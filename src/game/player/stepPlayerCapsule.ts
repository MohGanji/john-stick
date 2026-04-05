import { FIXED_DT } from "../gameLoop";
import { INPUT_COMBAT } from "../input/inputCombatConstants";
import { KEYBOARD_LOCOMOTION } from "../input/keyboardLocomotion";
import {
  syncRigidBodyYawFromFacing,
  type JohnStickPhysics,
} from "../physics/rapierWorld";
import { clampVerticalVelocityWhenGrounded } from "./groundedMotion";
import { facingRelativePlanarVelocityXZ } from "./moveFromFacing";
import { PLAYER_CAPSULE } from "./playerCapsuleConfig";
import type { PlayerLocomotionScalars } from "../tuning/gameplayRuntimeTuning";

export type PlayerLocomotionState = {
  /** From last `computeColliderMovement` (start false until first step). */
  wasGrounded: boolean;
  verticalVelocity: number;
  /** GP §3.2.3 — time left (seconds) to jump after leaving ground. */
  coyoteRemainingSec: number;
};

export function createPlayerLocomotionState(): PlayerLocomotionState {
  /** Spawn on dojo floor — allows first-frame jump; KCC overwrites after first step. */
  return { wasGrounded: true, verticalVelocity: 0, coyoteRemainingSec: 0 };
}

export type JumpLatch = { latched: boolean };

/**
 * WS-040 — Rapier **kinematic** capsule + `KinematicCharacterController` for one fixed step.
 * Call **before** `world.step()`. Consumes at most one jump per frame via `jumpLatch`.
 */
export function stepPlayerCapsule(
  physics: JohnStickPhysics,
  state: PlayerLocomotionState,
  facingYawRad: number,
  moveForwardSigned: number,
  moveStrafeSigned: number,
  jumpLatch: JumpLatch,
  /** When set, overrides move/jump/gravity scalars from `PLAYER_CAPSULE`. */
  locomotionScalars?: PlayerLocomotionScalars,
): void {
  const { playerRigidBody, playerCollider, characterController } = physics;
  const dt = FIXED_DT;
  const loc = locomotionScalars ?? {
    forwardMoveSpeed: PLAYER_CAPSULE.moveSpeed,
    strafeMoveSpeed: PLAYER_CAPSULE.strafeMoveSpeed,
    yawDegPerSec: KEYBOARD_LOCOMOTION.yawDegPerSec,
    jumpVelocity: PLAYER_CAPSULE.jumpVelocity,
    gravityY: PLAYER_CAPSULE.gravityY,
  };

  syncRigidBodyYawFromFacing(playerRigidBody, facingYawRad);

  let vy = state.verticalVelocity;

  if (jumpLatch.latched) {
    if (state.wasGrounded || state.coyoteRemainingSec > 0) {
      vy = loc.jumpVelocity;
      state.coyoteRemainingSec = 0;
    }
    jumpLatch.latched = false;
  }

  vy += loc.gravityY * dt;

  const { vx, vz } = facingRelativePlanarVelocityXZ(
    facingYawRad,
    moveForwardSigned,
    moveStrafeSigned,
    loc.forwardMoveSpeed,
    loc.strafeMoveSpeed,
  );
  const desiredTranslation = {
    x: vx * dt,
    y: vy * dt,
    z: vz * dt,
  };

  characterController.computeColliderMovement(
    playerCollider,
    desiredTranslation,
  );

  const movement = characterController.computedMovement();
  const grounded = characterController.computedGrounded();

  const t = playerRigidBody.translation();
  playerRigidBody.setNextKinematicTranslation({
    x: t.x + movement.x,
    y: t.y + movement.y,
    z: t.z + movement.z,
  });

  vy = clampVerticalVelocityWhenGrounded(vy, grounded);
  state.verticalVelocity = vy;
  state.wasGrounded = grounded;
  if (grounded) {
    state.coyoteRemainingSec = INPUT_COMBAT.jumpCoyoteSec;
  } else {
    state.coyoteRemainingSec = Math.max(0, state.coyoteRemainingSec - dt);
  }
}
