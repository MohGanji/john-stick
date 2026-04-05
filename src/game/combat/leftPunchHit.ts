/**
 * WS-060 — left punch strike using shared sphere sweep (WS-080 generalizes all four limbs).
 */
import type { JohnStickPhysics } from "../physics/rapierWorld";
import { baseMoveProfile } from "./baseMoveTable";
import {
  createSphereStrikeState,
  sphereContactWorldForTests,
  stepSphereStrikeHitFixed,
  type SphereStrikeFixedStepResult,
  type SphereStrikeHitDebugSnapshot,
  type SphereStrikeState,
} from "./sphereStrikeHit";

export type LeftPunchStrikeState = SphereStrikeState;
export type LeftPunchHitDebugSnapshot = SphereStrikeHitDebugSnapshot;
export type LeftPunchFixedStepResult = SphereStrikeFixedStepResult;

export function createLeftPunchStrikeState(): LeftPunchStrikeState {
  return createSphereStrikeState();
}

export function stepLeftPunchHitFixed(
  physics: JohnStickPhysics,
  strike: LeftPunchStrikeState,
  playerPos: { x: number; y: number; z: number },
  playerRot: { x: number; y: number; z: number; w: number },
): LeftPunchFixedStepResult {
  return stepSphereStrikeHitFixed(
    physics,
    strike,
    baseMoveProfile("atk_lp"),
    playerPos,
    playerRot,
  );
}

export function fistWorldForTests(
  pos: { x: number; y: number; z: number },
  yawRad: number,
): { x: number; y: number; z: number } {
  return sphereContactWorldForTests(pos, yawRad, baseMoveProfile("atk_lp"));
}
