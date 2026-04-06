/**
 * WS-050 / GP §3.2.1 — **action map**: four limb keys, **Shift** defensive modifier,
 * **Enter** interact toggle (signs). Sample `snapshot()` each frame; no mouse on this path.
 *
 * **Shift held:** punch keys → **guard** (left/right); kick keys → **dock** to that side.
 * **Shift released:** same keys → **attack** holds for `combatIntent.ts` (WS-051) resolution.
 * **Enter:** edge press toggles **interact mode** open ↔ closed; **open** may be gated by
 * proximity to a sign kiosk (`AttachActionMapOptions.getInteractOpenAllowed`, WS-101).
 *
 * **Layout:** top row **U** / **I** = punches; home row **J** / **K** = kicks (row-based mnemonic).
 */
export const KEY_ACTION_MAP = {
  shift: ["ShiftLeft", "ShiftRight"] as const,
  leftPunch: "KeyU" as const,
  rightPunch: "KeyI" as const,
  leftKick: "KeyJ" as const,
  rightKick: "KeyK" as const,
  interactToggle: "Enter" as const,
} as const;

export type LimbId = "leftPunch" | "rightPunch" | "leftKick" | "rightKick";

export type ActionMapSnapshot = {
  shiftHeld: boolean;
  /** Raw digital holds (`KeyboardEvent.code`). */
  limb: Record<LimbId, boolean>;
  /** Shift + punch — high guard / block per side (hold). */
  guardLeft: boolean;
  guardRight: boolean;
  /** Shift + kick — dock / stance step to that side (hold). */
  dockLeft: boolean;
  dockRight: boolean;
  /** Limb held with Shift **not** down — attacks for interpreter (WS-051). */
  attackLeftPunch: boolean;
  attackRightPunch: boolean;
  attackLeftKick: boolean;
  attackRightKick: boolean;
  /** After last toggle: whether sign / interact UI is considered active. */
  interactModeOpen: boolean;
};

const SHIFT_CODES = new Set<string>(KEY_ACTION_MAP.shift);

function shiftFromHeld(held: ReadonlySet<string>): boolean {
  for (const c of SHIFT_CODES) {
    if (held.has(c)) return true;
  }
  return false;
}

/** Pure: map held key codes → combat-facing flags (no interact state). */
export function computeActionMapFromHeld(
  held: ReadonlySet<string>,
): Omit<ActionMapSnapshot, "interactModeOpen"> {
  const shiftHeld = shiftFromHeld(held);
  const lp = held.has(KEY_ACTION_MAP.leftPunch);
  const rp = held.has(KEY_ACTION_MAP.rightPunch);
  const lk = held.has(KEY_ACTION_MAP.leftKick);
  const rk = held.has(KEY_ACTION_MAP.rightKick);

  return {
    shiftHeld,
    limb: {
      leftPunch: lp,
      rightPunch: rp,
      leftKick: lk,
      rightKick: rk,
    },
    guardLeft: shiftHeld && lp,
    guardRight: shiftHeld && rp,
    dockLeft: shiftHeld && lk,
    dockRight: shiftHeld && rk,
    attackLeftPunch: !shiftHeld && lp,
    attackRightPunch: !shiftHeld && rp,
    attackLeftKick: !shiftHeld && lk,
    attackRightKick: !shiftHeld && rk,
  };
}

export type ActionMapInput = {
  /** Full frame snapshot (includes interact mode). */
  snapshot: () => ActionMapSnapshot;
  /**
   * Edge-detected **Enter** since last poll — toggles internal interact mode when true.
   * Call once per frame from `beforeFixedSteps` (same phase as jump latch).
   */
  takeInteractEnterLatch: () => boolean;
  /** Programmatic close (e.g. Escape on sign-read modal); does not set interact-enter latch. */
  closeInteractMode: () => void;
  dispose: () => void;
};

export type AttachActionMapOptions = {
  /**
   * WS-101 / GP §7.1.3 — when opening interact from **Enter**, require proximity to a sign
   * unless this returns true. Closing interact is always allowed. Omit for “open anywhere” (tests / lab).
   */
  getInteractOpenAllowed?: () => boolean;
};

export function attachActionMap(
  doc: Document = document,
  options?: AttachActionMapOptions,
): ActionMapInput {
  const win = doc.defaultView;
  if (!win) {
    throw new Error("attachActionMap: document has no defaultView");
  }

  const held = new Set<string>();
  let interactModeOpen = false;
  let interactEnterPending = false;

  const trackLimbOrShift = (code: string): boolean => {
    if (SHIFT_CODES.has(code)) return true;
    if (
      code === KEY_ACTION_MAP.leftPunch ||
      code === KEY_ACTION_MAP.rightPunch ||
      code === KEY_ACTION_MAP.leftKick ||
      code === KEY_ACTION_MAP.rightKick
    ) {
      return true;
    }
    return false;
  };

  const onKeyDown = (e: KeyboardEvent): void => {
    if (doc.visibilityState !== "visible") return;

    if (e.code === KEY_ACTION_MAP.interactToggle && !e.repeat) {
      if (interactModeOpen) {
        interactModeOpen = false;
        interactEnterPending = true;
      } else {
        const allow = options?.getInteractOpenAllowed?.() ?? true;
        if (allow) {
          interactModeOpen = true;
          interactEnterPending = true;
        }
      }
    }

    if (trackLimbOrShift(e.code)) {
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
      interactEnterPending = false;
    }
  };

  /** Capture phase on `document` — keys work on cold open without a prior click (WS-223). */
  doc.addEventListener("keydown", onKeyDown, true);
  doc.addEventListener("keyup", onKeyUp, true);
  win.addEventListener("blur", clearHeld);
  doc.addEventListener("visibilitychange", onVisibilityChange);

  return {
    snapshot(): ActionMapSnapshot {
      return {
        ...computeActionMapFromHeld(held),
        interactModeOpen,
      };
    },
    takeInteractEnterLatch(): boolean {
      const v = interactEnterPending;
      interactEnterPending = false;
      return v;
    },
    closeInteractMode(): void {
      if (!interactModeOpen) return;
      interactModeOpen = false;
    },
    dispose(): void {
      doc.removeEventListener("keydown", onKeyDown, true);
      doc.removeEventListener("keyup", onKeyUp, true);
      win.removeEventListener("blur", clearHeld);
      doc.removeEventListener("visibilitychange", onVisibilityChange);
      held.clear();
      interactEnterPending = false;
    },
  };
}
