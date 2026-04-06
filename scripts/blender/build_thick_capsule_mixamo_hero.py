"""
Thick **capsule** silhouette — **experimental / not shippable** as default runtime.

**Known failure:** `ARMATURE_AUTO` weights + merged primitives **collapse to blob** geometry under locomotion
in Three.js (2026-04). Model thick-capsule silhouette by hand in Blender; do **not** set
**`STICKMAN_BASE_GLTF_URL`** to this output without a full weight + mesh pass.

Default import: **`stick_frig_v15_hero.glb`** (or override). Replaces meshes, re-exports. Legacy output name
**`char_thick_capsule_mixamo_v01.glb`** — still **not** shippable without hand weights.

  export JOHN_STICK_ROOT=/path/to/john-stick
  /Applications/Blender.app/Contents/MacOS/Blender -b -P \\
    scripts/blender/build_thick_capsule_mixamo_hero.py
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


def _bw_ht(arm: bpy.types.Object, bone_name: str) -> tuple[Vector, Vector]:
    b = arm.data.bones[bone_name]
    mw = arm.matrix_world
    return mw @ b.head_local.copy(), mw @ b.tail_local.copy()


def _cylinder_between(
    v1: Vector,
    v2: Vector,
    radius: float,
    name: str,
    vseg: int = 14,
) -> bpy.types.Object:
    d = v2 - v1
    length = float(d.length)
    if length < 1e-6:
        bpy.ops.mesh.primitive_uv_sphere_add(radius=radius, segments=vseg, ring_count=8, location=v1)
        ob = bpy.context.active_object
        ob.name = name
        return ob
    mid = (v1 + v2) / 2.0
    bpy.ops.mesh.primitive_cylinder_add(radius=radius, depth=length, vertices=vseg, location=mid)
    ob = bpy.context.active_object
    ob.name = name
    quat = d.normalized().to_track_quat("Z", "Y")
    ob.rotation_euler = quat.to_euler()
    return ob


def _sphere_at(center: Vector, radius: float, name: str) -> bpy.types.Object:
    bpy.ops.mesh.primitive_uv_sphere_add(radius=radius, segments=18, ring_count=10, location=center)
    ob = bpy.context.active_object
    ob.name = name
    return ob


def _radius_for_segment(v1: Vector, v2: Vector, scale: float) -> float:
    return max(0.005, min(0.07, float((v2 - v1).length) * scale))


# (bone_a, bone_b, radius scale vs segment length)
# Blender glTF import uses **`mixamorig:Bone`**; Three.js often flattens to **`mixamorigBone`**.
BonePairs: list[tuple[str, str, float]] = [
    ("mixamorig:Hips_01", "mixamorig:Spine_02", 0.42),
    ("mixamorig:Spine_02", "mixamorig:Spine1_03", 0.40),
    ("mixamorig:Spine1_03", "mixamorig:Spine2_04", 0.38),
    ("mixamorig:Spine2_04", "mixamorig:Neck_05", 0.28),
    ("mixamorig:Neck_05", "mixamorig:Head_06", 0.22),
    ("mixamorig:LeftShoulder_08", "mixamorig:LeftArm_09", 0.14),
    ("mixamorig:LeftArm_09", "mixamorig:LeftForeArm_010", 0.15),
    ("mixamorig:LeftForeArm_010", "mixamorig:LeftHand_011", 0.12),
    ("mixamorig:RightShoulder_016", "mixamorig:RightArm_017", 0.14),
    ("mixamorig:RightArm_017", "mixamorig:RightForeArm_018", 0.15),
    ("mixamorig:RightForeArm_018", "mixamorig:RightHand_019", 0.12),
    ("mixamorig:LeftUpLeg_024", "mixamorig:LeftLeg_025", 0.14),
    ("mixamorig:LeftLeg_025", "mixamorig:LeftFoot_026", 0.16),
    ("mixamorig:RightUpLeg_00", "mixamorig:RightLeg_029", 0.14),
    ("mixamorig:RightLeg_029", "mixamorig:RightFoot_030", 0.16),
]


def _add_katana_meshes(arm: bpy.types.Object, pieces: list[bpy.types.Object]) -> None:
    try:
        h, t = _bw_ht(arm, "mixamorig:Spine2_04")
    except KeyError:
        return
    up = (t - h).normalized()
    side = up.cross(Vector((0.0, 1.0, 0.0)))
    if side.length < 1e-3:
        side = Vector((1.0, 0.0, 0.0))
    else:
        side.normalize()
    back = side.cross(up).normalized()

    span = float((t - h).length)
    blade_len = span * 2.4
    r_blade = max(0.006, blade_len * 0.018)
    start = h + up * 0.03 + side * 0.07 + back * 0.04
    end = start - up * blade_len * 0.55 + side * (-blade_len * 0.35) + back * (-blade_len * 0.12)
    pieces.append(_cylinder_between(start, end, r_blade, "KatanaBlade", vseg=10))
    pieces.append(_sphere_at(start + up * 0.02 + side * 0.02, r_blade * 2.2, "KatanaGuard"))


def _assign_black_material(obj: bpy.types.Object) -> None:
    name = "StickBlackMat"
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    principled = nodes.get("Principled BSDF")
    if principled:
        principled.inputs["Base Color"].default_value = (0.02, 0.02, 0.02, 1.0)
        principled.inputs["Roughness"].default_value = 0.45
    obj.data.materials.clear()
    obj.data.materials.append(mat)


def _ensure_idle_hold_from_walk() -> None:
    walk = bpy.data.actions.get("Walk")
    if walk is None or "Idle" in bpy.data.actions:
        return
    if not walk.layers:
        return
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


def build_capsule_mixamo_glb(
    *,
    repo: Path | None = None,
    src_name: str | None = None,
    out_name: str | None = None,
    katana: bool | None = None,
) -> Path:
    root = repo or _repo_root()
    src = Path(
        os.environ.get("JOHN_STICK_MIXAMO_SRC")
        or (root / "public" / "models" / (src_name or "stick_frig_v15_hero.glb")),
    )
    out = Path(
        os.environ.get("JOHN_STICK_MIXAMO_OUT")
        or (root / "public" / "models" / (out_name or "char_thick_capsule_mixamo_v01.glb")),
    )
    if katana is None:
        katana = os.environ.get("JOHN_STICK_KATANA", "1") != "0"

    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=True)
    for a in list(bpy.data.actions):
        bpy.data.actions.remove(a)

    bpy.ops.import_scene.gltf(filepath=str(src.resolve()))

    arm: bpy.types.Object | None = None
    for o in bpy.context.scene.objects:
        if o.type == "ARMATURE":
            arm = o
            break
    if arm is None:
        raise RuntimeError("No armature after glTF import")

    for o in list(bpy.context.scene.objects):
        if o.type == "MESH":
            bpy.data.objects.remove(o, do_unlink=True)

    pieces: list[bpy.types.Object] = []
    for i, (bn_a, bn_b, rscale) in enumerate(BonePairs):
        if bn_a not in arm.data.bones or bn_b not in arm.data.bones:
            continue
        h1, t1 = _bw_ht(arm, bn_a)
        h2, t2 = _bw_ht(arm, bn_b)
        # segment from end of parent chain toward child
        v1, v2 = t1, h2
        if (v2 - v1).length < 1e-4:
            v1, v2 = h1, t2
        r = _radius_for_segment(v1, v2, rscale)
        pieces.append(_cylinder_between(v1, v2, r, f"Cap_{i}"))

    try:
        hh, ht = _bw_ht(arm, "mixamorig:Head_06")
        r_head = max(0.04, float((ht - hh).length) * 0.85)
        pieces.append(_sphere_at((hh + ht) / 2.0, r_head, "HeadSphere"))
    except KeyError:
        pass

    for bname, suffix in (
        ("mixamorig:LeftHand_011", "HandL"),
        ("mixamorig:RightHand_019", "HandR"),
    ):
        if bname not in arm.data.bones:
            continue
        h, t = _bw_ht(arm, bname)
        pieces.append(_sphere_at((h + t) / 2.0, _radius_for_segment(h, t, 1.05), f"Mitten_{suffix}"))

    if katana:
        _add_katana_meshes(arm, pieces)

    if not pieces:
        raise RuntimeError("No capsule pieces — bone names mismatch?")

    bpy.ops.object.select_all(action="DESELECT")
    for p in pieces:
        p.select_set(True)
    bpy.context.view_layer.objects.active = pieces[0]
    bpy.ops.object.join()
    body = bpy.context.active_object
    body.name = "ThickCapsuleBody"
    _assign_black_material(body)

    bpy.ops.object.select_all(action="DESELECT")
    body.select_set(True)
    arm.select_set(True)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.parent_set(type="ARMATURE_AUTO")

    _ensure_idle_hold_from_walk()

    bpy.ops.object.select_all(action="DESELECT")
    for o in (body, arm):
        o.select_set(True)
    bpy.context.view_layer.objects.active = body

    out.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=str(out.resolve()),
        export_format="GLB",
        use_selection=True,
        export_yup=True,
        export_apply=True,
        export_animations=True,
    )
    anims = [a.name for a in bpy.data.actions]
    print(f"[john-stick] Wrote {out}  actions={anims}")
    return out


if __name__ == "__main__":
    build_capsule_mixamo_glb()
