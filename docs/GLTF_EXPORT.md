# glTF export & validation (GP §5.3.1)

**Engine:** Three.js `^0.175` (see `package.json`). `loadPlayerCharacter` scales the glTF to the capsule height band, samples **`Walk` at t = 0**, and uses **`setFromObject(…, true)`** so **skinned** bounds include deformation (bind-pose-only boxes float the mesh). It then offsets by **`-(halfHeight + radius + spawnClearance)`** so soles sit on **level art y = 0** while the rigid body stays at the **capsule center** (`rapierWorld.ts`).  
**Player stick:** procedural: `npm run export:character` → `public/models/char_player_stick_v01.glb`. **Blender (agent + MCP):** `scripts/blender/export_john_stick_hero_glb.py` (see `docs/DCC_AUTOMATION_PIPELINE.md`). Silhouette: `docs/reference/character/` (`CHARACTER_RIG_MAP.md`).

## Blender handoff (when replacing procedural mesh)

1. **Apply modifiers** on export mesh where needed; final mesh only in the export collection.
2. **Scale / pivot:** 1 Blender unit = **1 m**; **Y-up**; character **+Z forward**; **feet on the ground** (exported AABB bottom ≈ 0 before engine root motion). Visual **standing height** should land near the capsule band **~1.48 m** (`PLAYER_CAPSULE.halfHeight * 2 + radius * 2` in `playerCapsuleConfig.ts`) unless you intentionally retune physics to match.
3. **Export:** glTF 2.0 binary (`.glb`), embedded textures for small heroes unless you split binaries and document Vite `public/` paths.
4. **Animations:** actions named exactly **`Idle`** (loop) and **`Walk`** (loop). The runtime drives only those for locomotion; a **single** unnamed third-party clip is supported only via a **static first-frame** synthetic idle (no real idle cycle until you author `Idle`). **Mixamo / Sketchfab:** rename in Blender before export, or use clips that already match — see **Hero glTF export checklist** in `docs/CHARACTER_RIG_MAP.md`. Optional **strike** clip names: `strikePresentation.ts` + `compoundMoveTable.ts`.
5. **Skin:** skinned mesh as **glTF root node** (or single root) avoids validator warnings about parent transforms on skinned meshes.

**Runtime (all stickmen):** **`STICKMAN_BASE_GLTF_URL`** in `playerCharacter.ts` — one file for **player + dummy + sparring**; `appearance` only tints materials. Default today: **Sketchfab** kaisoon (`stickman_fighting_kaisoon.glb`, `CREDITS.md`). Set base to `PLAYER_GLTF_URL_CANONICAL` to run the whole cast on the procedural stick. **`gltfUrlOverride`** is for local experiments only.

## Validation

```bash
npm run validate:gltf
```

Uses `@gltf-transform/cli` (`gltf-transform validate …`). **INFO** lines (e.g. unused TEXCOORD) are acceptable unless you want a zero-noise report — then strip unused attributes in DCC.

**CI:** `npm run build` runs `validate:gltf` after TypeScript check and before `vite build`.

## Common fixes

- **Euler flips:** spot-check in engine after every export (TA + animator).
- **Double materials:** merge slots or name consistently for engine binding.
- **Wrong clip count:** confirm NLA strips / export “selected only” settings in Blender.
