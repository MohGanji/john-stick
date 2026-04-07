"""
Import **`assets/stick-man-for-mixamo/stick-man-for-mixamo.fbx`** (Mixamo skeleton + skinned stick mesh),
normalize **action names** for the runtime (`Idle`, `Walk`, …), export **`public/models/stick_man_mixamo_base.glb`**.

  export JOHN_STICK_ROOT=/path/to/john-stick
  /Applications/Blender.app/Contents/MacOS/Blender -b \\
    -P "$JOHN_STICK_ROOT/scripts/blender/export_stick_man_mixamo_base_glb.py"

Optional: **`JOHN_STICK_MIXAMO_FBX`**, **`JOHN_STICK_MIXAMO_OUT`** (output `.glb` basename under `public/models/`).
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


def _sanitize_action_names() -> None:
    """FBX import uses `Armature|Armature|Idle`-style names; engine expects short names."""
    for action in list(bpy.data.actions):
        raw = action.name
        short = raw.split("|")[-1].strip() if "|" in raw else raw
        if short and short != raw:
            action.name = short


def export_stick_man_mixamo_base_glb(
    *,
    repo: Path | None = None,
    fbx_name: str | None = None,
    out_name: str | None = None,
) -> Path:
    root = repo or _repo_root()
    fbx = Path(
        os.environ.get("JOHN_STICK_MIXAMO_FBX")
        or (root / "assets" / "stick-man-for-mixamo" / (fbx_name or "stick-man-for-mixamo.fbx")),
    )
    out = root / "public" / "models" / (out_name or os.environ.get("JOHN_STICK_MIXAMO_OUT") or "stick_man_mixamo_base.glb")
    out.parent.mkdir(parents=True, exist_ok=True)

    if not fbx.is_file():
        raise FileNotFoundError(f"Mixamo FBX not found: {fbx}")

    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.fbx(filepath=str(fbx.resolve()))

    _sanitize_action_names()

    bpy.ops.object.select_all(action="DESELECT")
    for obj in bpy.context.scene.objects:
        if obj.type in {"ARMATURE", "MESH"}:
            obj.select_set(True)

    meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    if not meshes:
        raise RuntimeError("No mesh after FBX import")
    bpy.context.view_layer.objects.active = meshes[0]

    bpy.ops.export_scene.gltf(
        filepath=str(out.resolve()),
        export_format="GLB",
        use_selection=True,
        export_yup=True,
        export_apply=True,
        export_animations=True,
    )
    print(f"[john-stick] Mixamo stick base export wrote {out}")
    return out


if __name__ == "__main__":
    export_stick_man_mixamo_base_glb()
