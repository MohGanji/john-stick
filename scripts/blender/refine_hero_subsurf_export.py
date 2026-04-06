"""
Round-trip **`PLAYER_GLTF_URL_PROCEDURAL`** (`char_player_stick_v01.glb`) through Blender for a
**smoother** silhouette (Subdivision) while keeping **literal** `Hips`/`Spine`/… and **`Idle`/`Walk`**.

Does **not** replace the default **Stick_FRig** runtime hero (`STICKMAN_BASE_GLTF_URL`) unless you swap URLs
after export.

**When:** After `npm run export:character` (or whenever `public/models/char_player_stick_v01.glb`
needs a DCC pass). Same workflow as Blender MCP: purge stray actions, import glb, drop import
cruft, add Subdivision before Armature, export with apply.

**Headless:**
  export JOHN_STICK_ROOT=/path/to/john-stick
  /Applications/Blender.app/Contents/MacOS/Blender -b -P \\
    "$JOHN_STICK_ROOT/scripts/blender/refine_hero_subsurf_export.py"
"""

from __future__ import annotations

import os
from pathlib import Path

import bpy


def _repo_root() -> Path:
    env = os.environ.get("JOHN_STICK_ROOT")
    if env:
        return Path(env).resolve()
    return Path(__file__).resolve().parent.parent.parent


def refine_and_export(
    *,
    repo: Path | None = None,
    src_name: str = "char_player_stick_v01.glb",
    out_name: str | None = None,
) -> Path:
    root = repo or _repo_root()
    src = root / "public" / "models" / src_name
    out = root / "public" / "models" / (out_name or src_name)

    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=True)
    for a in list(bpy.data.actions):
        bpy.data.actions.remove(a)
    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj, do_unlink=True)

    bpy.ops.import_scene.gltf(filepath=str(src.resolve()))

    bpy.ops.object.mode_set(mode="OBJECT")
    bpy.ops.object.select_all(action="DESELECT")
    for o in list(bpy.context.scene.objects):
        if o.type == "MESH" and o.name.startswith("Icosphere"):
            o.select_set(True)
    bpy.ops.object.delete(use_global=False)

    mesh_obj = None
    for o in bpy.context.scene.objects:
        if o.type == "MESH" and o.parent and o.parent.type == "ARMATURE":
            mesh_obj = o
            break
    if mesh_obj is None:
        raise RuntimeError("No skinned mesh parented to armature after glTF import")

    mesh_obj.name = "HeroBody"
    bpy.context.view_layer.objects.active = mesh_obj
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.mesh.faces_shade_smooth()
    bpy.ops.object.mode_set(mode="OBJECT")

    if not any(m.type == "SUBSURF" for m in mesh_obj.modifiers):
        bpy.context.view_layer.objects.active = mesh_obj
        sub = mesh_obj.modifiers.new(name="Subdivision", type="SUBSURF")
        sub.levels = 1
        sub.render_levels = 2
        while mesh_obj.modifiers[0].type != "SUBSURF":
            bpy.ops.object.modifier_move_up(modifier="Subdivision")

    arm = mesh_obj.parent
    if arm is None or arm.type != "ARMATURE":
        raise RuntimeError("HeroBody lost armature parent")

    bpy.ops.object.select_all(action="DESELECT")
    arm.select_set(True)
    mesh_obj.select_set(True)
    bpy.context.view_layer.objects.active = mesh_obj

    out.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=str(out.resolve()),
        export_format="GLB",
        use_selection=True,
        export_yup=True,
        export_apply=True,
        export_animations=True,
    )
    print(f"[john-stick] Refined hero wrote {out}")
    return out


if __name__ == "__main__":
    refine_and_export()
