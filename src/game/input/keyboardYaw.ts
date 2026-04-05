import * as THREE from "three";

/**
 * WS-032 / GP §3.1.4 — **keyboard-only** turn: hold **Q** / **E** to change **shared facing yaw**
 * (player body + follow camera orbit). See `docs/REPO_CONVENTIONS.md` (prototype input).
 */
export const KEYBOARD_YAW = {
  /** Hold-to-spin rate (degrees per second). Tune in playtests (GP §3.4.1). */
  yawDegPerSec: 95,
  /** `KeyboardEvent.code` — layout-stable. */
  yawLeft: "KeyQ",
  yawRight: "KeyE",
} as const;

export type KeyboardYawInput = {
  /** Add to accumulated camera yaw (radians) each `update` tick. */
  consumeYawDeltaRad: (dtSeconds: number) => number;
  dispose: () => void;
};

/**
 * Tracks held keys; **clears** on window blur / document hidden so Tab-out does not
 * leave a stuck spin (gameplay programmer — focus / repeat / Tab out).
 */
export function attachKeyboardYaw(target: Window = window): KeyboardYawInput {
  const held = new Set<string>();

  const onKeyDown = (e: KeyboardEvent): void => {
    if (e.code === KEYBOARD_YAW.yawLeft || e.code === KEYBOARD_YAW.yawRight) {
      held.add(e.code);
    }
  };

  const onKeyUp = (e: KeyboardEvent): void => {
    held.delete(e.code);
  };

  const clearHeld = (): void => {
    held.clear();
  };

  const onVisibilityChange = (): void => {
    if (target.document.visibilityState === "hidden") clearHeld();
  };

  target.addEventListener("keydown", onKeyDown);
  target.addEventListener("keyup", onKeyUp);
  target.addEventListener("blur", clearHeld);
  target.document.addEventListener("visibilitychange", onVisibilityChange);

  const radPerSec = THREE.MathUtils.degToRad(KEYBOARD_YAW.yawDegPerSec);

  return {
    consumeYawDeltaRad(dtSeconds: number): number {
      if (dtSeconds <= 0) return 0;
      let sign = 0;
      if (held.has(KEYBOARD_YAW.yawLeft)) sign -= 1;
      if (held.has(KEYBOARD_YAW.yawRight)) sign += 1;
      // Negative: matches “Q = left, E = right” with our +Y quaternion + follow cam math.
      return -sign * radPerSec * dtSeconds;
    },
    dispose(): void {
      target.removeEventListener("keydown", onKeyDown);
      target.removeEventListener("keyup", onKeyUp);
      target.removeEventListener("blur", clearHeld);
      target.document.removeEventListener("visibilitychange", onVisibilityChange);
      held.clear();
    },
  };
}
