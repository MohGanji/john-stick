import * as THREE from "three";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

import type { StrikeMoveId } from "../input/combatIntent";
import { PLAYER_CAPSULE, playerCapsuleCenterY } from "./playerCapsuleConfig";
import { strikePresentationClipName } from "./strikePresentation";

/**
 * **Parametric** stick (`npm run export:character`) — exact **`Hips` / `Spine` / …** names for tooling
 * and retarget experiments. Not **`STICKMAN_BASE_GLTF_URL`** (Stick_FRig hero).
 */
export const PLAYER_GLTF_URL_PROCEDURAL = "/models/char_player_stick_v01.glb";

/**
 * **Single shipped hero** — Stick_FRig: `source_assets/Stick_FRig_V15.blend` →
 * `scripts/blender/export_stick_frig_hero_glb.py` → **`stick_frig_v15_hero.glb`**.
 *
 * **Animations** — The runtime plays **glTF clips by name** (`Idle`, `Walk`, strike names from
 * `strikePresentationClipName`, etc.). Author and export them **in Blender** on this armature. There is
 * **no** in-game library that retargets Mixamo (or any other skeleton) onto this rig.
 *
 * **Physics / ragdoll** — Uses **logical bone slots** (`Hips`, `Spine`, …) in `TRAINING_DUMMY_RAGDOLL_*`.
 * `TRAINING_DUMMY_RAGDOLL_BONE_NAME_FALLBACKS` maps each slot to **actual glTF bone names** (Stick_FRig
 * first; extra strings are only for `gltfUrlOverride` experiments or legacy assets).
 */
export const STICKMAN_BASE_GLTF_URL = "/models/stick_frig_v15_hero.glb";

/** Alias — same URL as `STICKMAN_BASE_GLTF_URL` (explicit “hero” name for imports). */
export const PLAYER_GLTF_URL_STICKMAN_HERO = STICKMAN_BASE_GLTF_URL;

/** Same as `STICKMAN_BASE_GLTF_URL`. */
export const PLAYER_GLTF_URL_CANONICAL = STICKMAN_BASE_GLTF_URL;

/**
 * @deprecated Use **`STICKMAN_BASE_GLTF_URL`** or **`PLAYER_GLTF_URL_STICKMAN_HERO`**.
 */
export const PLAYER_GLTF_URL_MIXAMO_FOUNDATION = STICKMAN_BASE_GLTF_URL;

/**
 * @deprecated Use **`STICKMAN_BASE_GLTF_URL`**.
 */
export const PLAYER_GLTF_URL_SKETCHFAB_KAISOON = STICKMAN_BASE_GLTF_URL;

/**
 * Removed from repo — failed headless capsule experiment. Symbol kept only for stray tooling references.
 */
export const PLAYER_GLTF_URL_THICK_CAPSULE_AUTOMATION_BROKEN =
  "/models/char_thick_capsule_mixamo_v01.glb";

/** @deprecated Use `STICKMAN_BASE_GLTF_URL` (same value). */
export const PLAYER_GLTF_URL = STICKMAN_BASE_GLTF_URL;

/**
 * Bump when stickman `.glb` files under `public/models/` change in dev so the browser does not serve
 * a stale cache for the same URL.
 */
const DEV_STICKMAN_GLB_CACHE_BUST = 10;

function withDevCacheBustStickmanGlb(url: string): string {
  if (!import.meta.env.DEV) return url;
  const base = url.split("?")[0];
  const knownBases = new Set<string>([
    STICKMAN_BASE_GLTF_URL,
    PLAYER_GLTF_URL_STICKMAN_HERO,
    PLAYER_GLTF_URL_CANONICAL,
    PLAYER_GLTF_URL_PROCEDURAL,
    PLAYER_GLTF_URL_MIXAMO_FOUNDATION,
    PLAYER_GLTF_URL_SKETCHFAB_KAISOON,
    PLAYER_GLTF_URL_THICK_CAPSULE_AUTOMATION_BROKEN,
  ]);
  if (!knownBases.has(base)) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}cbStickman=${DEV_STICKMAN_GLB_CACHE_BUST}`;
}

export const PLAYER_ANIM_IDLE = "Idle";
export const PLAYER_ANIM_WALK = "Walk";

export type LoadPlayerCharacterOptions = {
  /**
   * Instance look: `training_dummy` / `sparring_partner` tint materials so lab targets read distinct.
   * All roles load `STICKMAN_BASE_GLTF_URL` (or `gltfUrlOverride`).
   */
  appearance?: "player" | "training_dummy" | "sparring_partner";
  /** Dev / tools: load another glb without editing `STICKMAN_BASE_GLTF_URL`. */
  gltfUrlOverride?: string;
};

const CROSS_FADE_SEC = 0.14;
const WALK_BLEND_THRESHOLD = 0.06;

export type PlayerCharacter = {
  /** Add to scene; sync from capsule each frame. */
  readonly root: THREE.Object3D;
  updateLocomotionAnim(
    dtSeconds: number,
    opts: { planarInput: number; grounded: boolean; freezePose?: boolean },
  ): void;
  /**
   * WS-081 — if `strikePresentationClipName(moveId)` exists in the glb, briefly cross-fade to it
   * and back to Idle/Walk when the clip finishes.
   */
  beginStrikePresentation(moveId: StrikeMoveId): void;
  dispose(): void;
};

/** ~standing extent from foot to head read vs gameplay capsule. */
const PLAYER_VISUAL_TARGET_HEIGHT =
  PLAYER_CAPSULE.halfHeight * 2 + PLAYER_CAPSULE.radius * 2;

/**
 * Off-the-shelf glTF is often Y-up but wrong scale; skin root may not sit at feet.
 * `lateUpdate` places **`wrapped`** at the **capsule center** (`bootstrap.ts`). So the lowest sensible
 * foot contact in **local** space must sit **`playerCapsuleCenterY()`** below `wrapped` origin — same
 * offset Rapier uses from floor to capsule center (`playerCapsuleConfig.ts`). Without that, the mesh
 * floats; walk hip-bob then flickers between “almost touching” and “high” frames.
 *
 * Uses the clip that matches **what plays first** (idle). Aligning with **Walk** at t=0 while the
 * default state is **Idle** leaves hips/feet higher → visible hover in front of the dojo floor.
 * Falls back to **`walkClip`** when idle and walk are the same reference.
 *
 * Samples at **t = 0** and uses **`setFromObject(…, true)`** for skinned AABB.
 */
function normalizeImportedPlayerVisual(
  wrapped: THREE.Group,
  scene: THREE.Object3D,
  idleClip: THREE.AnimationClip,
  walkClip: THREE.AnimationClip,
): void {
  wrapped.add(scene);

  const alignClip = idleClip === walkClip ? walkClip : idleClip;
  const poseMixer = new THREE.AnimationMixer(scene);
  const poseAction = poseMixer.clipAction(alignClip);
  poseAction.reset();
  poseAction.time = 0;
  poseAction.enabled = true;
  poseAction.setEffectiveWeight(1);
  poseMixer.update(1e-6);
  scene.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(scene, true);
  if (box.isEmpty()) {
    poseMixer.stopAllAction();
    return;
  }
  const size = box.getSize(new THREE.Vector3());
  const h = Math.max(size.y, 1e-3);
  const s = PLAYER_VISUAL_TARGET_HEIGHT / h;
  scene.scale.setScalar(s);
  poseMixer.update(1e-6);
  scene.updateMatrixWorld(true);

  const box2 = new THREE.Box3().setFromObject(scene, true);
  scene.position.y -= box2.min.y;
  scene.position.y -= playerCapsuleCenterY();
  poseMixer.stopAllAction();
}

function needsImportedVisualNormalization(url: string): boolean {
  return url !== PLAYER_GLTF_URL_PROCEDURAL;
}

/**
 * Hold the source clip’s **first keyframe** on every track as a loopable “idle” so the mesh does not
 * bob when standing. **Required** when the glb only exports `Walk` — otherwise
 * `idle` and `walk` would be the **same** `AnimationClip` reference, standing would play a full walk
 * cycle (hips lift → feet no longer match floor alignment → visible float / flicker), and crossfades
 * would target duplicate actions on one clip.
 */
function makeHoldFirstKeyframeClip(
  source: THREE.AnimationClip,
  name: string,
): THREE.AnimationClip {
  const duration = Math.max(source.duration, 1e-5);
  const tracks: THREE.KeyframeTrack[] = [];

  for (const track of source.tracks) {
    if (track.times.length === 0) continue;
    const valueSize = track.getValueSize();
    const values = new Float32Array(valueSize * 2);
    for (let j = 0; j < valueSize; j++) {
      const v = track.values[j]!;
      values[j] = v;
      values[j + valueSize] = v;
    }
    const times = new Float32Array([0, duration]);
    const TrackCtor = track.constructor as new (
      n: string,
      t: Float32Array,
      v: Float32Array,
      interpolation?: THREE.InterpolationModes,
    ) => THREE.KeyframeTrack;
    tracks.push(
      new TrackCtor(
        track.name,
        times,
        values,
        track.getInterpolation(),
      ),
    );
  }

  return new THREE.AnimationClip(name, duration, tracks);
}

/** Exported for tests — see `locomotionClipResolve.test.ts`. */
export function resolveIdleWalkClips(
  gltf: GLTF,
  urlForErrors: string,
): {
  idle: THREE.AnimationClip;
  walk: THREE.AnimationClip;
} {
  const byIdle = gltf.animations.find((a) => a.name === PLAYER_ANIM_IDLE);
  const byWalk = gltf.animations.find((a) => a.name === PLAYER_ANIM_WALK);
  if (byIdle && byWalk) return { idle: byIdle, walk: byWalk };

  if (byWalk && !byIdle) {
    return {
      idle: makeHoldFirstKeyframeClip(byWalk, PLAYER_ANIM_IDLE),
      walk: byWalk,
    };
  }

  if (byIdle && !byWalk) {
    return { idle: byIdle, walk: byIdle };
  }

  const fallback =
    gltf.animations[0] ??
    (() => {
      throw new Error(
        `No animations in ${urlForErrors} — need Idle+Walk or at least one clip`,
      );
    })();

  return {
    idle: makeHoldFirstKeyframeClip(fallback, PLAYER_ANIM_IDLE),
    walk: fallback,
  };
}

function tintTrainingDummyMaterials(root: THREE.Object3D): void {
  const tint = new THREE.Color(0x8fa3bf);
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    const mats = Array.isArray(obj.material)
      ? obj.material
      : [obj.material];
    for (const m of mats) {
      if (m instanceof THREE.MeshStandardMaterial) {
        m.color.lerp(tint, 0.2);
      }
    }
  });
}

function tintSparringPartnerMaterials(root: THREE.Object3D): void {
  const tint = new THREE.Color(0x7aab8f);
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    const mats = Array.isArray(obj.material)
      ? obj.material
      : [obj.material];
    for (const m of mats) {
      if (m instanceof THREE.MeshStandardMaterial) {
        m.color.lerp(tint, 0.26);
      }
    }
  });
}

/**
 * WS-041 — skinned stick visual: load glTF, drive **Idle** / **Walk** from planar input.
 * Physics capsule remains authoritative; `root` follows rigid-body transform.
 */
export async function loadPlayerCharacter(
  options?: LoadPlayerCharacterOptions,
): Promise<PlayerCharacter> {
  const gltfUrl = options?.gltfUrlOverride ?? STICKMAN_BASE_GLTF_URL;

  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync(withDevCacheBustStickmanGlb(gltfUrl));

  const animScene = gltf.scene;

  if (options?.appearance === "training_dummy") {
    tintTrainingDummyMaterials(animScene);
  }
  if (options?.appearance === "sparring_partner") {
    tintSparringPartnerMaterials(animScene);
  }

  animScene.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.castShadow = true;
    }
  });

  const { idle: idleClip, walk: walkClip } = resolveIdleWalkClips(gltf, gltfUrl);

  const wrapped = new THREE.Group();
  if (needsImportedVisualNormalization(gltfUrl)) {
    normalizeImportedPlayerVisual(wrapped, animScene, idleClip, walkClip);
  } else {
    wrapped.add(animScene);
  }

  const mixer = new THREE.AnimationMixer(animScene);

  const idleAction = mixer.clipAction(idleClip);
  const walkAction = mixer.clipAction(walkClip);
  idleAction.loop = THREE.LoopRepeat;
  walkAction.loop = THREE.LoopRepeat;
  idleAction.play();

  let mode: "idle" | "walk" = "idle";

  let strikePresentationAction: THREE.AnimationAction | null = null;
  let strikePresentationBusy = false;

  const restoreLocomotionAfterStrike = (): void => {
    strikePresentationBusy = false;
    if (strikePresentationAction) {
      strikePresentationAction.stop();
      strikePresentationAction = null;
    }
    if (mode === "walk") {
      walkAction.reset().play();
      idleAction.crossFadeTo(walkAction, CROSS_FADE_SEC, false);
    } else {
      idleAction.reset().play();
      walkAction.crossFadeTo(idleAction, CROSS_FADE_SEC, false);
    }
  };

  const onMixerFinished = (e: { action: THREE.AnimationAction }): void => {
    if (e.action === strikePresentationAction) {
      restoreLocomotionAfterStrike();
    }
  };
  mixer.addEventListener("finished", onMixerFinished);

  const disposeMaterialsAndGeometry = (o: THREE.Object3D): void => {
    o.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry?.dispose();
        const m = obj.material;
        if (Array.isArray(m)) m.forEach((x) => x.dispose());
        else m?.dispose();
      }
    });
  };

  return {
    root: wrapped,
    updateLocomotionAnim(dtSeconds, { planarInput, grounded, freezePose }) {
      const dtAnim = freezePose ? 0 : dtSeconds;
      if (!strikePresentationBusy) {
        const moving = grounded && planarInput > WALK_BLEND_THRESHOLD;
        if (moving && mode === "idle") {
          walkAction.reset().play();
          idleAction.crossFadeTo(walkAction, CROSS_FADE_SEC, false);
          mode = "walk";
        } else if (!moving && mode === "walk") {
          idleAction.reset().play();
          walkAction.crossFadeTo(idleAction, CROSS_FADE_SEC, false);
          mode = "idle";
        }

        if (mode === "walk") {
          const t = THREE.MathUtils.clamp(planarInput, 0, 1);
          walkAction.setEffectiveTimeScale(0.82 + 0.55 * t);
        } else {
          walkAction.setEffectiveTimeScale(1);
        }
      }

      mixer.update(dtAnim);
    },
    beginStrikePresentation(moveId: StrikeMoveId) {
      const clipName = strikePresentationClipName(moveId);
      if (!clipName) return;
      const clip = gltf.animations.find((a) => a.name === clipName);
      if (!clip) return;

      strikePresentationAction?.stop();
      strikePresentationAction = mixer.clipAction(clip);
      strikePresentationAction.loop = THREE.LoopOnce;
      strikePresentationAction.clampWhenFinished = true;
      strikePresentationBusy = true;

      idleAction.fadeOut(0.08);
      walkAction.fadeOut(0.08);
      strikePresentationAction.reset().fadeIn(0.1).play();
    },
    dispose() {
      mixer.removeEventListener("finished", onMixerFinished);
      mixer.stopAllAction();
      disposeMaterialsAndGeometry(wrapped);
    },
  };
}
