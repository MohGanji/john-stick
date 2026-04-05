import type { ActionMapSnapshot } from "../input/actionMap";

/** True on the frame **U** becomes an attack (not Shift, not interact). WS-060 / GP §3.2.1. */
export function leftPunchAttackPressEdge(
  prev: ActionMapSnapshot,
  curr: ActionMapSnapshot,
): boolean {
  if (curr.interactModeOpen || curr.shiftHeld) return false;
  return !prev.attackLeftPunch && curr.attackLeftPunch;
}
