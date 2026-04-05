import * as THREE from "three";

import { runGameLoop } from "./gameLoop";
import {
  createJohnStickPhysics,
  readRigidBodyTransform,
  stepPhysicsWorld,
} from "./physics/rapierWorld";

export async function mountGame(root: HTMLElement): Promise<void> {
  const physics = await createJohnStickPhysics();

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    200,
  );
  camera.position.set(0, 1.35, 4.2);
  camera.lookAt(0, 0.4, 0);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x1a1a24, 1);
  root.appendChild(renderer.domElement);

  const floorMesh = new THREE.Mesh(
    new THREE.BoxGeometry(48, 0.1, 48),
    new THREE.MeshBasicMaterial({ color: 0x2a2a36 }),
  );
  floorMesh.position.set(0, -0.05, 0);
  scene.add(floorMesh);

  const demoMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.44, 0.44, 0.44),
    new THREE.MeshBasicMaterial({ color: 0x66ccff }),
  );
  scene.add(demoMesh);

  const scratchPos = { x: 0, y: 0, z: 0 };
  const scratchQuat = { x: 0, y: 0, z: 0, w: 1 };

  function onResize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  window.addEventListener("resize", onResize);

  runGameLoop({
    update(_dtSeconds) {
      // Input sampling (WS-050+). No physics.
    },
    fixedStep(_fixedDtSeconds) {
      stepPhysicsWorld(physics.world);
    },
    /**
     * GP §4.2.3 — `runGameLoop` exposes `beforeFixedSteps` + `fixedStepAlpha` for dual-buffer rendering.
     * Demo mesh uses the integrated pose directly; per-substep prev/curr buffers belong in WS-040+.
     */
    lateUpdate(_dtSeconds, _fixedStepAlpha) {
      readRigidBodyTransform(
        physics.demoRigidBody,
        scratchPos,
        scratchQuat,
      );
      demoMesh.position.set(scratchPos.x, scratchPos.y, scratchPos.z);
      demoMesh.quaternion.set(
        scratchQuat.x,
        scratchQuat.y,
        scratchQuat.z,
        scratchQuat.w,
      );
    },
    render() {
      renderer.render(scene, camera);
    },
  });
}
