/**
 * WS-093 — planar wander for the harmless sparring partner (dynamic capsule, idle only).
 */
import type RAPIER from "@dimforge/rapier3d-compat";

import type { TrainingDummyFsm } from "../combat/trainingDummyFsm";
import {
  SPARRING_NPC_WANDER_EXCLUSIONS,
  SPARRING_NPC_WANDER_GOAL_RADIUS,
  SPARRING_NPC_WANDER_REPICK_SEC,
  SPARRING_NPC_WANDER_SPEED,
  sparringNpcWanderBounds,
} from "../level/sparringNpcConfig";
import { syncRigidBodyYawFromFacing } from "../physics/rapierWorld";

export type SparringNpcWanderState = {
  goalX: number;
  goalZ: number;
  repickTimerSec: number;
};

function sampleGoal(): { x: number; z: number } {
  const b = sparringNpcWanderBounds();
  for (let attempt = 0; attempt < 48; attempt += 1) {
    const x = b.minX + Math.random() * (b.maxX - b.minX);
    const z = b.minZ + Math.random() * (b.maxZ - b.minZ);
    let ok = true;
    for (const ex of SPARRING_NPC_WANDER_EXCLUSIONS) {
      if (Math.hypot(x - ex.x, z - ex.z) < ex.radius) {
        ok = false;
        break;
      }
    }
    if (ok) {
      return { x, z };
    }
  }
  return {
    x: (b.minX + b.maxX) * 0.5,
    z: (b.minZ + b.maxZ) * 0.5,
  };
}

export function createSparringNpcWanderState(): SparringNpcWanderState {
  const g = sampleGoal();
  return {
    goalX: g.x,
    goalZ: g.z,
    repickTimerSec: SPARRING_NPC_WANDER_REPICK_SEC,
  };
}

/**
 * Call **before** `world.step()` while the partner is dynamic `idle` (no kinematic recover).
 */
export function stepSparringNpcWanderFixed(
  body: RAPIER.RigidBody,
  fsm: TrainingDummyFsm,
  wander: SparringNpcWanderState,
  fixedDt: number,
): void {
  if (fsm.phase !== "idle") {
    return;
  }
  if (body.isKinematic()) {
    return;
  }

  wander.repickTimerSec -= fixedDt;
  const t = body.translation();
  const dx = wander.goalX - t.x;
  const dz = wander.goalZ - t.z;
  const dist = Math.hypot(dx, dz);

  if (dist < SPARRING_NPC_WANDER_GOAL_RADIUS || wander.repickTimerSec <= 0) {
    const g = sampleGoal();
    wander.goalX = g.x;
    wander.goalZ = g.z;
    wander.repickTimerSec = SPARRING_NPC_WANDER_REPICK_SEC;
  }

  const ndx = wander.goalX - t.x;
  const ndz = wander.goalZ - t.z;
  const nd = Math.hypot(ndx, ndz);
  let dirX = 0;
  let dirZ = 0;
  if (nd > 1e-4) {
    dirX = ndx / nd;
    dirZ = ndz / nd;
  }

  const v = body.linvel();
  const wx = dirX * SPARRING_NPC_WANDER_SPEED;
  const wz = dirZ * SPARRING_NPC_WANDER_SPEED;
  body.setLinvel({ x: wx, y: v.y, z: wz }, true);

  if (nd > 0.08) {
    const yaw = Math.atan2(dirX, dirZ);
    syncRigidBodyYawFromFacing(body, yaw, true);
  }
}
