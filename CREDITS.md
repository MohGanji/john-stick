# Third-party credits

## 3D — foundational hero (runtime)

- **Stick_FRig V15** — in-engine **`STICKMAN_BASE_GLTF_URL`**: `source_assets/Stick_FRig_V15.blend` → `scripts/blender/export_stick_frig_hero_glb.py` → `public/models/stick_frig_v15_hero.glb`. Project-owned rig + mesh (see `docs/CHARACTER_RIG_MAP.md`).
- **Stickman Fighting (historical reference)** — earlier base mesh / silhouette research: [Sketchfab](https://sketchfab.com/3d-models/stickman-fighting-64ea34474dd74a4c99da63e117b04b4f) by [kaisoon](https://sketchfab.com/kaisoon), [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/). License text: `public/models/third_party/stickman_fighting_kaisoon_LICENSE.txt`. The Sketchfab `.glb` is **no longer** shipped in `public/models/`.

## In-repo (authoring / parametric)

- **John Stick procedural stick** — `npm run export:character` → `public/models/char_player_stick_v01.glb` (`PLAYER_GLTF_URL_PROCEDURAL`). Literal **`Hips` / `Spine` / …** bone names for tooling and `scripts/blender/refine_hero_subsurf_export.py`; not the default runtime body.
