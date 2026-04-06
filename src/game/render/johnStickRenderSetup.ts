import * as THREE from "three";

/**
 * WS-020 / GP §4.1.1 — baseline rendering: color space, tone mapping, one shadow-casting sun.
 * Single shipped tier (no in-game quality presets — see WORK_STREAMS **WS-113 rejected**).
 */
export const GRAPHICS_PRESET_DEFAULT = {
  shadowMapSize: 2048,
  maxPixelRatio: 2,
} as const;

/** WS-071 — baseline vertical FOV (degrees); combat FOV punch adds on top then decays. */
export const DEFAULT_PERSPECTIVE_FOV_DEG = 50;

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
  /** Programmatic fallback when `<canvas>` cannot hold focus in some WebGL + browser combos (WS-223). */
  root.tabIndex = -1;

  const scene = new THREE.Scene();
  /** Warm dark interior void (enclosed hall). */
  scene.background = new THREE.Color(0x2a2622);

  const camera = new THREE.PerspectiveCamera(
    DEFAULT_PERSPECTIVE_FOV_DEG,
    window.innerWidth / Math.max(1, window.innerHeight),
    0.1,
    200,
  );
  /** Default pose matches `createThirdPersonFollowScratch` warm-start; WS-030 drives each frame. */
  camera.position.set(0, 7.0, 21.0);
  camera.lookAt(0, 0.25, 0);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.48;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  applyRendererSize(
    camera,
    renderer,
    window.innerWidth,
    Math.max(1, window.innerHeight),
  );
  root.appendChild(renderer.domElement);

  const canvas = renderer.domElement;
  /** WS-223 / GP §3 — keyboard-first: canvas must be focusable for automation + click-free cold open. */
  canvas.tabIndex = 0;
  canvas.setAttribute("role", "application");
  canvas.setAttribute("aria-label", "John Stick game view");

  /** Bright airy bounce — pale ceiling + warm floor (shōji + pendants do most of the mood in-level). */
  const hemi = new THREE.HemisphereLight(0xfaf6f0, 0x8c7a68, 0.78);
  scene.add(hemi);

  /**
   * Single shadow caster — soft skylight / high window wash; pendants in `dojoTraditionalDressing`
   * add warm pools on the floor (no extra shadow maps).
   */
  const sunLight = new THREE.DirectionalLight(0xfffaef, 0.82);
  sunLight.position.set(2.8, 16.2, 1.2);
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
  sunLight.shadow.normalBias = 0.034;
  sunLight.target.position.set(0, 0.35, 0);
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

/**
 * WS-223 — after mount, move keyboard focus to the WebGL canvas without scrolling the page.
 * Deferred so sync UI appended to `root` can finish; safe to call again (e.g. after closing a modal).
 */
export function requestJohnStickCanvasFocus(
  canvas: HTMLCanvasElement,
  surfaceRoot?: HTMLElement,
): void {
  const doc = canvas.ownerDocument;
  const win = doc.defaultView;

  const apply = (): void => {
    try {
      win?.focus();
    } catch {
      /* Embedded viewers may forbid window.focus(); game input still uses document capture. */
    }
    canvas.focus({ preventScroll: true });
    if (surfaceRoot && doc.activeElement !== canvas) {
      surfaceRoot.focus({ preventScroll: true });
    }
  };

  queueMicrotask(() => {
    apply();
    requestAnimationFrame(apply);
    requestAnimationFrame(() => requestAnimationFrame(apply));
  });
  win?.setTimeout(apply, 50);
  win?.setTimeout(apply, 200);
}
