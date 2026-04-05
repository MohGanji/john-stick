/**
 * WS-081 / GP §2.2.1–2.2.3 — designer rows for **chord** + **sequence** strikes resolved in WS-051.
 *
 * Same column pattern as `baseMoveTable.ts`: sphere hit profile, optional recovery override,
 * bag tier for lab scaling, and a **hit-type** label for future launch/sweep/pop-up tuning.
 *
 * **Technical animator:** `suggestedAnimClipName` is the intended glTF clip when assets ship;
 * `playerCharacter.ts` plays it if present (otherwise no-op).
 */
import type { StrikeMoveId } from "../input/combatIntent";
import {
  DEFAULT_STRIKE_INPUT_COOLDOWN_BY_KIND,
  REPO_DEFAULT_STRIKE_INPUT_COOLDOWN_SEC,
  strikeInputCooldownAfterSec as baseStrikeInputCooldownAfterSec,
  type BaseAttackMoveId,
  type MoveKind,
  type SphereStrikeProfile,
} from "./baseMoveTable";

export type CompoundStrikeMoveId = Exclude<StrikeMoveId, BaseAttackMoveId>;

/** GP §2.2.3 — data-driven reaction / launch family (bag tuning uses tier today). */
export type MoveHitType = "standard" | "launch" | "sweep" | "pop_up";

export type CompoundMoveRow = {
  moveId: CompoundStrikeMoveId;
  kind: MoveKind;
  profile: SphereStrikeProfile;
  inputCooldownAfterStrikeSec?: number;
  /** GP §6.2.2 — `applyTrainingBagHitFromPunch` tier index. */
  bagChargeTierIndex: number;
  hitType: MoveHitType;
  /** Optional glTF clip name (must exist in player glb to play). */
  suggestedAnimClipName?: string;
};

const CHORD_DUAL_PUNCH: SphereStrikeProfile = {
  radius: 0.14,
  reach: 0.58,
  sideOffset: 0,
  heightFromCapsuleCenter: 0.2,
  activeFrames: 5,
};

const CHORD_DUAL_KICK: SphereStrikeProfile = {
  radius: 0.16,
  reach: 0.64,
  sideOffset: 0,
  heightFromCapsuleCenter: -0.1,
  activeFrames: 6,
};

const CHORD_TRIPLE: SphereStrikeProfile = {
  radius: 0.15,
  reach: 0.62,
  sideOffset: 0,
  heightFromCapsuleCenter: 0.05,
  activeFrames: 6,
};

const CHORD_QUAD: SphereStrikeProfile = {
  radius: 0.17,
  reach: 0.68,
  sideOffset: 0,
  heightFromCapsuleCenter: 0.08,
  activeFrames: 7,
};

function mixedProfile(sideOffset: number, height: number): SphereStrikeProfile {
  return {
    radius: 0.145,
    reach: 0.6,
    sideOffset,
    heightFromCapsuleCenter: height,
    activeFrames: 5,
  };
}

/** Short chain strikes — slightly tighter than dual chords. */
const SEQ_CHAIN: SphereStrikeProfile = {
  radius: 0.13,
  reach: 0.54,
  sideOffset: 0,
  heightFromCapsuleCenter: 0.12,
  activeFrames: 4,
};

const SEQ_PUNCH_KICK: SphereStrikeProfile = {
  radius: 0.135,
  reach: 0.56,
  sideOffset: 0.06,
  heightFromCapsuleCenter: -0.02,
  activeFrames: 5,
};

const SEQ_KICK_PUNCH: SphereStrikeProfile = {
  radius: 0.135,
  reach: 0.55,
  sideOffset: 0.05,
  heightFromCapsuleCenter: 0.14,
  activeFrames: 5,
};

export const COMPOUND_MOVE_TABLE: Record<CompoundStrikeMoveId, CompoundMoveRow> = {
  chord_dual_punch: {
    moveId: "chord_dual_punch",
    kind: "compound",
    profile: CHORD_DUAL_PUNCH,
    inputCooldownAfterStrikeSec: 0.38,
    bagChargeTierIndex: 1,
    hitType: "standard",
    suggestedAnimClipName: "Strike_DualPunch",
  },
  chord_dual_kick: {
    moveId: "chord_dual_kick",
    kind: "compound",
    profile: CHORD_DUAL_KICK,
    inputCooldownAfterStrikeSec: 0.48,
    bagChargeTierIndex: 1,
    hitType: "sweep",
    suggestedAnimClipName: "Strike_DualKick",
  },
  chord_mixed_pi_lk: {
    moveId: "chord_mixed_pi_lk",
    kind: "compound",
    profile: mixedProfile(0.12, 0.04),
    bagChargeTierIndex: 1,
    hitType: "pop_up",
    suggestedAnimClipName: "Strike_Mixed_PI_LK",
  },
  chord_mixed_pi_rk: {
    moveId: "chord_mixed_pi_rk",
    kind: "compound",
    profile: mixedProfile(-0.12, 0.04),
    bagChargeTierIndex: 1,
    hitType: "pop_up",
    suggestedAnimClipName: "Strike_Mixed_PI_RK",
  },
  chord_mixed_pu_lk: {
    moveId: "chord_mixed_pu_lk",
    kind: "compound",
    profile: mixedProfile(0.1, 0.1),
    bagChargeTierIndex: 1,
    hitType: "standard",
    suggestedAnimClipName: "Strike_Mixed_PU_LK",
  },
  chord_mixed_pu_rk: {
    moveId: "chord_mixed_pu_rk",
    kind: "compound",
    profile: mixedProfile(-0.1, 0.1),
    bagChargeTierIndex: 1,
    hitType: "standard",
    suggestedAnimClipName: "Strike_Mixed_PU_RK",
  },
  chord_triple: {
    moveId: "chord_triple",
    kind: "compound",
    profile: CHORD_TRIPLE,
    inputCooldownAfterStrikeSec: 0.52,
    bagChargeTierIndex: 2,
    hitType: "launch",
    suggestedAnimClipName: "Strike_TripleChord",
  },
  chord_quad: {
    moveId: "chord_quad",
    kind: "compound",
    profile: CHORD_QUAD,
    inputCooldownAfterStrikeSec: 0.62,
    bagChargeTierIndex: 2,
    hitType: "launch",
    suggestedAnimClipName: "Strike_QuadChord",
  },
  seq_lp_rp: {
    moveId: "seq_lp_rp",
    kind: "punch",
    profile: { ...SEQ_CHAIN, sideOffset: 0.08 },
    bagChargeTierIndex: 1,
    hitType: "standard",
    suggestedAnimClipName: "Strike_Seq_LP_RP",
  },
  seq_rp_lp: {
    moveId: "seq_rp_lp",
    kind: "punch",
    profile: { ...SEQ_CHAIN, sideOffset: -0.08 },
    bagChargeTierIndex: 1,
    hitType: "standard",
    suggestedAnimClipName: "Strike_Seq_RP_LP",
  },
  seq_lk_rk: {
    moveId: "seq_lk_rk",
    kind: "kick",
    profile: { ...SEQ_CHAIN, heightFromCapsuleCenter: -0.14 },
    bagChargeTierIndex: 1,
    hitType: "sweep",
    suggestedAnimClipName: "Strike_Seq_LK_RK",
  },
  seq_rk_lk: {
    moveId: "seq_rk_lk",
    kind: "kick",
    profile: { ...SEQ_CHAIN, heightFromCapsuleCenter: -0.14, sideOffset: -0.04 },
    bagChargeTierIndex: 1,
    hitType: "sweep",
    suggestedAnimClipName: "Strike_Seq_RK_LK",
  },
  seq_lp_lk: {
    moveId: "seq_lp_lk",
    kind: "compound",
    profile: { ...SEQ_PUNCH_KICK, sideOffset: 0.14 },
    bagChargeTierIndex: 1,
    hitType: "standard",
    suggestedAnimClipName: "Strike_Seq_LP_LK",
  },
  seq_lp_rk: {
    moveId: "seq_lp_rk",
    kind: "compound",
    profile: { ...SEQ_PUNCH_KICK, sideOffset: -0.12 },
    bagChargeTierIndex: 1,
    hitType: "pop_up",
    suggestedAnimClipName: "Strike_Seq_LP_RK",
  },
  seq_rp_lk: {
    moveId: "seq_rp_lk",
    kind: "compound",
    profile: { ...SEQ_PUNCH_KICK, sideOffset: 0.12 },
    bagChargeTierIndex: 1,
    hitType: "standard",
    suggestedAnimClipName: "Strike_Seq_RP_LK",
  },
  seq_rp_rk: {
    moveId: "seq_rp_rk",
    kind: "compound",
    profile: { ...SEQ_PUNCH_KICK, sideOffset: -0.14 },
    bagChargeTierIndex: 1,
    hitType: "pop_up",
    suggestedAnimClipName: "Strike_Seq_RP_RK",
  },
  seq_lk_lp: {
    moveId: "seq_lk_lp",
    kind: "compound",
    profile: { ...SEQ_KICK_PUNCH, sideOffset: 0.12 },
    bagChargeTierIndex: 1,
    hitType: "standard",
    suggestedAnimClipName: "Strike_Seq_LK_LP",
  },
  seq_lk_rp: {
    moveId: "seq_lk_rp",
    kind: "compound",
    profile: { ...SEQ_KICK_PUNCH, sideOffset: -0.1 },
    bagChargeTierIndex: 1,
    hitType: "standard",
    suggestedAnimClipName: "Strike_Seq_LK_RP",
  },
  seq_rk_lp: {
    moveId: "seq_rk_lp",
    kind: "compound",
    profile: { ...SEQ_KICK_PUNCH, sideOffset: 0.1 },
    bagChargeTierIndex: 1,
    hitType: "standard",
    suggestedAnimClipName: "Strike_Seq_RK_LP",
  },
  seq_rk_rp: {
    moveId: "seq_rk_rp",
    kind: "compound",
    profile: { ...SEQ_KICK_PUNCH, sideOffset: -0.12 },
    bagChargeTierIndex: 1,
    hitType: "pop_up",
    suggestedAnimClipName: "Strike_Seq_RK_RP",
  },
};

export const COMPOUND_MOVE_DESIGN_ROWS: readonly CompoundMoveRow[] = Object.values(
  COMPOUND_MOVE_TABLE,
);

export function getCompoundMoveRow(moveId: CompoundStrikeMoveId): CompoundMoveRow {
  return COMPOUND_MOVE_TABLE[moveId];
}

export function compoundStrikeInputCooldownAfterSec(
  moveId: CompoundStrikeMoveId,
): number {
  const row = COMPOUND_MOVE_TABLE[moveId];
  return (
    row.inputCooldownAfterStrikeSec ??
    DEFAULT_STRIKE_INPUT_COOLDOWN_BY_KIND[row.kind] ??
    REPO_DEFAULT_STRIKE_INPUT_COOLDOWN_SEC
  );
}

export function strikeBagChargeTierIndex(moveId: StrikeMoveId): number {
  if (
    moveId === "atk_lp" ||
    moveId === "atk_rp" ||
    moveId === "atk_lk" ||
    moveId === "atk_rk"
  ) {
    return 0;
  }
  return COMPOUND_MOVE_TABLE[moveId].bagChargeTierIndex;
}

/** Unified cooldown column for dev HUD + bootstrap (WS-080 base + WS-081 compounds). */
export function resolveStrikeInputCooldownSec(moveId: StrikeMoveId): number {
  if (
    moveId === "atk_lp" ||
    moveId === "atk_rp" ||
    moveId === "atk_lk" ||
    moveId === "atk_rk"
  ) {
    return baseStrikeInputCooldownAfterSec(moveId);
  }
  return compoundStrikeInputCooldownAfterSec(moveId);
}
