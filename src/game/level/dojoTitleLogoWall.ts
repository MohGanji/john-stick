import * as THREE from "three";

import { DOJO_BLOCKOUT } from "./dojoBlockout";

/**
 * WS-110 / GP §9.2.1 — Diegetic **two-line** hero logo (Wick-style stagger: line 2 inset).
 * Transparent tex; **serious** high-contrast block type + distressed **blood / void** reads;
 * **“i”** = **authored PNG** (`public/logo/dojo-stickman-i.png`) composited **after** global weathering
 * so grain / scanlines never touch the figure. Drawn with the **same italic skew** as **ST** / **CK**
 * (`transform(0.7, 0, -0.46, 1, 0, 0)`) so it reads as one lockup. **Fallback:** `drawStickmanAsI`
 * (also in skew space) if the image fails to load.
 *
 * **Refs:** `docs/reference/logo/dojo-stickman-i.png` (same art), `dojo-stickman-i.svg` (optional vector).
 *
 * **Reference board:** `docs/reference/logo/` (+ `README.md`).
 */

/** Vite `public/` URL — same file copied under `docs/reference/logo/` for art handoff. */
export const DOJO_TITLE_STICKMAN_I_URL = "/logo/dojo-stickman-i.png";

/**
 * Default **relative** size of the “I” stickman vs auto-fit to the **typography** (`fontPx` + `slot`).
 * `1` = shear-safe max fit; values above `1` enlarge (may overlap neighbors). **World** `planeWidthM` scales the
 * **entire** texture uniformly, so this ratio vs **JOHN STICK** type stays fixed when only the wall quad changes.
 */
export const DOJO_TITLE_STICKMAN_RELATIVE_SCALE_DEFAULT = 2.41;

export type DojoTitleLogoSyncScalars = {
  planeWidthM: number;
  centerWorldX: number;
  /** Dimensionless; multiplies bitmap fit derived from line-2 `fontPx` / I-slot (not world meters). */
  stickRelativeScale: number;
};

const CANVAS_W = 2688;
/**
 * Shorter canvas ⇒ wider **world** `PLANE_W` possible while `PLANE_H` stays under the **4m** wall.
 * (Two-line copy still fits via the font fit loop.)
 */
/** Tuned with **22m** default width so `PLANE_H` stays under the **4m** wall shell. */
const CANVAS_H = 448;

/**
 * Base **world** width of the logo quad (m) before dev HUD **uniform scale**.
 * `PlaneGeometry` is built at this size; height follows canvas aspect (`PLANE_H`).
 */
export const DOJO_TITLE_LOGO_BASE_PLANE_WIDTH_M = 22;
const PLANE_W = DOJO_TITLE_LOGO_BASE_PLANE_WIDTH_M;
const PLANE_H = (PLANE_W * CANVAS_H) / CANVAS_W;

/**
 * Default **world X** of the logo group center on the north wall (**+** = viewer-left at spawn).
 * **Lower** values move the lockup **toward room center** (usually fixes left-edge clip). Tunable in dev HUD.
 */
export const DOJO_TITLE_LOGO_DEFAULT_CENTER_WORLD_X = -3.3;
const CENTER_Y = 1.96;
const Z_EPS = 0.035;

const LINE1 = "JOHN";
const LINE2_A = "ST";
const LINE2_B = "CK";

/**
 * Second line inset vs line 1 — **strong** stagger so **S** reads clearly **right** of **J**
 * (STICK is longer than JOHN; a small indent looked like a common left edge).
 */
function line2IndentPx(fontPx: number, wJohn: number): number {
  return Math.max(fontPx * 0.56, wJohn * 0.38);
}

/** Horizontal slot for stick-as-**I** (narrow bar like a capital I; widened for thick silhouette). */
function stickISlotPx(fontPx: number): number {
  return fontPx * 0.39;
}

function drawSeriousBlockText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fontPx: number,
): void {
  ctx.textBaseline = "middle";
  const heavy = Math.max(11, fontPx * 0.058);
  const mid = heavy * 0.38;

  ctx.strokeStyle = "#020203";
  ctx.lineWidth = heavy;
  ctx.lineJoin = "miter";
  ctx.miterLimit = 2;
  ctx.strokeText(text, x, y);

  ctx.strokeStyle = "#1c1d22";
  ctx.lineWidth = mid;
  ctx.strokeText(text, x, y);

  const g = ctx.createLinearGradient(0, y - fontPx * 0.66, 0, y + fontPx * 0.5);
  g.addColorStop(0, "#ffffff");
  g.addColorStop(0.12, "#d8d9df");
  g.addColorStop(0.38, "#6e717a");
  g.addColorStop(0.62, "#2e3036");
  g.addColorStop(1, "#060607");
  ctx.fillStyle = g;
  ctx.fillText(text, x, y);
}

/**
 * Internal **depth voids** + **blood tone** — only where logo already has ink (`source-atop`).
 */
function drawInternalShadeAndBlood(
  ctx: CanvasRenderingContext2D,
  x0: number,
  yMid: number,
  wApprox: number,
  fontPx: number,
  opts: { gunHint: boolean },
): void {
  ctx.save();
  ctx.globalCompositeOperation = "source-atop";

  const gr = ctx.createRadialGradient(
    x0 + wApprox * 0.35,
    yMid - fontPx * 0.08,
    fontPx * 0.05,
    x0 + wApprox * 0.45,
    yMid,
    fontPx * 0.9,
  );
  gr.addColorStop(0, "rgba(0,0,0,0)");
  gr.addColorStop(0.45, "rgba(8,8,12,0.55)");
  gr.addColorStop(1, "rgba(0,0,0,0.35)");
  ctx.fillStyle = gr;
  ctx.fillRect(x0 - fontPx * 0.2, yMid - fontPx * 0.85, wApprox + fontPx * 0.5, fontPx * 1.7);

  for (let i = 0; i < 28; i++) {
    ctx.fillStyle = `rgba(${55 + Math.random() * 40},${6 + Math.random() * 10},${8 + Math.random() * 8},${0.12 + Math.random() * 0.22})`;
    ctx.beginPath();
    ctx.ellipse(
      x0 + Math.random() * wApprox,
      yMid + (Math.random() - 0.5) * fontPx * 1.1,
      Math.random() * fontPx * 0.22 + 2,
      Math.random() * fontPx * 0.16 + 2,
      Math.random() * Math.PI,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }

  for (let i = 0; i < 55; i++) {
    ctx.fillStyle = `rgba(0,0,0,${0.15 + Math.random() * 0.35})`;
    ctx.beginPath();
    ctx.arc(
      x0 + Math.random() * wApprox,
      yMid + (Math.random() - 0.5) * fontPx * 1.0,
      Math.random() * fontPx * 0.07 + 0.5,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }

  if (opts.gunHint) {
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = "rgba(18,16,20,0.58)";
    ctx.beginPath();
    const gx = x0 + wApprox * 0.38;
    const gy = yMid - fontPx * 0.02;
    ctx.moveTo(gx, gy - fontPx * 0.06);
    ctx.lineTo(gx + fontPx * 0.52, gy - fontPx * 0.04);
    ctx.lineTo(gx + fontPx * 0.5, gy + fontPx * 0.02);
    ctx.lineTo(gx + fontPx * 0.16, gy + fontPx * 0.04);
    ctx.lineTo(gx + fontPx * 0.12, gy + fontPx * 0.14);
    ctx.lineTo(gx + fontPx * 0.04, gy + fontPx * 0.12);
    ctx.lineTo(gx, gy + fontPx * 0.05);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "rgba(12,10,14,0.5)";
    ctx.fillRect(gx + fontPx * 0.02, gy - fontPx * 0.02, fontPx * 0.22, fontPx * 0.07);
  }

  ctx.restore();
}

/**
 * **I**-slot silhouette: **thick capsule** warrior (ref: `john-stick-ref-thick-capsule-katana-canonical.png`
 * + `docs/reference/logo/dojo-stickman-i.svg`). **Flat #060606** only — caller draws this **after**
 * `applyGlobalWeathering` so the figure stays clean. Draw **back-to-front** so blade reads behind torso.
 *
 * Call with **`cx` / `baselineY` in lockup-local space** after `translate(padX,baseY)` +
 * `transform(0.7, 0, -0.46, 1, 0, 0)` (same as line-2 glyphs). Used for procedural fallback when
 * the PNG does not load; the PNG path uses the same transform for a unified italic logo.
 */
function drawStickmanAsI(
  ctx: CanvasRenderingContext2D,
  cx: number,
  baselineY: number,
  fontPx: number,
): void {
  const u = fontPx;
  const ink = "#060606";
  ctx.fillStyle = ink;

  const headR = u * 0.09;
  const headCy = baselineY - u * 0.505;
  const headFloat = u * 0.022;
  const neckTop = headCy + headR + headFloat;
  const neckBot = neckTop + u * 0.04;
  const neckHalfW = u * 0.046;

  const shoulderY = neckBot;
  const shoulderHalf = u * 0.12;
  const waistHalf = u * 0.048;
  const hipY = baselineY + u * 0.016;
  const footY = baselineY + u * 0.108;

  const armW = u * 0.05;
  const handY = baselineY - u * 0.02;
  const legW = u * 0.052;
  const footOut = u * 0.122;
  const footRx = u * 0.098;
  const footRy = u * 0.032;

  // Viewer’s **right** shoulder anchor (katana hilt side).
  const rsx = cx + shoulderHalf;
  const rsy = shoulderY + u * 0.03;

  // 1) Blade behind body — diagonal from upper-right toward viewer-left / low.
  const bladeT = u * 0.036;
  ctx.beginPath();
  ctx.moveTo(rsx + u * 0.018, rsy - u * 0.012);
  ctx.lineTo(rsx - u * 0.385, hipY + u * 0.12);
  ctx.lineTo(rsx - u * 0.385 - bladeT * 0.88, hipY + u * 0.12 - bladeT * 1.05);
  ctx.lineTo(rsx + u * 0.018 - bladeT * 0.92, rsy - u * 0.012 - bladeT * 0.38);
  ctx.closePath();
  ctx.fill();

  // 2) Legs — thick quads into wide A-frame; feet = horizontal pills (ellipse).
  ctx.beginPath();
  ctx.moveTo(cx - waistHalf, hipY);
  ctx.lineTo(cx - waistHalf - legW * 0.12, hipY);
  ctx.lineTo(cx - footOut, footY - footRy * 0.35);
  ctx.lineTo(cx - footOut + legW * 0.55, footY - footRy * 0.5);
  ctx.lineTo(cx - waistHalf + legW * 0.32, hipY);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(cx + waistHalf, hipY);
  ctx.lineTo(cx + waistHalf + legW * 0.12, hipY);
  ctx.lineTo(cx + footOut, footY - footRy * 0.35);
  ctx.lineTo(cx + footOut - legW * 0.55, footY - footRy * 0.5);
  ctx.lineTo(cx + waistHalf - legW * 0.32, hipY);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(cx - footOut, footY, footRx, footRy, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + footOut, footY, footRx, footRy, 0, 0, Math.PI * 2);
  ctx.fill();

  // 3) Torso — V-taper (wide shoulders → narrower waist).
  ctx.beginPath();
  ctx.moveTo(cx - shoulderHalf, shoulderY);
  ctx.lineTo(cx + shoulderHalf, shoulderY);
  ctx.lineTo(cx + waistHalf, hipY);
  ctx.lineTo(cx - waistHalf, hipY);
  ctx.closePath();
  ctx.fill();

  // 4) Arms — thick segments + mitten hands.
  const ay0 = shoulderY + u * 0.024;
  const elbowLX = cx - shoulderHalf - u * 0.098;
  const elbowRX = cx + shoulderHalf + u * 0.098;
  const handLX = cx - shoulderHalf - u * 0.112;
  const handRX = cx + shoulderHalf + u * 0.112;

  ctx.beginPath();
  ctx.moveTo(cx - shoulderHalf, ay0);
  ctx.lineTo(elbowLX, shoulderY + u * 0.152);
  ctx.lineTo(handLX - armW * 0.12, handY + u * 0.038);
  ctx.lineTo(handLX + armW * 0.92, handY + u * 0.038);
  ctx.lineTo(cx - shoulderHalf + u * 0.045, shoulderY + u * 0.115);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.arc(handLX, handY + u * 0.028, armW * 0.82, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(cx + shoulderHalf, ay0);
  ctx.lineTo(elbowRX, shoulderY + u * 0.152);
  ctx.lineTo(handRX + armW * 0.12, handY + u * 0.038);
  ctx.lineTo(handRX - armW * 0.92, handY + u * 0.038);
  ctx.lineTo(cx + shoulderHalf - u * 0.045, shoulderY + u * 0.115);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.arc(handRX, handY + u * 0.028, armW * 0.82, 0, Math.PI * 2);
  ctx.fill();

  // 5) Neck + head.
  ctx.fillRect(cx - neckHalfW, neckTop, neckHalfW * 2, neckBot - neckTop);
  ctx.beginPath();
  ctx.arc(cx, headCy, headR, 0, Math.PI * 2);
  ctx.fill();

  // 6) Hilt + tsuba (viewer-right shoulder).
  ctx.beginPath();
  ctx.moveTo(rsx + u * 0.022, rsy - u * 0.018);
  ctx.lineTo(rsx + u * 0.108, rsy + u * 0.008);
  ctx.lineTo(rsx + u * 0.102, rsy + u * 0.048);
  ctx.lineTo(rsx + u * 0.012, rsy + u * 0.038);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(rsx + u * 0.058, rsy + u * 0.018, u * 0.075, u * 0.024);
}

function applyGlobalWeathering(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const data = ctx.getImageData(0, 0, w, h);
  const d = data.data;
  for (let i = 0; i < d.length; i += 4) {
    const a = d[i + 3];
    if (a < 28) continue;
    const grain = (Math.random() - 0.5) * 20;
    d[i] = Math.min(255, Math.max(0, d[i] + grain));
    d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + grain));
    d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + grain));
    if (Math.random() < 0.0022) {
      const dent = 0.5 + Math.random() * 0.28;
      d[i] *= dent;
      d[i + 1] *= dent;
      d[i + 2] *= dent;
    }
  }
  ctx.putImageData(data, 0, 0);

  ctx.save();
  ctx.globalCompositeOperation = "source-atop";
  ctx.lineWidth = 1;
  for (let s = 0; s < 64; s++) {
    ctx.strokeStyle = `rgba(255,255,255,${0.03 + Math.random() * 0.08})`;
    const y = Math.random() * h;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  for (let s = 0; s < 44; s++) {
    ctx.strokeStyle = `rgba(0,0,0,${0.07 + Math.random() * 0.16})`;
    ctx.beginPath();
    ctx.moveTo(Math.random() * w, Math.random() * h);
    ctx.lineTo(Math.random() * w, Math.random() * h);
    ctx.stroke();
  }

  ctx.globalCompositeOperation = "destination-out";
  ctx.fillStyle = "#000";
  for (let s = 0; s < 70; s++) {
    ctx.beginPath();
    ctx.arc(
      Math.random() * w,
      Math.random() * h,
      Math.random() * 2.8 + 0.4,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  ctx.restore();
}

async function loadDojoStickmanIImage(): Promise<HTMLImageElement | null> {
  if (typeof Image === "undefined") return null;
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve(img.naturalWidth > 1 ? img : null);
    };
    img.onerror = () => resolve(null);
    img.src = DOJO_TITLE_STICKMAN_I_URL;
  });
}

/** Logo italic matrix `transform(0.7, 0, -0.46, 1, 0, 0)` → `x' = a*x + c*y`, `y' = y`. */
const LOGO_SKEW_A = 0.7;
const LOGO_SKEW_C = -0.46;

/**
 * Raster **I**-slot art: same **italic shear** as metallic type so the figure belongs to the lockup.
 *
 * **Sizing:** A bitmap rect `(dw, dh)` in lockup space maps to a **parallelogram** on the canvas; its
 * axis-aligned width is **`a*dw + |c|*dh`**, height **`dh`** (since `y' = y`). Using `min(slot/dw, …)`
 * in local *x* only ignores the `c*dh` term and lets **`dh` blow up** → stretched silhouette. We pick
 * one **uniform** scale `s` so both canvas bounds fit: `dh ≤ Hmax`, `a*(iw*s) + |c|*(ih*s) ≤ Wmax`.
 */
function drawStickmanIImageOrFallback(
  ctx: CanvasRenderingContext2D,
  padX: number,
  baseY: number,
  stickCx: number,
  y2: number,
  fontPx: number,
  slotPx: number,
  stickImage: HTMLImageElement | null,
  stickRelativeScale: number,
): void {
  const rel =
    Number.isFinite(stickRelativeScale) && stickRelativeScale > 0
      ? stickRelativeScale
      : DOJO_TITLE_STICKMAN_RELATIVE_SCALE_DEFAULT;
  ctx.save();
  ctx.translate(padX, baseY);
  ctx.transform(LOGO_SKEW_A, 0, LOGO_SKEW_C, 1, 0, 0);
  if (stickImage && stickImage.naturalWidth > 0) {
    const iw = stickImage.naturalWidth;
    const ih = stickImage.naturalHeight;
    const Wmax = LOGO_SKEW_A * slotPx * 0.93;
    const Hmax = fontPx * 1.12;
    const denom = LOGO_SKEW_A * iw + Math.abs(LOGO_SKEW_C) * ih;
    const sBase = Math.min(Hmax / ih, Wmax / denom);
    const s = sBase * rel;
    const dw = iw * s;
    const dh = ih * s;
    ctx.drawImage(stickImage, stickCx - dw / 2, y2 - dh / 2, dw, dh);
  } else {
    drawStickmanAsI(ctx, stickCx, y2, fontPx * rel);
  }
  ctx.restore();
}

function buildTitleLogoTexture(
  stickImage: HTMLImageElement | null,
  stickRelativeScale: number,
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) {
    throw new Error("dojoTitleLogoWall: 2d canvas context unavailable");
  }

  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

  /** Low pad → lockup anchors **canvas left** → **world +X** → **left of the opening view** (see `OFFSET_X`). */
  const padX = CANVAS_W * 0.048;
  const baseY = CANVAS_H * 0.52;
  const maxLinePx = CANVAS_W * 0.92;

  const fontStack =
    'italic 900 {px}px system-ui, Impact, "Arial Narrow", "Arial Black", sans-serif';

  let fontPx = 200;
  let wJohn = 0;
  let wSt = 0;
  let wCk = 0;
  let indent = 0;
  let slot = 0;
  let lineStep = 0;

  for (let iter = 0; iter < 18; iter++) {
    ctx.save();
    ctx.translate(padX, baseY);
    ctx.transform(LOGO_SKEW_A, 0, LOGO_SKEW_C, 1, 0, 0);
    ctx.font = fontStack.replace("{px}", String(fontPx));
    wJohn = ctx.measureText(LINE1).width;
    wSt = ctx.measureText(LINE2_A).width;
    wCk = ctx.measureText(LINE2_B).width;
    indent = line2IndentPx(fontPx, wJohn);
    slot = stickISlotPx(fontPx);
    lineStep = fontPx * 0.98;
    const wLine2 = indent + wSt + slot + wCk;
    const lineW = Math.max(wJohn, wLine2);
    ctx.restore();
    if (lineW <= maxLinePx) break;
    fontPx -= 12;
  }

  ctx.save();
  ctx.translate(padX, baseY);
  ctx.transform(LOGO_SKEW_A, 0, LOGO_SKEW_C, 1, 0, 0);
  ctx.font = fontStack.replace("{px}", String(fontPx));

  const y1 = -lineStep * 0.48;
  const y2 = lineStep * 0.54;

  drawSeriousBlockText(ctx, LINE1, 0, y1, fontPx);
  drawInternalShadeAndBlood(ctx, 0, y1, wJohn, fontPx, { gunHint: true });

  const xSt = indent;
  const stickCx = xSt + wSt + slot * 0.5;
  const xCk = xSt + wSt + slot;

  drawSeriousBlockText(ctx, LINE2_A, xSt, y2, fontPx);
  drawSeriousBlockText(ctx, LINE2_B, xCk, y2, fontPx);
  drawInternalShadeAndBlood(ctx, xSt, y2, wSt + slot + wCk, fontPx, {
    gunHint: false,
  });

  ctx.restore();

  applyGlobalWeathering(ctx, CANVAS_W, CANVAS_H);

  /** Stickman **after** weathering — pure flat ink, **italic** skew to match **ST** / **CK**. */
  drawStickmanIImageOrFallback(
    ctx,
    padX,
    baseY,
    stickCx,
    y2,
    fontPx,
    slot,
    stickImage,
    stickRelativeScale,
  );

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  return tex;
}

export type DojoTitleLogoWall = {
  group: THREE.Group;
  dispose: () => void;
  /** Dev / runtime: position, world width, and **relative** I-stick scale (rebuilds canvas if scale changes). */
  syncFromTuning(scalars: DojoTitleLogoSyncScalars): void;
};

/**
 * Uniform XY scale from dev tuning (`planeWidthM` = desired world width in meters).
 */
export function syncDojoTitleLogoWallScale(
  root: THREE.Group,
  planeWidthM: number,
): void {
  const s = planeWidthM / DOJO_TITLE_LOGO_BASE_PLANE_WIDTH_M;
  if (s > 0 && Number.isFinite(s)) {
    root.scale.set(s, s, 1);
  }
}

/** Applies dev-HUD **placement**, **world width**, and **I-stick relative scale** (texture rebuild on scale change). */
export function syncDojoTitleLogoWallFromTuning(
  wall: DojoTitleLogoWall,
  scalars: DojoTitleLogoSyncScalars,
): void {
  wall.syncFromTuning(scalars);
}

export async function createDojoTitleLogoWall(): Promise<DojoTitleLogoWall> {
  const stickImage = await loadDojoStickmanIImage();
  let lastStickRel = DOJO_TITLE_STICKMAN_RELATIVE_SCALE_DEFAULT;
  const texture = buildTitleLogoTexture(stickImage, lastStickRel);
  const mat = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 1,
    depthWrite: true,
    alphaTest: 0.06,
    side: THREE.FrontSide,
  });

  const geom = new THREE.PlaneGeometry(PLANE_W, PLANE_H);
  const mesh = new THREE.Mesh(geom, mat);
  mesh.name = "dojo_title_logo_wall";
  mesh.renderOrder = 2;

  const innerNorthZ = DOJO_BLOCKOUT.floorHalfDepth;

  const group = new THREE.Group();
  group.name = "dojo_title_logo";
  group.position.set(
    DOJO_TITLE_LOGO_DEFAULT_CENTER_WORLD_X,
    CENTER_Y,
    innerNorthZ - Z_EPS,
  );
  group.rotation.y = Math.PI;
  group.add(mesh);

  return {
    group,
    dispose: () => {
      mat.map?.dispose();
      mat.dispose();
      geom.dispose();
    },
    syncFromTuning(scalars: DojoTitleLogoSyncScalars) {
      group.position.x = scalars.centerWorldX;
      syncDojoTitleLogoWallScale(group, scalars.planeWidthM);
      const sr =
        Number.isFinite(scalars.stickRelativeScale) &&
        scalars.stickRelativeScale > 0
          ? scalars.stickRelativeScale
          : DOJO_TITLE_STICKMAN_RELATIVE_SCALE_DEFAULT;
      if (sr !== lastStickRel) {
        lastStickRel = sr;
        const prev = mat.map;
        const next = buildTitleLogoTexture(stickImage, sr);
        mat.map = next;
        mat.needsUpdate = true;
        prev?.dispose();
      }
    },
  };
}
