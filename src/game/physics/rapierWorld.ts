import RAPIER from "@dimforge/rapier3d-compat";

import { DOJO_BLOCKOUT } from "../level/dojoBlockout";
import { FIXED_DT } from "../gameLoop";
import { PLAYER_CAPSULE, playerCapsuleCenterY } from "../player/playerCapsuleConfig";
import {
  collisionGroups,
  PhysicsFilter,
  PhysicsMembership,
} from "./collisionLayers";
import { TRAINING_HURT_VOLUME } from "../combat/combatHitConstants";

export type JohnStickPhysics = {
  world: RAPIER.World;
  playerRigidBody: RAPIER.RigidBody;
  playerCollider: RAPIER.Collider;
  characterController: RAPIER.KinematicCharacterController;
  /** WS-060 — sensor hurt volume for left-punch hit tests (GP §6.2.1). */
  trainingHurtCollider: RAPIER.Collider;
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
  const playerGroups = collisionGroups(
    PhysicsMembership.player,
    PhysicsFilter.allSolid,
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

  /** WS-040 — kinematic capsule + KCC; yaw-only facing (WS-032, KeyA and KeyD). */
  const playerRigidBody = world.createRigidBody(
    RAPIER.RigidBodyDesc.kinematicPositionBased()
      .setTranslation(0, playerCapsuleCenterY(), 0)
      .enabledRotations(false, true, false),
  );
  const playerColliderDesc = RAPIER.ColliderDesc.capsule(
    PLAYER_CAPSULE.halfHeight,
    PLAYER_CAPSULE.radius,
  )
    .setFriction(0.65)
    .setRestitution(0)
    .setCollisionGroups(playerGroups)
    .setSolverGroups(playerGroups);
  const playerCollider = world.createCollider(
    playerColliderDesc,
    playerRigidBody,
  );

  const characterController = world.createCharacterController(
    PLAYER_CAPSULE.characterControllerOffset,
  );
  characterController.setSlideEnabled(true);
  characterController.setMaxSlopeClimbAngle(Math.PI * 0.42);
  characterController.setMinSlopeSlideAngle(Math.PI * 0.32);
  characterController.enableSnapToGround(0.38);
  characterController.disableAutostep();

  /** WS-060 — fixed sensor aligned with `TRAINING_HURT_VOLUME` (trigger layer: no solid vs player). */
  const trainingHurtBody = world.createRigidBody(
    RAPIER.RigidBodyDesc.fixed().setTranslation(
      TRAINING_HURT_VOLUME.center.x,
      TRAINING_HURT_VOLUME.center.y,
      TRAINING_HURT_VOLUME.center.z,
    ),
  );
  const hurtGroups = collisionGroups(
    PhysicsMembership.trigger,
    PhysicsMembership.player | PhysicsMembership.enemy,
  );
  const trainingHurtCollider = world.createCollider(
    RAPIER.ColliderDesc.cuboid(
      TRAINING_HURT_VOLUME.halfExtents.x,
      TRAINING_HURT_VOLUME.halfExtents.y,
      TRAINING_HURT_VOLUME.halfExtents.z,
    )
      .setSensor(true)
      .setCollisionGroups(hurtGroups)
      .setSolverGroups(hurtGroups),
    trainingHurtBody,
  );

  return {
    world,
    playerRigidBody,
    playerCollider,
    characterController,
    trainingHurtCollider,
  };
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

/**
 * World-space yaw (radians, about +Y) matches keyboard facing + third-person camera orbit.
 * Call **before** `world.step()` so contacts use the current facing. Dynamic bodies: clears angular
 * velocity so collisions do not add pitch/roll or spin on Y. Kinematic: uses `setNextKinematicRotation`.
 */
export function syncRigidBodyYawFromFacing(
  body: RAPIER.RigidBody,
  yawRad: number,
  wakeUp = true,
): void {
  const half = yawRad * 0.5;
  const q = { x: 0, y: Math.sin(half), z: 0, w: Math.cos(half) };
  if (body.isKinematic()) {
    body.setNextKinematicRotation(q);
  } else {
    body.setRotation(q, wakeUp);
    body.setAngvel({ x: 0, y: 0, z: 0 }, wakeUp);
  }
}
