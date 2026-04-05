import type { ActionMapSnapshot } from "./actionMap";
import type { ResolvedCombatIntent } from "./combatIntent";

const INPUT_DEBUG_TOGGLE_CODE = "Comma";

/**
 * Dev-only overlay: proves **U I J K** + Shift + Enter are sampled (WS-050)
 * and shows WS-051 resolved combat intent (priority + move id).
 * Hidden until **Comma** (same toggle pattern as gameplay tuning on **Period**).
 * Stripped in production builds (`import.meta.env.PROD`).
 */
export function attachActionMapDebugHud(
  container: HTMLElement,
  getFrame: () => {
    snapshot: ActionMapSnapshot;
    combat: ResolvedCombatIntent;
  },
): { refresh: () => void; dispose: () => void } {
  const el = document.createElement("pre");
  el.setAttribute("aria-hidden", "true");
  let visible = false;
  el.style.cssText = [
    "position:fixed",
    "bottom:10px",
    "left:10px",
    "margin:0",
    "padding:10px 12px",
    "font:11px/1.35 ui-monospace,monospace",
    "color:#dbe7ff",
    "background:rgba(8,10,18,0.82)",
    "border:1px solid rgba(120,140,200,0.35)",
    "border-radius:6px",
    "pointer-events:none",
    "z-index:20",
    "text-align:left",
    "white-space:pre",
    "display:none",
  ].join(";");

  function applyVisibility(): void {
    el.style.display = visible ? "block" : "none";
  }

  const onKeyDown = (e: KeyboardEvent): void => {
    if (e.code !== INPUT_DEBUG_TOGGLE_CODE || e.repeat) return;
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement ||
      e.target instanceof HTMLSelectElement
    ) {
      return;
    }
    e.preventDefault();
    visible = !visible;
    applyVisibility();
    if (visible) {
      const { snapshot, combat } = getFrame();
      el.textContent = format(snapshot, combat);
    }
  };

  window.addEventListener("keydown", onKeyDown, true);

  const dot = (on: boolean): string => (on ? "●" : "·");

  function format(s: ActionMapSnapshot, c: ResolvedCombatIntent): string {
    const { limb, shiftHeld } = s;
    return [
      "input debug (dev) — use keyboard, not mouse",
      ", (comma) — hide/show this panel",
      ". (period) — gameplay tuning panel",
      "U/I punch  J/K kick  Shift+… guard/dock  Enter interact",
      "",
      `Shift ${dot(shiftHeld)}   U ${dot(limb.leftPunch)}   I ${dot(
        limb.rightPunch,
      )}   J ${dot(limb.leftKick)}   K ${dot(limb.rightKick)}`,
      `atk  lp${dot(s.attackLeftPunch)} rp${dot(s.attackRightPunch)} lk${dot(
        s.attackLeftKick,
      )} rk${dot(s.attackRightKick)}`,
      `grd  L${dot(s.guardLeft)} R${dot(s.guardRight)}   dock L${dot(
        s.dockLeft,
      )} R${dot(s.dockRight)}`,
      `interact ${s.interactModeOpen ? "ON (move frozen)" : "off"}`,
      "",
      `intent ${c.priority}  move ${c.attackMoveId}`,
      `eff grd L${dot(c.guardLeft)} R${dot(c.guardRight)} dock L${dot(
        c.dockLeft,
      )} R${dot(c.dockRight)}`,
    ].join("\n");
  }

  container.appendChild(el);

  return {
    refresh(): void {
      if (!visible) return;
      const { snapshot, combat } = getFrame();
      el.textContent = format(snapshot, combat);
    },
    dispose(): void {
      window.removeEventListener("keydown", onKeyDown, true);
      el.remove();
    },
  };
}
