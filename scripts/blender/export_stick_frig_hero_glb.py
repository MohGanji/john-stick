"""
Export **Stick_FRig_V15** body + armature to `public/models/stick_frig_v15_hero.glb` for **`STICKMAN_BASE_GLTF_URL`**.

- Loads **`source_assets/Stick_FRig_V15.blend`** (or `JOHN_STICK_STICK_FRIG_BLEND`).
- Selects **Armature** + character **body part** meshes only (drops arrows, controller gizmos, camera, lights, GP).
- **Y-up** glTF binary; animations from the blend (rename primary armature action to **`Walk`** if none named Walk/Idle).

  export JOHN_STICK_ROOT=/path/to/john-stick
  /Applications/Blender.app/Contents/MacOS/Blender -b \\
    "$JOHN_STICK_ROOT/source_assets/Stick_FRig_V15.blend" \\
    -P "$JOHN_STICK_ROOT/scripts/blender/export_stick_frig_hero_glb.py"
"""

from __future__ import annotations

import os
from pathlib import Path

import bpy

# Meshes that are the stick figure body (parented to Armature / armature-modified).
_BODY_MESH_NAMES: frozenset[str] = frozenset(
    {
        "Arm_lower.L",
        "Arm_lower.R",
        "Arm_Upper.L",
        "Arm_Upper.R",
        "Foot.L",
        "Foot.R",
        "Head",
        "Shin.L",
        "Shin.R",
        "Thigh.L",
        "Thigh.R",
        "Torso",
        "Wrist.L",
        "Wrist.R",
    },
)


def _repo_root() -> Path:
    env = os.environ.get("JOHN_STICK_ROOT")
    if env:
        return Path(env).resolve()
    return Path(__file__).resolve().parent.parent.parent


def _rename_locomotion_actions() -> None:
    """Ensure engine finds `Idle` and `Walk` (case-sensitive)."""
    actions = list(bpy.data.actions)
    if not actions:
        return
    # Prefer an action already on the armature
    arm = bpy.data.objects.get("Armature")
    if arm and arm.animation_data and arm.animation_data.action:
        primary = arm.animation_data.action
    else:
        primary = next((a for a in actions if "Armature" in a.name or "Stick" in a.name), actions[0])

    if primary.name not in ("Idle", "Walk"):
        # If only one authored clip, treat as Walk; engine can synth Idle from Walk if needed
        if not any(a.name == "Walk" for a in actions):
            primary.name = "Walk"

    if not any(a.name == "Idle" for a in actions) and any(a.name == "Walk" for a in actions):
        idle = bpy.data.actions["Walk"].copy()
        idle.name = "Idle"
        idle.use_fake_user = True


def export_stick_frig_glb(
    *,
    repo: Path | None = None,
    out_name: str = "stick_frig_v15_hero.glb",
) -> Path:
    root = repo or _repo_root()
    out = root / "public" / "models" / out_name
    out.parent.mkdir(parents=True, exist_ok=True)

    for obj in bpy.context.scene.objects:
        obj.select_set(False)
    for obj in bpy.context.scene.objects:
        if obj.type == "MESH" and obj.name in _BODY_MESH_NAMES:
            obj.select_set(True)
        elif obj.type == "ARMATURE" and obj.name == "Armature":
            obj.select_set(True)

    sel = bpy.context.selected_objects
    if not any(o.type == "ARMATURE" for o in sel):
        raise RuntimeError("Armature 'Armature' not found or not selectable")
    if not any(o.type == "MESH" for o in sel):
        raise RuntimeError("No body meshes selected — check _BODY_MESH_NAMES")

    meshes = [o for o in sel if o.type == "MESH"]
    bpy.context.view_layer.objects.active = meshes[0]

    _rename_locomotion_actions()

    bpy.ops.export_scene.gltf(
        filepath=str(out.resolve()),
        export_format="GLB",
        use_selection=True,
        export_yup=True,
        export_apply=True,
        export_animations=True,
    )
    print(f"[john-stick] Stick_FRig export wrote {out}")
    return out


if __name__ == "__main__":
    export_stick_frig_glb()
