/**
 * Player-facing stamina bar (strike budget). Pointer-events none so it never blocks gameplay.
 */
export function attachStaminaHud(root: HTMLElement): {
  setFillRatio(ratio01: number): void;
  dispose(): void;
} {
  const wrap = document.createElement("div");
  wrap.setAttribute("data-ui", "stamina-hud");
  wrap.style.cssText = [
    "position:fixed",
    "left:16px",
    "bottom:22px",
    "width:min(220px,42vw)",
    "z-index:15",
    "pointer-events:none",
    "font-family:system-ui,Segoe UI,sans-serif",
  ].join(";");

  const label = document.createElement("div");
  label.textContent = "Stamina";
  label.style.cssText = [
    "font-size:10px",
    "letter-spacing:0.14em",
    "text-transform:uppercase",
    "color:rgba(230,238,255,0.5)",
    "margin-bottom:5px",
  ].join(";");

  const track = document.createElement("div");
  track.style.cssText = [
    "height:9px",
    "border-radius:5px",
    "background:rgba(18,24,40,0.92)",
    "border:1px solid rgba(110,130,190,0.4)",
    "overflow:hidden",
    "box-shadow:inset 0 1px 2px rgba(0,0,0,0.35)",
  ].join(";");

  const fill = document.createElement("div");
  fill.style.cssText = [
    "height:100%",
    "width:100%",
    "transform-origin:left center",
    "transform:scaleX(1)",
    "background:linear-gradient(90deg,#4f8dff,#9ae8ff)",
    "will-change:transform",
  ].join(";");

  track.appendChild(fill);
  wrap.appendChild(label);
  wrap.appendChild(track);
  root.appendChild(wrap);

  return {
    setFillRatio(ratio01: number) {
      const t = Math.max(0, Math.min(1, ratio01));
      fill.style.transform = `scaleX(${t})`;
    },
    dispose() {
      wrap.remove();
    },
  };
}
