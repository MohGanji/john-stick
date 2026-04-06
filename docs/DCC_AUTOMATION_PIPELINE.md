# DCC automation & integration — pipeline decision (WS-131)

**Work stream:** WS-131 — Wave 13 (`docs/WORK_STREAMS.md`).  
**Primary DCC:** **Blender** (LTS recommended for team stability). *Equivalent DCCs* (Maya, Houdini, etc.) can follow the same **tier order**; swap the interactive bridge and CLI invocation for that tool’s official automation docs.  
**Handoff contract:** `docs/GLTF_EXPORT.md` + `npm run validate:gltf` after any export lands in `public/models/`.

---

## Executive decision

| Tier | Approach | When to use |
|------|-----------|-------------|
| **1 — Recommended** | **Blender + MCP** (running GUI Blender + MCP server, agent/human drives `bpy` / operators) | Day-to-day authoring on a **local** machine with **Cursor** (or another MCP client). Best match for **iterative** rig/skin/export debugging where **UI context** matters. |
| **2 — Fallback** | **Headless Blender CLI** (`blender -b … -P script.py`) | **Batch** exports, **repeatable** conversions, future **CI** that installs Blender on the runner. No MCP dependency. |
| **3 — Last resort** | **Manual SOP** (human in Blender + checklist; agents use **Cursor browser** for official docs only) | MCP unavailable, CLI blocked (policy), or one-off licenses / gated UIs that resist automation. |

**Crew rule:** Prefer **tier 1** when `docs/TOOLCHAIN_ACCESS.md` prerequisites are satisfied; if an agent session has no Blender MCP, use **tier 2** with a committed script under `scripts/blender/` (add when first needed) or **tier 3** and record what blocked automation.

---

## Tier 1 — Blender + MCP (recommended)

**Idea:** An MCP server talks to a **live** Blender process; the add-on (or companion socket) executes Python / operators inside that session. This matches the technical-artist workflow: inspect scene state, fix NLA/materials, export, then validate in-repo.

**Pros:** Fast iteration; uses the same session as an artist; can run arbitrary `bpy` consistent with GUI.  
**Cons:** Requires **local** setup (Blender + chosen MCP stack); community servers vary — **pin one** repo/version for the team and re-evaluate quarterly.

**Default stack for this repo:** [ahujasid/blender-mcp](https://github.com/ahujasid/blender-mcp) — MCP server (`uvx blender-mcp`) + **`addon.py`** inside Blender. Pin the release / `addon.py` version your crew tested; re-read their readme when upgrading.

**Alternatives (if the default breaks on your OS):** [djeada/blender-mcp-server](https://github.com/djeada/blender-mcp-server) and other listings (e.g. [MCPCursor — Blender](https://mcpcursor.com/server/blender)); follow that project’s readme, not aggregators alone.

**Cursor (this workspace):** `.cursor/mcp.json` registers the **`blender`** server (`uvx blender-mcp`) for **project** MCP. On macOS it prepends `/opt/homebrew/bin` and `/usr/local/bin` to `PATH` so Cursor’s GUI can find `uv`. Reload MCP / restart Cursor after editing. **Do not** run a second copy of the same server in Claude Desktop simultaneously (upstream warns this breaks things).

**Setup sketch (ahujasid):**

1. **Prerequisites:** Blender 3+, **uv** (`brew install uv` on macOS).  
2. Install **`tools/blender-mcp/addon.py`** (vendored; MIT, see `tools/blender-mcp/LICENSE`) → Blender **Edit → Preferences → Add-ons → Install…** → enable **Interface: Blender MCP**.  
3. Cursor loads MCP from `.cursor/mcp.json` (or add the same JSON via **Settings → MCP** globally if you prefer).  
4. **Blender:** 3D View sidebar (**N**) → **BlenderMCP** → **Connect** (addon listens; Cursor starts `uvx` when a tool is used).

**Smoke test (human + agent):**

1. Blender open with default scene, add-on **connected**.  
2. Cursor chat with MCP enabled: ask the agent to **inspect the Blender scene** (e.g. list objects / scene summary via the Blender MCP tool your client exposes).  
3. **Pass:** tool returns real data, not a connection timeout.  
4. **Optional:** ask for a trivial op (add cube, rename object) and confirm in the viewport.  
5. **Headless sanity (no MCP):** confirms CLI only — `Applications/Blender.app/Contents/MacOS/Blender -b --python-expr "import bpy; print(bpy.app.version_string)"` on macOS.

**Verify:**

```bash
blender -v
uv --version
```

**Pitfall:** `uvx blender-mcp` is an **stdio MCP server** — it will sit and wait if you run it manually in a terminal; that’s normal. Let **Cursor** spawn it.

### Agent-driven export (no manual File → Export)

With **Blender running**, add-on **connected**, and **MCP enabled**, the agent can write the hero GLB into the repo using `execute_blender_code` + `scripts/blender/export_john_stick_hero_glb.py`:

1. Set `JOHN_STICK_ROOT` to your clone path.
2. `importlib.util.spec_from_file_location` → `exec_module` → `export_hero_glb()`.
3. Agent runs `npm run validate:gltf` after.

The script selects **mesh + armature** objects only (skips default lights/camera) and exports under **`public/models/`** per `docs/GLTF_EXPORT.md` (GLB, Y-up, apply modifiers, animations). Default output name **`char_player_stick_v01.glb`** (procedural / authoring). For the **single runtime base** (`STICKMAN_BASE_GLTF_URL` in `playerCharacter.ts` — today often `stickman_fighting_kaisoon.glb`), overwrite **that** file via `export_hero_glb(out_name="…")` or env `JOHN_STICK_EXPORT_GLB` when using `-P` so **player + dummy + sparring** stay in sync.

**You still run Blender** (app open + **Connect** once per session). You do **not** need to use Blender’s export menus if the agent runs the script for you.

**Headless (no MCP):** `export JOHN_STICK_ROOT=…` then `blender yourscene.blend -b -P scripts/blender/export_john_stick_hero_glb.py`.

---

## Tier 2 — Headless CLI (`blender -b` / `-P`)

**Idea:** Run Blender **without UI**, load `.blend`, run a Python script that calls `bpy.ops.export_scene.gltf` (or other ops), exit.

**Official CLI reference:** [Blender manual — Command Line Arguments](https://docs.blender.org/manual/en/latest/advanced/command_line/arguments.html) (`-b` / `--background`, `-P` / `--python`).

**Minimal pattern:**

```bash
blender /path/to/scene.blend -b -P /path/to/export_glb.py
```

**Script responsibilities (typical):**

- Open file if not passed on argv (or use Blender’s trailing `.blend` argument).
- Select export collection / objects per studio convention.
- Call `bpy.ops.export_scene.gltf(filepath=…, export_format='GLB', …)` with parameters aligned to `docs/GLTF_EXPORT.md`.
- Use `--python-exit-code 1` (see manual) if you want non-zero exit on uncaught exceptions in CI.

**Pros:** Reproducible; version-controllable script; suitable for automation runners.  
**Cons:** Slower feedback for artists; must handle **background-mode** quirks (depsgraph, context) — see Blender manual notes on `--disable-depsgraph-on-file-load` and ensure evaluated data when needed.

**Historical note:** Older glTF exporter builds had background-export edge cases ([glTF-Blender-IO #1281](https://github.com/KhronosGroup/glTF-Blender-IO/issues/1281)); stay on **current LTS** and retest after upgrades.

**Python API:** [bpy.ops.export_scene.gltf](https://docs.blender.org/api/current/bpy.ops.export_scene.html) (parameters mirror the exporter UI).

**Verify:**

```bash
blender -v
blender -b --python-exit-code 1 -P scripts/blender/export_example.py
```

*(Add `scripts/blender/export_example.py` when the first automated export is implemented; until then, the second line is a placeholder for future CI.)*

**Web/tools note:** CI will need a **Blender install step** and cache discipline — binary size and license are fine for GPL Blender; pin version to match artists.

---

## Tier 3 — Manual SOP + browser support

**When:** No MCP, no headless Blender on the machine, or gated steps (account logins, marketplace downloads) that **must** be human.

**Process:**

1. Human performs export in Blender per **`docs/GLTF_EXPORT.md`**.
2. Run **`npm run validate:gltf`** before commit.
3. Agents may use **Cursor browser MCP** to read [Blender glTF exporter documentation](https://docs.blender.org/manual/en/latest/addons/import_export/scene_gltf2.html) — not to store credentials in-repo.

**Pitfall:** “Looks fine in Blender” — always confirm in **Three.js** (`package.json` version) after export.

---

## Summary for leads

- **Ship path:** **MCP + local Blender** for interactive work; **headless `blender -P`** for batch/CI; **manual checklist** when automation is blocked.  
- **Single written contract for exports:** `docs/GLTF_EXPORT.md` + validator in `package.json`.  
- **Access / secrets / installs:** `docs/TOOLCHAIN_ACCESS.md`.

---

## Related docs

- `docs/TOOLCHAIN_ACCESS.md` — prerequisites (WS-130).  
- `docs/GLTF_EXPORT.md` — engine-facing export checklist.  
- `docs/WORK_STREAMS.md` — WS-131 checkbox / Wave 13 context.
