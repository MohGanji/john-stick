/**
 * WS-081 — optional glTF **strike** clips; `loadPlayerCharacter` plays a clip when the name exists.
 */
import type { StrikeMoveId } from "../input/combatIntent";
import type { BaseAttackMoveId } from "../combat/baseMoveTable";
import { COMPOUND_MOVE_TABLE } from "../combat/compoundMoveTable";

const BASE_STRIKE_CLIP: Record<BaseAttackMoveId, string | undefined> = {
  atk_lp: "Strike_LeftPunch",
  atk_rp: "Strike_RightPunch",
  atk_lk: "Strike_LeftKick",
  atk_rk: "Strike_RightKick",
};

export function strikePresentationClipName(moveId: StrikeMoveId): string | undefined {
  if (
    moveId === "atk_lp" ||
    moveId === "atk_rp" ||
    moveId === "atk_lk" ||
    moveId === "atk_rk"
  ) {
    return BASE_STRIKE_CLIP[moveId];
  }
  return COMPOUND_MOVE_TABLE[moveId].suggestedAnimClipName;
}
