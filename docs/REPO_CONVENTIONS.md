# John Stick — repo layout & naming

**Owner lens:** Game Director — keep the spine shippable (`docs/GAME_PLAN.md`), **no backend**, **keyboard-only**. This doc is the **layout contract** for code and art handoffs.

**Process (matches `WORK_STREAMS.md`):** **Linear iteration** — improve what exists; **no “v1 / v2”** release layering in how we run the project. **YAGNI** in code; **delete** unused or superseded implementation instead of versioning it. **Assets** may remain as **pickable options**, **refs**, or **inspiration**. **Docs** should stay accurate: **update or remove** stale sections rather than treating them as history.

## Directory map

| Path | Purpose |
|------|---------|
| `src/main.ts` | Vite entry only: finds `#app`, calls into `src/game`. |
| `src/game/` | All game runtime: loop, sim, rendering glue, data loaders. Add subfolders here as domains grow (e.g. `input/`, `combat/`) rather than a flat dump. |
| `assets/` | **Source** art and audio committed to git. Import from TS (`import url from "../assets/..."`) or copy in build when a pipeline exists. Subfolders: `models/`, `textures/`, `audio/`. |
| `public/` | **Static** files served at **site root** (`/file.ext`). Use for files that must keep exact URLs (e.g. `LoadingManager` paths, `fetch('/dojo/level.json')`). |
| `docs/` | Design and process: `GAME_PLAN.md`, `WORK_STREAMS.md`, `FUTURE_MAYBE.md` (maybes until scheduled or cut — see that file), this file. |

## Naming

- **TypeScript modules:** `camelCase.ts` for single-purpose files (`bootstrap.ts`); **PascalCase** only for types/classes if you introduce them.
- **Asset files:** `kebab-case` with a short prefix when useful (`sfx-hit-heavy-01.webm`, `prop-heavy-bag.gltf`).
- **Event / tuning IDs:** prefer stable string ids aligned with `GAME_PLAN` (e.g. `CombatHit`, `sfx_*`) — see plan §4.3 / audio roles.

## Imports

- Prefer **relative** imports inside `src/` until a path alias is justified (WS-010+).
- Do **not** import from `node_modules` paths that bypass the package entry (e.g. `three/examples/...` is OK only when documented and version-pinned).

## Build output

- Vite emits bundled JS under `dist/assets/` — do not hand-edit; it is not the same as repo-root `assets/`.

## Prototype input — WASD move + shared facing yaw (WS-032 / WS-040, GP §3.1.4, §3.4.1)

- **Bindings:** **WASD only** for locomotion (**no** arrow keys, **no** **Q**/**E**). **A** / **D** add **hold-to-yaw** (screen-wise turn with follow cam) **and** lateral strafe on the same keys. Single **`facingYawRad`** (radians about world **+Y**). Turn rate: `KEYBOARD_LOCOMOTION.yawDegPerSec` in `src/game/input/keyboardLocomotion.ts` (tune strafe vs turn balance with rig — see `docs/FUTURE_MAYBE.md`).
- **Camera + body:** The same yaw drives **both** `updateThirdPersonFollowCamera` (orbit behind the player) and the **player capsule** via `syncRigidBodyYawFromFacing` before each physics step (`src/game/physics/rapierWorld.ts`). The body uses **`enabledRotations(false, true, false)`** so pitch/roll stay locked.
- **Move:** **Facing-relative** horizontal move from `facingYawRad` (`moveFromFacing.ts` + capsule step).
- **Focus:** Window `blur` and `document.visibilityState === "hidden"` **clear** held move keys so Tab-away does not leave stuck input.

## Action map — limbs + Shift + interact (WS-050, GP §3.2.1)

- **Module:** `src/game/input/actionMap.ts` (`KEY_ACTION_MAP`, `attachActionMap`, `computeActionMapFromHeld`).
- **Limb keys (`KeyboardEvent.code`):** **U** / **I** = left / right **punch**; **J** / **K** = left / right **kick** (row-based layout for memorization).
- **Shift** (**ShiftLeft** or **ShiftRight**): with punches held → **guard** per side; with kicks held → **dock** per side. Same keys without Shift → **attack** holds for WS-051.
- **Interact:** **Enter** toggles **interact mode** (open ↔ close). While open, bootstrap **freezes** move / yaw / jump so signs/UI can own the moment (retune with WS-101 / WS-051 priority graph).
- **Focus:** Blur / hidden document clears **held** limb + Shift codes (interact mode is **not** cleared on blur).
- **Dev (`npm run dev`):** bottom-left **input debug** overlay shows **U I J K**, Shift, guard/dock, and interact — limb keys are **keyboard** only (click the page/canvas so the window has focus).
