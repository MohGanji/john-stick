/**
 * WS-101 / GP §2.4.2, §7.1.3 — diegetic sign copy; labels follow live `KeyboardEvent.code` bindings
 * (`actionMap`, `keyboardLocomotion`) so Pause → Help can stay aligned (WS-111).
 */
import { KEY_ACTION_MAP } from "../input/actionMap";
import { KEYBOARD_LOCOMOTION } from "../input/keyboardLocomotion";
import { INPUT_COMBAT } from "../input/inputCombatConstants";

function codeToDisplayLabel(code: string): string {
  if (code === "Space") return "Space";
  if (code === "Enter") return "Enter";
  if (code.startsWith("Key")) return code.slice(3);
  if (code === "ShiftLeft" || code === "ShiftRight") return "Shift";
  return code;
}

const forwardKey = codeToDisplayLabel(KEYBOARD_LOCOMOTION.forward[0]);
const backKey = codeToDisplayLabel(KEYBOARD_LOCOMOTION.back[0]);
const leftKey = codeToDisplayLabel(KEYBOARD_LOCOMOTION.left[0]);
const rightKey = codeToDisplayLabel(KEYBOARD_LOCOMOTION.right[0]);
const jumpKey = codeToDisplayLabel(KEYBOARD_LOCOMOTION.jump);
const interactKey = codeToDisplayLabel(KEY_ACTION_MAP.interactToggle);

/** For UI hints (sign modal footer, future pause help). */
export const DOJO_SIGN_INTERACT_KEY_LABEL = interactKey;

/** WS-102 — HUD context prompts use the same live labels as signs (GP §3.4.2). */
export const CONTEXT_HUD_KEY_LABELS = {
  shift: codeToDisplayLabel(KEY_ACTION_MAP.shift[0]),
  leftPunch: codeToDisplayLabel(KEY_ACTION_MAP.leftPunch),
  rightPunch: codeToDisplayLabel(KEY_ACTION_MAP.rightPunch),
  leftKick: codeToDisplayLabel(KEY_ACTION_MAP.leftKick),
  rightKick: codeToDisplayLabel(KEY_ACTION_MAP.rightKick),
} as const;

const lp = codeToDisplayLabel(KEY_ACTION_MAP.leftPunch);
const rp = codeToDisplayLabel(KEY_ACTION_MAP.rightPunch);
const lk = codeToDisplayLabel(KEY_ACTION_MAP.leftKick);
const rk = codeToDisplayLabel(KEY_ACTION_MAP.rightKick);

export const DOJO_SIGN_TITLE_MOVEMENT = "TRAINING HALL — MOVEMENT";
export const DOJO_SIGN_TITLE_COMBAT = "STRIKES AND DEFENSE";

/** Lines for canvas texture (no title — title drawn larger separately). */
export function dojoSignMovementBodyLines(): string[] {
  return [
    `${forwardKey} — step forward    ${backKey} — step back`,
    `${leftKey} / ${rightKey} — strafe; hold either to turn your stance`,
    `${jumpKey} — jump`,
    `Stand near a sign and press ${interactKey} to read the training notice.`,
  ];
}

export function dojoSignCombatBodyLines(): string[] {
  const chainSec = INPUT_COMBAT.sequenceChainSec;
  return [
    `${lp} — left punch     ${rp} — right punch`,
    `${lk} — left kick      ${rk} — right kick`,
    `Shift + punches — guard (hold)`,
    `Shift + kicks — dock step (hold)`,
    `Hold two or more strike keys together (no Shift) for a chord.`,
    `Tap two different strikes within ${chainSec.toFixed(2)}s for a chain.`,
    `Try: ${lp} then ${rp}, or hold ${lp} + ${rp}.`,
  ];
}

/**
 * WS-111 / GP §9.3.3 — pause / help uses the **same** live-bound strings as the dojo signs
 * (movement kiosk → combat kiosk), so §3.4.2 stays aligned when defaults change.
 */
export function pauseHelpSections(): { title: string; lines: string[] }[] {
  return [
    { title: DOJO_SIGN_TITLE_MOVEMENT, lines: dojoSignMovementBodyLines() },
    { title: DOJO_SIGN_TITLE_COMBAT, lines: dojoSignCombatBodyLines() },
  ];
}

/** Kiosk order matches `DOJO_SIGN_KIOSK_SPECS` (0 = movement, 1 = combat). */
export function getDojoSignReadContent(
  kioskIndex: number,
): { title: string; lines: string[] } | null {
  if (kioskIndex === 0) {
    return {
      title: DOJO_SIGN_TITLE_MOVEMENT,
      lines: dojoSignMovementBodyLines(),
    };
  }
  if (kioskIndex === 1) {
    return {
      title: DOJO_SIGN_TITLE_COMBAT,
      lines: dojoSignCombatBodyLines(),
    };
  }
  return null;
}
