import * as THREE from "three";

import {
  DOJO_SIGN_TITLE_COMBAT,
  DOJO_SIGN_TITLE_MOVEMENT,
  dojoSignCombatBodyLines,
  dojoSignMovementBodyLines,
} from "./dojoSignCopy";

/**
 * WS-101 / GP §7.1.3 — sign kiosks: placement on ±120° from spawn **+Z** (toward the bag),
 * inward-facing boards, capsule interaction footprint.
 */
const PLACE_RADIUS = 5.2;
const DEG_120 = (2 * Math.PI) / 3;

/** Horizontal capsule radius (m); vertical span for standing player. */
export const DOJO_SIGN_INTERACT_RADIUS_XZ = 1.2;
export const DOJO_SIGN_INTERACT_Y_MIN = 0;
export const DOJO_SIGN_INTERACT_Y_MAX = 2.15;

export type DojoSignKioskSpec = {
  id: string;
  x: number;
  z: number;
};

export const DOJO_SIGN_KIOSK_SPECS: readonly DojoSignKioskSpec[] = [
  {
    id: "dojo_sign_east",
    x: PLACE_RADIUS * Math.sin(DEG_120),
    z: PLACE_RADIUS * Math.cos(DEG_120),
  },
  {
    id: "dojo_sign_west",
    x: PLACE_RADIUS * Math.sin(-DEG_120),
    z: PLACE_RADIUS * Math.cos(-DEG_120),
  },
];

export type DojoSignInteractVolume = {
  x: number;
  z: number;
  yMin: number;
  yMax: number;
  radiusXZ: number;
};

function buildSignPanelTexture(
  title: string,
  bodyLines: string[],
): THREE.CanvasTexture {
  const w = 640;
  const h = 880;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("dojoSignKiosks: 2d canvas context unavailable");
  }

  ctx.fillStyle = "#f0ebe2";
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "#3a2e26";
  ctx.lineWidth = 10;
  ctx.strokeRect(5, 5, w - 10, h - 10);

  ctx.fillStyle = "#2a221c";
  ctx.textAlign = "center";
  ctx.font = '600 28px system-ui, "Segoe UI", sans-serif';
  ctx.fillText(title, w / 2, 56);

  ctx.textAlign = "left";
  ctx.font = '22px system-ui, "Segoe UI", sans-serif';
  let y = 118;
  const lh = 34;
  const padX = 44;
  for (const line of bodyLines) {
    ctx.fillText(line, padX, y);
    y += lh;
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  return tex;
}

const FRAME_MAT = new THREE.MeshStandardMaterial({
  color: 0x3a2e26,
  roughness: 0.82,
  metalness: 0.06,
});

const POST_W = 0.11;
const POST_D = 0.11;
const POST_H = 0.95;
const BOARD_W = 0.58;
const BOARD_H = 0.86;
const BOARD_Y = POST_H + BOARD_H * 0.5 - 0.02;

export type DojoSignKiosks = {
  group: THREE.Group;
  interactVolumes: readonly DojoSignInteractVolume[];
  textures: THREE.CanvasTexture[];
  dispose: () => void;
};

export function createDojoSignKiosks(): DojoSignKiosks {
  const root = new THREE.Group();
  root.name = "dojo_sign_kiosks";

  const textures: THREE.CanvasTexture[] = [];
  const movementTex = buildSignPanelTexture(
    DOJO_SIGN_TITLE_MOVEMENT,
    dojoSignMovementBodyLines(),
  );
  const combatTex = buildSignPanelTexture(
    DOJO_SIGN_TITLE_COMBAT,
    dojoSignCombatBodyLines(),
  );
  textures.push(movementTex, combatTex);

  const panelMats = [
    new THREE.MeshStandardMaterial({
      map: movementTex,
      roughness: 0.78,
      metalness: 0.04,
    }),
    new THREE.MeshStandardMaterial({
      map: combatTex,
      roughness: 0.78,
      metalness: 0.04,
    }),
  ];

  const specs: { spec: DojoSignKioskSpec; texIndex: 0 | 1 }[] = [
    { spec: DOJO_SIGN_KIOSK_SPECS[0], texIndex: 0 },
    { spec: DOJO_SIGN_KIOSK_SPECS[1], texIndex: 1 },
  ];

  for (const { spec, texIndex } of specs) {
    const { x, z } = spec;
    const kiosk = new THREE.Group();
    kiosk.name = spec.id;
    kiosk.position.set(x, 0, z);

    const post = new THREE.Mesh(
      new THREE.BoxGeometry(POST_W, POST_H, POST_D),
      FRAME_MAT,
    );
    post.position.set(0, POST_H * 0.5, 0);
    post.castShadow = true;
    post.receiveShadow = true;
    kiosk.add(post);

    const board = new THREE.Mesh(
      new THREE.PlaneGeometry(BOARD_W, BOARD_H),
      panelMats[texIndex],
    );
    board.name = `${spec.id}_panel`;
    board.castShadow = true;
    board.receiveShadow = true;

    const normal = new THREE.Vector3(-x, 0, -z).normalize();
    board.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      normal,
    );
    board.position.set(0, BOARD_Y, 0);

    const frameBorder = 0.04;
    const frameW = BOARD_W + frameBorder * 2;
    const frameH = BOARD_H + frameBorder * 2;
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(frameW, frameH, 0.05),
      FRAME_MAT,
    );
    frame.position.set(0, BOARD_Y, 0);
    frame.quaternion.copy(board.quaternion);
    frame.translateZ(-0.03);
    frame.castShadow = true;
    frame.receiveShadow = true;

    kiosk.add(frame);
    kiosk.add(board);
    root.add(kiosk);
  }

  const interactVolumes: DojoSignInteractVolume[] = DOJO_SIGN_KIOSK_SPECS.map(
    (s) => ({
      x: s.x,
      z: s.z,
      yMin: DOJO_SIGN_INTERACT_Y_MIN,
      yMax: DOJO_SIGN_INTERACT_Y_MAX,
      radiusXZ: DOJO_SIGN_INTERACT_RADIUS_XZ,
    }),
  );

  return {
    group: root,
    interactVolumes,
    textures,
    dispose(): void {
      for (const t of textures) {
        t.dispose();
      }
      for (const m of panelMats) {
        m.dispose();
      }
    },
  };
}

export function pointInDojoSignVolume(
  px: number,
  py: number,
  pz: number,
  v: DojoSignInteractVolume,
): boolean {
  const dx = px - v.x;
  const dz = pz - v.z;
  return (
    dx * dx + dz * dz <= v.radiusXZ * v.radiusXZ &&
    py >= v.yMin &&
    py <= v.yMax
  );
}

export function isPlayerInAnyDojoSignVolume(
  px: number,
  py: number,
  pz: number,
  volumes: readonly DojoSignInteractVolume[],
): boolean {
  for (const v of volumes) {
    if (pointInDojoSignVolume(px, py, pz, v)) return true;
  }
  return false;
}

/** Among volumes containing the point, pick the kiosk with smallest horizontal distance. */
export function resolveNearestDojoSignKioskIndex(
  px: number,
  py: number,
  pz: number,
  volumes: readonly DojoSignInteractVolume[],
): number | null {
  let bestI: number | null = null;
  let bestD2 = Infinity;
  for (let i = 0; i < volumes.length; i++) {
    const v = volumes[i];
    if (!pointInDojoSignVolume(px, py, pz, v)) continue;
    const dx = px - v.x;
    const dz = pz - v.z;
    const d2 = dx * dx + dz * dz;
    if (d2 < bestD2) {
      bestD2 = d2;
      bestI = i;
    }
  }
  return bestI;
}

/**
 * Character forward in XZ matches `moveFromFacing.ts` (yaw 0 → +Z).
 * `maxHalfAngleRad` is half of the total “in front” cone width.
 */
export function isPlayerFacingPointXZ(
  px: number,
  pz: number,
  facingYawRad: number,
  targetX: number,
  targetZ: number,
  maxHalfAngleRad: number,
): boolean {
  const dx = targetX - px;
  const dz = targetZ - pz;
  const len = Math.hypot(dx, dz);
  if (len < 0.32) return true;
  const inv = 1 / len;
  const tx = dx * inv;
  const tz = dz * inv;
  const fx = Math.sin(facingYawRad);
  const fz = Math.cos(facingYawRad);
  const dot = fx * tx + fz * tz;
  return dot >= Math.cos(maxHalfAngleRad);
}

/** ~50° total cone — must face roughly toward the kiosk board, not just stand in volume. */
export const DOJO_SIGN_READ_PROMPT_HALF_ANGLE_RAD = THREE.MathUtils.degToRad(25);

export function getDojoSignReadPromptState(opts: {
  px: number;
  py: number;
  pz: number;
  facingYawRad: number;
  volumes: readonly DojoSignInteractVolume[];
}): { inRange: boolean; facingSign: boolean } {
  const ki = resolveNearestDojoSignKioskIndex(
    opts.px,
    opts.py,
    opts.pz,
    opts.volumes,
  );
  if (ki === null) {
    return { inRange: false, facingSign: false };
  }
  const spec = DOJO_SIGN_KIOSK_SPECS[ki];
  const facingSign = isPlayerFacingPointXZ(
    opts.px,
    opts.pz,
    opts.facingYawRad,
    spec.x,
    spec.z,
    DOJO_SIGN_READ_PROMPT_HALF_ANGLE_RAD,
  );
  return { inRange: true, facingSign };
}
