import RAPIER from "@dimforge/rapier3d-compat";

import { DOJO_BLOCKOUT } from "../level/dojoBlockout";
import {
  PUNCHING_BAG,
  punchingBagPivotLocalAnchorY,
  punchingBagPivotWorldY,
} from "../level/punchingBagConfig";
import { FIXED_DT } from "../gameLoop";
import { PLAYER_CAPSULE, playerCapsuleCenterY } from "../player/playerCapsuleConfig";
import {
  collisionGroups,
  PhysicsFilter,
  PhysicsMembership,
} from "./collisionLayers";
import { TRAINING_DUMMY_HURT_VOLUME, TRAINING_HURT_VOLUME } from "../combat/combatHitConstants";
import { TRAINING_DUMMY_PHYSICS } from "../level/trainingDummyConfig";
import { SPARRING_NPC_PHYSICS } from "../level/sparringNpcConfig";

export type JohnStickPhysics = {
  world: RAPIER.World;
  playerRigidBody: RAPIER.RigidBody;
  playerCollider: RAPIER.Collider;
  characterController: RAPIER.KinematicCharacterController;
  /** WS-060 / WS-061 — hurt sensor on the swinging bag (GP §6.2.1, §7.1.2). */
  trainingHurtCollider: RAPIER.Collider;
  /** WS-061 — dynamic bag; use for rendering and WS-062 hit impulses (GP §7.1.2). */
  punchingBagRigidBody: RAPIER.RigidBody;
  /** WS-061 — fixed ceiling/chain anchor for the spherical joint. */
  punchingBagPivotBody: RAPIER.RigidBody;
  /** WS-090 — dynamic dummy (player-scale capsule); hurt sensor moves with the body. */
  trainingDummyRigidBody: RAPIER.RigidBody;
  /** WS-094 — monolithic capsule (removed while articulated ragdoll is active). */
  trainingDummySolidCollider: RAPIER.Collider;
  trainingDummyHurtCollider: RAPIER.Collider;
  /** WS-093 — moving lab partner; same capsule + hurt pattern as the static dummy. */
  sparringNpcRigidBody: RAPIER.RigidBody;
  sparringNpcSolidCollider: RAPIER.Collider;
  sparringNpcHurtCollider: RAPIER.Collider;
  /** WS-094 — same membership as bag/dummy solids for spawned limb colliders. */
  propCollisionGroups: number;
  propSolverGroups: number;
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

  /** GP §7.2.1 — perimeter solids; spans extend past corners so there is no crack (closed dojo). */
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
  addWallCollider(
    xReach,
    wallHalfY,
    wallHalfThickness,
    0,
    wallY,
    floorHalfDepth + wallHalfThickness,
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

  const propGroups = collisionGroups(
    PhysicsMembership.prop,
    PhysicsFilter.allSolid,
  );

  /** WS-061 — top pivot + dynamic capsule; spherical joint gives swing/recoil (GP §7.1.2). */
  const pivotY = punchingBagPivotWorldY();
  const punchingBagPivotBody = world.createRigidBody(
    RAPIER.RigidBodyDesc.fixed().setTranslation(
      PUNCHING_BAG.centerX,
      pivotY,
      PUNCHING_BAG.centerZ,
    ),
  );

  const bagDesc = RAPIER.RigidBodyDesc.dynamic()
    .setTranslation(
      PUNCHING_BAG.centerX,
      PUNCHING_BAG.centerY,
      PUNCHING_BAG.centerZ,
    )
    .setLinearDamping(PUNCHING_BAG.linearDamping)
    .setAngularDamping(PUNCHING_BAG.angularDamping);
  const punchingBagRigidBody = world.createRigidBody(bagDesc);

  const bagCapsule = RAPIER.ColliderDesc.capsule(
    PUNCHING_BAG.capsuleHalfHeight,
    PUNCHING_BAG.capsuleRadius,
  )
    .setFriction(PUNCHING_BAG.friction)
    .setRestitution(PUNCHING_BAG.restitution)
    .setMass(PUNCHING_BAG.colliderMassKg)
    .setCollisionGroups(propGroups)
    .setSolverGroups(propGroups);
  world.createCollider(bagCapsule, punchingBagRigidBody);

  const anchorPivot = { x: 0, y: 0, z: 0 };
  const anchorBag = {
    x: 0,
    y: punchingBagPivotLocalAnchorY(),
    z: 0,
  };
  const spherical = RAPIER.JointData.spherical(anchorPivot, anchorBag);
  const bagJoint = world.createImpulseJoint(
    spherical,
    punchingBagPivotBody,
    punchingBagRigidBody,
    true,
  );
  bagJoint.setContactsEnabled(false);

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
    punchingBagRigidBody,
  );

  const d = TRAINING_DUMMY_PHYSICS;
  const trainingDummyRigidBody = world.createRigidBody(
    RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(d.centerX, d.centerY, d.centerZ)
      .setLinearDamping(d.linearDamping)
      .setAngularDamping(d.angularDamping),
  );
  const dummySolid = RAPIER.ColliderDesc.capsule(
    d.capsuleHalfHeight,
    d.capsuleRadius,
  )
    .setFriction(d.friction)
    .setRestitution(d.restitution)
    .setMass(d.colliderMassKg)
    .setCollisionGroups(propGroups)
    .setSolverGroups(propGroups);
  const trainingDummySolidCollider = world.createCollider(
    dummySolid,
    trainingDummyRigidBody,
  );

  const dhe = TRAINING_DUMMY_HURT_VOLUME.halfExtents;
  const trainingDummyHurtCollider = world.createCollider(
    RAPIER.ColliderDesc.cuboid(dhe.x, dhe.y, dhe.z)
      .setSensor(true)
      .setCollisionGroups(hurtGroups)
      .setSolverGroups(hurtGroups),
    trainingDummyRigidBody,
  );

  const sn = SPARRING_NPC_PHYSICS;
  const sparringNpcRigidBody = world.createRigidBody(
    RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(sn.centerX, sn.centerY, sn.centerZ)
      .setLinearDamping(sn.linearDamping)
      .setAngularDamping(sn.angularDamping),
  );
  const sparringNpcSolid = RAPIER.ColliderDesc.capsule(
    sn.capsuleHalfHeight,
    sn.capsuleRadius,
  )
    .setFriction(sn.friction)
    .setRestitution(sn.restitution)
    .setMass(sn.colliderMassKg)
    .setCollisionGroups(propGroups)
    .setSolverGroups(propGroups);
  const sparringNpcSolidCollider = world.createCollider(
    sparringNpcSolid,
    sparringNpcRigidBody,
  );
  const sparringNpcHurtCollider = world.createCollider(
    RAPIER.ColliderDesc.cuboid(dhe.x, dhe.y, dhe.z)
      .setSensor(true)
      .setCollisionGroups(hurtGroups)
      .setSolverGroups(hurtGroups),
    sparringNpcRigidBody,
  );

  return {
    world,
    playerRigidBody,
    playerCollider,
    characterController,
    trainingHurtCollider,
    punchingBagRigidBody,
    punchingBagPivotBody,
    trainingDummyRigidBody,
    trainingDummySolidCollider,
    trainingDummyHurtCollider,
    sparringNpcRigidBody,
    sparringNpcSolidCollider,
    sparringNpcHurtCollider,
    propCollisionGroups: propGroups,
    propSolverGroups: propGroups,
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
