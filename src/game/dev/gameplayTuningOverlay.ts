import type { CombatHitAttackKind } from "../combat/combatEventBus";
import { COMPOUND_MOVE_DESIGN_ROWS } from "../combat/compoundMoveTable";
import type { StrikeMoveId } from "../input/combatIntent";
import type {
  BaseStrikeTuningRow,
  GameplayRuntimeTuning,
} from "../tuning/gameplayRuntimeTuning";
import {
  TRAINING_BAG_SFX_PRESETS,
  TRAINING_BAG_SFX_STYLE_ORDER,
  type TrainingBagSfxStyleId,
} from "../audio/trainingBagSfxPresets";
import {
  HIT_BURST_VFX_PRESETS,
  HIT_BURST_VFX_STYLE_ORDER,
  type HitBurstVfxStyleId,
} from "../vfx/hitBurstVfxPresets";

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
export type GameplayTuningOverlayOptions = {
  /** Plays the limb’s bag preset once (needs user gesture + running AudioContext). */
  previewTrainingBagSfx?: (attackKind: CombatHitAttackKind) => void;
  /** Spawns one hit burst with the current VFX preset (ignores reduced-motion VFX gate). */
  previewHitBurstVfx?: () => void;
};

export function attachGameplayTuningOverlay(
  container: HTMLElement,
  tuning: GameplayRuntimeTuning,
  options?: GameplayTuningOverlayOptions,
): { dispose: () => void } {
  const panel = document.createElement("div");
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "Gameplay tuning");
  panel.style.cssText = [
    "position:fixed",
    "top:12px",
    "right:12px",
    "width:min(280px,calc(100vw - 24px))",
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
  const syncExtras: (() => void)[] = [];

  function refreshAllSliders(): void {
    for (const s of syncSliders) s();
    for (const x of syncExtras) x();
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

  function wireStrikes(): void {
    body.appendChild(sectionTitle("Strikes (WS-080 + WS-081)"));
    const note = document.createElement("p");
    note.style.cssText =
      "margin:0 0 8px 0;font-size:11px;line-height:1.35;opacity:0.78;color:#a8b8d8;";
    note.textContent =
      "Sphere hit probe vs bag + input cooldown after the active window. Pick any base limb, chord, or sequence row; Reset restores shipped table defaults.";
    body.appendChild(note);

    const MOVE_ROWS: { id: StrikeMoveId; label: string }[] = [
      { id: "atk_lp", label: "Base — LP (U)" },
      { id: "atk_rp", label: "Base — RP (I)" },
      { id: "atk_lk", label: "Base — LK (J)" },
      { id: "atk_rk", label: "Base — RK (K)" },
      ...COMPOUND_MOVE_DESIGN_ROWS.map((r) => ({
        id: r.moveId,
        label: `Chord/seq — ${r.moveId}`,
      })),
    ];

    let selectedMove: StrikeMoveId = "atk_lp";

    const moveWrap = document.createElement("div");
    moveWrap.style.cssText = "margin:8px 0;";
    const moveLab = document.createElement("label");
    moveLab.style.cssText =
      "display:block;color:#dbe7ff;opacity:0.92;font-size:12px;margin-bottom:4px;";
    moveLab.textContent = "Edit row";
    moveLab.setAttribute("for", "js-base-strike-move");
    const moveSel = document.createElement("select");
    moveSel.id = "js-base-strike-move";
    moveSel.style.cssText =
      "width:100%;box-sizing:border-box;padding:6px 8px;border-radius:6px;border:1px solid rgba(120,140,200,0.45);background:rgba(28,36,60,0.95);color:#e8eefc;font:12px ui-sans-serif,system-ui,sans-serif;";
    for (const row of MOVE_ROWS) {
      const opt = document.createElement("option");
      opt.value = row.id;
      opt.textContent = row.label;
      moveSel.appendChild(opt);
    }
    moveSel.addEventListener("change", () => {
      selectedMove = moveSel.value as StrikeMoveId;
      refreshAllSliders();
    });
    moveWrap.appendChild(moveLab);
    moveWrap.appendChild(moveSel);
    body.appendChild(moveWrap);

    function row(): BaseStrikeTuningRow {
      return tuning.strikes[selectedMove];
    }

    syncExtras.push(() => {
      moveSel.value = selectedMove;
    });

    syncSliders.push(
      bindSlider(
        body,
        {
          key: "bs_r",
          label: "Probe radius (m)",
          min: 0.05,
          max: 0.28,
          step: 0.005,
          format: (v) => v.toFixed(3),
        },
        () => row().profile.radius,
        (v) => {
          row().profile.radius = v;
        },
        () => {},
      ),
    );
    syncSliders.push(
      bindSlider(
        body,
        {
          key: "bs_reach",
          label: "Reach (m)",
          min: 0.25,
          max: 0.95,
          step: 0.01,
          format: (v) => v.toFixed(2),
        },
        () => row().profile.reach,
        (v) => {
          row().profile.reach = v;
        },
        () => {},
      ),
    );
    syncSliders.push(
      bindSlider(
        body,
        {
          key: "bs_side",
          label: "Side offset (m, + = char left)",
          min: -0.45,
          max: 0.45,
          step: 0.01,
          format: (v) => v.toFixed(2),
        },
        () => row().profile.sideOffset,
        (v) => {
          row().profile.sideOffset = v;
        },
        () => {},
      ),
    );
    syncSliders.push(
      bindSlider(
        body,
        {
          key: "bs_h",
          label: "Height from capsule (m)",
          min: -0.45,
          max: 0.45,
          step: 0.01,
          format: (v) => v.toFixed(2),
        },
        () => row().profile.heightFromCapsuleCenter,
        (v) => {
          row().profile.heightFromCapsuleCenter = v;
        },
        () => {},
      ),
    );
    syncSliders.push(
      bindSlider(
        body,
        {
          key: "bs_af",
          label: "Active frames (60 Hz ticks)",
          min: 1,
          max: 14,
          step: 1,
          format: (v) => String(Math.round(v)),
        },
        () => row().profile.activeFrames,
        (v) => {
          row().profile.activeFrames = Math.max(1, Math.round(v));
        },
        () => {},
      ),
    );
    syncSliders.push(
      bindSlider(
        body,
        {
          key: "bs_cd",
          label: "Input cooldown after window (ms)",
          min: 0,
          max: 1200,
          step: 5,
          format: (v) => `${Math.round(v)} ms`,
        },
        () => row().inputCooldownAfterStrikeSec * 1000,
        (v) => {
          row().inputCooldownAfterStrikeSec = Math.max(0, v / 1000);
        },
        () => {},
      ),
    );

    resetRow(body, "Reset strikes (table defaults)", () => {
      tuning.resetStrikes();
      refreshAllSliders();
    });
  }

  function wireCombatStamina(): void {
    body.appendChild(sectionTitle("Stamina & strike lunge (GP §2.2.2)"));
    const note = document.createElement("p");
    note.style.cssText =
      "margin:0 0 8px 0;font-size:11px;line-height:1.35;opacity:0.78;color:#a8b8d8;";
    note.textContent =
      "Stamina bar — cost per strike start; regen only after you stop attacking (delay after each strike start). Lunge = forward nudge on strike begin.";
    body.appendChild(note);

    const st = tuning.combatStamina;

    syncSliders.push(
      bindSlider(
        body,
        {
          key: "st_max",
          label: "Max stamina (bar = current / this)",
          min: 0.25,
          max: 2,
          step: 0.05,
          format: (v) => v.toFixed(2),
        },
        () => st.maxStamina,
        (v) => {
          st.maxStamina = Math.max(0.1, v);
        },
        () => {},
      ),
    );
    syncSliders.push(
      bindSlider(
        body,
        {
          key: "st_cost",
          label: "Stamina cost per strike",
          min: 0.05,
          max: 0.55,
          step: 0.01,
          format: (v) => v.toFixed(2),
        },
        () => st.staminaCostPerStrike,
        (v) => {
          st.staminaCostPerStrike = Math.max(0.01, v);
        },
        () => {},
      ),
    );
    syncSliders.push(
      bindSlider(
        body,
        {
          key: "st_regen",
          label: "Stamina regen / sec",
          min: 0.5,
          max: 12,
          step: 0.25,
          format: (v) => v.toFixed(2),
        },
        () => st.staminaRegenPerSec,
        (v) => {
          st.staminaRegenPerSec = Math.max(0.1, v);
        },
        () => {},
      ),
    );
    syncSliders.push(
      bindSlider(
        body,
        {
          key: "st_regen_pause",
          label: "Regen pause after strike (ms)",
          min: 0,
          max: 1500,
          step: 10,
          format: (v) => `${Math.round(v)} ms`,
        },
        () => st.staminaRegenResumeDelayAfterStrikeSec * 1000,
        (v) => {
          st.staminaRegenResumeDelayAfterStrikeSec = Math.max(0, v / 1000);
        },
        () => {},
      ),
    );
    syncSliders.push(
      bindSlider(
        body,
        {
          key: "st_lunge",
          label: "Strike lunge (m, forward)",
          min: 0,
          max: 0.22,
          step: 0.005,
          format: (v) => v.toFixed(3),
        },
        () => st.strikeLungeForwardMeters,
        (v) => {
          st.strikeLungeForwardMeters = Math.max(0, v);
        },
        () => {},
      ),
    );

    resetRow(body, "Reset stamina / lunge (defaults)", () => {
      tuning.resetCombatStamina();
      refreshAllSliders();
    });
  }

  function wireAudio(): void {
    body.appendChild(sectionTitle("Combat SFX (dev)"));
    const note = document.createElement("p");
    note.style.cssText =
      "margin:0 0 8px 0;font-size:11px;line-height:1.35;opacity:0.78;color:#a8b8d8;";
    note.textContent =
      "Per-limb procedural presets on training-bag hits. Each play picks a random pitch from the preset’s cents list; future: combo-specific voices + seeded variation (see FUTURE_DESIGN_NOTES).";
    body.appendChild(note);

    const a = tuning.audio;
    const LIMB_SFX: { kind: CombatHitAttackKind; short: string }[] = [
      { kind: "left_punch", short: "LP" },
      { kind: "right_punch", short: "RP" },
      { kind: "left_kick", short: "LK" },
      { kind: "right_kick", short: "RK" },
      { kind: "compound_dual_punch", short: "2×P" },
      { kind: "compound_dual_kick", short: "2×K" },
      { kind: "compound_mixed", short: "Mix" },
      { kind: "compound_multi", short: "Multi" },
      { kind: "sequence_strike", short: "Seq" },
    ];

    const selectStyle =
      "width:100%;box-sizing:border-box;padding:5px 7px;border-radius:6px;border:1px solid rgba(120,140,200,0.45);background:rgba(28,36,60,0.95);color:#e8eefc;font:11px ui-sans-serif,system-ui,sans-serif;";

    for (const { kind, short } of LIMB_SFX) {
      const wrap = document.createElement("div");
      wrap.style.cssText = "margin:6px 0;display:grid;grid-template-columns:32px 1fr;gap:6px;align-items:center;";
      const lab = document.createElement("span");
      lab.style.cssText = "color:#a8c7ff;font-variant-numeric:tabular-nums;";
      lab.textContent = short;
      const sel = document.createElement("select");
      sel.style.cssText = selectStyle;
      sel.setAttribute("aria-label", `${short} bag hit preset`);
      for (const id of TRAINING_BAG_SFX_STYLE_ORDER) {
        const p = TRAINING_BAG_SFX_PRESETS[id];
        const opt = document.createElement("option");
        opt.value = id;
        opt.textContent = p.title;
        sel.appendChild(opt);
      }
      function syncThis(): void {
        sel.value = a.trainingBagSfxByAttackKind[kind];
      }
      syncThis();
      sel.addEventListener("change", () => {
        a.trainingBagSfxByAttackKind[kind] = sel.value as TrainingBagSfxStyleId;
      });
      syncExtras.push(syncThis);
      wrap.appendChild(lab);
      wrap.appendChild(sel);
      body.appendChild(wrap);
    }

    if (options?.previewTrainingBagSfx) {
      const preview = options.previewTrainingBagSfx;
      const prevRow = document.createElement("div");
      prevRow.style.cssText =
        "margin:10px 0 4px 0;display:flex;flex-wrap:wrap;gap:6px;align-items:center;";
      const prevLab = document.createElement("span");
      prevLab.style.cssText = "font-size:11px;color:#8ea3c9;margin-right:4px;";
      prevLab.textContent = "Preview:";
      prevRow.appendChild(prevLab);
      for (const { kind, short } of LIMB_SFX) {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = short;
        b.style.cssText =
          "cursor:pointer;padding:4px 8px;border-radius:5px;border:1px solid rgba(120,140,200,0.45);background:rgba(30,40,70,0.9);color:#dbe7ff;font:11px/1.2 ui-sans-serif,system-ui,sans-serif;";
        b.addEventListener("click", () => preview(kind));
        prevRow.appendChild(b);
      }
      body.appendChild(prevRow);
    }

    resetRow(body, "Reset audio (all limbs)", () => {
      tuning.resetAudio();
      refreshAllSliders();
    });
  }

  function wireHitBurstVfx(): void {
    body.appendChild(sectionTitle("Hit burst VFX (dev)"));
    const note = document.createElement("p");
    note.style.cssText =
      "margin:0 0 8px 0;font-size:11px;line-height:1.35;opacity:0.78;color:#a8b8d8;";
    note.textContent =
      "WS-073 additive particles on bag hit. Preset drives count, life, speed, color. Preview spawns in front of the camera (no SFX).";
    body.appendChild(note);

    const v = tuning.vfx;
    const wrap = document.createElement("div");
    wrap.style.cssText = "margin:8px 0;";

    const lab = document.createElement("label");
    lab.style.cssText =
      "display:block;color:#dbe7ff;opacity:0.92;font-size:12px;margin-bottom:4px;";
    lab.textContent = "Hit burst preset";
    lab.setAttribute("for", "js-vfx-hit-burst-style");

    const sel = document.createElement("select");
    sel.id = "js-vfx-hit-burst-style";
    sel.style.cssText =
      "width:100%;box-sizing:border-box;padding:6px 8px;border-radius:6px;border:1px solid rgba(120,140,200,0.45);background:rgba(28,36,60,0.95);color:#e8eefc;font:12px ui-sans-serif,system-ui,sans-serif;";

    for (const id of HIT_BURST_VFX_STYLE_ORDER) {
      const p = HIT_BURST_VFX_PRESETS[id];
      const opt = document.createElement("option");
      opt.value = id;
      opt.textContent = p.title;
      sel.appendChild(opt);
    }

    const blurb = document.createElement("p");
    blurb.style.cssText =
      "margin:8px 0 0 0;font-size:11px;line-height:1.35;opacity:0.82;color:#a8b8d8;";
    function syncBlurb(): void {
      blurb.textContent = HIT_BURST_VFX_PRESETS[v.hitBurstStyle].tagline;
    }

    function syncSelect(): void {
      sel.value = v.hitBurstStyle;
      syncBlurb();
    }

    syncSelect();

    sel.addEventListener("change", () => {
      v.hitBurstStyle = sel.value as HitBurstVfxStyleId;
      syncBlurb();
    });

    wrap.appendChild(lab);
    wrap.appendChild(sel);
    wrap.appendChild(blurb);
    body.appendChild(wrap);

    syncExtras.push(syncSelect);

    if (options?.previewHitBurstVfx) {
      const preview = options.previewHitBurstVfx;
      resetRow(body, "Preview hit burst", () => {
        preview();
      });
    }

    resetRow(body, "Reset hit burst (preset)", () => {
      tuning.resetVfx();
      refreshAllSliders();
    });
  }

  function wireTrainingDummyFeel(): void {
    body.appendChild(sectionTitle("Training dummy — kickback / spin / get-up"));
    const note = document.createElement("p");
    note.style.cssText =
      "margin:0 0 8px 0;font-size:11px;line-height:1.35;opacity:0.78;color:#a8b8d8;";
    note.textContent =
      "Kickback scales strike impulse on the dummy only. Spin: low = shove, high = more fist torque + spin persists. Ragdoll get-up = wait on floor before blend + how long the blend to spawn takes. Light stagger = pre-KD hit react + in-place stand.";
    body.appendChild(note);

    const d = tuning.trainingDummyFeel;

    const sliders: {
      key: string;
      label: string;
      min: number;
      max: number;
      step: number;
      format: (v: number) => string;
      read: () => number;
      write: (v: number) => void;
    }[] = [
      {
        key: "td_kick",
        label: "Kickback scale",
        min: 0.35,
        max: 10,
        step: 0.05,
        format: (v) => v.toFixed(2),
        read: () => d.kickbackScale,
        write: (v) => {
          d.kickbackScale = Math.max(0.1, v);
        },
      },
      {
        key: "td_spin",
        label: "Spin / tumble (0–1)",
        min: 0,
        max: 1,
        step: 0.05,
        format: (v) => v.toFixed(2),
        read: () => d.spinAmount,
        write: (v) => {
          d.spinAmount = Math.min(1, Math.max(0, v));
        },
      },
      {
        key: "td_ld",
        label: "Slide drag (linear damping)",
        min: 0.25,
        max: 2.2,
        step: 0.05,
        format: (v) => v.toFixed(2),
        read: () => d.linearDamping,
        write: (v) => {
          d.linearDamping = Math.max(0.05, v);
        },
      },
      {
        key: "td_hit",
        label: "Light hit — react flash (s)",
        min: 0.02,
        max: 0.4,
        step: 0.01,
        format: (v) => v.toFixed(2),
        read: () => d.hitReactSec,
        write: (v) => {
          d.hitReactSec = Math.max(0.01, v);
        },
      },
      {
        key: "td_stag",
        label: "Light hit — stagger hold (s)",
        min: 0.08,
        max: 1.6,
        step: 0.02,
        format: (v) => v.toFixed(2),
        read: () => d.staggerHoldSec,
        write: (v) => {
          d.staggerHoldSec = Math.max(0.03, v);
        },
      },
      {
        key: "td_lsb",
        label: "Light hit — stand-up blend (s)",
        min: 0.12,
        max: 1.4,
        step: 0.02,
        format: (v) => v.toFixed(2),
        read: () => d.lightHitStandBlendSec,
        write: (v) => {
          d.lightHitStandBlendSec = Math.max(0.05, v);
        },
      },
      {
        key: "td_rdwn",
        label: "Ragdoll — min down before get-up (s)",
        min: 0.15,
        max: 4,
        step: 0.05,
        format: (v) => v.toFixed(2),
        read: () => d.ragdollDownBeforeRecoverSec,
        write: (v) => {
          d.ragdollDownBeforeRecoverSec = Math.max(0.05, v);
        },
      },
      {
        key: "td_rblend",
        label: "Ragdoll — get-up blend to spawn (s)",
        min: 0.15,
        max: 2.2,
        step: 0.05,
        format: (v) => v.toFixed(2),
        read: () => d.ragdollStandUpBlendSec,
        write: (v) => {
          d.ragdollStandUpBlendSec = Math.max(0.08, v);
        },
      },
      {
        key: "td_rmax",
        label: "Ragdoll — max down (timeout, s)",
        min: 1,
        max: 14,
        step: 0.2,
        format: (v) => v.toFixed(1),
        read: () => d.ragdollDownMaxSec,
        write: (v) => {
          d.ragdollDownMaxSec = Math.max(0.5, v);
        },
      },
      {
        key: "td_slin",
        label: "Ragdoll — settle planar speed max",
        min: 0.08,
        max: 1.4,
        step: 0.02,
        format: (v) => v.toFixed(2),
        read: () => d.ragdollSettlePlanarSpeed,
        write: (v) => {
          d.ragdollSettlePlanarSpeed = Math.max(0.02, v);
        },
      },
      {
        key: "td_sang",
        label: "Ragdoll — settle spin speed max",
        min: 0.15,
        max: 2.2,
        step: 0.05,
        format: (v) => v.toFixed(2),
        read: () => d.ragdollSettleAngSpeed,
        write: (v) => {
          d.ragdollSettleAngSpeed = Math.max(0.05, v);
        },
      },
    ];

    for (const s of sliders) {
      syncSliders.push(
        bindSlider(
          body,
          {
            key: s.key,
            label: s.label,
            min: s.min,
            max: s.max,
            step: s.step,
            format: s.format,
          },
          s.read,
          s.write,
          () => {},
        ),
      );
    }

    resetRow(body, "Reset training dummy feel", () => {
      tuning.resetTrainingDummyFeel();
      refreshAllSliders();
    });
  }

  function wireCombatBasics(): void {
    body.appendChild(sectionTitle("Combat baseline (×N later)"));
    const note = document.createElement("p");
    note.style.cssText =
      "margin:0 0 8px 0;font-size:11px;line-height:1.35;opacity:0.78;color:#a8b8d8;";
    note.textContent =
      "Base punch damage × charge tier table applies to bag + dummy hits. Base enemy health = training dummy knockdown threshold (cumulative lab damage). Future: multiply these for other enemies / moves.";
    body.appendChild(note);

    const c = tuning.combatBasics;
    syncSliders.push(
      bindSlider(
        body,
        {
          key: "cb_dmg",
          label: "Base punch damage (tier 0)",
          min: 1,
          max: 80,
          step: 1,
          format: (v) => String(Math.round(v)),
        },
        () => c.basePunchDamage,
        (v) => {
          c.basePunchDamage = Math.max(1, v);
        },
        () => {},
      ),
    );
    syncSliders.push(
      bindSlider(
        body,
        {
          key: "cb_hp",
          label: "Base enemy health (dummy KD)",
          min: 20,
          max: 400,
          step: 5,
          format: (v) => String(Math.round(v)),
        },
        () => c.baseEnemyHealth,
        (v) => {
          c.baseEnemyHealth = Math.max(1, v);
        },
        () => {},
      ),
    );
    resetRow(body, "Reset combat baseline", () => {
      tuning.resetCombatBasics();
      refreshAllSliders();
    });
  }

  function wireBag(): void {
    body.appendChild(sectionTitle("Bag hit (lab) — impulses"));
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
    resetRow(body, "Reset bag impulses", () => {
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

  function wireDojoTitleLogo(): void {
    body.appendChild(sectionTitle("Dojo title logo (WS-110)"));
    const note = document.createElement("p");
    note.style.cssText =
      "margin:0 0 8px 0;font-size:11px;line-height:1.35;opacity:0.78;color:#a8b8d8;";
    note.textContent =
      "North-wall title: plane width scales the entire lockup (letters + stickman) together. “I vs type (relative)” only changes the stickman versus line-2 typography (I-slot), not world meters. Copy winners into dojoTitleLogoWall.ts when locking defaults.";
    body.appendChild(note);

    const d = tuning.dojoTitleLogo;
    syncSliders.push(
      bindSlider(
        body,
        {
          key: "dtl_w",
          label: "Plane width (m)",
          min: 6,
          max: 30,
          step: 0.1,
          format: (v) => `${v.toFixed(1)} m`,
        },
        () => d.planeWidthM,
        (v) => {
          d.planeWidthM = Math.max(0.5, v);
        },
        () => {},
      ),
    );
    syncSliders.push(
      bindSlider(
        body,
        {
          key: "dtl_x",
          label: "Center world X (m)",
          min: -6,
          max: 6,
          step: 0.05,
          format: (v) => v.toFixed(2),
        },
        () => d.centerWorldX,
        (v) => {
          d.centerWorldX = v;
        },
        () => {},
      ),
    );
    syncSliders.push(
      bindSlider(
        body,
        {
          key: "dtl_stick",
          label: '"I" vs type (relative)',
          min: 0.45,
          max: 3,
          step: 0.02,
          format: (v) => `${v.toFixed(2)}×`,
        },
        () => d.stickRelativeScale,
        (v) => {
          d.stickRelativeScale = Math.max(0.2, Math.min(3, v));
        },
        () => {},
      ),
    );

    resetRow(body, "Reset dojo title logo", () => {
      tuning.resetDojoTitleLogo();
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
  wireStrikes();
  wireCombatStamina();
  wireAudio();
  wireHitBurstVfx();
  wireCombatBasics();
  wireTrainingDummyFeel();
  wireBag();
  wirePlayer();
  wireCameraFollow();
  wireRenderCamera();
  wireDojoTitleLogo();

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
