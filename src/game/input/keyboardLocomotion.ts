import * as THREE from "three";

/**
 * WS-040 — **keyboard-only** move + jump + facing yaw (`KeyboardEvent.code`).
 * **WASD** only for move + **A** and **D** hold-to-yaw (same keys). **Arrows** and **Q** and **E** are not used.
 * Limb / Shift / interact: `actionMap.ts` (WS-050, GP §3.2.1). Clears held keys on blur / hidden document.
 */
export const KEYBOARD_LOCOMOTION = {
  forward: ["KeyW"] as const,
  back: ["KeyS"] as const,
  right: ["KeyD"] as const,
  left: ["KeyA"] as const,
  jump: "Space" as const,
  /**
   * Hold-to-yaw rate for **KeyA** / **KeyD** (degrees per second).
   * Retune with strafe vs turn balance once rig + locomotion clips exist (`docs/FUTURE_MAYBE.md`).
   */
  yawDegPerSec: 170,
} as const;

export type KeyboardLocomotionOptions = {
  /** Live yaw rate (deg/s); default `KEYBOARD_LOCOMOTION.yawDegPerSec`. */
  getYawDegPerSec?: () => number;
};

export type KeyboardLocomotionInput = {
  /** −1..1 forward (−1 = back), −1..1 strafe (−1 = left); normalized diagonals. */
  moveAxes: () => { forward: number; strafe: number };
  /**
   * Facing yaw delta from **KeyA** / **KeyD** (same keys as strafe left/right).
   * Sign matches screen-wise turn with follow cam.
   */
  facingYawDeltaRad: (dtSeconds: number) => number;
  /** Call once per frame from `beforeFixedSteps` — edge-detected Space since last poll. */
  takeJumpLatch: () => boolean;
  dispose: () => void;
};

export function attachKeyboardLocomotion(
  doc: Document = document,
  options?: KeyboardLocomotionOptions,
): KeyboardLocomotionInput {
  const win = doc.defaultView;
  if (!win) {
    throw new Error("attachKeyboardLocomotion: document has no defaultView");
  }

  const held = new Set<string>();
  let jumpPending = false;

  const codesForward = new Set<string>(KEYBOARD_LOCOMOTION.forward);
  const codesBack = new Set<string>(KEYBOARD_LOCOMOTION.back);
  const codesRight = new Set<string>(KEYBOARD_LOCOMOTION.right);
  const codesLeft = new Set<string>(KEYBOARD_LOCOMOTION.left);

  const onKeyDown = (e: KeyboardEvent): void => {
    if (
      e.code === KEYBOARD_LOCOMOTION.jump &&
      !e.repeat &&
      doc.visibilityState === "visible"
    ) {
      jumpPending = true;
    }
    if (
      codesForward.has(e.code) ||
      codesBack.has(e.code) ||
      codesRight.has(e.code) ||
      codesLeft.has(e.code)
    ) {
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
    if (doc.visibilityState === "hidden") {
      clearHeld();
      jumpPending = false;
    }
  };

  /** Capture phase on `document` — keys work on cold open without a prior click (WS-223). */
  doc.addEventListener("keydown", onKeyDown, true);
  doc.addEventListener("keyup", onKeyUp, true);
  win.addEventListener("blur", clearHeld);
  doc.addEventListener("visibilitychange", onVisibilityChange);

  function axisFromSets(
    positiveCodes: Set<string>,
    negativeCodes: Set<string>,
  ): number {
    let v = 0;
    for (const c of positiveCodes) if (held.has(c)) v += 1;
    for (const c of negativeCodes) if (held.has(c)) v -= 1;
    return Math.max(-1, Math.min(1, v));
  }

  const keyYawLeft = KEYBOARD_LOCOMOTION.left[0];
  const keyYawRight = KEYBOARD_LOCOMOTION.right[0];

  function yawRadPerSec(): number {
    const deg =
      options?.getYawDegPerSec?.() ?? KEYBOARD_LOCOMOTION.yawDegPerSec;
    return THREE.MathUtils.degToRad(deg);
  }

  return {
    moveAxes(): { forward: number; strafe: number } {
      const forward = axisFromSets(codesForward, codesBack);
      const strafe = axisFromSets(codesRight, codesLeft);
      return { forward, strafe };
    },
    facingYawDeltaRad(dtSeconds: number): number {
      if (dtSeconds <= 0) return 0;
      let sign = 0;
      if (held.has(keyYawLeft)) sign -= 1;
      if (held.has(keyYawRight)) sign += 1;
      return -sign * yawRadPerSec() * dtSeconds;
    },
    takeJumpLatch(): boolean {
      const j = jumpPending;
      jumpPending = false;
      return j;
    },
    dispose(): void {
      doc.removeEventListener("keydown", onKeyDown, true);
      doc.removeEventListener("keyup", onKeyUp, true);
      win.removeEventListener("blur", clearHeld);
      doc.removeEventListener("visibilitychange", onVisibilityChange);
      held.clear();
      jumpPending = false;
    },
  };
}
