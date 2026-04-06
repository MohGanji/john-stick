"""
Export the current Blender scene’s mesh + armature to the John Stick hero GLB.

Uses `docs/GLTF_EXPORT.md` conventions (GLB, Y-up, animations, apply modifiers).

Run headless (saved .blend with your hero as the only mesh/armature content, or adjust selection logic):

  export JOHN_STICK_ROOT=/path/to/john-stick
  blender /path/to/hero.blend --background --python "$JOHN_STICK_ROOT/scripts/blender/export_john_stick_hero_glb.py"

Or from repo root after `export JOHN_STICK_ROOT=$PWD`:

  /Applications/Blender.app/Contents/MacOS/Blender hero.blend -b -P scripts/blender/export_john_stick_hero_glb.py

Agent + MCP (GUI Blender connected): set `JOHN_STICK_ROOT` and `importlib`-load this file, then call
`export_hero_glb()` or `export_hero_glb(out_name="stick_frig_v15_hero.glb")` for the runtime hero slot.

Environment (optional): `JOHN_STICK_EXPORT_GLB=stick_frig_v15_hero.glb` when running `-P` without editing the script.
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


def export_hero_glb(
    *,
    out_name: str = "char_player_stick_v01.glb",
    repo: Path | None = None,
) -> Path:
    root = repo or _repo_root()
    out: Path = root / "public" / "models" / out_name
    out.parent.mkdir(parents=True, exist_ok=True)

    bpy.ops.object.select_all(action="DESELECT")
    for obj in bpy.context.scene.objects:
        if obj.type in {"MESH", "ARMATURE"}:
            obj.select_set(True)

    # Last selected as active (exporter likes an active object)
    meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    if meshes:
        bpy.context.view_layer.objects.active = meshes[0]

    filepath = str(out.resolve())
    bpy.ops.export_scene.gltf(
        filepath=filepath,
        export_format="GLB",
        use_selection=True,
        export_yup=True,
        export_apply=True,
        export_animations=True,
    )
    print(f"[john-stick] Wrote {filepath}")
    return out


if __name__ == "__main__":
    export_hero_glb(
        out_name=os.environ.get(
            "JOHN_STICK_EXPORT_GLB",
            "char_player_stick_v01.glb",
        ),
    )
