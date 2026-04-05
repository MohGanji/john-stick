/**
 * WS-094 / GP §5.2.1, §6.1.1, §6.4.1 — Rapier multi-body training dummy (spawn on ragdoll, teardown after recover).
 */
import RAPIER, { RevoluteImpulseJoint } from "@dimforge/rapier3d-compat";
import * as THREE from "three";

import { TRAINING_DUMMY_PHYSICS } from "../level/trainingDummyConfig";
import {
  TRAINING_DUMMY_HINGE_LIMITS_RAD,
  TRAINING_DUMMY_PELVIS_CAPSULE,
  TRAINING_DUMMY_RAGDOLL_BONE_ORDER,
  TRAINING_DUMMY_RAGDOLL_MASS_SHARE,
  TRAINING_DUMMY_RAGDOLL_PARENT,
  TRAINING_DUMMY_RAGDOLL_RADIUS,
  type TrainingDummyRagdollBoneName,
} from "./trainingDummyRagdollConfig";
import type { JohnStickPhysics } from "./rapierWorld";

const _oneScale = new THREE.Vector3(1, 1, 1);
const _m1 = new THREE.Matrix4();
const _m2 = new THREE.Matrix4();
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _v3 = new THREE.Vector3();
const _q1 = new THREE.Quaternion();
const _q2 = new THREE.Quaternion();

export type ArticulatedBodyTransform = {
  px: number;
  py: number;
  pz: number;
  qx: number;
  qy: number;
  qz: number;
  qw: number;
};

export type TrainingDummyArticulatedRagdoll = {
  active: boolean;
  /** Same order as `TRAINING_DUMMY_RAGDOLL_BONE_ORDER`; index 0 = hips (`physics.trainingDummyRigidBody`). */
  bodies: RAPIER.RigidBody[];
  /** Per-bone bind correction: boneWorld = bodyWorld * correction (spawn-time). */
  boneVisualCorrection: THREE.Matrix4[];
  orderedBones: THREE.Bone[];
  joints: RAPIER.ImpulseJoint[];
  pelvisCollider: RAPIER.Collider | null;
};

function massKgForBone(name: TrainingDummyRagdollBoneName, totalKg: number): number {
  let sum = 0;
  for (const n of TRAINING_DUMMY_RAGDOLL_BONE_ORDER) {
    sum += TRAINING_DUMMY_RAGDOLL_MASS_SHARE[n];
  }
  return (totalKg * TRAINING_DUMMY_RAGDOLL_MASS_SHARE[name]) / sum;
}

function worldPointToBodyLocal(
  body: RAPIER.RigidBody,
  wx: number,
  wy: number,
  wz: number,
  out: { x: number; y: number; z: number },
): void {
  const t = body.translation();
  const r = body.rotation();
  _m1.compose(
    new THREE.Vector3(t.x, t.y, t.z),
    new THREE.Quaternion(r.x, r.y, r.z, r.w),
    _oneScale,
  );
  _m1.invert();
  _v1.set(wx, wy, wz).applyMatrix4(_m1);
  out.x = _v1.x;
  out.y = _v1.y;
  out.z = _v1.z;
}

function worldDirToBodyLocal(
  body: RAPIER.RigidBody,
  dx: number,
  dy: number,
  dz: number,
  out: { x: number; y: number; z: number },
): void {
  const r = body.rotation();
  _q1.set(r.x, r.y, r.z, r.w);
  _q1.invert();
  _v1.set(dx, dy, dz).applyQuaternion(_q1);
  out.x = _v1.x;
  out.y = _v1.y;
  out.z = _v1.z;
}

function findBoneMap(root: THREE.Object3D): Map<string, THREE.Bone> {
  const map = new Map<string, THREE.Bone>();
  root.traverse((o) => {
    if (o instanceof THREE.Bone) map.set(o.name, o);
  });
  return map;
}

export function findFirstSkinnedMesh(root: THREE.Object3D): THREE.SkinnedMesh | null {
  let found: THREE.SkinnedMesh | null = null;
  root.traverse((o) => {
    if (found) return;
    if (o instanceof THREE.SkinnedMesh) found = o;
  });
  return found;
}

type SegmentDesc =
  | {
      kind: "capsule";
      centerWx: number;
      centerWy: number;
      centerWz: number;
      quat: THREE.Quaternion;
      halfHeight: number;
      radius: number;
    }
  | {
      kind: "ball";
      centerWx: number;
      centerWy: number;
      centerWz: number;
      radius: number;
    };

function buildSegmentDesc(
  bone: THREE.Bone,
  boneName: TrainingDummyRagdollBoneName,
): SegmentDesc {
  const radius = TRAINING_DUMMY_RAGDOLL_RADIUS[boneName];
  const startW = _v2.setFromMatrixPosition(bone.matrixWorld);
  const child = bone.children.find((c) => c instanceof THREE.Bone) as
    | THREE.Bone
    | undefined;

  if (boneName === "Head") {
    bone.getWorldQuaternion(_q1);
    const up = _v3.set(0, 1, 0).applyQuaternion(_q1);
    const centerW = startW.clone().addScaledVector(up, 0.045);
    return {
      kind: "ball",
      centerWx: centerW.x,
      centerWy: centerW.y,
      centerWz: centerW.z,
      radius,
    };
  }

  const endW = child
    ? _v3.setFromMatrixPosition(child.matrixWorld)
    : startW.clone().add(new THREE.Vector3(0, 0.08, 0));

  const dir = _v1.subVectors(endW, startW);
  const len = dir.length();
  const halfHeight = Math.max(len * 0.5, 0.018);
  const mid = _v2.clone().addVectors(startW, endW).multiplyScalar(0.5);
  dir.normalize();
  _q2.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  return {
    kind: "capsule",
    centerWx: mid.x,
    centerWy: mid.y,
    centerWz: mid.z,
    quat: _q2.clone(),
    halfHeight,
    radius,
  };
}

export function readArticulatedBodyTransform(
  body: RAPIER.RigidBody,
  out: ArticulatedBodyTransform,
): void {
  const t = body.translation();
  const r = body.rotation();
  out.px = t.x;
  out.py = t.y;
  out.pz = t.z;
  out.qx = r.x;
  out.qy = r.y;
  out.qz = r.z;
  out.qw = r.w;
}

/** World-space rigid-body targets at bind (character root at spawn, upright idle). */
export function computeArticulatedBindWorldTransforms(
  skinnedRoot: THREE.Object3D,
): ArticulatedBodyTransform[] {
  if (!findFirstSkinnedMesh(skinnedRoot)) {
    throw new Error("WS-094: training dummy has no SkinnedMesh for bind capture");
  }
  skinnedRoot.updateMatrixWorld(true);
  const boneMap = findBoneMap(skinnedRoot);
  const out: ArticulatedBodyTransform[] = [];
  for (const name of TRAINING_DUMMY_RAGDOLL_BONE_ORDER) {
    const bone = boneMap.get(name);
    if (!bone) {
      throw new Error(`WS-094: missing bone "${name}" on training dummy`);
    }
    const seg = buildSegmentDesc(bone, name);
    const t = new THREE.Vector3();
    const q = new THREE.Quaternion();
    if (seg.kind === "capsule") {
      t.set(seg.centerWx, seg.centerWy, seg.centerWz);
      q.copy(seg.quat);
    } else {
      t.set(seg.centerWx, seg.centerWy, seg.centerWz);
      q.identity();
    }
    out.push({
      px: t.x,
      py: t.y,
      pz: t.z,
      qx: q.x,
      qy: q.y,
      qz: q.z,
      qw: q.w,
    });
  }
  return out;
}

function makeBodyMatrix(body: RAPIER.RigidBody, out: THREE.Matrix4): void {
  const t = body.translation();
  const r = body.rotation();
  out.compose(
    new THREE.Vector3(t.x, t.y, t.z),
    new THREE.Quaternion(r.x, r.y, r.z, r.w),
    _oneScale,
  );
}

/**
 * Drive skinned bones from Rapier bodies (ragdoll display). `boneWorld ≈ bodyWorld * correction`.
 */
export function syncTrainingDummySkeletonFromArticulatedRagdoll(
  ragdoll: TrainingDummyArticulatedRagdoll,
): void {
  if (!ragdoll.active) return;
  const { bodies, boneVisualCorrection, orderedBones } = ragdoll;
  for (let i = 0; i < bodies.length; i++) {
    const bone = orderedBones[i];
    const body = bodies[i];
    makeBodyMatrix(body, _m1);
    _m2.multiplyMatrices(_m1, boneVisualCorrection[i]);
    const parent = bone.parent;
    if (parent instanceof THREE.Bone) {
      parent.updateMatrixWorld(true);
      _m1.copy(parent.matrixWorld).invert();
      _m2.premultiply(_m1);
    }
    _m2.decompose(_v1, _q1, _v3);
    bone.position.copy(_v1);
    bone.quaternion.copy(_q1);
    bone.scale.set(1, 1, 1);
  }
  const skinned = orderedBones[0]?.parent;
  let rootSkinned: THREE.SkinnedMesh | null = null;
  let p: THREE.Object3D | null = skinned ?? null;
  while (p) {
    if (p instanceof THREE.SkinnedMesh) {
      rootSkinned = p;
      break;
    }
    p = p.parent;
  }
  rootSkinned?.skeleton?.update();
}

const _anchorA = { x: 0, y: 0, z: 0 };
const _anchorB = { x: 0, y: 0, z: 0 };
const _axisA = { x: 0, y: 0, z: 0 };

export function beginTrainingDummyArticulatedRagdoll(
  physics: JohnStickPhysics,
  skinnedRoot: THREE.Object3D,
  into: TrainingDummyArticulatedRagdoll,
): void {
  if (into.active) return;
  const world = physics.world;
  const hips = physics.trainingDummyRigidBody;

  if (!findFirstSkinnedMesh(skinnedRoot)) {
    throw new Error("WS-094: articulated ragdoll requires a skinned dummy");
  }
  skinnedRoot.updateMatrixWorld(true);
  const boneMap = findBoneMap(skinnedRoot);
  const orderedBones: THREE.Bone[] = [];
  for (const name of TRAINING_DUMMY_RAGDOLL_BONE_ORDER) {
    const b = boneMap.get(name);
    if (!b) throw new Error(`WS-094: missing bone "${name}"`);
    orderedBones.push(b);
  }

  world.removeCollider(physics.trainingDummySolidCollider, true);

  const pelvis = RAPIER.ColliderDesc.capsule(
    TRAINING_DUMMY_PELVIS_CAPSULE.halfHeight,
    TRAINING_DUMMY_PELVIS_CAPSULE.radius,
  )
    .setTranslation(0, TRAINING_DUMMY_PELVIS_CAPSULE.centerY, 0)
    .setFriction(TRAINING_DUMMY_PHYSICS.friction)
    .setRestitution(TRAINING_DUMMY_PHYSICS.restitution)
    .setMass(massKgForBone("Hips", TRAINING_DUMMY_PHYSICS.colliderMassKg))
    .setCollisionGroups(physics.propCollisionGroups)
    .setSolverGroups(physics.propSolverGroups);
  into.pelvisCollider = world.createCollider(pelvis, hips);

  const bodies: RAPIER.RigidBody[] = [];
  bodies.length = TRAINING_DUMMY_RAGDOLL_BONE_ORDER.length;
  bodies[0] = hips;

  const corrections: THREE.Matrix4[] = [];
  corrections.length = bodies.length;

  const descByName = new Map<TrainingDummyRagdollBoneName, SegmentDesc>();
  for (const name of TRAINING_DUMMY_RAGDOLL_BONE_ORDER) {
    descByName.set(name, buildSegmentDesc(boneMap.get(name)!, name));
  }

  const linVel = hips.linvel();
  const angVel = hips.angvel();
  const totalMass = TRAINING_DUMMY_PHYSICS.colliderMassKg;

  for (let i = 1; i < TRAINING_DUMMY_RAGDOLL_BONE_ORDER.length; i++) {
    const name = TRAINING_DUMMY_RAGDOLL_BONE_ORDER[i];
    const seg = descByName.get(name)!;
    const desc = RAPIER.RigidBodyDesc.dynamic()
      .setLinearDamping(TRAINING_DUMMY_PHYSICS.linearDamping)
      .setAngularDamping(TRAINING_DUMMY_PHYSICS.angularDamping);
    if (seg.kind === "capsule") {
      desc.setTranslation(seg.centerWx, seg.centerWy, seg.centerWz);
      desc.setRotation({ x: seg.quat.x, y: seg.quat.y, z: seg.quat.z, w: seg.quat.w });
    } else {
      desc.setTranslation(seg.centerWx, seg.centerWy, seg.centerWz);
    }
    const body = world.createRigidBody(desc);
    body.setLinvel(linVel, true);
    body.setAngvel(angVel, true);

    let colliderDesc: RAPIER.ColliderDesc;
    if (seg.kind === "capsule") {
      colliderDesc = RAPIER.ColliderDesc.capsule(seg.halfHeight, seg.radius)
        .setFriction(TRAINING_DUMMY_PHYSICS.friction)
        .setRestitution(TRAINING_DUMMY_PHYSICS.restitution)
        .setMass(massKgForBone(name, totalMass))
        .setCollisionGroups(physics.propCollisionGroups)
        .setSolverGroups(physics.propSolverGroups);
    } else {
      colliderDesc = RAPIER.ColliderDesc.ball(seg.radius)
        .setFriction(TRAINING_DUMMY_PHYSICS.friction)
        .setRestitution(TRAINING_DUMMY_PHYSICS.restitution)
        .setMass(massKgForBone(name, totalMass))
        .setCollisionGroups(physics.propCollisionGroups)
        .setSolverGroups(physics.propSolverGroups);
    }
    world.createCollider(colliderDesc, body);
    bodies[i] = body;

    makeBodyMatrix(body, _m1);
    _m1.invert();
    _m2.copy(orderedBones[i].matrixWorld);
    corrections[i] = _m1.multiply(_m2);
  }

  makeBodyMatrix(hips, _m1);
  _m1.invert();
  _m2.copy(orderedBones[0].matrixWorld);
  corrections[0] = _m1.multiply(_m2);

  const joints: RAPIER.ImpulseJoint[] = [];

  for (let i = 1; i < TRAINING_DUMMY_RAGDOLL_BONE_ORDER.length; i++) {
    const name = TRAINING_DUMMY_RAGDOLL_BONE_ORDER[i];
    const parentName = TRAINING_DUMMY_RAGDOLL_PARENT[name];
    if (!parentName) continue;
    const parentIdx = TRAINING_DUMMY_RAGDOLL_BONE_ORDER.indexOf(parentName);
    const parentBody = bodies[parentIdx];
    const childBody = bodies[i];
    const childBone = boneMap.get(name)!;
    const jx = childBone.matrixWorld.elements[12];
    const jy = childBone.matrixWorld.elements[13];
    const jz = childBone.matrixWorld.elements[14];

    worldPointToBodyLocal(parentBody, jx, jy, jz, _anchorA);
    worldPointToBodyLocal(childBody, jx, jy, jz, _anchorB);

    const hinge = TRAINING_DUMMY_HINGE_LIMITS_RAD[name];
    if (hinge) {
      childBone.matrixWorld.decompose(_v3, _q2, _v2);
      _v1.set(1, 0, 0).applyQuaternion(_q2);
      worldDirToBodyLocal(parentBody, _v1.x, _v1.y, _v1.z, _axisA);
      const jd = RAPIER.JointData.revolute(_anchorA, _anchorB, _axisA);
      const joint = world.createImpulseJoint(jd, parentBody, childBody, true);
      if (joint instanceof RevoluteImpulseJoint) {
        joint.setLimits(hinge.min, hinge.max);
        joint.setContactsEnabled(false);
      }
      joints.push(joint);
    } else {
      const jd = RAPIER.JointData.spherical(_anchorA, _anchorB);
      const joint = world.createImpulseJoint(jd, parentBody, childBody, true);
      joint.setContactsEnabled(false);
      joints.push(joint);
    }
  }

  into.bodies.length = 0;
  into.bodies.push(...bodies);
  into.boneVisualCorrection.length = 0;
  into.boneVisualCorrection.push(...corrections);
  into.orderedBones.length = 0;
  into.orderedBones.push(...orderedBones);
  into.joints.length = 0;
  into.joints.push(...joints);
  into.active = true;
}

export function endTrainingDummyArticulatedRagdoll(
  physics: JohnStickPhysics,
  ragdoll: TrainingDummyArticulatedRagdoll,
): void {
  if (!ragdoll.active) return;
  const world = physics.world;
  if (ragdoll.pelvisCollider) {
    world.removeCollider(ragdoll.pelvisCollider, false);
    ragdoll.pelvisCollider = null;
  }
  for (let i = 1; i < ragdoll.bodies.length; i++) {
    world.removeRigidBody(ragdoll.bodies[i]);
  }
  ragdoll.bodies.length = 1;
  ragdoll.bodies[0] = physics.trainingDummyRigidBody;
  ragdoll.joints.length = 0;
  ragdoll.boneVisualCorrection.length = 0;
  ragdoll.orderedBones.length = 0;
  ragdoll.active = false;

  const d = TRAINING_DUMMY_PHYSICS;
  const dummySolid = RAPIER.ColliderDesc.capsule(
    d.capsuleHalfHeight,
    d.capsuleRadius,
  )
    .setFriction(d.friction)
    .setRestitution(d.restitution)
    .setMass(d.colliderMassKg)
    .setCollisionGroups(physics.propCollisionGroups)
    .setSolverGroups(physics.propSolverGroups);
  physics.trainingDummySolidCollider = world.createCollider(
    dummySolid,
    physics.trainingDummyRigidBody,
  );
}

export function createTrainingDummyArticulatedRagdollShell(): TrainingDummyArticulatedRagdoll {
  return {
    active: false,
    bodies: [],
    boneVisualCorrection: [],
    orderedBones: [],
    joints: [],
    pelvisCollider: null,
  };
}
