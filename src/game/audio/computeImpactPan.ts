import * as THREE from "three";

/**
 * Lateral pan in [-1, 1] for `StereoPannerNode` from contact vs camera (dojo-scale).
 */
export function computeImpactPan(
  contactWorld: { x: number; y: number; z: number },
  camera: THREE.Camera,
  maxLateralDistance = 3.5,
): number {
  const camPos = new THREE.Vector3();
  camera.getWorldPosition(camPos);
  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  const up = camera.up;
  const right = new THREE.Vector3().crossVectors(forward, up).normalize();
  const toContact = new THREE.Vector3(
    contactWorld.x - camPos.x,
    contactWorld.y - camPos.y,
    contactWorld.z - camPos.z,
  );
  const lateral = toContact.dot(right);
  const d = maxLateralDistance > 0 ? maxLateralDistance : 1;
  return Math.max(-1, Math.min(1, lateral / d));
}
