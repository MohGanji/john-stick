/**
 * WS-111 / GP §9.3.3 — Esc pause overlay: help text (live bindings), resume, restart, next level.
 * Register **after** `attachSignReadModal` so sign Escape handling runs first in capture phase.
 */

import { pauseHelpSections } from "../level/dojoSignCopy";

export type PauseMenuLevelActions = {
  onRestart: () => void;
  onNextLevel: () => void;
  /** When false, Next is disabled (stub until more `LEVEL_ORDER` entries exist). */
  nextLevelAvailable: boolean;
  /** Shown near the Next control when `nextLevelAvailable` is false. */
  nextLevelStubHint: string;
};

export type PauseMenuModal = {
  isOpen: () => boolean;
  dispose: () => void;
};

export function attachPauseMenuModal(
  root: HTMLElement,
  opts: {
    onOpenChange: (open: boolean) => void;
    levelActions: PauseMenuLevelActions;
  },
): PauseMenuModal {
  const backdrop = document.createElement("div");
  backdrop.setAttribute("data-ui", "pause-menu");
  backdrop.setAttribute("role", "presentation");
  backdrop.style.cssText = [
    "position:fixed",
    "inset:0",
    "z-index:110",
    "display:none",
    "align-items:center",
    "justify-content:center",
    "padding:24px",
    "box-sizing:border-box",
    "background:rgba(4,6,12,0.82)",
    "backdrop-filter:blur(3px)",
  ].join(";");

  const panel = document.createElement("div");
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "true");
  panel.setAttribute("aria-label", "Paused — help and level actions");
  panel.style.cssText = [
    "max-width:min(560px,94vw)",
    "max-height:min(86vh,720px)",
    "overflow:auto",
    "padding:26px 30px 20px",
    "box-sizing:border-box",
    "border-radius:4px",
    "border:2px solid rgba(120,150,190,0.55)",
    "box-shadow:0 12px 40px rgba(0,0,0,0.55),inset 0 1px 0 rgba(255,255,255,0.05)",
    "background:linear-gradient(168deg,rgba(20,24,32,0.98) 0%,rgba(12,14,20,0.99) 100%)",
    "color:#e4eaf2",
    "font-family:system-ui,Segoe UI,sans-serif",
  ].join(";");

  const titleEl = document.createElement("h2");
  titleEl.style.cssText = [
    "margin:0 0 14px",
    "font-size:clamp(18px,2.8vw,22px)",
    "font-weight:650",
    "letter-spacing:0.04em",
    "text-align:center",
    "color:#9ec8ff",
  ].join(";");
  titleEl.textContent = "Paused";

  const helpScroll = document.createElement("div");
  helpScroll.style.cssText = [
    "max-height:min(42vh,360px)",
    "overflow:auto",
    "margin-bottom:16px",
    "padding-right:6px",
    "border-bottom:1px solid rgba(120,150,190,0.2)",
  ].join(";");

  const actionsRow = document.createElement("div");
  actionsRow.style.cssText = [
    "display:flex",
    "flex-wrap:wrap",
    "gap:10px",
    "justify-content:center",
    "margin-bottom:12px",
  ].join(";");

  const mkBtn = (label: string): HTMLButtonElement => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = label;
    b.style.cssText = [
      "font:inherit",
      "font-size:14px",
      "font-weight:600",
      "padding:10px 16px",
      "border-radius:4px",
      "border:1px solid rgba(160,190,230,0.45)",
      "background:rgba(40,52,72,0.95)",
      "color:#e8f0ff",
      "cursor:pointer",
    ].join(";");
    b.addEventListener("mouseenter", () => {
      if (!b.disabled) b.style.background = "rgba(56,72,96,0.98)";
    });
    b.addEventListener("mouseleave", () => {
      if (!b.disabled) b.style.background = "rgba(40,52,72,0.95)";
    });
    return b;
  };

  const btnResume = mkBtn("Resume");
  const btnRestart = mkBtn("Restart level");
  const btnNext = mkBtn("Next level");

  const stubStatus = document.createElement("div");
  stubStatus.setAttribute("role", "status");
  stubStatus.setAttribute("aria-live", "polite");
  stubStatus.style.cssText = [
    "min-height:1.2em",
    "text-align:center",
    "font-size:13px",
    "color:rgba(200,210,225,0.75)",
    "margin-bottom:10px",
  ].join(";");

  const footer = document.createElement("div");
  footer.style.cssText = [
    "font-size:12px",
    "letter-spacing:0.03em",
    "text-align:center",
    "color:rgba(200,210,225,0.5)",
    "padding-top:8px",
    "border-top:1px solid rgba(120,150,190,0.22)",
  ].join(";");
  footer.textContent = "Press Esc to close this menu";

  actionsRow.appendChild(btnResume);
  actionsRow.appendChild(btnRestart);
  actionsRow.appendChild(btnNext);

  panel.appendChild(titleEl);
  panel.appendChild(helpScroll);
  panel.appendChild(actionsRow);
  panel.appendChild(stubStatus);
  panel.appendChild(footer);
  backdrop.appendChild(panel);
  root.appendChild(backdrop);

  let visible = false;

  function setNextDisabledState(): void {
    const avail = opts.levelActions.nextLevelAvailable;
    btnNext.disabled = !avail;
    btnNext.style.opacity = avail ? "1" : "0.45";
    btnNext.style.cursor = avail ? "pointer" : "not-allowed";
    stubStatus.textContent = avail ? "" : opts.levelActions.nextLevelStubHint;
  }

  function rebuildHelpBody(): void {
    helpScroll.replaceChildren();
    for (const section of pauseHelpSections()) {
      const h = document.createElement("h3");
      h.style.cssText = [
        "margin:14px 0 8px",
        "font-size:15px",
        "font-weight:650",
        "letter-spacing:0.06em",
        "text-transform:uppercase",
        "color:#b8d4ff",
      ].join(";");
      h.textContent = section.title;
      helpScroll.appendChild(h);
      for (const line of section.lines) {
        const p = document.createElement("p");
        p.textContent = line;
        p.style.cssText = "margin:0.35em 0;font-size:clamp(14px,2vw,16px);line-height:1.5;";
        helpScroll.appendChild(p);
      }
    }
  }

  function showModal(): void {
    rebuildHelpBody();
    setNextDisabledState();
    backdrop.style.display = "flex";
    visible = true;
    opts.onOpenChange(true);
    queueMicrotask(() => btnResume.focus());
  }

  function hideModal(): void {
    backdrop.style.display = "none";
    visible = false;
    opts.onOpenChange(false);
  }

  function toggleFromEsc(): void {
    if (visible) {
      hideModal();
    } else {
      showModal();
    }
  }

  btnResume.addEventListener("click", () => hideModal());
  btnRestart.addEventListener("click", () => opts.levelActions.onRestart());
  btnNext.addEventListener("click", () => {
    if (!opts.levelActions.nextLevelAvailable) return;
    opts.levelActions.onNextLevel();
  });

  backdrop.addEventListener("click", (e) => {
    if (!visible || e.target !== backdrop) return;
    hideModal();
  });

  const onKeyDownCapture = (e: KeyboardEvent): void => {
    if (e.code !== "Escape" || e.repeat) return;
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement
    ) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    toggleFromEsc();
  };

  window.addEventListener("keydown", onKeyDownCapture, true);

  return {
    isOpen: () => visible,
    dispose(): void {
      window.removeEventListener("keydown", onKeyDownCapture, true);
      backdrop.remove();
    },
  };
}
