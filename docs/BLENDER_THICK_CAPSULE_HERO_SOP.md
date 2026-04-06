# Blender SOP — thick capsule + katana hero (Mixamo rig)

**Goal:** Match **`docs/reference/character/john-stick-ref-thick-capsule-katana-canonical.png`** (rounded capsule limbs, circle head, sheathed katana on back) on the **Stick_FRig** armature, then export a glTF for **`STICKMAN_BASE_GLTF_URL`** (`stick_frig_v15_hero.glb`).

**Ignore for default runtime:** `char_thick_capsule_mixamo_v01.glb` from **`build_thick_capsule_mixamo_hero.py`** — automatic weights make **blob** meshes in-engine; use this doc to model properly in Blender instead.

**Not this doc:** Rapier colliders live in **`trainingDummyRagdollConfig.ts`** (tune after the mesh is final).

---

## 1. Start from the shipped Mixamo hero

1. Open **`source_assets/Stick_FRig_V15.blend`** (canonical rig), *or* Blender **File → Import → glTF 2.0** → **`public/models/stick_frig_v15_hero.glb`**.
2. **Outliner:** expand armature; confirm **Stick_FRig** bone names (`Pelvis`, `ThighL`, … — see `docs/CHARACTER_RIG_MAP.md`). **Do not** rename bones unless you update **`TRAINING_DUMMY_RAGDOLL_BONE_NAME_FALLBACKS`** + **`CHARACTER_RIG_MAP`**.
3. **Pose Mode → Pose → Clear Transform** on everything if anything looks posed; you want **rest/bind** for modeling.
4. **Delete** the imported mesh objects only (keep the armature), then model the capsule body — *or* sculpt/onion-skin the old mesh as scale reference.

**Reference image:** Properties → **View** → set **Background Image** on *Camera* or use an **empty** + image in a second viewport; align **front/ side** roughly to the armature — this is a silhouette read, not millimeter match.

---

## 2. Block out the body (capsule read)

Pick **one** workflow (TA preference):

| Workflow | Pros |
|----------|------|
| **Curve + Bevel (round profile)** | Clean “tube” limbs; easy radius tweaks; convert to mesh when happy. |
| **Cylinder primitives + Bevel modifier (amount ~1)** | Pill ends without manual spheres at every joint. |
| **Single Subdivision mesh sculpted** | Best organic fuse at shoulders/hips; more time. |

**Coverage (minimum):** pelvis / lower torso / upper torso / neck stub / **sphere head**; **upper arm + forearm** (or one tapered capsule per arm); **thigh + shin + foot pill** per leg. Use **`docs/CHARACTER_RIG_MAP.md`** logical regions vs Mixamo bones.

**Scale:** Work in **meters**, **apply scale** on mesh objects **before** parenting (`Ctrl+A → Scale`), **never** apply scale on the armature unless you fully understand rest pose + skin bind.

---

## 3. Katana (sheathed on back)

1. Add a **thin cube** or **cylinder** for blade + scabbard read; a **small torus or disc** for tsuba if needed.
2. Place in **Object Mode** using **Spine / Spine2 / Chest** as visual guides (hilt above **left** shoulder in the ref, diagonal down the back).
3. **Either:** join katana verts into the body mesh **before** parenting, **or** keep as second mesh also parented to armature (glTF allows multiple skinned meshes — engine loads fine; one material is simplest).

---

## 4. Material

- **Principled BSDF:** near-black base color (~`0.02`), moderate roughness — matches silhouette ref; engine + lights do the rest.
- One material slot for the whole hero is enough for v1.

---

## 5. Armature parenting & weights

1. Select **mesh**, then **armature**; **`Ctrl+P` → Armature Deform → With Automatic Weights**.
2. **Pose Mode:** bend elbows/knees; fix spikes with **Weight Paint** (blur, normalize) or **Limit Total** in export (prefer fixing weights).
3. **Fingers:** optional — ragdoll uses **upper arm + forearm** style slots; you can strip finger geo or weight it 100% to **Hand** bone to avoid stray deformation.

---

## 6. Animations

- Source file usually has **`Walk`** only; runtime can synthesize **`Idle`** (see **`playerCharacter.ts`**).  
- For a real **`Idle`** loop: author in **Action Editor**, name exactly **`Idle`**; keep **`Walk`** locomotion-only (**`WS-229`**).
- **NLA:** only strips you intend to ship should feed **glTF export** (check exporter “animation” mode).

---

## 7. Export

1. Select **mesh + armature** only.
2. **File → Export → glTF 2.0 (.glb)**  
   - **Y up**, **Apply Modifiers** if your final stack is intentional.  
   - Animations on.
3. Repo: **`npm run validate:gltf`** (add path if new file), bump **`DEV_STICKMAN_GLB_CACHE_BUST`** if URL unchanged in dev.

---

## 8. Optional: seed mesh from the repo script

`scripts/blender/build_thick_capsule_mixamo_hero.py` may be used to dump **placeholder** geometry for reference only; **re-parent and weight-paint from scratch** if you import it — the automated export is **not** shippable as-is.

---

## Roles

- **Blender / TA:** this SOP + **`role-blender-expert`**.  
- **Art direction:** silhouette vs **`john-stick-ref-thick-capsule-katana-canonical.png`**, black read.  
- **Tech anim:** **`Idle` / `Walk`** intent, **`WS-224` / `WS-229`**.
