"""
Hero glb pass: import `stick_frig_v15_hero.glb` (or env override), ground feet,
optional foot widen, **`Idle`** from first key of **`Walk`**, re-export same path.

**DANGER — 2026-04-06:** A fully automated run of this workflow **broke** the hero (bad deformation /
silhouette). **Backup the `.glb`** before running. Verify every change in **Blender viewport** and in the
**browser** before committing. Prefer **interactive MCP** + small steps over headless batch until re-validated.

Blender **5.1+** (layered actions API). **MCP** users can run the same steps live; this script is the headless replay.

  export JOHN_STICK_ROOT=/path/to/john-stick
  \"$BLENDER\" -b -P \"$JOHN_STICK_ROOT/scripts/blender/ws228_hero_glb_production.py\"

Optional env: `JOHN_STICK_WS228_SRC` / `JOHN_STICK_WS228_OUT` (default: Stick_FRig hero in/out),
`JOHN_STICK_WS228_SKIP_MESH_EDIT=1` to skip foot widen.
"""

from __future__ import annotations

import os
from pathlib import Path

import bpy
from mathutils import Vector


def _repo_root() -> Path:
    env = os.environ.get("JOHN_STICK_ROOT")
    if env:
        return Path(env).resolve()
    return Path(__file__).resolve().parent.parent.parent


def _purge_actions() -> None:
    for a in list(bpy.data.actions):
        bpy.data.actions.remove(a)


def _world_mesh_bbox() -> tuple[Vector, Vector]:
    min_c = Vector((1e9, 1e9, 1e9))
    max_c = Vector((-1e9, -1e9, -1e9))
    for o in bpy.context.scene.objects:
        if o.type != "MESH" or not o.data.vertices:
            continue
        for c in o.bound_box:
            w = o.matrix_world @ Vector(c)
            for i, val in enumerate(w):
                min_c[i] = min(min_c[i], val)
                max_c[i] = max(max_c[i], val)
    return min_c, max_c


def _armature_object() -> bpy.types.Object:
    for o in bpy.context.scene.objects:
        if o.type == "ARMATURE":
            return o
    raise RuntimeError("No armature in scene after import")


def _remove_stray_meshes(names: tuple[str, ...] = ("Icosphere", "Icosphere.001")) -> None:
    for name in names:
        o = bpy.data.objects.get(name)
        if o:
            bpy.data.objects.remove(o, do_unlink=True)


def _ground_armature(arm: bpy.types.Object) -> None:
    min_c, _ = _world_mesh_bbox()
    arm.location.z -= min_c.z
    bpy.context.view_layer.update()


def _foot_widen_main_skinned_mesh(factor: float = 1.12, z_band: float = 0.12) -> None:
    mesh_main = None
    for o in bpy.context.scene.objects:
        if o.type != "MESH" or not o.parent or o.parent.type != "ARMATURE":
            continue
        if mesh_main is None or len(o.data.vertices) > len(mesh_main.data.vertices):
            mesh_main = o
    if mesh_main is None:
        return

    coords = [mesh_main.data.vertices[i].co.copy() for i in range(len(mesh_main.data.vertices))]
    min_z = min(v.z for v in coords)
    max_z = max(v.z for v in coords)
    th = min_z + (max_z - min_z) * z_band

    bpy.ops.object.mode_set(mode="OBJECT")
    bpy.ops.object.select_all(action="DESELECT")
    mesh_main.select_set(True)
    bpy.context.view_layer.objects.active = mesh_main
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="DESELECT")
    bpy.ops.object.mode_set(mode="OBJECT")

    sel_verts: list[Vector] = []
    for v in mesh_main.data.vertices:
        v.select = v.co.z <= th
        if v.select:
            sel_verts.append(mesh_main.matrix_world @ v.co.copy())
    mesh_main.data.update()

    if not sel_verts:
        bpy.ops.object.mode_set(mode="OBJECT")
        return

    c_world = sum(sel_verts, Vector((0.0, 0.0, 0.0))) / len(sel_verts)
    bpy.context.scene.cursor.location = c_world

    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.transform.resize(
        value=(factor, 1.0, 1.0),
        center_override=c_world,
        orient_type="GLOBAL",
    )
    bpy.ops.object.mode_set(mode="OBJECT")


def _idle_from_walk_layered() -> None:
    walk = bpy.data.actions.get("Walk")
    if walk is None:
        raise RuntimeError("Expected an action named 'Walk'")
    if "Idle" in bpy.data.actions:
        bpy.data.actions.remove(bpy.data.actions["Idle"])
    idle = walk.copy()
    idle.name = "Idle"
    strip = idle.layers[0].strips[0]
    cb = strip.channelbags[0]
    for fc in cb.fcurves:
        kps = fc.keyframe_points
        n = len(kps)
        if n == 0:
            continue
        x0 = float(kps[0].co[0])
        y0 = float(kps[0].co[1])
        for i in range(n - 1, 0, -1):
            kps.remove(kps[i])
        kps.insert(x0 + 1.0, y0, options=set())
    idle.use_fake_user = True


def export_hero_glb_ws228(
    *,
    repo: Path | None = None,
    src_name: str = "stick_frig_v15_hero.glb",
    out_name: str | None = None,
    skip_mesh_edit: bool = False,
) -> Path:
    root = repo or _repo_root()
    src = (
        Path(os.environ["JOHN_STICK_WS228_SRC"])
        if os.environ.get("JOHN_STICK_WS228_SRC")
        else root / "public" / "models" / src_name
    )
    out = (
        Path(os.environ["JOHN_STICK_WS228_OUT"])
        if os.environ.get("JOHN_STICK_WS228_OUT")
        else root / "public" / "models" / (out_name or src_name)
    )

    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=True)
    _purge_actions()
    bpy.ops.import_scene.gltf(filepath=str(src.resolve()))
    _remove_stray_meshes()

    arm = _armature_object()
    _ground_armature(arm)
    if not skip_mesh_edit and os.environ.get("JOHN_STICK_WS228_SKIP_MESH_EDIT") != "1":
        _foot_widen_main_skinned_mesh()

    _idle_from_walk_layered()

    bpy.ops.object.select_all(action="DESELECT")
    for obj in bpy.context.scene.objects:
        if obj.type in {"MESH", "ARMATURE"}:
            obj.select_set(True)
    meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    if meshes:
        bpy.context.view_layer.objects.active = meshes[0]

    out.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=str(out.resolve()),
        export_format="GLB",
        use_selection=True,
        export_yup=True,
        export_apply=True,
        export_animations=True,
    )
    print(f"[john-stick] WS-228 wrote {out} actions {[a.name for a in bpy.data.actions]}")
    return out


if __name__ == "__main__":
    export_hero_glb_ws228()
