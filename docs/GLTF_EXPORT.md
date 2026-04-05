# glTF export & validation (GP §5.3.1)

**Engine:** Three.js `^0.175` (see `package.json`).  
**Player stick (procedural v1):** regenerate with `npm run export:character` → writes `public/models/char_player_stick_v01.glb`. Silhouette targets live under `docs/reference/character/` (see `CHARACTER_RIG_MAP.md`).

## Blender handoff (when replacing procedural mesh)

1. **Apply modifiers** on export mesh where needed; final mesh only in the export collection.
2. **Scale:** 1 Blender unit = **1 m**; **Y-up**; character **+Z forward** to match current runtime.
3. **Export:** glTF 2.0 binary (`.glb`), embedded textures for small heroes unless you split binaries and document Vite `public/` paths.
4. **Animations:** push to NLA or active clips; names **`Idle`** and **`Walk`** must match `playerCharacter.ts` (or update code + this doc).
5. **Skin:** skinned mesh as **glTF root node** (or single root) avoids validator warnings about parent transforms on skinned meshes.

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
