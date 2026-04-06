/**
 * WS-102 / GP §9.1.2 — pure priority for one context prompt at a time.
 */

export type ContextPromptVariant =
  | "hidden"
  | "sign_read"
  | "stamina_recover"
  | "guard_hint";

export type ResolveContextPromptInput = {
  simulationPaused: boolean;
  signInRangeAndFacing: boolean;
  staminaBlockedStrike: boolean;
  guardHintActive: boolean;
};

export function resolveContextPromptVariant(
  input: ResolveContextPromptInput,
): ContextPromptVariant {
  if (input.simulationPaused) return "hidden";
  if (input.signInRangeAndFacing) return "sign_read";
  if (input.staminaBlockedStrike) return "stamina_recover";
  if (input.guardHintActive) return "guard_hint";
  return "hidden";
}
