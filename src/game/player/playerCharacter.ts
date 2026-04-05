import * as THREE from "three";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

import type { StrikeMoveId } from "../input/combatIntent";
import { strikePresentationClipName } from "./strikePresentation";

/** Served from `public/` (Vite). Regenerate via `npm run export:character`. */
export const PLAYER_GLTF_URL = "/models/char_player_stick_v01.glb";

export const PLAYER_ANIM_IDLE = "Idle";
export const PLAYER_ANIM_WALK = "Walk";

export type LoadPlayerCharacterOptions = {
  /** `training_dummy` tints materials so the dojo partner reads distinct from the hero. */
  appearance?: "player" | "training_dummy";
};

const CROSS_FADE_SEC = 0.14;
const WALK_BLEND_THRESHOLD = 0.06;

export type PlayerCharacter = {
  /** Add to scene; sync from capsule each frame. */
  readonly root: THREE.Object3D;
  updateLocomotionAnim(
    dtSeconds: number,
    opts: { planarInput: number; grounded: boolean },
  ): void;
  /**
   * WS-081 — if `strikePresentationClipName(moveId)` exists in the glb, briefly cross-fade to it
   * and back to Idle/Walk when the clip finishes.
   */
  beginStrikePresentation(moveId: StrikeMoveId): void;
  dispose(): void;
};

function findClip(gltf: GLTF, name: string): THREE.AnimationClip {
  const clip = gltf.animations.find((a) => a.name === name);
  if (!clip) {
    throw new Error(
      `Missing animation "${name}" in ${PLAYER_GLTF_URL} (got: ${gltf.animations.map((a) => a.name).join(", ") || "none"})`,
    );
  }
  return clip;
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

/**
 * WS-041 — skinned stick visual: load glTF, drive **Idle** / **Walk** from planar input.
 * Physics capsule remains authoritative; `root` follows rigid-body transform.
 */
export async function loadPlayerCharacter(
  options?: LoadPlayerCharacterOptions,
): Promise<PlayerCharacter> {
  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync(PLAYER_GLTF_URL);

  if (options?.appearance === "training_dummy") {
    tintTrainingDummyMaterials(gltf.scene);
  }

  const mixer = new THREE.AnimationMixer(gltf.scene);
  const idleClip = findClip(gltf, PLAYER_ANIM_IDLE);
  const walkClip = findClip(gltf, PLAYER_ANIM_WALK);

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
    root: gltf.scene,
    updateLocomotionAnim(dtSeconds, { planarInput, grounded }) {
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

      mixer.update(dtSeconds);
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
      disposeMaterialsAndGeometry(gltf.scene);
    },
  };
}
