import RAPIER from "@dimforge/rapier3d-compat";

import { DOJO_BLOCKOUT } from "../level/dojoBlockout";
import { FIXED_DT } from "../gameLoop";
import {
  collisionGroups,
  PhysicsFilter,
  PhysicsMembership,
} from "./collisionLayers";

export type JohnStickPhysics = {
  world: RAPIER.World;
  /** Temporary dynamic body to validate gravity + floor; replace with player in WS-040. */
  demoRigidBody: RAPIER.RigidBody;
};

/**
 * WS-011 / GP §4.2.1 — Rapier 3D (`@dimforge/rapier3d-compat`): WASM compat build, works with Vite.
 */
export async function createJohnStickPhysics(): Promise<JohnStickPhysics> {
  await RAPIER.init();

  const world = new RAPIER.World({ x: 0, y: -28, z: 0 });
  world.timestep = FIXED_DT;

  const staticGroups = collisionGroups(
    PhysicsMembership.staticWorld,
    PhysicsFilter.allSolid,
  );
  const propGroups = collisionGroups(
    PhysicsMembership.prop,
    PhysicsFilter.allSolid | PhysicsMembership.trigger,
  );

  const {
    floorHalfWidth,
    floorHalfDepth,
    floorThickness,
    wallHeight,
    wallHalfThickness,
  } = DOJO_BLOCKOUT;

  const floorBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
  const floorHalfY = floorThickness / 2;
  const floorCollider = RAPIER.ColliderDesc.cuboid(
    floorHalfWidth,
    floorHalfY,
    floorHalfDepth,
  )
    .setTranslation(0, -floorHalfY, 0)
    .setFriction(0.85)
    .setCollisionGroups(staticGroups)
    .setSolverGroups(staticGroups);
  world.createCollider(floorCollider, floorBody);

  /** GP §7.2.1 — perimeter solids; spans extend past corners so there is no crack. +Z open (see dojoBlockout). */
  const wallHalfY = wallHeight / 2;
  const wallY = wallHalfY;
  const zReach = floorHalfDepth + wallHalfThickness * 2;
  const xReach = floorHalfWidth + wallHalfThickness * 2;
  const boundsBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed());

  function addWallCollider(
    hx: number,
    hy: number,
    hz: number,
    tx: number,
    ty: number,
    tz: number,
  ): void {
    const desc = RAPIER.ColliderDesc.cuboid(hx, hy, hz)
      .setTranslation(tx, ty, tz)
      .setFriction(0.45)
      .setRestitution(0.02)
      .setCollisionGroups(staticGroups)
      .setSolverGroups(staticGroups);
    world.createCollider(desc, boundsBody);
  }

  addWallCollider(
    wallHalfThickness,
    wallHalfY,
    zReach,
    floorHalfWidth + wallHalfThickness,
    wallY,
    0,
  );
  addWallCollider(
    wallHalfThickness,
    wallHalfY,
    zReach,
    -(floorHalfWidth + wallHalfThickness),
    wallY,
    0,
  );
  addWallCollider(
    xReach,
    wallHalfY,
    wallHalfThickness,
    0,
    wallY,
    -(floorHalfDepth + wallHalfThickness),
  );

  const demoRigidBody = world.createRigidBody(
    RAPIER.RigidBodyDesc.dynamic().setTranslation(0, 1.75, 0),
  );
  const demoCollider = RAPIER.ColliderDesc.cuboid(0.22, 0.22, 0.22)
    .setDensity(2.2)
    .setFriction(0.55)
    .setRestitution(0.08)
    .setCollisionGroups(propGroups)
    .setSolverGroups(propGroups);
  world.createCollider(demoCollider, demoRigidBody);

  return { world, demoRigidBody };
}

export function stepPhysicsWorld(world: RAPIER.World): void {
  world.step();
}

export function readRigidBodyTransform(
  body: RAPIER.RigidBody,
  outPos: { x: number; y: number; z: number },
  outQuat: { x: number; y: number; z: number; w: number },
): void {
  const t = body.translation();
  outPos.x = t.x;
  outPos.y = t.y;
  outPos.z = t.z;
  const r = body.rotation();
  outQuat.x = r.x;
  outQuat.y = r.y;
  outQuat.z = r.z;
  outQuat.w = r.w;
}
