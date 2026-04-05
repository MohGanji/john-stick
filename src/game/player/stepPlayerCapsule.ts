import { FIXED_DT } from "../gameLoop";
import { INPUT_COMBAT } from "../input/inputCombatConstants";
import {
  syncRigidBodyYawFromFacing,
  type JohnStickPhysics,
} from "../physics/rapierWorld";
import { clampVerticalVelocityWhenGrounded } from "./groundedMotion";
import { facingRelativeMoveXZ } from "./moveFromFacing";
import { PLAYER_CAPSULE } from "./playerCapsuleConfig";

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
): void {
  const { playerRigidBody, playerCollider, characterController } = physics;
  const dt = FIXED_DT;

  syncRigidBodyYawFromFacing(playerRigidBody, facingYawRad);

  let vy = state.verticalVelocity;

  if (jumpLatch.latched) {
    if (state.wasGrounded || state.coyoteRemainingSec > 0) {
      vy = PLAYER_CAPSULE.jumpVelocity;
      state.coyoteRemainingSec = 0;
    }
    jumpLatch.latched = false;
  }

  vy += PLAYER_CAPSULE.gravityY * dt;

  const { wx, wz } = facingRelativeMoveXZ(
    facingYawRad,
    moveForwardSigned,
    moveStrafeSigned,
  );
  const hSpeed = PLAYER_CAPSULE.moveSpeed;
  const desiredTranslation = {
    x: wx * hSpeed * dt,
    y: vy * dt,
    z: wz * hSpeed * dt,
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
