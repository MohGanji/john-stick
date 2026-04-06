import * as THREE from "three";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

import type { StrikeMoveId } from "../input/combatIntent";
import { PLAYER_CAPSULE } from "./playerCapsuleConfig";
import { strikePresentationClipName } from "./strikePresentation";

/** Canonical mesh from `npm run export:character` (already scaled to capsule). */
export const PLAYER_GLTF_URL_CANONICAL = "/models/char_player_stick_v01.glb";

/**
 * Sketchfab “Stickman Fighting” experiment (CC-BY — `CREDITS.md`). Swap `PLAYER_GLTF_URL` to toggle.
 */
export const PLAYER_GLTF_URL_SKETCHFAB_KAISOON =
  "/models/stickman_fighting_kaisoon.glb";

/** Active player glb (set to `PLAYER_GLTF_URL_CANONICAL` to revert). */
export const PLAYER_GLTF_URL = PLAYER_GLTF_URL_SKETCHFAB_KAISOON;

export const PLAYER_ANIM_IDLE = "Idle";
export const PLAYER_ANIM_WALK = "Walk";

export type LoadPlayerCharacterOptions = {
  /** `training_dummy` / `sparring_partner` tint the glTF so lab targets read distinct from the hero. */
  appearance?: "player" | "training_dummy" | "sparring_partner";
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
 * Scale to our capsule band and lift so AABB bottom is at local Y=0 on `wrapped` pivot.
 */
function normalizeImportedPlayerVisual(
  wrapped: THREE.Group,
  scene: THREE.Object3D,
): void {
  wrapped.add(scene);
  scene.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(scene);
  if (box.isEmpty()) return;
  const size = box.getSize(new THREE.Vector3());
  const h = Math.max(size.y, 1e-3);
  const s = PLAYER_VISUAL_TARGET_HEIGHT / h;
  scene.scale.setScalar(s);
  scene.updateMatrixWorld(true);
  const box2 = new THREE.Box3().setFromObject(scene);
  scene.position.y -= box2.min.y;
}

function needsImportedVisualNormalization(url: string): boolean {
  return url !== PLAYER_GLTF_URL_CANONICAL;
}

function resolveIdleWalkClips(
  gltf: GLTF,
  urlForErrors: string,
): {
  idle: THREE.AnimationClip;
  walk: THREE.AnimationClip;
} {
  const idle = gltf.animations.find((a) => a.name === PLAYER_ANIM_IDLE);
  const walk = gltf.animations.find((a) => a.name === PLAYER_ANIM_WALK);
  if (idle && walk) return { idle, walk };
  const fallback =
    idle ??
    walk ??
    gltf.animations[0] ??
    (() => {
      throw new Error(
        `No animations in ${urlForErrors} — need Idle+Walk or at least one clip`,
      );
    })();
  return {
    idle: idle ?? fallback,
    walk: walk ?? fallback,
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
  /**
   * Lab targets use WS-094 articulated ragdoll bone names from `CHARACTER_RIG_MAP` / canonical export.
   * Third-party hero glTF (see `PLAYER_GLTF_URL`) often uses different skeletons — always load canonical
   * mesh for dummy + sparring so boot cannot fail on `computeArticulatedBindWorldTransforms`.
   */
  const gltfUrl =
    options?.appearance === "training_dummy" ||
    options?.appearance === "sparring_partner"
      ? PLAYER_GLTF_URL_CANONICAL
      : PLAYER_GLTF_URL;

  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync(gltfUrl);

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

  const wrapped = new THREE.Group();
  if (needsImportedVisualNormalization(gltfUrl)) {
    normalizeImportedPlayerVisual(wrapped, animScene);
  } else {
    wrapped.add(animScene);
  }

  const mixer = new THREE.AnimationMixer(animScene);
  const { idle: idleClip, walk: walkClip } = resolveIdleWalkClips(gltf, gltfUrl);

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
