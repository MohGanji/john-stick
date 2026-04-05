import type { ActionMapSnapshot } from "./actionMap";
import type { ResolvedCombatIntent } from "./combatIntent";

/**
 * Dev-only overlay: proves **U I J K** + Shift + Enter are sampled (WS-050)
 * and shows WS-051 resolved combat intent (priority + move id).
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
    "z-index:100000",
    "text-align:left",
    "white-space:pre",
  ].join(";");

  const dot = (on: boolean): string => (on ? "●" : "·");

  function format(s: ActionMapSnapshot, c: ResolvedCombatIntent): string {
    const { limb, shiftHeld } = s;
    return [
      "input debug (dev) — use keyboard, not mouse",
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
      const { snapshot, combat } = getFrame();
      el.textContent = format(snapshot, combat);
    },
    dispose(): void {
      el.remove();
    },
  };
}
