/**
 * WS-060 / WS-080 / GP §6.2.1 — sphere **sweep** vs training hurt sensor (parameterized per base move).
 */
import RAPIER from "@dimforge/rapier3d-compat";

import type { JohnStickPhysics } from "../physics/rapierWorld";
import { characterLeftUnitXZ, facingRelativeMoveXZ } from "../player/moveFromFacing";
import type { SphereStrikeProfile } from "./baseMoveTable";

export type SphereStrikeState = {
  /** Consumed on the first fixed substep after `update` queues a press. */
  pendingStart: boolean;
  activeFramesRemaining: number;
  /** At most one damage event per active window. */
  hitConsumed: boolean;
  lastContact: { x: number; y: number; z: number } | null;
};

export type SphereStrikeHitDebugSnapshot = {
  active: boolean;
  contactWorld: { x: number; y: number; z: number };
  radius: number;
};

export function createSphereStrikeState(): SphereStrikeState {
  return {
    pendingStart: false,
    activeFramesRemaining: 0,
    hitConsumed: false,
    lastContact: null,
  };
}

const shapeCache = new Map<number, RAPIER.Ball>();

function ballShape(radius: number): RAPIER.Ball {
  let s = shapeCache.get(radius);
  if (!s) {
    s = new RAPIER.Ball(radius);
    shapeCache.set(radius, s);
  }
  return s;
}

const shapeRotIdentity = { x: 0, y: 0, z: 0, w: 1 };

function yawFromPlayerRotation(q: { x: number; y: number; z: number; w: number }): number {
  return 2 * Math.atan2(q.y, q.w);
}

function contactWorldFromPose(
  pos: { x: number; y: number; z: number },
  yawRad: number,
  profile: SphereStrikeProfile,
): { x: number; y: number; z: number } {
  const fwd = facingRelativeMoveXZ(yawRad, 1, 0);
  const left = characterLeftUnitXZ(yawRad);
  const r = profile.reach;
  const s = profile.sideOffset;
  return {
    x: pos.x + fwd.wx * r + left.x * s,
    y: pos.y + profile.heightFromCapsuleCenter,
    z: pos.z + fwd.wz * r + left.z * s,
  };
}

function probeHitSensor(
  world: RAPIER.World,
  physics: JohnStickPhysics,
  hurtCollider: RAPIER.Collider,
  radius: number,
  contact: { x: number; y: number; z: number },
  last: { x: number; y: number; z: number } | null,
): boolean {
  const shape = ballShape(radius);
  const pred = (c: RAPIER.Collider) => c === hurtCollider;

  if (last === null) {
    return (
      world.intersectionWithShape(
        contact,
        shapeRotIdentity,
        shape,
        RAPIER.QueryFilterFlags.EXCLUDE_SOLIDS,
        undefined,
        physics.playerCollider,
        physics.playerRigidBody,
        pred,
      ) !== null
    );
  }

  const vx = contact.x - last.x;
  const vy = contact.y - last.y;
  const vz = contact.z - last.z;
  const cast = world.castShape(
    last,
    shapeRotIdentity,
    { x: vx, y: vy, z: vz },
    shape,
    0.0,
    1.0,
    true,
    RAPIER.QueryFilterFlags.EXCLUDE_SOLIDS,
    undefined,
    physics.playerCollider,
    physics.playerRigidBody,
    pred,
  );
  if (cast !== null) return true;

  return (
    world.intersectionWithShape(
      contact,
      shapeRotIdentity,
      shape,
      RAPIER.QueryFilterFlags.EXCLUDE_SOLIDS,
      undefined,
      physics.playerCollider,
      physics.playerRigidBody,
      pred,
    ) !== null
  );
}

export type StrikeHitTargetKind =
  | "none"
  | "training_bag"
  | "training_dummy"
  | "sparring_npc";

export type SphereStrikeFixedStepResult = {
  /** WS-090 — which training target registered the strike this substep (bag checked before dummy). */
  hitTarget: StrikeHitTargetKind;
  /** @deprecated Use `hitTarget === "training_bag"`. */
  hitPunchingBag: boolean;
  debug: SphereStrikeHitDebugSnapshot;
};

/**
 * Call **after** `stepPhysicsWorld` with the player body’s **current** translation + rotation.
 */
export function stepSphereStrikeHitFixed(
  physics: JohnStickPhysics,
  strike: SphereStrikeState,
  profile: SphereStrikeProfile,
  playerPos: { x: number; y: number; z: number },
  playerRot: { x: number; y: number; z: number; w: number },
): SphereStrikeFixedStepResult {
  const yaw = yawFromPlayerRotation(playerRot);
  const contact = contactWorldFromPose(playerPos, yaw, profile);

  if (strike.pendingStart) {
    strike.pendingStart = false;
    strike.activeFramesRemaining = profile.activeFrames;
    strike.hitConsumed = false;
  }

  const activeThisStep = strike.activeFramesRemaining > 0;
  let hitTarget: StrikeHitTargetKind = "none";

  if (activeThisStep) {
    const bagTouch = probeHitSensor(
      physics.world,
      physics,
      physics.trainingHurtCollider,
      profile.radius,
      contact,
      strike.lastContact,
    );
    const dummyTouch =
      !bagTouch &&
      probeHitSensor(
        physics.world,
        physics,
        physics.trainingDummyHurtCollider,
        profile.radius,
        contact,
        strike.lastContact,
      );
    const sparringTouch =
      !bagTouch &&
      !dummyTouch &&
      probeHitSensor(
        physics.world,
        physics,
        physics.sparringNpcHurtCollider,
        profile.radius,
        contact,
        strike.lastContact,
      );
    const touch = bagTouch || dummyTouch || sparringTouch;
    if (touch && !strike.hitConsumed) {
      strike.hitConsumed = true;
      hitTarget = bagTouch
        ? "training_bag"
        : dummyTouch
          ? "training_dummy"
          : "sparring_npc";
      if (import.meta.env.DEV) {
        console.debug(
          "[combat] sphere strike →",
          hitTarget,
          "(WS-060/080/090)",
        );
      }
    }
    strike.activeFramesRemaining -= 1;
    strike.lastContact = contact;
  } else {
    strike.lastContact = null;
  }

  return {
    hitTarget,
    hitPunchingBag: hitTarget === "training_bag",
    debug: {
      active: activeThisStep,
      contactWorld: contact,
      radius: profile.radius,
    },
  };
}

/** Exposed for tests — same pose math as the fixed step. */
export function sphereContactWorldForTests(
  pos: { x: number; y: number; z: number },
  yawRad: number,
  profile: SphereStrikeProfile,
): { x: number; y: number; z: number } {
  return contactWorldFromPose(pos, yawRad, profile);
}
