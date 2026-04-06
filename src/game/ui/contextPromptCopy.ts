/**
 * WS-102 / GP §9.1.2 — screen copy for `attachContextPromptHud` (bindings from `dojoSignCopy`).
 */

import type { ContextPromptHudState } from "./attachContextPromptHud";
import type { ContextPromptVariant } from "./contextPromptResolve";
import {
  CONTEXT_HUD_KEY_LABELS,
  DOJO_SIGN_INTERACT_KEY_LABEL,
} from "../level/dojoSignCopy";

export function contextPromptSignRead(interactKey = DOJO_SIGN_INTERACT_KEY_LABEL): {
  kind: "key";
  keyLabel: string;
  body: string;
} {
  return {
    kind: "key",
    keyLabel: interactKey,
    body: "Read sign",
  };
}

export function contextPromptStaminaRecover(): { kind: "text"; body: string } {
  return {
    kind: "text",
    body: "Stamina recovering — wait for the bar, then strike again.",
  };
}

export function contextPromptGuardHint(
  keys: Pick<
    typeof CONTEXT_HUD_KEY_LABELS,
    "shift" | "leftPunch" | "rightPunch"
  > = CONTEXT_HUD_KEY_LABELS,
): { kind: "text"; body: string } {
  return {
    kind: "text",
    body: `Hold ${keys.shift} + ${keys.leftPunch} / ${keys.rightPunch} — guard`,
  };
}

export function contextPromptHudStateForVariant(
  variant: ContextPromptVariant,
): ContextPromptHudState {
  switch (variant) {
    case "hidden":
      return { visible: false };
    case "sign_read": {
      const c = contextPromptSignRead();
      return {
        visible: true,
        kind: "key",
        keyLabel: c.keyLabel,
        body: c.body,
      };
    }
    case "stamina_recover": {
      const c = contextPromptStaminaRecover();
      return { visible: true, kind: "text", body: c.body };
    }
    case "guard_hint": {
      const c = contextPromptGuardHint();
      return { visible: true, kind: "text", body: c.body };
    }
    default: {
      const _exhaustive: never = variant;
      return _exhaustive;
    }
  }
}
