/**
 * WS-080 / GP §2.2.1 — **designer move table** for the four base limb strikes.
 *
 * Lead Game Designer owns numbers; gameplay reads rows for hit profiles + input cooldown.
 * Compound / chord rows reuse the same cooldown pattern in WS-081.
 *
 * **Technical animator:** treat each `moveId` as the hook for a distinct clip / hit-sync pass;
 * sphere `reach` / `heightFromCapsuleCenter` / `sideOffset` should stay in family with the rig contact.
 */

/** Resolver `MoveId` subset — single-limb attacks only (WS-080). */
export type BaseAttackMoveId = "atk_lp" | "atk_rp" | "atk_lk" | "atk_rk";

/** `compound` — default cooldown family for chords / multi-limb rows (WS-081). */
export type MoveKind = "punch" | "kick" | "compound";

/** Sphere sweep probe vs training hurt sensor (WS-060 pattern, parameterized per row). */
export type SphereStrikeProfile = {
  radius: number;
  reach: number;
  /**
   * Lateral offset along **character left** in XZ (meters).
   * Right-side limbs use a negative value (mirror of left).
   */
  sideOffset: number;
  heightFromCapsuleCenter: number;
  activeFrames: number;
};

export type BaseMoveRow = {
  moveId: BaseAttackMoveId;
  kind: MoveKind;
  profile: SphereStrikeProfile;
  /**
   * Extra input lockout after this strike’s active window ends (sim seconds), before another
   * strike may start. Omit → `DEFAULT_STRIKE_INPUT_COOLDOWN_BY_KIND[kind]` → `REPO_DEFAULT_STRIKE_INPUT_COOLDOWN_SEC`.
   */
  inputCooldownAfterStrikeSec?: number;
};

/** Fallback when a kind default is missing (should not happen). */
export const REPO_DEFAULT_STRIKE_INPUT_COOLDOWN_SEC = 0.25;

export const DEFAULT_STRIKE_INPUT_COOLDOWN_BY_KIND: Record<MoveKind, number> = {
  punch: 0.22,
  kick: 0.34,
  compound: 0.42,
};

const LP: SphereStrikeProfile = {
  radius: 0.12,
  reach: 0.52,
  sideOffset: 0.22,
  heightFromCapsuleCenter: 0.18,
  activeFrames: 4,
};

const RP: SphereStrikeProfile = {
  ...LP,
  sideOffset: -LP.sideOffset,
};

const LK: SphereStrikeProfile = {
  radius: 0.14,
  reach: 0.58,
  sideOffset: 0.2,
  heightFromCapsuleCenter: -0.12,
  activeFrames: 5,
};

const RK: SphereStrikeProfile = {
  ...LK,
  sideOffset: -LK.sideOffset,
};

export const BASE_MOVE_TABLE: Record<BaseAttackMoveId, BaseMoveRow> = {
  atk_lp: { moveId: "atk_lp", kind: "punch", profile: LP },
  atk_rp: { moveId: "atk_rp", kind: "punch", profile: RP },
  atk_lk: { moveId: "atk_lk", kind: "kick", profile: LK },
  atk_rk: {
    moveId: "atk_rk",
    kind: "kick",
    profile: RK,
    /** Example per-row override — slightly snappier than default kick cooldown. */
    inputCooldownAfterStrikeSec: 0.3,
  },
};

/** Ordered rows for docs / CSV export — same data as `BASE_MOVE_TABLE`. */
export const BASE_MOVE_DESIGN_ROWS: readonly BaseMoveRow[] = [
  BASE_MOVE_TABLE.atk_lp,
  BASE_MOVE_TABLE.atk_rp,
  BASE_MOVE_TABLE.atk_lk,
  BASE_MOVE_TABLE.atk_rk,
];

export function getBaseMoveRow(moveId: BaseAttackMoveId): BaseMoveRow {
  return BASE_MOVE_TABLE[moveId];
}

export function baseMoveProfile(moveId: BaseAttackMoveId): SphereStrikeProfile {
  return BASE_MOVE_TABLE[moveId].profile;
}

/**
 * Recovery / input cooldown after this move’s active frames end (WS-051 deferral → WS-080).
 */
export function strikeInputCooldownAfterSec(moveId: BaseAttackMoveId): number {
  const row = BASE_MOVE_TABLE[moveId];
  return (
    row.inputCooldownAfterStrikeSec ??
    DEFAULT_STRIKE_INPUT_COOLDOWN_BY_KIND[row.kind] ??
    REPO_DEFAULT_STRIKE_INPUT_COOLDOWN_SEC
  );
}
