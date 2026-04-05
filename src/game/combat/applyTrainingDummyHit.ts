/**
 * WS-090 / GP §2.4.1 — lab damage + Rapier impulse (split COM vs fist via `trainingDummyFeel`).
 */
import type { JohnStickPhysics } from "../physics/rapierWorld";
import { facingRelativeMoveXZ } from "../player/moveFromFacing";
import {
  BAG_HIT_TUNING,
  bagDamageTierMultiplier,
  bagImpulseDamageTierMultiplier,
} from "./bagHitTuning";
import {
  defaultTrainingDummyFeel,
  type BagHitScalars,
  type TrainingDummyFeelScalars,
} from "../tuning/gameplayRuntimeTuning";
import type { TrainingBagHitContext } from "./applyTrainingBagHit";
import { trainingDummyImpulseShares } from "./trainingDummyFeel";

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
  basePunchDamage: number = BAG_HIT_TUNING.baseDamage,
  feel: TrainingDummyFeelScalars = defaultTrainingDummyFeel(),
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
  };
  const impMul = bagImpulseDamageTierMultiplier(ctx.chargeTierIndex);
  const dmgMul = bagDamageTierMultiplier(ctx.chargeTierIndex);
  const kick = feel.kickbackScale;
  const planarMag =
    bases.basePlanarImpulse * impMul * IMPULSE_SCALE_VS_BAG * kick;
  const iy = bases.upwardImpulse * impMul * IMPULSE_SCALE_VS_BAG * kick;

  const impulseWorld = {
    x: planar.x * planarMag,
    y: iy,
    z: planar.z * planarMag,
  };

  const damageDealt = basePunchDamage * dmgMul;

  const { com: comShare, point: pointShare } =
    trainingDummyImpulseShares(feel.spinAmount);

  const body = physics.trainingDummyRigidBody;
  body.applyImpulse(
    {
      x: impulseWorld.x * comShare,
      y: impulseWorld.y * comShare,
      z: impulseWorld.z * comShare,
    },
    true,
  );
  body.applyImpulseAtPoint(
    {
      x: impulseWorld.x * pointShare,
      y: impulseWorld.y * pointShare,
      z: impulseWorld.z * pointShare,
    },
    ctx.fistWorld,
    true,
  );

  return { damageDealt, impulseWorld };
}
