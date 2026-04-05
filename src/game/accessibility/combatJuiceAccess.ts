/**
 * WS-071 / GP §6.3.1 — accessibility hooks for combat hit-stop and camera punch.
 *
 * Defaults follow `prefers-reduced-motion: reduce` when no explicit storage override.
 * Optional localStorage (string `"0"` / `"1"`):
 * - `johnStick.a11y.combatHitStop`
 * - `johnStick.a11y.combatCameraEffects`
 */
export const COMBAT_JUICE_STORAGE_HIT_STOP = "johnStick.a11y.combatHitStop";
export const COMBAT_JUICE_STORAGE_CAMERA = "johnStick.a11y.combatCameraEffects";

export type CombatJuiceAccess = {
  hitStopEnabled: boolean;
  cameraEffectsEnabled: boolean;
};

function parseOverride(stored: string | null): boolean | undefined {
  if (stored === "1" || stored === "true") return true;
  if (stored === "0" || stored === "false") return false;
  return undefined;
}

/** Read flags for the current mount (call each frame if you add storage listeners later). */
export function getCombatJuiceAccess(win: Window): CombatJuiceAccess {
  const prefersReduce =
    win.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  const hitStopOverride = parseOverride(
    win.localStorage.getItem(COMBAT_JUICE_STORAGE_HIT_STOP),
  );
  const cameraOverride = parseOverride(
    win.localStorage.getItem(COMBAT_JUICE_STORAGE_CAMERA),
  );
  return {
    hitStopEnabled: hitStopOverride ?? !prefersReduce,
    cameraEffectsEnabled: cameraOverride ?? !prefersReduce,
  };
}
