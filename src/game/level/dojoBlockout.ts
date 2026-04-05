import * as THREE from "three";

import { PUNCHING_BAG } from "./punchingBagConfig";

/**
 * GP §7.1.1 — training floor scale (role-level-designer default: 24m × 18m).
 * GP §7.2.1 — boundary envelope for physics + placeholder visuals.
 */
export const DOJO_BLOCKOUT = {
  floorHalfWidth: 12,
  floorHalfDepth: 9,
  /** Full thickness of the floor slab (Y). */
  floorThickness: 0.1,
  wallHeight: 4,
  wallHalfThickness: 0.2,
} as const;

/** Lifted mid tones — still reads as interior mat, not black hole corners. */
const WALL_MATERIAL = new THREE.MeshStandardMaterial({
  color: 0x6e7190,
  roughness: 0.8,
  metalness: 0.05,
});

const FLOOR_MATERIAL = new THREE.MeshStandardMaterial({
  color: 0x3e4254,
  roughness: 0.9,
  metalness: 0.04,
});

/**
 * WS-021 — placeholder dojo shell: floor mat + perimeter walls (diegetic-ish trim).
 * +Z wall omitted for now so the default static camera (sitting on +Z) is not blocked;
 * restore when WS-030 follow-cam owns framing.
 */
export function createDojoPlaceholderLevel(): THREE.Group {
  const g = new THREE.Group();
  g.name = "dojo_01_blockout";

  const { floorHalfWidth, floorHalfDepth, floorThickness, wallHeight, wallHalfThickness } =
    DOJO_BLOCKOUT;

  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(
      floorHalfWidth * 2,
      floorThickness,
      floorHalfDepth * 2,
    ),
    FLOOR_MATERIAL,
  );
  floor.position.set(0, -floorThickness / 2, 0);
  floor.receiveShadow = true;
  g.add(floor);

  const wallY = wallHeight / 2;
  const zSpan = floorHalfDepth * 2 + wallHalfThickness * 4;
  const xSpan = floorHalfWidth * 2 + wallHalfThickness * 4;

  const eastWestGeom = new THREE.BoxGeometry(
    wallHalfThickness * 2,
    wallHeight,
    zSpan,
  );
  const northSouthGeom = new THREE.BoxGeometry(
    xSpan,
    wallHeight,
    wallHalfThickness * 2,
  );

  const east = new THREE.Mesh(eastWestGeom, WALL_MATERIAL);
  east.position.set(floorHalfWidth + wallHalfThickness, wallY, 0);
  east.castShadow = true;
  east.receiveShadow = true;
  g.add(east);

  const west = new THREE.Mesh(eastWestGeom, WALL_MATERIAL);
  west.position.set(-(floorHalfWidth + wallHalfThickness), wallY, 0);
  west.castShadow = true;
  west.receiveShadow = true;
  g.add(west);

  const south = new THREE.Mesh(northSouthGeom, WALL_MATERIAL);
  south.position.set(0, wallY, -(floorHalfDepth + wallHalfThickness));
  south.castShadow = true;
  south.receiveShadow = true;
  g.add(south);

  /**
   * WS-061 / GP §7.1.2 — ceiling patch over the bag. Cord visual is **dynamic** (`punchingBagHangerVisual`)
   * so it tilts with swings instead of a rigid vertical rod.
   */
  const ceilingUndersideY = wallHeight;
  const ceilingSlabThickness = 0.14;
  const mountHalfExtent = 1.35;

  const ceilingPatch = new THREE.Mesh(
    new THREE.BoxGeometry(
      mountHalfExtent * 2,
      ceilingSlabThickness,
      mountHalfExtent * 2,
    ),
    WALL_MATERIAL,
  );
  ceilingPatch.position.set(
    PUNCHING_BAG.centerX,
    ceilingUndersideY + ceilingSlabThickness / 2,
    PUNCHING_BAG.centerZ,
  );
  ceilingPatch.castShadow = true;
  ceilingPatch.receiveShadow = true;
  ceilingPatch.name = "punching_bag_ceiling_patch";
  g.add(ceilingPatch);

  return g;
}
