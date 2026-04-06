/**
 * Lightweight “press key to interact” hint (WS-102-adjacent onboarding). Shown when the game
 * reports the prompt should be visible; hidden during any global pause (`gamePause`).
 */

export type InteractPromptHud = {
  setVisible(visible: boolean): void;
  dispose(): void;
};

export function attachInteractPromptHud(
  root: HTMLElement,
  opts: {
    keyLabel: string;
    actionLabel: string;
  },
): InteractPromptHud {
  const wrap = document.createElement("div");
  wrap.setAttribute("data-ui", "interact-prompt");
  wrap.setAttribute("role", "status");
  wrap.setAttribute("aria-live", "polite");
  wrap.style.cssText = [
    "position:fixed",
    "left:50%",
    "bottom:18%",
    "transform:translateX(-50%)",
    "z-index:90",
    "display:none",
    "flex-direction:row",
    "align-items:center",
    "gap:12px",
    "padding:10px 18px",
    "border-radius:6px",
    "background:rgba(12,14,22,0.88)",
    "border:1px solid rgba(140,160,220,0.45)",
    "box-shadow:0 6px 24px rgba(0,0,0,0.4)",
    "font-family:system-ui,Segoe UI,sans-serif",
    "pointer-events:none",
  ].join(";");

  const keyBadge = document.createElement("kbd");
  keyBadge.textContent = opts.keyLabel;
  keyBadge.style.cssText = [
    "display:inline-flex",
    "min-width:2.1em",
    "justify-content:center",
    "padding:6px 10px",
    "border-radius:4px",
    "font-size:15px",
    "font-weight:600",
    "letter-spacing:0.04em",
    "color:#e8eeff",
    "background:linear-gradient(180deg,#3a4560,#252a3a)",
    "border:1px solid rgba(200,210,255,0.35)",
    "box-shadow:inset 0 1px 0 rgba(255,255,255,0.12)",
  ].join(";");

  const label = document.createElement("span");
  label.textContent = opts.actionLabel;
  label.style.cssText = [
    "font-size:14px",
    "font-weight:500",
    "color:rgba(230,236,255,0.92)",
    "white-space:nowrap",
  ].join(";");

  wrap.appendChild(keyBadge);
  wrap.appendChild(label);
  root.appendChild(wrap);

  return {
    setVisible(visible: boolean): void {
      wrap.style.display = visible ? "flex" : "none";
    },
    dispose(): void {
      wrap.remove();
    },
  };
}
