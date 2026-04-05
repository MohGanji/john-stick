/**
 * WS-094 / GP §5.2.1, §6.4.1–§6.4.2 — articulated training dummy: bone order matches
 * `docs/CHARACTER_RIG_MAP.md` + `scripts/export-stick-character.mjs`.
 */

/** GP §6.4.2 — single articulated knockdown target in dojo; keep body count explicit for perf reviews. */
export const TRAINING_DUMMY_ARTICULATED_DYNAMIC_BODY_CAP = 12;

/** Creation order = `bodies[]` / FSM articulated arrays index. */
export const TRAINING_DUMMY_RAGDOLL_BONE_ORDER = [
  "Hips",
  "Spine",
  "Chest",
  "Head",
  "ShoulderL",
  "ArmL",
  "ShoulderR",
  "ArmR",
  "LegUpperL",
  "LegLowerL",
  "LegUpperR",
  "LegLowerR",
] as const;

export type TrainingDummyRagdollBoneName =
  (typeof TRAINING_DUMMY_RAGDOLL_BONE_ORDER)[number];

/** Parent bone name per rig map; `Hips` is world root of the chain. */
export const TRAINING_DUMMY_RAGDOLL_PARENT: Record<
  TrainingDummyRagdollBoneName,
  TrainingDummyRagdollBoneName | null
> = {
  Hips: null,
  Spine: "Hips",
  Chest: "Spine",
  Head: "Chest",
  ShoulderL: "Chest",
  ArmL: "ShoulderL",
  ShoulderR: "Chest",
  ArmR: "ShoulderR",
  LegUpperL: "Hips",
  LegLowerL: "LegUpperL",
  LegUpperR: "Hips",
  LegLowerR: "LegUpperR",
};

/** Capsule radius by bone (meters); from export script limb/torso radii. */
export const TRAINING_DUMMY_RAGDOLL_RADIUS: Record<
  TrainingDummyRagdollBoneName,
  number
> = {
  Hips: 0.024 * 1.2,
  Spine: 0.024 * 1.05,
  Chest: 0.024 * 1.1,
  Head: 0.074,
  ShoulderL: 0.024,
  ArmL: 0.024,
  ShoulderR: 0.024,
  ArmR: 0.024,
  LegUpperL: 0.024,
  LegLowerL: 0.024 * 0.96,
  LegUpperR: 0.024,
  LegLowerR: 0.024 * 0.96,
};

/** Relative mass share (normalized when building). Total matches `TRAINING_DUMMY_PHYSICS.colliderMassKg`. */
export const TRAINING_DUMMY_RAGDOLL_MASS_SHARE: Record<
  TrainingDummyRagdollBoneName,
  number
> = {
  Hips: 0.22,
  Spine: 0.12,
  Chest: 0.14,
  Head: 0.06,
  ShoulderL: 0.04,
  ArmL: 0.05,
  ShoulderR: 0.04,
  ArmR: 0.05,
  LegUpperL: 0.09,
  LegLowerL: 0.07,
  LegUpperR: 0.09,
  LegLowerR: 0.07,
};

/** Pelvis capsule on the existing hips body after removing the monolithic dummy capsule (hips bone local, Y-up). */
export const TRAINING_DUMMY_PELVIS_CAPSULE = {
  halfHeight: 0.055,
  radius: 0.024 * 1.2,
  /** COM offset from hips bone origin (meters). */
  centerY: -0.035,
} as const;

/**
 * Knee / elbow flex as revolute limits (rad); axis is local +X on both bodies (stick bind).
 * GP §6.4.1 — stops hyper-extension while allowing a forward bend window.
 */
export const TRAINING_DUMMY_HINGE_LIMITS_RAD: Partial<
  Record<TrainingDummyRagdollBoneName, { min: number; max: number }>
> = {
  ArmL: { min: -0.12, max: 2.35 },
  ArmR: { min: -0.12, max: 2.35 },
  LegLowerL: { min: -0.08, max: 2.45 },
  LegLowerR: { min: -0.08, max: 2.45 },
};
