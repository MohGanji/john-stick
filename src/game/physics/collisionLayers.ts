/**
 * GP §4.2.2 — collision membership + filter masks for Rapier `InteractionGroups`.
 * Packed as `(membership << 16) | filter` (see Rapier `interaction_groups.d.ts`).
 */
export const PhysicsMembership = {
  player: 1 << 0,
  enemy: 1 << 1,
  prop: 1 << 2,
  ragdollLimb: 1 << 3,
  /** Overlap volumes (hurtboxes, signs). Not in `allSolid` so the KCC capsule ignores them. */
  trigger: 1 << 4,
  staticWorld: 1 << 5,
} as const;

/** Low 16 bits: which memberships this collider interacts with. */
export const PhysicsFilter = {
  allSolid:
    PhysicsMembership.player |
    PhysicsMembership.enemy |
    PhysicsMembership.prop |
    PhysicsMembership.ragdollLimb |
    PhysicsMembership.staticWorld,
  /** Volumes that should fire on player/enemy overlap only. */
  triggerProbe: PhysicsMembership.player | PhysicsMembership.enemy,
} as const;

export function collisionGroups(membership: number, filter: number): number {
  return ((membership & 0xffff) << 16) | (filter & 0xffff);
}

/**
 * WS-031 / GP §3.1.1 — Rapier query groups for third-person camera spherecasts.
 * Hits static + props; pair with `filterExcludeRigidBody` for the followed character.
 */
export const CAMERA_PROBE_GROUPS = collisionGroups(
  PhysicsMembership.player,
  PhysicsFilter.allSolid,
);
