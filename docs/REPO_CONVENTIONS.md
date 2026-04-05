# John Stick — repo layout & naming

**Owner lens:** Game Director — keep the spine shippable (`docs/GAME_PLAN.md`), **no backend**, **keyboard-only**. This doc is the **layout contract** for code and art handoffs.

## Directory map

| Path | Purpose |
|------|---------|
| `src/main.ts` | Vite entry only: finds `#app`, calls into `src/game`. |
| `src/game/` | All game runtime: loop, sim, rendering glue, data loaders. Add subfolders here as domains grow (e.g. `input/`, `combat/`) rather than a flat dump. |
| `assets/` | **Source** art and audio committed to git. Import from TS (`import url from "../assets/..."`) or copy in build when a pipeline exists. Subfolders: `models/`, `textures/`, `audio/`. |
| `public/` | **Static** files served at **site root** (`/file.ext`). Use for files that must keep exact URLs (e.g. `LoadingManager` paths, `fetch('/dojo/level.json')`). |
| `docs/` | Design and process: `GAME_PLAN.md`, `WORK_STREAMS.md`, this file. |

## Naming

- **TypeScript modules:** `camelCase.ts` for single-purpose files (`bootstrap.ts`); **PascalCase** only for types/classes if you introduce them.
- **Asset files:** `kebab-case` with a short prefix when useful (`sfx-hit-heavy-01.webm`, `prop-heavy-bag.gltf`).
- **Event / tuning IDs:** prefer stable string ids aligned with `GAME_PLAN` (e.g. `CombatHit`, `sfx_*`) — see plan §4.3 / audio roles.

## Imports

- Prefer **relative** imports inside `src/` until a path alias is justified (WS-010+).
- Do **not** import from `node_modules` paths that bypass the package entry (e.g. `three/examples/...` is OK only when documented and version-pinned).

## Build output

- Vite emits bundled JS under `dist/assets/` — do not hand-edit; it is not the same as repo-root `assets/`.
