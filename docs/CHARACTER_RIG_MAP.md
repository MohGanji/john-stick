# Player stick rig — bone ↔ future ragdoll map (GP §5.2.1)

**Asset (authoring — procedural):** `public/models/char_player_stick_v01.glb` (root node `char_player_stick_v01`)  
**Regenerate:** `npm run export:character` (`scripts/export-stick-character.mjs`)  
**Runtime (all stickmen):** **One** glTF — `STICKMAN_BASE_GLTF_URL` in `src/game/player/playerCharacter.ts` — loads for **player**, **training_dummy**, and **sparring_partner**. **Instantiation** (material tint per `appearance`, future scale/outfit hooks) replaces maintaining **separate** character GLBs per role. To run the whole game on the procedural mesh, set `STICKMAN_BASE_GLTF_URL` to `PLAYER_GLTF_URL_CANONICAL` (same file). Iterate the active base in Blender/MCP (see `docs/GLTF_EXPORT.md`, `CREDITS.md` for current default).  
**Units / axes:** meters, **Y-up**, **+Z forward** (matches Three.js + current level blockout).

## One default rig + instantiation (Mixamo-class skeleton)

**Policy:** There is a **single** runtime stickman asset. **Do not** add alternate GLB URLs per NPC class — vary **instances** (tint, later uniform scale, materials, modular segments / **WS-134**).

| Layer | What it is |
|--------|------------|
| **Runtime glb** | **`STICKMAN_BASE_GLTF_URL`** — typically **Mixamo-compatible** for flowy motion and clip libraries (`mixamorig:…` tracks in-file). |
| **Logical / physics map** | Bone **Hierarchy** table below — canonical **`Hips` / `Spine` / …** names are the **contract** for **WS-094** ragdoll and docs. **`TRAINING_DUMMY_RAGDOLL_BONE_NAME_FALLBACKS`** maps those slots to Mixamo node names when the mesh is not the procedural export. |
| **Procedural export** | `char_player_stick_v01.glb` — **parametric** reference mesh + dev fallback; regenerate with `export:character`, **or** use as `STICKMAN_BASE_GLTF_URL` until WS-133 lands a neutral `stickman_base_v01.glb`. |

**Procurement:** Prefer **Mixamo-rigged** base meshes. Retarget all locomotion/strikes to **that** skeleton; clip names still follow the **Hero glTF export checklist** below.

### Hero glTF export checklist (runtime contract)

Rename or author actions so names match lookups (case-sensitive):

| Role | Clip name | Notes |
|------|-----------|--------|
| Locomotion | `Idle`, `Walk` | Loops. If only `Walk` exists, runtime builds a **synthetic** `Idle` (hold first frame). See `resolveIdleWalkClips` in `playerCharacter.ts`. |
| Base strikes | `Strike_LeftPunch`, `Strike_RightPunch`, `Strike_LeftKick`, `Strike_RightKick` | Optional; `src/game/player/strikePresentation.ts`. |
| Compound strikes | Each `suggestedAnimClipName` in `src/game/combat/compoundMoveTable.ts` | Optional (e.g. `Strike_DualPunch`, `Strike_TripleChord`, `Strike_Seq_*`). |

**Validate:** `docs/GLTF_EXPORT.md` · `npm run validate:gltf`.

**Swapping the base asset:** Overwrite or relink **`STICKMAN_BASE_GLTF_URL`** — every stickman in the scene picks it up. Ship **mesh + skeleton + animations** for one base, or **retarget** in Mixamo/Blender. Do not add a second “hero-only” path for the same cast; use **`gltfUrlOverride`** in `loadPlayerCharacter` only for dev experiments.

## Visual mesh vs gameplay physics (today vs later)

**Right now (WS-040 + WS-041):** The glTF stickman is **presentation only** for the player. **Rapier** uses a **single kinematic capsule** (see `PLAYER_CAPSULE` + `rapierWorld.ts`) for **movement, floor contact, and world collision**. The skinned mesh **does not** drive hit detection or rigid-body shape yet; it **follows** the capsule’s position/yaw and plays **Idle/Walk** on the skeleton (`playerCharacter.ts` + `bootstrap.ts`).

**Later (WS-091 / GP §6.1.1):** Combat and knockback add **ragdoll or partial ragdoll** — **separate physics bodies and joints** in Rapier (or similar), **mapped from this bone hierarchy** (see table below). Collider sizes, limits, and “who owns motion” (capsule vs ragdoll) are **physics-programmer tuning**, not the glTF triangle mesh. The **hinge layout in art** should stay **consistent with bone parents** so that mapping stays 1:1.

**Hinge read vs this rig** (see `docs/reference/character/john-stick-ref-hinge-combat.png`):

| Idea in ref | This rig |
|-------------|-----------|
| Legs hinge from bottom of body | `LegUpperL` / `LegUpperR` are children of **`Hips`** (pelvis), not `Spine` |
| Torso “break” at waist / mid-back | **`Spine` → `Chest`** (two torso links) |
| Arm hinges | **`Shoulder*` → `Arm*`** (shoulder + elbow-style split as upper/lower cylinders) |
| Head on neck | **`Head`** is parented to **`Chest`** today — works for head animation; a dedicated **`Neck`** bone is a **deferred** idea (`docs/FUTURE_MAYBE.md` → *Character: `Neck` bone…*) |

So: **yes** — today the stick is **visual + animation skeleton**; **gameplay collision** is the **capsule** until ragdoll work **reuses these bone names and hierarchy** for real physics shapes.

## Art direction & where this is “finalized”

**V1 mesh authoring:** **cylinders** for pelvis, **two stacked torso** cylinders (`Spine` + `Chest` bones), **short neck** stub (weighted to `Chest`), **two cylinders + mitten sphere per arm**, **two cylinders + foot blob per leg**, **large sphere** head — flat caps at segment joins (optional joint smoothing: `docs/FUTURE_MAYBE.md`). **Back katana** on the procedural mesh is **optional** (`EXPORT_BACK_KATANA` in `scripts/export-stick-character.mjs`; default **off** until design locks swords for all stickmen).

**Target look** (silhouette, not pose-for-pose): solid **black** fill, **heroic** proportions — **head ~ torso width**, **blocky** upper body (mild V-taper), **long legs (~60% of height)**, **wide stance**, **large pill feet**, **mitten hands**. **Canonical 2D ref** (what the wall logo uses and what 3D should chase):

- `docs/reference/logo/dojo-stickman-i.png` (shipped copy: `public/logo/dojo-stickman-i.png`) — **primary** clean silhouette for **scale, proportions, and graphic read** in-engine and in marketing

Supporting character-folder PNGs (mood, combat poses, hinge language — not pose-matched in v1 export):

- `docs/reference/character/john-stick-ref-thick-capsule-katana-canonical.png` — earlier thick capsule + sheathed katana mood (katana optional in 3D today)
- `docs/reference/character/john-stick-ref-thick-rounded-action.png` — weighted, rounded stick + dynamic stance
- `docs/reference/character/john-stick-ref-sleek-combat-airborne.png` — long-limbed brawler read (enemy palette differs in-game; shape language is the cue)
- `docs/reference/character/john-stick-ref-hinge-combat.png` — hinge layout: torso break, limbs, head (2D capsule read; we use cylinders + sphere in 3D)
- `docs/reference/character/john-stick-ref-combat-katana-ready-stance.png` — **held** katana: two-hand grip, blade horizontal behind head/neck, **wide low stance**, **flat pill feet**, head can read **floating** (minimal neck). Use for a future **combat-ready clip** or **weapon state** (distinct from v1 **sheathed-on-back** procedural mesh).
- `docs/reference/character/john-stick-ref-eyes-and-vector-blood.png` — **face / VFX language** (not skeleton): optional **angry eyes** (white + red glow, slanted almond), **blank** head for neutral; **blood** as solid red circles; sword **grey blade / warm guard & hilt** for keyed reads. Implementation likely **decal / emissive texture / sprite** on the head sphere — see `docs/FUTURE_MAYBE.md`.

**WS-041** delivered the **pipeline** (glTF load, skinned mesh, Idle/Walk, validation, bone naming for ragdoll prep). The **in-repo procedural mesh** is an **iterating placeholder** that chases those refs until a **Blender (or DCC) hero export** replaces it under the same clip names and bone table. Final marketing/trailer silhouette = art pass + engine lighting, not a single closed ticket.

This is a **v1 locomotion** rig: keyframed **Idle** and **Walk** only (airborne clip: `docs/FUTURE_MAYBE.md`). When Rapier ragdoll lands (WS-091), map these bones to capsule / limb colliders in code — do not rename bones without updating this table and the export script.

## Hierarchy (parent → child)

| Bone | Parent | Notes |
|------|--------|--------|
| `Hips` | *(armature root under skin)* | Vertical bob in Walk; future pelvis / root for ragdoll |
| `Spine` | `Hips` | **Lower** torso cylinder; bend/twist vs pelvis |
| `Chest` | `Spine` | **Upper** torso cylinder; shoulders attach here |
| `Head` | `Chest` | Sphere mesh; optional future **`Neck`** between `Chest` and `Head` — see `docs/FUTURE_MAYBE.md` |
| `ShoulderL` | `Chest` | Upper-arm cylinder |
| `ArmL` | `ShoulderL` | Forearm cylinder |
| `ShoulderR` | `Chest` | |
| `ArmR` | `ShoulderR` | |
| `LegUpperL` | `Hips` | Thigh cylinder |
| `LegLowerL` | `LegUpperL` | Shin cylinder |
| `LegUpperR` | `Hips` | |
| `LegLowerR` | `LegUpperR` | |

## Clip manifest (technical animator handoff)

Applies to **canonical** procedural export; **playable hero** uses the **same clip names** at runtime but animation tracks target **that file’s** bones (e.g. Mixamo). See **Hero glTF export checklist** above.

| clip_id | Approx. duration (s) | Loop | Notes |
|---------|----------------------|------|--------|
| `Idle` | ~3 | yes | `Spine` + `Chest` counter-tilt; head micro-yaw; subtle torso Y drift |
| `Walk` | ~0.7 | yes | Legs/arms + `Spine`/`Chest` counter; hips bounce; no root XZ motion |

**Runtime:** `src/game/player/playerCharacter.ts` expects exact names **`Idle`** and **`Walk`**.

## Ragdoll (WS-094 shipped)

Runtime: `src/game/physics/trainingDummyArticulatedRagdoll.ts` + `trainingDummyRagdollConfig.ts` — Rapier **impulse joints** (spherical + revolute limits on elbows/knees), **12** dynamic bodies at knockdown, skinned mesh driven from body poses, teardown + monolithic capsule restore after recover. Perf cap note: `TRAINING_DUMMY_ARTICULATED_DYNAMIC_BODY_CAP` (GP §6.4.2).

| Bone | Physics role |
|------|----------------|
| `Hips` | Pelvis capsule on existing root body; COM impulses from combat |
| `Spine` | Lower torso; spherical to Hips |
| `Chest` | Upper torso; spherical to Spine |
| `Head` | Ball collider; spherical to Chest |
| `Shoulder*` / `Arm*` | Spherical shoulder; **revolute** elbow (`TRAINING_DUMMY_HINGE_LIMITS_RAD`) |
| `LegUpper*` / `LegLower*` | Spherical hip; **revolute** knee |

Physics programmer owns numeric tuning in `trainingDummyRagdollConfig.ts`; this document fixes **naming and hierarchy** for export ↔ engine parity.
