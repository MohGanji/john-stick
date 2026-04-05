import * as THREE from "three";

import { createDojoEnvironmentMaterials } from "./dojoEnvironmentMaterials";
import { createDojoTraditionalDressing } from "./dojoTraditionalDressing";

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

/**
 * WS-021 — closed traditional dojo shell: floor, walls (cream shōmen on −Z), wood-tone ceiling,
 * beams / pendants / shōji + scroll dressing (`dojoTraditionalDressing`).
 */
export function createDojoPlaceholderLevel(): THREE.Group {
  const g = new THREE.Group();
  g.name = "dojo_01_blockout";

  const { floorHalfWidth, floorHalfDepth, floorThickness, wallHeight, wallHalfThickness } =
    DOJO_BLOCKOUT;

  const env = createDojoEnvironmentMaterials(floorHalfWidth, floorHalfDepth);

  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(
      floorHalfWidth * 2,
      floorThickness,
      floorHalfDepth * 2,
    ),
    env.floor,
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

  const east = new THREE.Mesh(eastWestGeom, env.sideWall);
  east.position.set(floorHalfWidth + wallHalfThickness, wallY, 0);
  east.castShadow = true;
  east.receiveShadow = true;
  g.add(east);

  const west = new THREE.Mesh(eastWestGeom, env.sideWall);
  west.position.set(-(floorHalfWidth + wallHalfThickness), wallY, 0);
  west.castShadow = true;
  west.receiveShadow = true;
  g.add(west);

  const south = new THREE.Mesh(northSouthGeom, env.shomenWall);
  south.position.set(0, wallY, -(floorHalfDepth + wallHalfThickness));
  south.castShadow = true;
  south.receiveShadow = true;
  g.add(south);

  const north = new THREE.Mesh(northSouthGeom, env.sideWall);
  north.position.set(0, wallY, floorHalfDepth + wallHalfThickness);
  north.castShadow = true;
  north.receiveShadow = true;
  g.add(north);

  /** Full ceiling slab; underside at `wallHeight` so `punchingBagHangerVisual` still meets the room shell. */
  const ceilingSlabThickness = 0.14;
  const ceilingGeom = new THREE.BoxGeometry(
    xSpan,
    ceilingSlabThickness,
    zSpan,
  );
  const ceiling = new THREE.Mesh(ceilingGeom, env.ceilingWood);
  ceiling.position.set(0, wallHeight + ceilingSlabThickness / 2, 0);
  ceiling.castShadow = true;
  ceiling.receiveShadow = true;
  ceiling.name = "dojo_ceiling_slab";
  g.add(ceiling);

  g.add(
    createDojoTraditionalDressing(env, {
      floorHalfWidth,
      floorHalfDepth,
      wallHeight,
      wallHalfThickness,
    }),
  );

  return g;
}
