/**
 * WS-062 / GP §2.4.1 — apply Rapier impulse + abstract damage when a strike hits the bag sensor.
 */
import type { JohnStickPhysics } from "../physics/rapierWorld";
import { facingRelativeMoveXZ } from "../player/moveFromFacing";
import {
  BAG_HIT_TUNING,
  bagDamageTierMultiplier,
  bagImpulseDamageTierMultiplier,
} from "./bagHitTuning";

export type TrainingBagHitContext = {
  fistWorld: { x: number; y: number; z: number };
  playerPos: { x: number; y: number; z: number };
  /** Same yaw as locomotion / fist pose (radians, +Y). */
  playerFacingYawRad: number;
  /**
   * 0 = default (current single left punch). Higher tiers for charged / heavy profiles (GP §6.2.2).
   */
  chargeTierIndex: number;
};

export type TrainingBagHitOutcome = {
  damageDealt: number;
  impulseWorld: { x: number; y: number; z: number };
};

function planarDirPlayerToBag(
  playerPos: { x: number; z: number },
  bagPos: { x: number; z: number },
  fallbackForwardXz: { x: number; z: number },
): { x: number; z: number } {
  let dx = bagPos.x - playerPos.x;
  let dz = bagPos.z - playerPos.z;
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

/**
 * Push the bag away from the player in XZ, slight +Y, at the fist point for a natural swing torque.
 */
export function applyTrainingBagHitFromPunch(
  physics: JohnStickPhysics,
  ctx: TrainingBagHitContext,
): TrainingBagHitOutcome {
  const bag = physics.punchingBagRigidBody;
  const bagT = bag.translation();
  const fwd = facingRelativeMoveXZ(ctx.playerFacingYawRad, 1, 0);
  const planar = planarDirPlayerToBag(
    { x: ctx.playerPos.x, z: ctx.playerPos.z },
    { x: bagT.x, z: bagT.z },
    { x: fwd.wx, z: fwd.wz },
  );

  const impMul = bagImpulseDamageTierMultiplier(ctx.chargeTierIndex);
  const planarMag = BAG_HIT_TUNING.basePlanarImpulse * impMul;
  const iy = BAG_HIT_TUNING.upwardImpulse * impMul;

  const impulseWorld = {
    x: planar.x * planarMag,
    y: iy,
    z: planar.z * planarMag,
  };

  bag.applyImpulseAtPoint(impulseWorld, ctx.fistWorld, true);

  const dmgMul = bagDamageTierMultiplier(ctx.chargeTierIndex);
  const damageDealt = BAG_HIT_TUNING.baseDamage * dmgMul;

  return { damageDealt, impulseWorld };
}
