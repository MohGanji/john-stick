/**
 * WS-090 / GP §2.4.1 — lab damage + Rapier impulse at the fist (dynamic dummy recoils / tips like the bag).
 */
import type { JohnStickPhysics } from "../physics/rapierWorld";
import { facingRelativeMoveXZ } from "../player/moveFromFacing";
import {
  BAG_HIT_TUNING,
  bagDamageTierMultiplier,
  bagImpulseDamageTierMultiplier,
} from "./bagHitTuning";
import type { BagHitScalars } from "../tuning/gameplayRuntimeTuning";
import type { TrainingBagHitContext } from "./applyTrainingBagHit";

export type TrainingDummyHitOutcome = {
  damageDealt: number;
  impulseWorld: { x: number; y: number; z: number };
};

/** Slightly softer than the heavy bag so the lighter dummy reads reactive without endless flight. */
const IMPULSE_SCALE_VS_BAG = 0.88;

function planarDirPlayerToTarget(
  playerPos: { x: number; z: number },
  targetPos: { x: number; z: number },
  fallbackForwardXz: { x: number; z: number },
): { x: number; z: number } {
  let dx = targetPos.x - playerPos.x;
  let dz = targetPos.z - playerPos.z;
  const len = Math.hypot(dx, dz);
  if (len < 1e-4) {
    dx = fallbackForwardXz.x;
    dz = fallbackForwardXz.z;
  } else {
    dx /= len;
    dz /= len;
  }
  return { x: dx, z: dz };
}

export function applyTrainingDummyHitFromStrike(
  physics: JohnStickPhysics,
  ctx: TrainingBagHitContext,
  bagScalars?: BagHitScalars,
): TrainingDummyHitOutcome {
  const dummyT = physics.trainingDummyRigidBody.translation();
  const fwd = facingRelativeMoveXZ(ctx.playerFacingYawRad, 1, 0);
  const planar = planarDirPlayerToTarget(
    { x: ctx.playerPos.x, z: ctx.playerPos.z },
    { x: dummyT.x, z: dummyT.z },
    { x: fwd.wx, z: fwd.wz },
  );

  const bases = bagScalars ?? {
    basePlanarImpulse: BAG_HIT_TUNING.basePlanarImpulse,
    upwardImpulse: BAG_HIT_TUNING.upwardImpulse,
    baseDamage: BAG_HIT_TUNING.baseDamage,
  };
  const impMul = bagImpulseDamageTierMultiplier(ctx.chargeTierIndex);
  const dmgMul = bagDamageTierMultiplier(ctx.chargeTierIndex);
  const planarMag =
    bases.basePlanarImpulse * impMul * IMPULSE_SCALE_VS_BAG;
  const iy = bases.upwardImpulse * impMul * IMPULSE_SCALE_VS_BAG;

  const impulseWorld = {
    x: planar.x * planarMag,
    y: iy,
    z: planar.z * planarMag,
  };

  const damageDealt = bases.baseDamage * dmgMul;

  physics.trainingDummyRigidBody.applyImpulseAtPoint(
    impulseWorld,
    ctx.fistWorld,
    true,
  );

  return { damageDealt, impulseWorld };
}
