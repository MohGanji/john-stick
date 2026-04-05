/**
 * WS-091 / GP §6.1.1, §6.1.3 — training dummy ownership: dynamic “ragdoll”, stagger **stand_up** in place,
 * and full **recover** blend back to spawn after ragdoll.
 */
import RAPIER from "@dimforge/rapier3d-compat";
import * as THREE from "three";

import type { TrainingDummyFsm } from "../combat/trainingDummyFsm";
import { TRAINING_DUMMY_SPAWN_TRANSFORM } from "../level/trainingDummyConfig";
import type { JohnStickPhysics } from "./rapierWorld";
import {
  endTrainingDummyArticulatedRagdoll,
  readArticulatedBodyTransform,
  type ArticulatedBodyTransform,
  type TrainingDummyArticulatedRagdoll,
} from "./trainingDummyArticulatedRagdoll";

const qa = new THREE.Quaternion();
const qb = new THREE.Quaternion();
const qo = new THREE.Quaternion();
const euler = new THREE.Euler(0, 0, 0, "YXZ");

function copyFromRigidBody(
  body: RAPIER.RigidBody,
  fsm: TrainingDummyFsm,
): void {
  const t = body.translation();
  const r = body.rotation();
  fsm.recoverBlendFromPos.x = t.x;
  fsm.recoverBlendFromPos.y = t.y;
  fsm.recoverBlendFromPos.z = t.z;
  fsm.recoverBlendFromQuat.x = r.x;
  fsm.recoverBlendFromQuat.y = r.y;
  fsm.recoverBlendFromQuat.z = r.z;
  fsm.recoverBlendFromQuat.w = r.w;
}

function setKinematicHoldCurrent(body: RAPIER.RigidBody): void {
  const t = body.translation();
  const r = body.rotation();
  body.setBodyType(RAPIER.RigidBodyType.KinematicPositionBased, true);
  body.setNextKinematicTranslation({ x: t.x, y: t.y, z: t.z });
  body.setNextKinematicRotation({ x: r.x, y: r.y, z: r.z, w: r.w });
  body.setLinvel({ x: 0, y: 0, z: 0 }, false);
  body.setAngvel({ x: 0, y: 0, z: 0 }, false);
}

/** Upright facing: preserve world Yaw from `rot`, zero pitch/roll (flat dojo floor). */
export function uprightWorldYawQuat(rot: {
  x: number;
  y: number;
  z: number;
  w: number;
}): { x: number; y: number; z: number; w: number } {
  qa.set(rot.x, rot.y, rot.z, rot.w);
  euler.setFromQuaternion(qa, "YXZ");
  qo.setFromEuler(new THREE.Euler(0, euler.y, 0, "YXZ"));
  return { x: qo.x, y: qo.y, z: qo.z, w: qo.w };
}

export type ArmTrainingDummyRecoverContext = {
  articulated: TrainingDummyArticulatedRagdoll;
  /** Upright bind targets in world (same order as `articulated.bodies`). */
  recoverTos: ArticulatedBodyTransform[];
};

/** Ragdoll recover blend target: dummy snaps to fixed spawn; sparring partner stays upright in place (WS-093). */
export type TrainingDummyRagdollRecoverAnchor =
  | { mode: "dummy_spawn" }
  | { mode: "in_place_standing"; standingY: number };

export function armTrainingDummyRecover(
  body: RAPIER.RigidBody,
  fsm: TrainingDummyFsm,
  ctx?: ArmTrainingDummyRecoverContext,
  anchor: TrainingDummyRagdollRecoverAnchor = { mode: "dummy_spawn" },
): void {
  copyFromRigidBody(body, fsm);

  if (anchor.mode === "dummy_spawn") {
    const s = TRAINING_DUMMY_SPAWN_TRANSFORM;
    fsm.recoverTargetPos.x = s.x;
    fsm.recoverTargetPos.y = s.y;
    fsm.recoverTargetPos.z = s.z;
    fsm.recoverTargetQuat.x = s.qx;
    fsm.recoverTargetQuat.y = s.qy;
    fsm.recoverTargetQuat.z = s.qz;
    fsm.recoverTargetQuat.w = s.qw;
  } else {
    const t = body.translation();
    const r = body.rotation();
    const up = uprightWorldYawQuat(r);
    fsm.recoverTargetPos.x = t.x;
    fsm.recoverTargetPos.y = anchor.standingY;
    fsm.recoverTargetPos.z = t.z;
    fsm.recoverTargetQuat.x = up.x;
    fsm.recoverTargetQuat.y = up.y;
    fsm.recoverTargetQuat.z = up.z;
    fsm.recoverTargetQuat.w = up.w;
  }

  if (ctx?.articulated.active && ctx.recoverTos.length === ctx.articulated.bodies.length) {
    const n = ctx.articulated.bodies.length;
    const from: ArticulatedBodyTransform[] = [];
    const to: ArticulatedBodyTransform[] = [];
    for (let i = 0; i < n; i++) {
      const a: ArticulatedBodyTransform = {
        px: 0,
        py: 0,
        pz: 0,
        qx: 0,
        qy: 0,
        qz: 0,
        qw: 1,
      };
      readArticulatedBodyTransform(ctx.articulated.bodies[i], a);
      from.push(a);
      const b = ctx.recoverTos[i]!;
      to.push({
        px: b.px,
        py: b.py,
        pz: b.pz,
        qx: b.qx,
        qy: b.qy,
        qz: b.qz,
        qw: b.qw,
      });
      setKinematicHoldCurrent(ctx.articulated.bodies[i]!);
    }
    fsm.articulatedRecoverFrom = from;
    fsm.articulatedRecoverTo = to;
  } else {
    fsm.articulatedRecoverFrom = null;
    fsm.articulatedRecoverTo = null;
    setKinematicHoldCurrent(body);
  }

  fsm.phase = "recover";
  fsm.timeInPhaseSec = 0;
}

/**
 * After light stagger: blend upright **in place** (same XZ as end of stagger, spawn standing Y, yaw preserved).
 */
export function armTrainingDummyStandUp(
  body: RAPIER.RigidBody,
  fsm: TrainingDummyFsm,
  floorStandingY: number = TRAINING_DUMMY_SPAWN_TRANSFORM.y,
): void {
  copyFromRigidBody(body, fsm);

  const t = body.translation();
  const r = body.rotation();
  const up = uprightWorldYawQuat(r);
  const sy = floorStandingY;

  fsm.recoverTargetPos.x = t.x;
  fsm.recoverTargetPos.y = sy;
  fsm.recoverTargetPos.z = t.z;
  fsm.recoverTargetQuat.x = up.x;
  fsm.recoverTargetQuat.y = up.y;
  fsm.recoverTargetQuat.z = up.z;
  fsm.recoverTargetQuat.w = up.w;

  setKinematicHoldCurrent(body);

  fsm.phase = "stand_up";
  fsm.timeInPhaseSec = 0;
}

function advanceKinematicBlend(
  fsm: TrainingDummyFsm,
  fixedDt: number,
  blendSec: number,
): number {
  fsm.timeInPhaseSec += fixedDt;
  return Math.min(1, fsm.timeInPhaseSec / Math.max(1e-4, blendSec));
}

function applyBlendSample(
  body: RAPIER.RigidBody,
  fsm: TrainingDummyFsm,
  t: number,
): void {
  const { recoverBlendFromPos: a, recoverTargetPos: b } = fsm;
  const px = a.x + (b.x - a.x) * t;
  const py = a.y + (b.y - a.y) * t;
  const pz = a.z + (b.z - a.z) * t;

  qa.set(
    fsm.recoverBlendFromQuat.x,
    fsm.recoverBlendFromQuat.y,
    fsm.recoverBlendFromQuat.z,
    fsm.recoverBlendFromQuat.w,
  );
  qb.set(
    fsm.recoverTargetQuat.x,
    fsm.recoverTargetQuat.y,
    fsm.recoverTargetQuat.z,
    fsm.recoverTargetQuat.w,
  );
  qo.copy(qa).slerp(qb, t);

  body.setNextKinematicTranslation({ x: px, y: py, z: pz });
  body.setNextKinematicRotation({
    x: qo.x,
    y: qo.y,
    z: qo.z,
    w: qo.w,
  });
}

function finishStandUpToDynamicIdle(
  body: RAPIER.RigidBody,
  fsm: TrainingDummyFsm,
): void {
  const p = fsm.recoverTargetPos;
  const q = fsm.recoverTargetQuat;
  body.setBodyType(RAPIER.RigidBodyType.Dynamic, true);
  body.setTranslation({ x: p.x, y: p.y, z: p.z }, true);
  body.setRotation({ x: q.x, y: q.y, z: q.z, w: q.w }, true);
  body.setLinvel({ x: 0, y: 0, z: 0 }, true);
  body.setAngvel({ x: 0, y: 0, z: 0 }, true);
  fsm.phase = "idle";
  fsm.timeInPhaseSec = 0;
}

function finishRagdollRecoverAfterBlend(
  body: RAPIER.RigidBody,
  fsm: TrainingDummyFsm,
  physics: JohnStickPhysics | undefined,
  articulated: TrainingDummyArticulatedRagdoll | undefined,
): void {
  if (physics && articulated?.active) {
    endTrainingDummyArticulatedRagdoll(physics, articulated);
  }
  const p = fsm.recoverTargetPos;
  const q = fsm.recoverTargetQuat;
  body.setBodyType(RAPIER.RigidBodyType.Dynamic, true);
  body.setTranslation({ x: p.x, y: p.y, z: p.z }, true);
  body.setRotation({ x: q.x, y: q.y, z: q.z, w: q.w }, true);
  body.setLinvel({ x: 0, y: 0, z: 0 }, true);
  body.setAngvel({ x: 0, y: 0, z: 0 }, true);
  fsm.phase = "idle";
  fsm.timeInPhaseSec = 0;
  fsm.articulatedRecoverFrom = null;
  fsm.articulatedRecoverTo = null;
}

function applyArticulatedRecoverSample(
  bodies: RAPIER.RigidBody[],
  from: ArticulatedBodyTransform[],
  to: ArticulatedBodyTransform[],
  t: number,
): void {
  for (let i = 0; i < bodies.length; i++) {
    const a = from[i]!;
    const b = to[i]!;
    const px = a.px + (b.px - a.px) * t;
    const py = a.py + (b.py - a.py) * t;
    const pz = a.pz + (b.pz - a.pz) * t;
    qa.set(a.qx, a.qy, a.qz, a.qw);
    qb.set(b.qx, b.qy, b.qz, b.qw);
    qo.copy(qa).slerp(qb, t);
    bodies[i]!.setNextKinematicTranslation({ x: px, y: py, z: pz });
    bodies[i]!.setNextKinematicRotation({
      x: qo.x,
      y: qo.y,
      z: qo.z,
      w: qo.w,
    });
  }
}

export type PrePhysicsTrainingDummyResult = {
  /** Ragdoll recover reached spawn and cleared knockdown lab damage (not used after light stand_up). */
  resetLabDamageAfterRagdollRecover: boolean;
};

export type PrePhysicsTrainingDummyOptions = {
  physics: JohnStickPhysics;
  articulated: TrainingDummyArticulatedRagdoll;
};

/**
 * Call at the **start** of each fixed step, **before** `world.step()`, for `stand_up` or `recover`.
 */
export function prePhysicsTrainingDummy(
  body: RAPIER.RigidBody,
  fsm: TrainingDummyFsm,
  fixedDt: number,
  recoverBlendSec: number,
  standUpBlendSec: number,
  opts?: PrePhysicsTrainingDummyOptions,
): PrePhysicsTrainingDummyResult {
  if (fsm.phase === "stand_up") {
    const t = advanceKinematicBlend(fsm, fixedDt, standUpBlendSec);
    applyBlendSample(body, fsm, t);
    if (t < 1) {
      return { resetLabDamageAfterRagdollRecover: false };
    }
    finishStandUpToDynamicIdle(body, fsm);
    return { resetLabDamageAfterRagdollRecover: false };
  }

  if (fsm.phase === "recover") {
    const t = advanceKinematicBlend(fsm, fixedDt, recoverBlendSec);
    const from = fsm.articulatedRecoverFrom;
    const to = fsm.articulatedRecoverTo;
    if (
      from &&
      to &&
      opts?.articulated.active &&
      from.length === opts.articulated.bodies.length
    ) {
      applyArticulatedRecoverSample(opts.articulated.bodies, from, to, t);
    } else {
      applyBlendSample(body, fsm, t);
    }
    if (t < 1) {
      return { resetLabDamageAfterRagdollRecover: false };
    }
    finishRagdollRecoverAfterBlend(body, fsm, opts?.physics, opts?.articulated);
    return { resetLabDamageAfterRagdollRecover: true };
  }

  return { resetLabDamageAfterRagdollRecover: false };
}

export function rigidBodyPlanarSpeedLinAng(body: RAPIER.RigidBody): {
  linPlanar: number;
  ang: number;
} {
  const v = body.linvel();
  const linPlanar = Math.hypot(v.x, v.z);
  const w = body.angvel();
  const ang = Math.hypot(w.x, w.y, w.z);
  return { linPlanar, ang };
}
