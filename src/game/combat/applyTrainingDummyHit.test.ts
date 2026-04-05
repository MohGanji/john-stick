import { describe, expect, it } from "vitest";

import { FIXED_DT } from "../gameLoop";
import {
  createJohnStickPhysics,
  readRigidBodyTransform,
  stepPhysicsWorld,
} from "../physics/rapierWorld";
import { applyTrainingDummyHitFromStrike } from "./applyTrainingDummyHit";

describe("WS-090 applyTrainingDummyHitFromStrike", () => {
  it("applies Rapier impulse so the dynamic dummy displaces after integration", async () => {
    const physics = await createJohnStickPhysics();
    const before = { x: 0, y: 0, z: 0 };
    const q = { x: 0, y: 0, z: 0, w: 1 };
    readRigidBodyTransform(physics.trainingDummyRigidBody, before, q);

    const dummyT = physics.trainingDummyRigidBody.translation();
    applyTrainingDummyHitFromStrike(physics, {
      fistWorld: { x: dummyT.x, y: dummyT.y, z: dummyT.z },
      playerPos: { x: 0, y: 1, z: 0 },
      playerFacingYawRad: 0,
      chargeTierIndex: 0,
    });

    const steps = Math.ceil(0.35 / FIXED_DT);
    for (let i = 0; i < steps; i += 1) {
      stepPhysicsWorld(physics.world);
    }

    const after = { x: 0, y: 0, z: 0 };
    readRigidBodyTransform(physics.trainingDummyRigidBody, after, q);
    const planar = Math.hypot(after.x - before.x, after.z - before.z);
    expect(planar).toBeGreaterThan(0.015);
  });

  it("returns non-zero damage and impulse", async () => {
    const physics = await createJohnStickPhysics();
    const dummyT = physics.trainingDummyRigidBody.translation();
    const out = applyTrainingDummyHitFromStrike(physics, {
      fistWorld: { x: dummyT.x, y: dummyT.y, z: dummyT.z },
      playerPos: { x: 0, y: 1, z: 0 },
      playerFacingYawRad: 0,
      chargeTierIndex: 0,
    });
    expect(out.damageDealt).toBeGreaterThan(0);
    expect(Math.abs(out.impulseWorld.x) + Math.abs(out.impulseWorld.z)).toBeGreaterThan(
      1,
    );
  });
});
