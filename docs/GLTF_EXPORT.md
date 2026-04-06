# glTF export & validation (GP §5.3.1)

**Engine:** Three.js `^0.175` (see `package.json`). `loadPlayerCharacter` scales the glTF to the capsule height band, samples the **`Idle` clip at t = 0** (authored in the glb **or** the runtime **synthetic** `Idle` built from **`Walk`’s first keys** when the file has no `Idle`), and uses **`setFromObject(…, true)`** so **skinned** bounds include deformation (bind-pose-only boxes float the mesh). It then offsets by **`-(halfHeight + radius + spawnClearance)`** so soles sit on **level art y = 0** while the rigid body stays at the **capsule center** (`rapierWorld.ts`).  
**Player stick:** procedural: `npm run export:character` → `public/models/char_player_stick_v01.glb`. **Blender (agent + MCP):** `scripts/blender/export_john_stick_hero_glb.py` (see `docs/DCC_AUTOMATION_PIPELINE.md`). Silhouette: `docs/reference/character/` (`CHARACTER_RIG_MAP.md`).

## Blender handoff (foundational hero)

Use this SOP for the **canonical** `STICKMAN_BASE_GLTF_URL` asset (same file for **player / dummy / sparring**) — **Stick_FRig** (`stick_frig_v15_hero.glb`). **Pipeline:** **`WS-228`** (mesh + standardize glb) → **`WS-229`** (fix **actions** in Blender — Walk vs combat, NLA export, retarget hygiene if importing mocap) → **`WS-224`/`225`** (looping locomotion + strike set + sign-off). **`@.cursor/rules/role-blender-expert.mdc`** (MCP or headless) owns Blender export at each step.

1. **Apply modifiers** on export mesh where needed; final mesh only in the export collection.
2. **Scale / pivot:** 1 Blender unit = **1 m**; **Y-up**; character **+Z forward**; **feet on the ground** (exported AABB bottom ≈ 0 before engine root motion). Visual **standing height** should land near the capsule band **~1.48 m** (`PLAYER_CAPSULE.halfHeight * 2 + radius * 2` in `playerCapsuleConfig.ts`) unless you intentionally retune physics to match.
3. **Export:** glTF 2.0 binary (`.glb`), embedded textures for small heroes unless you split binaries and document Vite `public/` paths.
4. **Animations:** actions named exactly **`Idle`** (loop) and **`Walk`** (loop). The runtime drives only those for locomotion; if the file has **only `Walk`**, code builds a **synthetic `Idle`** from the first keys. **Author clips on Stick_FRig in Blender** (or retarget in DCC, then export) — the engine does **not** retarget skeletons at runtime. See **Hero glTF export checklist** in `docs/CHARACTER_RIG_MAP.md`. Optional **strike** clip names: `strikePresentation.ts` + `compoundMoveTable.ts`.
5. **Skin:** skinned mesh as **glTF root node** (or single root) avoids validator warnings about parent transforms on skinned meshes.

**Runtime (all stickmen):** **`STICKMAN_BASE_GLTF_URL`** (`PLAYER_GLTF_URL_STICKMAN_HERO`) in `playerCharacter.ts` — one file for **player + dummy + sparring**; `appearance` only tints materials. **Default:** **`public/models/stick_frig_v15_hero.glb`** (Stick_FRig — **`CREDITS.md`**). **`PLAYER_GLTF_URL_PROCEDURAL`** → **`char_player_stick_v01.glb`** for tooling. **`docs/BLENDER_THICK_CAPSULE_HERO_SOP.md`** for thick-capsule mesh on **this** rig. **`gltfUrlOverride`** is for local experiments only.

### Asset changelog

- **2026-04-06 — Revert default hero:** Headless **`char_thick_capsule_mixamo_v01.glb`** (auto weights + merged capsules) **deformed to blobs** in-engine; **`STICKMAN_BASE_GLTF_URL`** back to **`stickman_fighting_kaisoon.glb`**. Thick capsule ref → **`docs/BLENDER_THICK_CAPSULE_HERO_SOP.md`** (manual Blender).
- **Scheduled — `WS-229`:** Full **animation** audit in Blender (locomotion vs strikes), NLA/export hygiene, Mixamo **retarget** if replacing clips — see **`docs/WORK_STREAMS.md`**.
- **2026-04-06 — Rollback (hero glb):** An automated Blender pass (grounding translate + edit-mode foot scale + layered **`Idle`** from **`Walk`**) produced a **bad `stickman_fighting_kaisoon.glb`** (viewport / skin read wrong). Restored **last good binary** from git (`817632`‑byte commit). **Do not** re-run `scripts/blender/ws228_hero_glb_production.py` without a **human viewport + in-engine** check; redo mesh/animation in **`WS-228` / `WS-229`** with smaller, verified steps.
- **2026-04-06 — Stick_FRig canonical hero:** **`STICKMAN_BASE_GLTF_URL`** → **`stick_frig_v15_hero.glb`**; ragdoll maps **logical** slots to **Stick_FRig** bones (`trainingDummyRagdollConfig.ts`). Sketchfab kaisoon `.glb` **removed** from `public/models/`; keep **`CREDITS.md`** attribution for historical reference.
- **2026-04-06 — Procedural polish (optional):** `char_player_stick_v01.glb` can still be **Blender round-tripped** (`scripts/blender/refine_hero_subsurf_export.py`) for a smoother **parametric** silhouette — does **not** replace the Stick_FRig runtime hero unless you intentionally swap URLs.

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
