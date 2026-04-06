# Player stick rig — bone ↔ ragdoll map (GP §5.2.1)

**Foundational hero (runtime):** **Stick_FRig** — `source_assets/Stick_FRig_V15.blend` → `scripts/blender/export_stick_frig_hero_glb.py` → **`public/models/stick_frig_v15_hero.glb`**. Custom armature (`Pelvis`, `ThighL`, `ForeL`, `Head`, …), **not** Mixamo. **`CREDITS.md`**.

**How the game uses it:** **Animations** are **authored in Blender** and exported as named clips in the glb (`Idle`, `Walk`, strikes — see checklist). The engine does **not** retarget from Mixamo or any other skeleton at runtime. **Physics / training dummy** use **logical slots** (`Hips`, `Spine`, …); `TRAINING_DUMMY_RAGDOLL_BONE_NAME_FALLBACKS` maps each slot to **Stick_FRig** bone names (and procedural `Hips`/`Spine`/… for tooling glbs).

**Thick capsule + katana** art target: **`docs/reference/character/john-stick-ref-thick-capsule-katana-canonical.png`** — model on **this** armature in Blender (`docs/BLENDER_THICK_CAPSULE_HERO_SOP.md`). **DCC:** **`WS-228`/`229`** → **`WS-224`/`225`**.

**Runtime (all stickmen):** **One** glTF — `STICKMAN_BASE_GLTF_URL` (alias `PLAYER_GLTF_URL_STICKMAN_HERO`) in `src/game/player/playerCharacter.ts` — loads for **player**, **training_dummy**, and **sparring_partner**. **Instantiation** (material tint per `appearance`, later scale/outfit) replaces separate GLBs per NPC class.

**Parametric / authoring:** `public/models/char_player_stick_v01.glb` — **`PLAYER_GLTF_URL_PROCEDURAL`**; `npm run export:character` for literal **`Hips` / `Spine` / …**, procedural clips, Blender `refine_hero_subsurf_export.py` — **not** the default in-engine body.

**Units / axes:** meters, **Y-up**, **+Z forward** (matches Three.js + current level blockout).

## One default rig + instantiation (Stick_FRig in glTF)

**Policy:** There is a **single** runtime stickman asset. **Do not** add alternate GLB URLs per NPC class — vary **instances** (tint, later uniform scale, materials, modular segments / **WS-134**).

| Layer | What it is |
|--------|------------|
| **Runtime glb** | **`STICKMAN_BASE_GLTF_URL`** — Stick_FRig **bone names** in the file; animation tracks target those bones. Swap the binary by re-exporting from `Stick_FRig_V15.blend` (or successor). |
| **Logical / physics map** | Slots **`Hips` / `Spine` / `Chest` / …** in code — **not** required as literal bone names in glTF. **`TRAINING_DUMMY_RAGDOLL_BONE_NAME_FALLBACKS`** resolves each slot to Stick_FRig names first, then procedural names. |
| **Parametric export** | `char_player_stick_v01.glb` — tooling mesh + literal `Hips`/`Spine`/… |

**Art bar:** Edit **mesh and actions** in Blender on **Stick_FRig** until silhouette matches refs. If you **rename bones**, update **`TRAINING_DUMMY_RAGDOLL_BONE_NAME_FALLBACKS`** and this doc. **Clip names** follow the checklist below (retarget any external mocap **in DCC**, not in the game loop).

### Hero glTF export checklist (runtime contract)

Rename or author actions so names match lookups (case-sensitive):

| Role | Clip name | Notes |
|------|-----------|--------|
| Locomotion | `Idle`, `Walk` | Loops. If only `Walk` exists, runtime builds a **synthetic** `Idle` (hold first frame). See `resolveIdleWalkClips` in `playerCharacter.ts`. |
| Base strikes | `Strike_LeftPunch`, `Strike_RightPunch`, `Strike_LeftKick`, `Strike_RightKick` | Optional; `src/game/player/strikePresentation.ts`. |
| Compound strikes | Each `suggestedAnimClipName` in `src/game/combat/compoundMoveTable.ts` | Optional (e.g. `Strike_DualPunch`, `Strike_TripleChord`, `Strike_Seq_*`). |

**Validate:** `docs/GLTF_EXPORT.md` · `npm run validate:gltf`.

**Swapping the base asset:** Overwrite or relink **`STICKMAN_BASE_GLTF_URL`** — every stickman in the scene picks it up. Ship **mesh + skeleton + animations** for one base; retarget external clips **in Blender** before export. Do not add a second “hero-only” path for the same cast; use **`gltfUrlOverride`** in `loadPlayerCharacter` only for dev experiments.

## Visual mesh vs gameplay physics (one stack, different owners per state)

**Player — locomotion + strikes:** The glTF stickman **follows** a **kinematic capsule** (`PLAYER_CAPSULE`, `rapierWorld.ts`) for **move, floor, world collision**. The skinned mesh **tracks** capsule position/yaw and plays **authored clips** (`playerCharacter.ts`, **WS-139** for strike read). This path is **not** “temporary until physics takes over” — it is the **default** motion owner for the hero unless **WS-223** schedules **receive / ragdoll** on the player for a given state.

**Targets — hit receive (training dummy, etc.):** **WS-091** + **WS-094** drive **Rapier** ragdoll and recovery using **this same bone hierarchy** (`CHARACTER_RIG_MAP` + name fallbacks). The **first** full articulated implementation is the **dummy** for lab clarity; **player** and **sparring** use the **identical** `STICKMAN_BASE_GLTF_URL` skeleton — extending who gets **WS-094**-depth receive stays **on the same bone map**, not a second rig standard.

**Policy:** Collider sizes, joint limits, and **who owns the bones** (clips vs capsule vs sim) are documented in **WS-223** and **`docs/FUTURE_MAYBE.md`** (*one motion system*), and tuned by gameplay/physics — not implied by triangle mesh alone. **Hinge layout in art** stays **consistent with bone parents** so bone ↔ collider mapping stays 1:1.

**Hinge read vs this rig** (see `docs/reference/character/john-stick-ref-hinge-combat.png`):

| Idea in ref | This rig |
|-------------|-----------|
| Legs hinge from bottom of body | `LegUpperL` / `LegUpperR` are children of **`Hips`** (pelvis), not `Spine` |
| Torso “break” at waist / mid-back | **`Spine` → `Chest`** (two torso links) |
| Arm hinges | **`Shoulder*` → `Arm*`** (shoulder + elbow-style split as upper/lower cylinders) |
| Head on neck | **`Head`** is parented to **`Chest`** today — works for head animation; a dedicated **`Neck`** bone is a **deferred** idea (`docs/FUTURE_MAYBE.md` → *Character: `Neck` bone…*) |

So: the **player’s** gameplay proxy is still the **capsule** + **clips**; the **dummy** already uses **ragdoll** on the **same logical slots** (resolved to **Mixamo** bones on the foundational hero). **WS-223** keeps **handoffs** explicit so nothing forks.

## Art direction & where this is “finalized”

**Procedural placeholder mesh (export script):** **cylinders** for pelvis, **two stacked torso** cylinders (`Spine` + `Chest` bones), **short neck** stub (weighted to `Chest`), **two cylinders + mitten sphere per arm**, **two cylinders + foot blob per leg**, **large sphere** head — flat caps at segment joins (optional joint smoothing: `docs/FUTURE_MAYBE.md`). **Back katana** on the procedural mesh is **optional** (`EXPORT_BACK_KATANA` in `scripts/export-stick-character.mjs`; default **off** until design locks swords for all stickmen).

**Target look** (silhouette, not pose-for-pose): solid **black** fill, **heroic** proportions — **head ~ torso width**, **blocky** upper body (mild V-taper), **long legs (~60% of height)**, **wide stance**, **large pill feet**, **mitten hands**. **Canonical 2D ref** (what the wall logo uses and what 3D should chase):

- `docs/reference/logo/dojo-stickman-i.png` (shipped copy: `public/logo/dojo-stickman-i.png`) — **primary** clean silhouette for **scale, proportions, and graphic read** in-engine and in marketing

Supporting character-folder PNGs (mood, combat poses, hinge language — not pose-matched to current procedural export):

- `docs/reference/character/john-stick-ref-thick-capsule-katana-canonical.png` — earlier thick capsule + sheathed katana mood (katana optional in 3D today)
- `docs/reference/character/john-stick-ref-thick-rounded-action.png` — weighted, rounded stick + dynamic stance
- `docs/reference/character/john-stick-ref-sleek-combat-airborne.png` — long-limbed brawler read (enemy palette differs in-game; shape language is the cue)
- `docs/reference/character/john-stick-ref-hinge-combat.png` — hinge layout: torso break, limbs, head (2D capsule read; we use cylinders + sphere in 3D)
- `docs/reference/character/john-stick-ref-combat-katana-ready-stance.png` — **held** katana: two-hand grip, blade horizontal behind head/neck, **wide low stance**, **flat pill feet**, head can read **floating** (minimal neck). Use for a future **combat-ready clip** or **weapon state** (distinct from **sheathed-on-back** procedural mesh today).
- `docs/reference/character/john-stick-ref-eyes-and-vector-blood.png` — **face / VFX language** (not skeleton): optional **angry eyes** (white + red glow, slanted almond), **blank** head for neutral; **blood** as solid red circles; sword **grey blade / warm guard & hilt** for keyed reads. Implementation likely **decal / emissive texture / sprite** on the head sphere — see `docs/FUTURE_MAYBE.md`.

**WS-041** delivered the **pipeline** (glTF load, skinned mesh, Idle/Walk, validation, bone naming for ragdoll prep). **Default runtime** uses **Stick_FRig** (`STICKMAN_BASE_GLTF_URL`); **procedural** `export:character` remains for tooling. **Blender** edits on **Stick_FRig** drive mesh + actions toward refs (**WS-224+** clips, **WS-139** presentation). Final marketing/trailer silhouette = art pass + engine lighting, not a single closed ticket.

**Baseline locomotion:** if the glb contains **only `Walk`**, **`resolveIdleWalkClips`** builds a **synthetic `Idle`** (hold first frame of `Walk`). Prefer authoring real **`Idle`** + **`Walk`** in Blender (**WS-229** / **WS-224**). **Dummy** ragdoll (**WS-094**) maps **logical** slots to **Stick_FRig** bones via fallbacks; **player** extension follows **WS-223**. If you rename glTF bones, update **fallbacks** + this doc (and `export-stick-character.mjs` only if you still use procedural).

## Hierarchy (logical slot → Stick_FRig bone)

| Slot | Parent slot | Primary Stick_FRig bone | Notes |
|------|-------------|-------------------------|--------|
| `Hips` | — | `Pelvis` | Ragdoll root |
| `Spine` | `Hips` | `TorsoLow_MCH` | Alternatives: `TorsoBendy`, `Torso_MCH` (see `trainingDummyRagdollConfig.ts`) |
| `Chest` | `Spine` | `TorsoHigh_MCH` | Also `TorsoIK` |
| `Head` | `Chest`* | `Head` | *Scene graph may use `Head_CTRL` / `TorsoIK`; fallbacks still resolve `Head` for colliders |
| `ShoulderL` | `Chest` | `Shoulder_MCHL`, `UpperL` | |
| `ArmL` | `ShoulderL` | `ForeL` | Ragdoll uses one **`ArmL`** capsule along upper/fore chain |
| `ShoulderR` | `Chest` | `Shoulder_MCHR`, `UpperR` | |
| `ArmR` | `ShoulderR` | `ForeR` | |
| `LegUpperL` | `Hips` | `ThighL` | Also FK/IK helper bones (`Thigh_FKL`, …) in fallbacks |
| `LegLowerL` | `LegUpperL` | `ShinL` | |
| `LegUpperR` | `Hips` | `ThighR` | |
| `LegLowerR` | `LegUpperR` | `ShinR` | |

Procedural export uses the **same logical slots** with literal names **`Hips`**, **`Spine`**, …

## Clip manifest (technical animator handoff)

**Parametric** export: table below approximates key motion on **`Hips` / …** bones. **Stick_FRig hero:** use the **same clip names** at runtime; tracks target **Stick_FRig** bones. See **Hero glTF export checklist** above.

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
