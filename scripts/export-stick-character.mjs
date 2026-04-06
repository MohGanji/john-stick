/**
 * WS-041 / GP §5.3.1 — Regenerate `public/models/char_player_stick_v01.glb`.
 * Run: `node scripts/export-stick-character.mjs`
 *
 * V1 mesh: **hero silhouette** — large **sphere** head, short **neck**, **blocky** torso (head-width read),
 * long **legs (~60% height)**, **mitten** hands, **wide stance**, **pill** feet.
 * Two torso bones (`Spine` + `Chest`) for bend/twist.
 *
 * **Canonical 2D ref (proportions + look):** `docs/reference/logo/dojo-stickman-i.png`
 * (runtime copy: `public/logo/dojo-stickman-i.png`). Match that read in 3D; older PNGs under
 * `docs/reference/character/` are supporting mood refs.
 *
 * **Back katana:** optional mesh — default **off** (set `EXPORT_BACK_KATANA` to `true` below to include).
 * Replace with Blender when art lands; keep clip names **Idle** and **Walk** for the runtime.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/* GLTFExporter uses FileReader for GLB assembly (browser-only in stock three.js). */
if (typeof globalThis.FileReader === "undefined") {
  globalThis.FileReader = class {
    readAsArrayBuffer(blob) {
      void (async () => {
        this.result = await blob.arrayBuffer();
        queueMicrotask(() => this.onloadend?.());
      })();
    }
    readAsDataURL(blob) {
      void (async () => {
        const buf = await blob.arrayBuffer();
        const b64 = Buffer.from(buf).toString("base64");
        this.result = `data:application/octet-stream;base64,${b64}`;
        queueMicrotask(() => this.onloadend?.());
      })();
    }
  };
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, "..", "public", "models", "char_player_stick_v01.glb");

/** `true` = add Chest-weighted katana on back (same bone hierarchy either way). */
const EXPORT_BACK_KATANA = false;

/** @param {THREE.BufferGeometry} geom @param {number} boneIndex */
function applySkin(geom, boneIndex) {
  const n = geom.attributes.position.count;
  const skinIndex = new Uint16Array(n * 4);
  const skinWeight = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    skinIndex[i * 4] = boneIndex;
    skinWeight[i * 4] = 1;
  }
  geom.setAttribute("skinIndex", new THREE.BufferAttribute(skinIndex, 4));
  geom.setAttribute("skinWeight", new THREE.BufferAttribute(skinWeight, 4));
}

const _va = new THREE.Vector3();
const _vb = new THREE.Vector3();
const _mid = new THREE.Vector3();
const _yUp = new THREE.Vector3(0, 1, 0);
const _qSeg = new THREE.Quaternion();
const _dirSeg = new THREE.Vector3();

/**
 * Right circular cylinder along segment A→B (flat caps). 100% weighted to `boneIndex`.
 * @param {[number, number, number]} a
 * @param {[number, number, number]} b
 */
function skinCylinderSegment(a, b, radius, boneIndex) {
  _va.set(a[0], a[1], a[2]);
  _vb.set(b[0], b[1], b[2]);
  const len = _va.distanceTo(_vb);
  _mid.copy(_va).add(_vb).multiplyScalar(0.5);

  if (len < 1e-6) {
    const g = new THREE.SphereGeometry(radius, 12, 10);
    g.translate(_mid.x, _mid.y, _mid.z);
    applySkin(g, boneIndex);
    return g;
  }

  const g = new THREE.CylinderGeometry(radius, radius, len, 14, 1, false);
  _dirSeg.subVectors(_vb, _va).normalize();
  _qSeg.setFromUnitVectors(_yUp, _dirSeg);
  g.applyQuaternion(_qSeg);
  g.translate(_mid.x, _mid.y, _mid.z);
  applySkin(g, boneIndex);
  return g;
}

/** @param {[number, number, number]} c @param {number} boneIndex */
function skinSphere(c, radius, boneIndex) {
  const g = new THREE.SphereGeometry(radius, 22, 16);
  g.translate(c[0], c[1], c[2]);
  applySkin(g, boneIndex);
  return g;
}

/**
 * Bind pose: thick rounded tubes + wide legs (canonical ref silhouette in 3D).
 * Bone index order must match `bones[]` below.
 */
function buildBindPoseBones() {
  const hips = new THREE.Bone();
  hips.name = "Hips";

  const spine = new THREE.Bone();
  spine.name = "Spine";
  spine.position.set(0, 0.11, 0);
  hips.add(spine);

  const chest = new THREE.Bone();
  chest.name = "Chest";
  chest.position.set(0, 0.15, 0);
  spine.add(chest);

  const head = new THREE.Bone();
  head.name = "Head";
  head.position.set(0, 0.28, 0);
  chest.add(head);

  const shoulderL = new THREE.Bone();
  shoulderL.name = "ShoulderL";
  shoulderL.position.set(-0.17, 0.11, 0.02);
  chest.add(shoulderL);

  const armL = new THREE.Bone();
  armL.name = "ArmL";
  armL.position.set(-0.22, -0.09, 0.055);
  shoulderL.add(armL);

  const shoulderR = new THREE.Bone();
  shoulderR.name = "ShoulderR";
  shoulderR.position.set(0.17, 0.11, -0.02);
  chest.add(shoulderR);

  const armR = new THREE.Bone();
  armR.name = "ArmR";
  armR.position.set(0.22, -0.09, -0.055);
  shoulderR.add(armR);

  const legUL = new THREE.Bone();
  legUL.name = "LegUpperL";
  legUL.position.set(-0.1, -0.04, 0.04);
  hips.add(legUL);

  const legLL = new THREE.Bone();
  legLL.name = "LegLowerL";
  /** Matches upper/lower segments in `buildMergedGeometry`. */
  legLL.position.set(-0.017, -0.398, 0.017);
  legUL.add(legLL);

  const legUR = new THREE.Bone();
  legUR.name = "LegUpperR";
  legUR.position.set(0.1, -0.04, -0.04);
  hips.add(legUR);

  const legLR = new THREE.Bone();
  legLR.name = "LegLowerR";
  legLR.position.set(0.017, -0.398, -0.017);
  legUR.add(legLR);

  const bones = [
    hips,
    spine,
    chest,
    head,
    shoulderL,
    armL,
    shoulderR,
    armR,
    legUL,
    legLL,
    legUR,
    legLR,
  ];
  return { hips, bones };
}

function buildMergedGeometry() {
  /** Radii stay in sync with `trainingDummyRagdollConfig`. Silhouette chases `dojo-stickman-i.png`. */
  const limbR = 0.034;
  const torsoLowerR = 0.039;
  const torsoUpperR = 0.043;
  const pelvisR = 0.043;
  const neckR = 0.017;
  const headR = 0.088;

  const parts = [
    skinCylinderSegment([0, -0.115, 0], [0, 0.05, 0], pelvisR, 0),
    skinCylinderSegment([0, 0.05, 0], [0, 0.22, 0], torsoLowerR, 1),
    skinCylinderSegment([0, 0.22, 0], [0, 0.39, 0], torsoUpperR, 2),
    skinCylinderSegment([0, 0.39, 0], [0, 0.48, 0], neckR, 2),
    skinSphere([0, 0.575, 0], headR, 3),
    skinCylinderSegment([-0.165, 0.352, 0.015], [-0.292, 0.288, 0.055], limbR, 4),
    skinCylinderSegment([-0.292, 0.288, 0.055], [-0.392, 0.092, 0.088], limbR * 0.92, 5),
    skinSphere([-0.415, 0.026, 0.095], limbR * 1.06, 5),
    skinCylinderSegment([0.165, 0.352, -0.015], [0.292, 0.288, -0.055], limbR, 6),
    skinCylinderSegment([0.292, 0.288, -0.055], [0.392, 0.092, -0.088], limbR * 0.92, 7),
    skinSphere([0.415, 0.026, -0.095], limbR * 1.06, 7),
    skinCylinderSegment([-0.098, -0.038, 0.038], [-0.112, -0.432, 0.056], limbR, 8),
    skinCylinderSegment([-0.112, -0.432, 0.056], [-0.142, -0.805, 0.074], limbR * 0.95, 9),
    skinSphere([-0.152, -0.872, 0.078], limbR * 0.98, 9),
    skinCylinderSegment([0.098, -0.038, -0.038], [0.112, -0.432, -0.056], limbR, 10),
    skinCylinderSegment([0.112, -0.432, -0.056], [0.142, -0.805, -0.074], limbR * 0.95, 11),
    skinSphere([0.152, -0.872, -0.078], limbR * 0.98, 11),
  ];
  if (EXPORT_BACK_KATANA) {
    const katanaBladeR = 0.013;
    const katanaGuardR = 0.026;
    parts.push(
      skinCylinderSegment([0.118, 0.455, 0.018], [-0.132, 0.045, -0.118], katanaBladeR, 2),
      skinSphere([0.098, 0.448, 0.008], katanaGuardR, 2),
    );
  }
  const merged = mergeGeometries(parts, false);
  merged.computeVertexNormals();
  return merged;
}

const q = new THREE.Quaternion();
const euler = new THREE.Euler();

/**
 * @param {string} boneName
 * @param {number[]} timesSec
 * @param {Array<[number, number, number]>} eulerDegKeyframes xyz deg per key (same length as times)
 */
function quatTrack(boneName, timesSec, eulerDegKeyframes) {
  const values = [];
  for (let k = 0; k < timesSec.length; k++) {
    const [ex, ey, ez] = eulerDegKeyframes[k];
    euler.set(
      THREE.MathUtils.degToRad(ex),
      THREE.MathUtils.degToRad(ey),
      THREE.MathUtils.degToRad(ez),
      "XYZ",
    );
    q.setFromEuler(euler);
    values.push(q.x, q.y, q.z, q.w);
  }
  return new THREE.QuaternionKeyframeTrack(
    `${boneName}.quaternion`,
    timesSec,
    values,
  );
}

/** @param {string} boneName */
function posTrack(boneName, timesSec, keyPositions) {
  const values = [];
  for (const p of keyPositions) {
    values.push(p[0], p[1], p[2]);
  }
  return new THREE.VectorKeyframeTrack(`${boneName}.position`, timesSec, values);
}

function buildIdleClip() {
  const times = [0, 1.5, 3];
  const tracks = [
    quatTrack(
      "Spine",
      times,
      [
        [0, 0, 0],
        [1.8, 0, 0],
        [0, 0, 0],
      ],
    ),
    quatTrack(
      "Chest",
      times,
      [
        [0, 0, 0],
        [-1.2, 0, 0],
        [0, 0, 0],
      ],
    ),
    quatTrack(
      "Head",
      times,
      [
        [0, 0, 0],
        [0, 3.5, 0],
        [0, 0, 0],
      ],
    ),
    posTrack(
      "Spine",
      times,
      [
        [0, 0.11, 0],
        [0, 0.115, 0],
        [0, 0.11, 0],
      ],
    ),
    posTrack(
      "Chest",
      times,
      [
        [0, 0.15, 0],
        [0, 0.155, 0],
        [0, 0.15, 0],
      ],
    ),
  ];
  const clip = new THREE.AnimationClip("Idle", -1, tracks);
  clip.resetDuration();
  return clip;
}

function buildWalkClip() {
  const T = 0.7;
  const times = [0, T * 0.25, T * 0.5, T * 0.75, T];
  const clip = new THREE.AnimationClip(
    "Walk",
    -1,
    [
      quatTrack(
        "LegUpperL",
        times,
        [
          [25, 0, 0],
          [0, 0, 0],
          [-18, 0, 0],
          [0, 0, 0],
          [25, 0, 0],
        ],
      ),
      quatTrack(
        "LegLowerL",
        times,
        [
          [0, 0, 0],
          [12, 0, 0],
          [35, 0, 0],
          [12, 0, 0],
          [0, 0, 0],
        ],
      ),
      quatTrack(
        "LegUpperR",
        times,
        [
          [-18, 0, 0],
          [0, 0, 0],
          [25, 0, 0],
          [0, 0, 0],
          [-18, 0, 0],
        ],
      ),
      quatTrack(
        "LegLowerR",
        times,
        [
          [35, 0, 0],
          [12, 0, 0],
          [0, 0, 0],
          [12, 0, 0],
          [35, 0, 0],
        ],
      ),
      quatTrack(
        "ArmL",
        times,
        [
          [-22, 8, 0],
          [-10, 4, 0],
          [18, -4, 0],
          [-10, 4, 0],
          [-22, 8, 0],
        ],
      ),
      quatTrack(
        "ArmR",
        times,
        [
          [18, -8, 0],
          [-10, -4, 0],
          [-22, 8, 0],
          [-10, -4, 0],
          [18, -8, 0],
        ],
      ),
      quatTrack(
        "Spine",
        times,
        [
          [3, 0, 0],
          [1, 0, 0],
          [3, 0, 0],
          [1, 0, 0],
          [3, 0, 0],
        ],
      ),
      quatTrack(
        "Chest",
        times,
        [
          [-2, 0, 0],
          [-4, 0, 0],
          [-2, 0, 0],
          [-4, 0, 0],
          [-2, 0, 0],
        ],
      ),
      posTrack(
        "Hips",
        times,
        [
          [0, 0, 0],
          [0, 0.02, 0],
          [0, 0, 0],
          [0, 0.02, 0],
          [0, 0, 0],
        ],
      ),
    ],
  );
  clip.resetDuration();
  return clip;
}

async function main() {
  const scene = new THREE.Scene();
  scene.name = "StickExportRoot";

  const { hips, bones } = buildBindPoseBones();
  const geom = buildMergedGeometry();
  const mat = new THREE.MeshStandardMaterial({
    color: 0x0d0d0d,
    roughness: 0.42,
    metalness: 0.04,
  });
  const skinned = new THREE.SkinnedMesh(geom, mat);
  /** Root node name — matches `docs/CHARACTER_RIG_MAP.md` asset id. */
  skinned.name = "char_player_stick_v01";
  skinned.castShadow = true;
  skinned.receiveShadow = true;

  const skeleton = new THREE.Skeleton(bones);
  skinned.add(hips);
  skinned.bind(skeleton);
  skinned.updateMatrixWorld(true);

  /* Skinned mesh as scene root avoids NODE_SKINNED_MESH_NON_ROOT validator noise. */
  scene.add(skinned);

  const idleClip = buildIdleClip();
  const walkClip = buildWalkClip();

  const exporter = new GLTFExporter();
  const arrayBuffer = await exporter.parseAsync(scene, {
    binary: true,
    animations: [idleClip, walkClip],
  });

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, Buffer.from(arrayBuffer));
  console.log("Wrote", outPath, `(${arrayBuffer.byteLength} bytes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
