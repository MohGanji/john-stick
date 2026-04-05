import { describe, expect, it } from "vitest";

import { FIXED_DT } from "../gameLoop";
import {
  createJohnStickPhysics,
  readRigidBodyTransform,
  stepPhysicsWorld,
} from "../physics/rapierWorld";
import { applyTrainingBagHitFromPunch } from "./applyTrainingBagHit";
import { BAG_HIT_TUNING, bagImpulseDamageTierMultiplier } from "./bagHitTuning";

describe("WS-062 applyTrainingBagHitFromPunch", () => {
  it("applies stronger planar impulse for higher charge tier (GP §6.2.2)", () => {
    expect(bagImpulseDamageTierMultiplier(0)).toBe(1);
    expect(bagImpulseDamageTierMultiplier(1)).toBeGreaterThan(
      bagImpulseDamageTierMultiplier(0),
    );
    expect(bagImpulseDamageTierMultiplier(99)).toBe(
      BAG_HIT_TUNING.impulseTierMultipliers[
        BAG_HIT_TUNING.impulseTierMultipliers.length - 1
      ],
    );
  });

  it("displaces the jointed bag after a punch-context hit", async () => {
    const physics = await createJohnStickPhysics();
    const q = { x: 0, y: 0, z: 0, w: 1 };
    const before = { x: 0, y: 0, z: 0 };
    readRigidBodyTransform(physics.punchingBagRigidBody, before, q);

    const bagT = physics.punchingBagRigidBody.translation();
    applyTrainingBagHitFromPunch(physics, {
      fistWorld: { x: bagT.x - 0.35, y: bagT.y, z: bagT.z },
      playerPos: { x: 0, y: 1, z: 0 },
      playerFacingYawRad: 0,
      chargeTierIndex: 0,
    });

    const steps = Math.ceil(0.4 / FIXED_DT);
    for (let i = 0; i < steps; i += 1) {
      stepPhysicsWorld(physics.world);
    }

    const after = { x: 0, y: 0, z: 0 };
    readRigidBodyTransform(physics.punchingBagRigidBody, after, q);

    const planar = Math.hypot(after.x - before.x, after.z - before.z);
    expect(planar).toBeGreaterThan(0.02);
  });
});
