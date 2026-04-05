import * as THREE from "three";

import type { DojoEnvironmentMaterials } from "./dojoEnvironmentMaterials";

export type DojoDressingDims = {
  floorHalfWidth: number;
  floorHalfDepth: number;
  wallHeight: number;
  wallHalfThickness: number;
};

/**
 * Traditional dojo read: pendant lamps + **world-axis** shōji frames (no rotated rails sticking into the room),
 * shōmen scroll accents. Ceiling beams removed — coffering reads better from real assets later.
 */
export function createDojoTraditionalDressing(
  env: Pick<
    DojoEnvironmentMaterials,
    "beamWood" | "shojiGlow" | "scrollPaper" | "scrollInk"
  >,
  dims: DojoDressingDims,
): THREE.Group {
  const root = new THREE.Group();
  root.name = "dojo_traditional_dressing";

  const { floorHalfWidth, floorHalfDepth, wallHeight, wallHalfThickness } = dims;

  const pendantY = 3.38;
  const pendantX = [-5.2, 0, 5.2];
  const globeR = 0.26;
  const globeMat = new THREE.MeshStandardMaterial({
    color: 0xfff6e8,
    emissive: 0xffe8c8,
    emissiveIntensity: 1.35,
    roughness: 0.22,
    metalness: 0.08,
    toneMapped: true,
  });

  for (const x of pendantX) {
    const p = new THREE.Group();
    p.position.set(x, pendantY, 0);

    const cordLen = Math.max(
      0.12,
      wallHeight - pendantY - globeR - 0.04,
    );
    const cord = new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.014, cordLen, 6),
      env.beamWood,
    );
    cord.position.set(0, globeR + cordLen * 0.5, 0);
    cord.castShadow = true;
    p.add(cord);

    const globe = new THREE.Mesh(
      new THREE.SphereGeometry(globeR, 20, 16),
      globeMat,
    );
    globe.castShadow = true;
    p.add(globe);

    const lamp = new THREE.PointLight(0xfff0dd, 1.05, 22, 2);
    lamp.position.set(0, -globeR * 0.2, 0);
    p.add(lamp);

    root.add(p);
  }

  const shojiH = wallHeight * 0.78;
  const shojiW = floorHalfDepth * 2 - 1.8;
  const inset = wallHalfThickness + 0.06;
  const frameDepth = 0.11;
  const stileW = 0.095;
  const railH = 0.085;

  function addShojiWall(xSign: 1 | -1): void {
    const xPlane = xSign * (floorHalfWidth - inset);
    const fy = shojiH * 0.5 + 0.35;
    const xc = xPlane + xSign * frameDepth * 0.5;

    const paperW = shojiW - 2 * stileW;
    const paperH = shojiH - 2 * railH;
    const panel = new THREE.Mesh(
      new THREE.PlaneGeometry(paperW, paperH),
      env.shojiGlow,
    );
    panel.position.set(xPlane + xSign * 0.03, fy, 0);
    panel.rotation.y = -xSign * Math.PI * 0.5;
    panel.receiveShadow = true;
    root.add(panel);

    const addFrame = (geom: THREE.BoxGeometry, px: number, py: number, pz: number): void => {
      const m = new THREE.Mesh(geom, env.beamWood);
      m.position.set(px, py, pz);
      m.castShadow = true;
      m.receiveShadow = true;
      root.add(m);
    };

    const fullZ = shojiW + 2 * stileW;
    addFrame(
      new THREE.BoxGeometry(frameDepth, railH, fullZ),
      xc,
      fy + shojiH * 0.5 + railH * 0.5,
      0,
    );
    addFrame(
      new THREE.BoxGeometry(frameDepth, railH, fullZ),
      xc,
      fy - shojiH * 0.5 - railH * 0.5,
      0,
    );
    addFrame(
      new THREE.BoxGeometry(frameDepth, shojiH, stileW),
      xc,
      fy,
      -shojiW * 0.5 + stileW * 0.5,
    );
    addFrame(
      new THREE.BoxGeometry(frameDepth, shojiH, stileW),
      xc,
      fy,
      shojiW * 0.5 - stileW * 0.5,
    );
  }

  addShojiWall(1);
  addShojiWall(-1);

  /** Inner face of south wall is z = -floorHalfDepth; sit scrolls slightly into the room. */
  const zInner = -floorHalfDepth + 0.08;
  const scrollCentersX = [-3.4, 0, 3.4];
  const paperW = 0.62;
  const paperH = 2.05;
  const sy = 1.52;

  for (const cx of scrollCentersX) {
    const scroll = new THREE.Group();
    scroll.position.set(cx, sy, zInner);

    const rod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, paperW + 0.2, 8),
      env.scrollInk,
    );
    rod.rotation.z = Math.PI / 2;
    rod.position.set(0, paperH * 0.5 + 0.06, 0);
    rod.castShadow = true;
    scroll.add(rod);

    const paper = new THREE.Mesh(
      new THREE.PlaneGeometry(paperW, paperH),
      env.scrollPaper,
    );
    scroll.add(paper);

    const ink = new THREE.Mesh(
      new THREE.PlaneGeometry(0.07, paperH * 0.55),
      env.scrollInk,
    );
    ink.position.set(0, -paperH * 0.08, 0.004);
    scroll.add(ink);

    const rodLo = rod.clone();
    rodLo.position.set(0, -paperH * 0.5 - 0.06, 0);
    scroll.add(rodLo);

    root.add(scroll);
  }

  return root;
}
