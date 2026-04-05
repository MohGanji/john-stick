/**
 * WS-080 / GP §2.2.1 — start a **base** limb strike only when WS-051 intent is `attack_base` for that `MoveId`.
 * Prevents queuing e.g. left punch when simultaneous limb holds resolve to a chord.
 */
import type { BaseAttackMoveId } from "../combat/baseMoveTable";
import type { ActionMapSnapshot, LimbId } from "./actionMap";
import type { ResolvedCombatIntent } from "./combatIntent";

function limbPressAttackEdge(
  prev: ActionMapSnapshot,
  curr: ActionMapSnapshot,
  limb: LimbId,
): boolean {
  switch (limb) {
    case "leftPunch":
      return !prev.attackLeftPunch && curr.attackLeftPunch;
    case "rightPunch":
      return !prev.attackRightPunch && curr.attackRightPunch;
    case "leftKick":
      return !prev.attackLeftKick && curr.attackLeftKick;
    case "rightKick":
      return !prev.attackRightKick && curr.attackRightKick;
    default: {
      const _exhaustive: never = limb;
      return _exhaustive;
    }
  }
}

function limbForBaseMove(moveId: BaseAttackMoveId): LimbId {
  switch (moveId) {
    case "atk_lp":
      return "leftPunch";
    case "atk_rp":
      return "rightPunch";
    case "atk_lk":
      return "leftKick";
    case "atk_rk":
      return "rightKick";
    default: {
      const _exhaustive: never = moveId;
      return _exhaustive;
    }
  }
}

/**
 * If this frame should queue a base strike, returns the `MoveId` row to run; otherwise `null`.
 */
export function baseStrikePressIntent(
  prev: ActionMapSnapshot,
  curr: ActionMapSnapshot,
  intent: ResolvedCombatIntent,
): BaseAttackMoveId | null {
  if (curr.interactModeOpen || curr.shiftHeld) return null;
  if (intent.priority !== "attack_base") return null;

  const id = intent.attackMoveId;
  if (id !== "atk_lp" && id !== "atk_rp" && id !== "atk_lk" && id !== "atk_rk") {
    return null;
  }

  const limb = limbForBaseMove(id);
  if (!limbPressAttackEdge(prev, curr, limb)) return null;

  return id;
}
