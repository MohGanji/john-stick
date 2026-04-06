/**
 * Articulated training dummy: logical bone order aligns with `TRAINING_DUMMY_RAGDOLL_BONE_ORDER` and
 * `scripts/export-stick-character.mjs`. Same `STICKMAN_BASE_GLTF_URL` skin as the hero;
 * `TRAINING_DUMMY_RAGDOLL_BONE_NAME_FALLBACKS` resolves **Stick_FRig** (and procedural) bone names to those slots.
 */

/** Single articulated knockdown target in dojo; keep body count explicit for perf reviews. */
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

/**
 * Ordered candidates per logical ragdoll slot: **Stick_FRig** (`Pelvis`, `ThighL`, …), then procedural
 * `Hips` / `Spine` / … for `PLAYER_GLTF_URL_PROCEDURAL` or `gltfUrlOverride`. glTF may use `:` in names;
 * `resolveRagdollBone` also tries a flattened key (no colons).
 */
export const TRAINING_DUMMY_RAGDOLL_BONE_NAME_FALLBACKS: Record<
  TrainingDummyRagdollBoneName,
  readonly string[]
> = {
  Hips: ["Pelvis", "Hips"],
  Spine: ["TorsoLow_MCH", "TorsoBendy", "Torso_MCH", "Spine"],
  Chest: ["TorsoHigh_MCH", "TorsoIK", "Chest"],
  Head: ["Head"],
  ShoulderL: ["Shoulder_MCHL", "UpperL", "ShoulderL"],
  ArmL: ["ForeL", "UpperL", "ArmL"],
  ShoulderR: ["Shoulder_MCHR", "UpperR", "ShoulderR"],
  ArmR: ["ForeR", "UpperR", "ArmR"],
  LegUpperL: ["ThighL", "Thigh_FKL", "Thigh_MCHL", "LegUpperL"],
  LegLowerL: ["ShinL", "Shin_FKL", "Shin_MCHL", "LegLowerL"],
  LegUpperR: ["ThighR", "Thigh_FKR", "Thigh_MCHR", "LegUpperR"],
  LegLowerR: ["ShinR", "Shin_FKR", "Shin_MCHR", "LegLowerR"],
};

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

/** Capsule radius by bone (meters); tuned against **`STICKMAN_BASE_GLTF_URL`**; tweak if mesh changes. */
export const TRAINING_DUMMY_RAGDOLL_RADIUS: Record<
  TrainingDummyRagdollBoneName,
  number
> = {
  Hips: 0.043,
  Spine: 0.039,
  Chest: 0.043,
  Head: 0.088,
  ShoulderL: 0.034,
  ArmL: 0.034,
  ShoulderR: 0.034,
  ArmR: 0.034,
  LegUpperL: 0.034,
  LegLowerL: 0.034 * 0.95,
  LegUpperR: 0.034,
  LegLowerR: 0.034 * 0.95,
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
  halfHeight: 0.084,
  radius: 0.043,
  /** COM offset from hips bone origin (meters). */
  centerY: -0.032,
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
