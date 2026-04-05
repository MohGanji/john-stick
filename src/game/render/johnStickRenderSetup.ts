import * as THREE from "three";

/**
 * WS-020 / GP §4.1.1 — baseline rendering: color space, tone mapping, one shadow-casting sun.
 * Preset hooks for WS-113 (`role-graphics-programmer` graphics preset table).
 *
 * | Preset | shadow_map | post | max_lights | notes |
 * |--------|------------|------|------------|-------|
 * | High (default) | 2048 | off | 1 dir + hemi | PCF soft shadow; no post in v1 |
 * | Low (future) | 512–1024 | off | 1 dir + ambient | reduce shadow casters, cap DPR |
 */
export const GRAPHICS_PRESET_DEFAULT = {
  shadowMapSize: 2048,
  maxPixelRatio: 2,
} as const;

export type JohnStickRenderSetup = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  /** Single directional shadow caster (v1 policy: no extra shadow casters). */
  sunLight: THREE.DirectionalLight;
  dispose: () => void;
};

function applyRendererSize(
  camera: THREE.PerspectiveCamera,
  renderer: THREE.WebGLRenderer,
  width: number,
  height: number,
): void {
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, GRAPHICS_PRESET_DEFAULT.maxPixelRatio),
  );
  renderer.setSize(width, height);
}

/**
 * Scene graph root + WebGLRenderer tuned for lit PBR-style materials (`MeshStandardMaterial`).
 */
export function createJohnStickRenderSetup(
  root: HTMLElement,
): JohnStickRenderSetup {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a24);

  const camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / Math.max(1, window.innerHeight),
    0.1,
    200,
  );
  /** Default pose frames WS-021 dojo bounds (~24×18 m); closer shots land in WS-030. */
  camera.position.set(0, 7.0, 21.0);
  camera.lookAt(0, 0.25, 0);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  applyRendererSize(
    camera,
    renderer,
    window.innerWidth,
    Math.max(1, window.innerHeight),
  );
  root.appendChild(renderer.domElement);

  const hemi = new THREE.HemisphereLight(0xb8c4e8, 0x2a2620, 0.42);
  scene.add(hemi);

  const sunLight = new THREE.DirectionalLight(0xfff5e6, 1.12);
  sunLight.position.set(8, 18, 6);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(
    GRAPHICS_PRESET_DEFAULT.shadowMapSize,
    GRAPHICS_PRESET_DEFAULT.shadowMapSize,
  );
  sunLight.shadow.camera.near = 1.5;
  sunLight.shadow.camera.far = 56;
  const orthoExtent = 28;
  sunLight.shadow.camera.left = -orthoExtent;
  sunLight.shadow.camera.right = orthoExtent;
  sunLight.shadow.camera.top = orthoExtent;
  sunLight.shadow.camera.bottom = -orthoExtent;
  sunLight.shadow.bias = -0.00025;
  sunLight.shadow.normalBias = 0.028;
  sunLight.target.position.set(0, 0.25, 0);
  scene.add(sunLight);
  scene.add(sunLight.target);

  function onResize(): void {
    applyRendererSize(
      camera,
      renderer,
      window.innerWidth,
      Math.max(1, window.innerHeight),
    );
  }

  window.addEventListener("resize", onResize);

  function dispose(): void {
    window.removeEventListener("resize", onResize);
    renderer.dispose();
    if (renderer.domElement.parentElement === root) {
      root.removeChild(renderer.domElement);
    }
  }

  return { scene, camera, renderer, sunLight, dispose };
}
