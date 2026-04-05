import { describe, expect, it } from "vitest";

import { FIXED_DT } from "../gameLoop";
import {
  createJohnStickPhysics,
  readRigidBodyTransform,
  stepPhysicsWorld,
} from "./rapierWorld";

describe("WS-061 punching bag", () => {
  it("dynamic bag displaces after an impulse (jointed pivot)", async () => {
    const physics = await createJohnStickPhysics();
    const q = { x: 0, y: 0, z: 0, w: 1 };
    const before = { x: 0, y: 0, z: 0 };
    readRigidBodyTransform(physics.punchingBagRigidBody, before, q);

    physics.punchingBagRigidBody.applyImpulse({ x: 0, y: 0, z: -320 }, true);

    const steps = Math.ceil(0.45 / FIXED_DT);
    for (let i = 0; i < steps; i += 1) {
      stepPhysicsWorld(physics.world);
    }

    const after = { x: 0, y: 0, z: 0 };
    readRigidBodyTransform(physics.punchingBagRigidBody, after, q);

    const planar = Math.hypot(after.x - before.x, after.z - before.z);
    expect(planar).toBeGreaterThan(0.035);
  });
});
