/**
 * WS-102 / GP §9.1.2 — bottom-center **context prompts**: interact, stamina block; optional guard copy (off in bootstrap).
 * Bindings use caller-supplied labels (same source as signs / `dojoSignCopy`).
 */

export type ContextPromptHudState =
  | { visible: false }
  | { visible: true; kind: "key"; keyLabel: string; body: string }
  | { visible: true; kind: "text"; body: string };

export type ContextPromptHud = {
  setState(state: ContextPromptHudState): void;
  dispose(): void;
};

export function attachContextPromptHud(root: HTMLElement): ContextPromptHud {
  const wrap = document.createElement("div");
  wrap.setAttribute("data-ui", "context-prompt");
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
    "max-width:min(92vw,520px)",
  ].join(";");

  const keyBadge = document.createElement("kbd");
  keyBadge.style.cssText = [
    "display:none",
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

  const body = document.createElement("span");
  body.style.cssText = [
    "font-size:16px",
    "font-weight:500",
    "line-height:1.35",
    "color:rgba(230,236,255,0.92)",
    "text-align:left",
  ].join(";");

  wrap.appendChild(keyBadge);
  wrap.appendChild(body);
  root.appendChild(wrap);

  return {
    setState(state: ContextPromptHudState): void {
      if (!state.visible) {
        wrap.style.display = "none";
        return;
      }
      wrap.style.display = "flex";
      if (state.kind === "key") {
        keyBadge.style.display = "inline-flex";
        keyBadge.textContent = state.keyLabel;
        body.textContent = state.body;
      } else {
        keyBadge.style.display = "none";
        body.textContent = state.body;
      }
    },
    dispose(): void {
      wrap.remove();
    },
  };
}
