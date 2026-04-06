/**
 * WS-081 — queue a **strike** (base, chord, or sequence) for the sphere sweep + cooldown pipeline.
 *
 * - **Base:** rising edge on the held limb when WS-051 priority is `attack_base` (WS-080).
 * - **Chord:** first frame entering `attack_hold_chord` from any other priority (simultaneous
 *   holds or second limb added).
 * - **Sequence:** any frame WS-051 emits `attack_sequence` (second limb edge within chain window).
 */
import type { ActionMapSnapshot } from "./actionMap";
import { baseStrikePressIntent } from "./baseStrikeInput";
import type { ResolvedCombatIntent, StrikeMoveId } from "./combatIntent";

export type StrikePressIntentOptions = {
  pauseMenuOpen?: boolean;
};

export function strikePressIntent(
  prev: ActionMapSnapshot,
  curr: ActionMapSnapshot,
  intent: ResolvedCombatIntent,
  prevIntent: ResolvedCombatIntent,
  options?: StrikePressIntentOptions,
): StrikeMoveId | null {
  if (options?.pauseMenuOpen || curr.interactModeOpen || curr.shiftHeld) {
    return null;
  }

  const base = baseStrikePressIntent(prev, curr, intent);
  if (base !== null) return base;

  if (intent.priority === "attack_hold_chord") {
    if (prevIntent.priority === "attack_hold_chord") return null;
    return intent.attackMoveId as StrikeMoveId;
  }

  if (intent.priority === "attack_sequence") {
    return intent.attackMoveId as StrikeMoveId;
  }

  return null;
}
