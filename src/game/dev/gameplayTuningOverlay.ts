import type { GameplayRuntimeTuning } from "../tuning/gameplayRuntimeTuning";

const TOGGLE_CODE = "Period";

type SliderSpec<K extends string> = {
  key: K;
  label: string;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
};

function bindSlider(
  root: HTMLElement,
  spec: SliderSpec<string>,
  read: () => number,
  write: (v: number) => void,
  onChange: () => void,
): () => void {
  const wrap = document.createElement("div");
  wrap.style.cssText =
    "display:grid;grid-template-columns:1fr auto;gap:6px 10px;align-items:center;margin:6px 0;font-size:12px;";
  const lab = document.createElement("label");
  lab.style.cssText = "color:#dbe7ff;opacity:0.92;";
  lab.textContent = spec.label;
  const range = document.createElement("input");
  range.type = "range";
  range.min = String(spec.min);
  range.max = String(spec.max);
  range.step = String(spec.step);
  range.style.cssText = "width:110px;max-width:100%;accent-color:#7ab0ff;";
  const val = document.createElement("span");
  val.style.cssText =
    "font-variant-numeric:tabular-nums;color:#a8c7ff;min-width:4.2em;text-align:right;";
  function syncFromModel(): void {
    const v = read();
    range.value = String(v);
    val.textContent = spec.format(v);
  }
  range.addEventListener("input", () => {
    const v = Number(range.value);
    write(v);
    val.textContent = spec.format(v);
    onChange();
  });
  wrap.appendChild(lab);
  wrap.appendChild(range);
  wrap.appendChild(document.createElement("span"));
  wrap.appendChild(val);
  root.appendChild(wrap);
  syncFromModel();
  return syncFromModel;
}

function sectionTitle(text: string): HTMLElement {
  const h = document.createElement("h3");
  h.style.cssText =
    "margin:14px 0 6px 0;font-size:11px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:#8ea3c9;border-bottom:1px solid rgba(120,140,200,0.25);padding-bottom:4px;";
  h.textContent = text;
  return h;
}

function resetRow(
  root: HTMLElement,
  label: string,
  onReset: () => void,
): void {
  const row = document.createElement("div");
  row.style.cssText = "margin-top:8px;";
  const btn = document.createElement("button");
  btn.type = "button";
  btn.textContent = label;
  btn.style.cssText =
    "cursor:pointer;padding:4px 10px;border-radius:5px;border:1px solid rgba(120,140,200,0.45);background:rgba(30,40,70,0.9);color:#dbe7ff;font:11px/1.2 ui-sans-serif,system-ui,sans-serif;";
  btn.addEventListener("click", onReset);
  row.appendChild(btn);
  root.appendChild(row);
}

/**
 * Dev-only panel: **.** toggles visibility. Mutates `tuning` in place; use “Reset …” to restore shipped defaults.
 * Stripped from production (`import.meta.env.PROD` callers should not attach).
 */
export function attachGameplayTuningOverlay(
  container: HTMLElement,
  tuning: GameplayRuntimeTuning,
): { dispose: () => void } {
  const panel = document.createElement("div");
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "Gameplay tuning");
  panel.style.cssText = [
    "position:fixed",
    "top:12px",
    "right:12px",
    "width:min(216px,calc(100vw - 24px))",
    "max-height:min(88vh,calc(100vh - 24px))",
    "overflow:auto",
    "margin:0",
    "padding:12px 14px 16px",
    "font:12px/1.4 ui-sans-serif,system-ui,sans-serif",
    "color:#e8eefc",
    "background:rgba(10,12,22,0.92)",
    "border:1px solid rgba(120,140,200,0.4)",
    "border-radius:10px",
    "box-shadow:0 12px 40px rgba(0,0,0,0.45)",
    "z-index:100001",
    "display:none",
  ].join(";");

  const header = document.createElement("div");
  header.style.cssText =
    "font-weight:600;margin-bottom:10px;color:#fff;font-size:13px;";
  header.textContent = "Gameplay tuning (dev)";
  panel.appendChild(header);
  const hint = document.createElement("p");
  hint.style.cssText = "margin:0 0 12px 0;opacity:0.78;font-size:11px;";
  hint.textContent =
    "Press . (period) to hide. Values apply immediately. Copy numbers you like into defaults when ready.";
  panel.appendChild(hint);

  const body = document.createElement("div");
  panel.appendChild(body);

  const syncSliders: (() => void)[] = [];

  function refreshAllSliders(): void {
    for (const s of syncSliders) s();
  }

  function wireJuice(): void {
    body.appendChild(sectionTitle("Combat juice"));
    const j = tuning.juice;
    syncSliders.push(
      bindSlider(
        body,
        {
          key: "hitStopBaseSec",
          label: "Hit-stop base (ms)",
          min: 0,
          max: 200,
          step: 1,
          format: (v) => `${Math.round(v)} ms`,
        },
        () => j.hitStopBaseSec * 1000,
        (v) => {
          j.hitStopBaseSec = v / 1000;
        },
        () => {},
      ),
    );
    syncSliders.push(
      bindSlider(
        body,
        {
          key: "hitStopPerChargeTier",
          label: "Hit-stop / charge tier (ms)",
          min: 0,
          max: 40,
          step: 0.5,
          format: (v) => `${v.toFixed(1)} ms`,
        },
        () => j.hitStopPerChargeTierSec * 1000,
        (v) => {
          j.hitStopPerChargeTierSec = v / 1000;
        },
        () => {},
      ),
    );
    syncSliders.push(
      bindSlider(
        body,
        {
          key: "hitStopMaxSec",
          label: "Hit-stop max (ms)",
          min: 40,
          max: 220,
          step: 1,
          format: (v) => `${Math.round(v)} ms`,
        },
        () => j.hitStopMaxSec * 1000,
        (v) => {
          j.hitStopMaxSec = v / 1000;
        },
        () => {},
      ),
    );
    syncSliders.push(
      bindSlider(
        body,
        {
          key: "fovPunchPeakDeg",
          label: "FOV punch peak (°)",
          min: 0,
          max: 8,
          step: 0.1,
          format: (v) => `${v.toFixed(1)}°`,
        },
        () => j.fovPunchPeakDeg,
        (v) => {
          j.fovPunchPeakDeg = v;
        },
        () => {},
      ),
    );
    syncSliders.push(
      bindSlider(
        body,
        {
          key: "fovPunchPerChargeTierDeg",
          label: "FOV punch / tier (°)",
          min: 0,
          max: 2,
          step: 0.05,
          format: (v) => `${v.toFixed(2)}°`,
        },
        () => j.fovPunchPerChargeTierDeg,
        (v) => {
          j.fovPunchPerChargeTierDeg = v;
        },
        () => {},
      ),
    );
    syncSliders.push(
      bindSlider(
        body,
        {
          key: "fovPunchDecayHalfLifeSec",
          label: "FOV decay half-life (ms)",
          min: 20,
          max: 300,
          step: 5,
          format: (v) => `${Math.round(v)} ms`,
        },
        () => j.fovPunchDecayHalfLifeSec * 1000,
        (v) => {
          j.fovPunchDecayHalfLifeSec = v / 1000;
        },
        () => {},
      ),
    );
    resetRow(body, "Reset juice", () => {
      tuning.resetJuice();
      refreshAllSliders();
    });
  }

  function wireBag(): void {
    body.appendChild(sectionTitle("Bag hit (lab)"));
    const b = tuning.bag;
    syncSliders.push(
      bindSlider(
        body,
        {
          key: "p",
          label: "Planar impulse",
          min: 80,
          max: 520,
          step: 4,
          format: (v) => String(Math.round(v)),
        },
        () => b.basePlanarImpulse,
        (v) => {
          b.basePlanarImpulse = v;
        },
        () => {},
      ),
    );
    syncSliders.push(
      bindSlider(
        body,
        {
          key: "u",
          label: "Upward impulse",
          min: 0,
          max: 80,
          step: 2,
          format: (v) => String(Math.round(v)),
        },
        () => b.upwardImpulse,
        (v) => {
          b.upwardImpulse = v;
        },
        () => {},
      ),
    );
    syncSliders.push(
      bindSlider(
        body,
        {
          key: "d",
          label: "Base damage",
          min: 1,
          max: 40,
          step: 1,
          format: (v) => String(Math.round(v)),
        },
        () => b.baseDamage,
        (v) => {
          b.baseDamage = v;
        },
        () => {},
      ),
    );
    resetRow(body, "Reset bag", () => {
      tuning.resetBag();
      refreshAllSliders();
    });
  }

  function wirePlayer(): void {
    body.appendChild(sectionTitle("Player move & A/D (WASD)"));
    const note = document.createElement("p");
    note.style.cssText =
      "margin:0 0 8px 0;font-size:11px;line-height:1.35;opacity:0.78;color:#a8b8d8;";
    note.textContent =
      "W/S = forward speed. A/D = strafe speed and turn rate (same keys).";
    body.appendChild(note);
    const p = tuning.player;
    syncSliders.push(
      bindSlider(
        body,
        {
          key: "fwd",
          label: "Forward speed W/S (m/s)",
          min: 2,
          max: 14,
          step: 0.05,
          format: (v) => v.toFixed(2),
        },
        () => p.forwardMoveSpeed,
        (v) => {
          p.forwardMoveSpeed = v;
        },
        () => {},
      ),
    );
    syncSliders.push(
      bindSlider(
        body,
        {
          key: "str",
          label: "Strafe speed A/D (m/s)",
          min: 0,
          max: 14,
          step: 0.05,
          format: (v) => v.toFixed(2),
        },
        () => p.strafeMoveSpeed,
        (v) => {
          p.strafeMoveSpeed = v;
        },
        () => {},
      ),
    );
    syncSliders.push(
      bindSlider(
        body,
        {
          key: "yaw",
          label: "A/D yaw rate (°/s)",
          min: 30,
          max: 200,
          step: 1,
          format: (v) => String(Math.round(v)),
        },
        () => p.yawDegPerSec,
        (v) => {
          p.yawDegPerSec = v;
        },
        () => {},
      ),
    );
    syncSliders.push(
      bindSlider(
        body,
        {
          key: "jv",
          label: "Jump velocity",
          min: 3,
          max: 14,
          step: 0.05,
          format: (v) => v.toFixed(2),
        },
        () => p.jumpVelocity,
        (v) => {
          p.jumpVelocity = v;
        },
        () => {},
      ),
    );
    syncSliders.push(
      bindSlider(
        body,
        {
          key: "g",
          label: "Gravity Y",
          min: -45,
          max: -8,
          step: 0.5,
          format: (v) => v.toFixed(1),
        },
        () => p.gravityY,
        (v) => {
          p.gravityY = v;
        },
        () => {},
      ),
    );
    resetRow(body, "Reset player", () => {
      tuning.resetPlayer();
      refreshAllSliders();
    });
  }

  function wireCameraFollow(): void {
    body.appendChild(sectionTitle("Follow camera"));
    const c = tuning.cameraFollow;
    syncSliders.push(
      bindSlider(
        body,
        {
          key: "arm",
          label: "Arm length (m)",
          min: 3,
          max: 12,
          step: 0.05,
          format: (v) => v.toFixed(2),
        },
        () => c.armLength,
        (v) => {
          c.armLength = v;
        },
        () => {},
      ),
    );
    syncSliders.push(
      bindSlider(
        body,
        {
          key: "sm",
          label: "Smooth half-life (s)",
          min: 0,
          max: 0.45,
          step: 0.005,
          format: (v) => v.toFixed(3),
        },
        () => c.smoothHalfLifeSec,
        (v) => {
          c.smoothHalfLifeSec = v;
        },
        () => {},
      ),
    );
    syncSliders.push(
      bindSlider(
        body,
        {
          key: "pv",
          label: "Pivot Y offset (m)",
          min: 0,
          max: 1.4,
          step: 0.01,
          format: (v) => v.toFixed(2),
        },
        () => c.pivotYOffset,
        (v) => {
          c.pivotYOffset = v;
        },
        () => {},
      ),
    );
    syncSliders.push(
      bindSlider(
        body,
        {
          key: "pitch",
          label: "Pitch (deg)",
          min: 8,
          max: 45,
          step: 0.5,
          format: (v) => `${v.toFixed(1)}°`,
        },
        () => c.pitchDeg,
        (v) => {
          c.pitchDeg = v;
        },
        () => {},
      ),
    );
    resetRow(body, "Reset camera follow", () => {
      tuning.resetCameraFollow();
      refreshAllSliders();
    });
  }

  function wireRenderCamera(): void {
    body.appendChild(sectionTitle("Render"));
    const r = tuning.camera;
    syncSliders.push(
      bindSlider(
        body,
        {
          key: "fov",
          label: "Base FOV (deg)",
          min: 35,
          max: 78,
          step: 0.5,
          format: (v) => `${v.toFixed(1)}°`,
        },
        () => r.baseFovDeg,
        (v) => {
          r.baseFovDeg = v;
        },
        () => {},
      ),
    );
    resetRow(body, "Reset render / FOV", () => {
      tuning.resetCamera();
      refreshAllSliders();
    });
  }

  wireJuice();
  wireBag();
  wirePlayer();
  wireCameraFollow();
  wireRenderCamera();

  resetRow(body, "Reset all to shipped defaults", () => {
    tuning.resetAll();
    refreshAllSliders();
  });

  container.appendChild(panel);

  let visible = false;

  function applyVisibility(): void {
    panel.style.display = visible ? "block" : "none";
  }

  const onKeyDown = (e: KeyboardEvent): void => {
    if (e.code !== TOGGLE_CODE || e.repeat) return;
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
  };

  window.addEventListener("keydown", onKeyDown, true);

  return {
    dispose(): void {
      window.removeEventListener("keydown", onKeyDown, true);
      panel.remove();
    },
  };
}
