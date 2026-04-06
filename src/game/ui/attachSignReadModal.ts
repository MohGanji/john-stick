/**
 * Skyrim-style centered “read sign” overlay: dimmed world, framed text, keyboard dismiss.
 * Shown when `interactModeOpen` (WS-050 / WS-101); simulation pause is handled in `gameLoop` scale.
 */

export type SignReadModalContent = {
  title: string;
  lines: string[];
};

export type SignReadModal = {
  show(content: SignReadModalContent): void;
  hide(): void;
  dispose(): void;
};

export function attachSignReadModal(
  root: HTMLElement,
  opts: {
    dismissHintLine: string;
    onRequestClose: () => void;
  },
): SignReadModal {
  const backdrop = document.createElement("div");
  backdrop.setAttribute("data-ui", "sign-read-modal");
  backdrop.setAttribute("role", "presentation");
  backdrop.style.cssText = [
    "position:fixed",
    "inset:0",
    "z-index:100",
    "display:none",
    "align-items:center",
    "justify-content:center",
    "padding:24px",
    "box-sizing:border-box",
    "background:rgba(6,8,14,0.78)",
    "backdrop-filter:blur(2px)",
  ].join(";");

  const panel = document.createElement("div");
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "true");
  panel.style.cssText = [
    "max-width:min(520px,92vw)",
    "max-height:min(78vh,640px)",
    "overflow:auto",
    "padding:28px 32px 22px",
    "box-sizing:border-box",
    "border-radius:4px",
    "border:2px solid rgba(198,168,98,0.85)",
    "box-shadow:0 12px 40px rgba(0,0,0,0.55),inset 0 1px 0 rgba(255,255,255,0.06)",
    "background:linear-gradient(165deg,rgba(36,30,24,0.98) 0%,rgba(22,18,14,0.99) 100%)",
    "color:#e8dcc8",
    "font-family:Georgia,'Times New Roman',serif",
  ].join(";");

  const titleEl = document.createElement("h2");
  titleEl.style.cssText = [
    "margin:0 0 18px",
    "font-size:clamp(17px,2.6vw,22px)",
    "font-weight:600",
    "letter-spacing:0.06em",
    "text-align:center",
    "text-transform:uppercase",
    "color:#d4b060",
    "text-shadow:0 1px 2px rgba(0,0,0,0.45)",
  ].join(";");

  const body = document.createElement("div");
  body.style.cssText = [
    "font-size:clamp(14px,2.1vw,17px)",
    "line-height:1.55",
    "margin-bottom:20px",
  ].join(";");

  const footer = document.createElement("div");
  footer.style.cssText = [
    "font-size:12px",
    "letter-spacing:0.04em",
    "text-align:center",
    "color:rgba(232,220,200,0.55)",
    "font-family:system-ui,Segoe UI,sans-serif",
    "padding-top:8px",
    "border-top:1px solid rgba(198,168,98,0.25)",
  ].join(";");

  footer.textContent = opts.dismissHintLine;

  panel.appendChild(titleEl);
  panel.appendChild(body);
  panel.appendChild(footer);
  backdrop.appendChild(panel);
  root.appendChild(backdrop);

  let visible = false;

  function hideModal(): void {
    backdrop.style.display = "none";
    visible = false;
    panel.removeAttribute("aria-labelledby");
    titleEl.removeAttribute("id");
  }

  const onKeyDownCapture = (e: KeyboardEvent): void => {
    if (!visible) return;
    if (e.code !== "Escape" || e.repeat) return;
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement
    ) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    opts.onRequestClose();
    hideModal();
  };

  backdrop.addEventListener("click", (e) => {
    if (!visible || e.target !== backdrop) return;
    opts.onRequestClose();
    hideModal();
  });

  window.addEventListener("keydown", onKeyDownCapture, true);

  function setBodyLines(lines: string[]): void {
    body.replaceChildren();
    for (const line of lines) {
      const p = document.createElement("p");
      p.textContent = line;
      p.style.margin = "0.42em 0";
      body.appendChild(p);
    }
  }

  return {
    show(content: SignReadModalContent): void {
      titleEl.textContent = content.title;
      setBodyLines(content.lines);
      backdrop.style.display = "flex";
      visible = true;
      titleEl.id = "john-stick-sign-read-title";
      panel.setAttribute("aria-labelledby", "john-stick-sign-read-title");
    },
    hide(): void {
      hideModal();
    },
    dispose(): void {
      window.removeEventListener("keydown", onKeyDownCapture, true);
      backdrop.remove();
    },
  };
}
