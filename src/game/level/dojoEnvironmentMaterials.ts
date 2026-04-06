import * as THREE from "three";

/**
 * WS-100 / GP §7.1 — Traditional dojo mood: polished warm floor, cream shōmen, side plaster,
 * dark timber beams / frames.
 */

const FLOOR_TEX_SIZE = 512;
const TAU = Math.PI * 2;

/** Honey / polished tatami-adjacent wood (reference warmth). */
const FLOOR_BASE_RGB: [number, number, number] = [0.76, 0.58, 0.42];

/** Side walls — warm neutral plaster (not cold gray). */
const SIDE_WALL_COLOR = 0x9a9a92;

/** Shōmen (front) wall — off-white. */
const SHOMEN_WALL_COLOR = 0xeae6dc;

/** Ceiling boards — pale warm wood. */
const CEILING_WOOD_COLOR = 0xc8bba8;

/** Exposed beam / frame timber. */
const BEAM_WOOD_COLOR = 0x3a2e26;

const SHOJI_TEX = 256;

/** Light paper + dark kumiko grid (read as shōji, not a flat light panel). */
function buildShojiPaperTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = SHOJI_TEX;
  canvas.height = SHOJI_TEX;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("dojoEnvironmentMaterials: 2d canvas context unavailable");
  }
  ctx.fillStyle = "#f4efe6";
  ctx.fillRect(0, 0, SHOJI_TEX, SHOJI_TEX);
  const cols = 10;
  const rows = 14;
  const cellW = SHOJI_TEX / cols;
  const cellH = SHOJI_TEX / rows;
  const line = 2;
  ctx.fillStyle = "#3d3229";
  for (let c = 0; c <= cols; c++) {
    const x = Math.round(c * cellW);
    ctx.fillRect(x - line / 2, 0, line, SHOJI_TEX);
  }
  for (let r = 0; r <= rows; r++) {
    const y = Math.round(r * cellH);
    ctx.fillRect(0, y - line / 2, SHOJI_TEX, line);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return tex;
}

function floorHeight01(u: number, v: number): number {
  let h = 0;
  h += Math.sin(TAU * u * 3) * Math.sin(TAU * v * 2) * 0.22;
  h += Math.sin(TAU * u * 11) * Math.sin(TAU * v * 7) * 0.09;
  h += Math.sin(TAU * (u * 5 + v * 3)) * 0.14;
  h += Math.sin(TAU * (u * 8 - v * 4)) * 0.1;
  h += Math.sin(TAU * u * 17) * Math.sin(TAU * v * 13) * 0.045;
  return h * 0.5 + 0.5;
}

function buildFloorMaps(): {
  albedo: THREE.CanvasTexture;
  normal: THREE.DataTexture;
  roughness: THREE.DataTexture;
} {
  const n = FLOOR_TEX_SIZE;
  const albedoCanvas = document.createElement("canvas");
  albedoCanvas.width = n;
  albedoCanvas.height = n;
  const ctx = albedoCanvas.getContext("2d");
  if (!ctx) {
    throw new Error("dojoEnvironmentMaterials: 2d canvas context unavailable");
  }

  const albedoImg = ctx.createImageData(n, n);
  const ad = albedoImg.data;

  const heights = new Float32Array(n * n);

  for (let y = 0; y < n; y++) {
    const v = (y + 0.5) / n;
    for (let x = 0; x < n; x++) {
      const u = (x + 0.5) / n;
      heights[y * n + x] = floorHeight01(u, v);
    }
  }

  const normalData = new Uint8Array(n * n * 4);
  const roughData = new Uint8Array(n * n * 4);

  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const xp = (x + 1) % n;
      const xm = (x - 1 + n) % n;
      const yp = (y + 1) % n;
      const ym = (y - 1 + n) % n;
      const h = heights[y * n + x];
      const hxp = heights[y * n + xp];
      const hxm = heights[y * n + xm];
      const hyp = heights[yp * n + x];
      const hym = heights[ym * n + x];

      const dhds = (hxp - hxm) * 0.5;
      const dhdv = (hyp - hym) * 0.5;
      const bumpStr = 2.45;
      let nx = -dhds * bumpStr;
      let ny = -dhdv * bumpStr;
      let nz = 1;
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
      nx /= len;
      ny /= len;
      nz /= len;

      const li = (y * n + x) * 4;
      normalData[li] = Math.floor(THREE.MathUtils.clamp(nx * 0.5 + 0.5, 0, 1) * 255);
      normalData[li + 1] = Math.floor(THREE.MathUtils.clamp(ny * 0.5 + 0.5, 0, 1) * 255);
      normalData[li + 2] = Math.floor(THREE.MathUtils.clamp(nz * 0.5 + 0.5, 0, 1) * 255);
      normalData[li + 3] = 255;

      const rough = THREE.MathUtils.clamp(
        0.14 + h * 0.22 + Math.abs(hxp - h) * 0.1,
        0.08,
        0.38,
      );
      const rb = Math.floor(rough * 255);
      roughData[li] = rb;
      roughData[li + 1] = rb;
      roughData[li + 2] = rb;
      roughData[li + 3] = 255;

      const v = (y + 0.5) / n;
      const plankGroove = Math.sin(TAU * v * 18) * 0.035;
      const warm = 1 + (h - 0.5) * 0.38;
      const grain = (hxp - h) * 0.16;
      const f = THREE.MathUtils.clamp(warm + grain - plankGroove, 0.84, 1.22);
      ad[li] = Math.floor(
        THREE.MathUtils.clamp(FLOOR_BASE_RGB[0] * f * 255, 0, 255),
      );
      ad[li + 1] = Math.floor(
        THREE.MathUtils.clamp(FLOOR_BASE_RGB[1] * f * 255, 0, 255),
      );
      ad[li + 2] = Math.floor(
        THREE.MathUtils.clamp(FLOOR_BASE_RGB[2] * f * 255, 0, 255),
      );
      ad[li + 3] = 255;
    }
  }

  ctx.putImageData(albedoImg, 0, 0);
  const albedo = new THREE.CanvasTexture(albedoCanvas);
  albedo.wrapS = THREE.RepeatWrapping;
  albedo.wrapT = THREE.RepeatWrapping;
  albedo.colorSpace = THREE.SRGBColorSpace;
  albedo.anisotropy = 8;
  albedo.minFilter = THREE.LinearMipmapLinearFilter;
  albedo.magFilter = THREE.LinearFilter;
  albedo.generateMipmaps = true;

  const normal = new THREE.DataTexture(normalData, n, n, THREE.RGBAFormat);
  normal.wrapS = THREE.RepeatWrapping;
  normal.wrapT = THREE.RepeatWrapping;
  normal.colorSpace = THREE.NoColorSpace;
  normal.anisotropy = 8;
  normal.minFilter = THREE.LinearMipmapLinearFilter;
  normal.magFilter = THREE.LinearFilter;
  normal.generateMipmaps = true;
  normal.flipY = false;
  normal.needsUpdate = true;

  const roughness = new THREE.DataTexture(roughData, n, n, THREE.RGBAFormat);
  roughness.wrapS = THREE.RepeatWrapping;
  roughness.wrapT = THREE.RepeatWrapping;
  roughness.colorSpace = THREE.NoColorSpace;
  roughness.anisotropy = 8;
  roughness.minFilter = THREE.LinearMipmapLinearFilter;
  roughness.magFilter = THREE.LinearFilter;
  roughness.generateMipmaps = true;
  roughness.flipY = false;
  roughness.needsUpdate = true;

  return { albedo, normal, roughness };
}

export type DojoEnvironmentMaterials = {
  floor: THREE.MeshStandardMaterial;
  sideWall: THREE.MeshStandardMaterial;
  shomenWall: THREE.MeshStandardMaterial;
  ceilingWood: THREE.MeshStandardMaterial;
  beamWood: THREE.MeshStandardMaterial;
  shojiGlow: THREE.MeshStandardMaterial;
  scrollPaper: THREE.MeshStandardMaterial;
  scrollInk: THREE.MeshStandardMaterial;
  textures: THREE.Texture[];
  dispose: () => void;
};

const FLOOR_METERS_PER_TEXTURE_PERIOD = 5.5;

export function createDojoEnvironmentMaterials(
  floorHalfWidth: number,
  floorHalfDepth: number,
): DojoEnvironmentMaterials {
  const { albedo, normal, roughness } = buildFloorMaps();
  const ru = (floorHalfWidth * 2) / FLOOR_METERS_PER_TEXTURE_PERIOD;
  const rv = (floorHalfDepth * 2) / FLOOR_METERS_PER_TEXTURE_PERIOD;
  albedo.repeat.set(ru, rv);
  normal.repeat.set(ru, rv);
  roughness.repeat.set(ru, rv);

  const floor = new THREE.MeshStandardMaterial({
    map: albedo,
    normalMap: normal,
    normalScale: new THREE.Vector2(0.48, -0.48),
    roughnessMap: roughness,
    roughness: 0.92,
    metalness: 0.02,
    color: 0xffffff,
  });

  const sideWall = new THREE.MeshStandardMaterial({
    color: SIDE_WALL_COLOR,
    roughness: 0.82,
    metalness: 0.04,
  });

  const shomenWall = new THREE.MeshStandardMaterial({
    color: SHOMEN_WALL_COLOR,
    roughness: 0.88,
    metalness: 0.02,
  });

  const ceilingWood = new THREE.MeshStandardMaterial({
    color: CEILING_WOOD_COLOR,
    roughness: 0.72,
    metalness: 0.03,
  });

  const beamWood = new THREE.MeshStandardMaterial({
    color: BEAM_WOOD_COLOR,
    roughness: 0.68,
    metalness: 0.05,
  });

  const shojiPaperMap = buildShojiPaperTexture();
  const shojiGlow = new THREE.MeshStandardMaterial({
    map: shojiPaperMap,
    color: 0xffffff,
    emissive: 0xfff3e5,
    /** Backlight feel without blowing out the whole wall. */
    emissiveIntensity: 0.2,
    roughness: 0.9,
    metalness: 0,
  });

  const scrollPaper = new THREE.MeshStandardMaterial({
    color: 0xf2eee4,
    roughness: 0.9,
    metalness: 0,
  });

  const scrollInk = new THREE.MeshStandardMaterial({
    color: 0x1a1816,
    roughness: 0.75,
    metalness: 0.02,
  });

  const textures: THREE.Texture[] = [albedo, normal, roughness];

  return {
    floor,
    sideWall,
    shomenWall,
    ceilingWood,
    beamWood,
    shojiGlow,
    scrollPaper,
    scrollInk,
    textures,
    dispose() {
      floor.dispose();
      sideWall.dispose();
      shomenWall.dispose();
      ceilingWood.dispose();
      beamWood.dispose();
      shojiGlow.dispose();
      scrollPaper.dispose();
      scrollInk.dispose();
      for (const t of textures) {
        t.dispose();
      }
    },
  };
}
