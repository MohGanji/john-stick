# Repo layout and naming

**Game:** [`docs/GAME_PLAN.md`](GAME_PLAN.md) (vision). **Deferred ideas:** [`docs/TODO.md`](TODO.md). **No backend** in scope for the web client.

## Directory map

| Path | Purpose |
|------|---------|
| `src/main.ts` | Vite entry: `#app` → `src/game`. |
| `src/game/` | Runtime: loop, sim, rendering, loaders. Prefer domain subfolders (`input/`, `combat/`, …). |
| `assets/` | Source art/audio in git; import from TS or copy in build. |
| `public/` | Static URLs from site root (`/models/...`, `/logo/...`). |
| `docs/` | This file, `TOOLCHAIN_ACCESS.md`, `GAME_PLAN.md`, `TODO.md` only. |

## Naming

- **TypeScript:** `camelCase.ts` modules; **PascalCase** for types/classes if needed.
- **Assets:** `kebab-case`, optional short prefix (`sfx-hit-01.webm`).

## Imports

- Prefer **relative** imports inside `src/` until a path alias is justified.
- Do **not** deep-import `node_modules` except documented/pinned cases (e.g. `three/examples/...`).

## Build

- Vite output: `dist/assets/` — do not hand-edit.

## Prototype controls (current code)

- **Locomotion:** WASD; **A**/**D** yaw + strafe; shared `facingYawRad`. Tune in `src/game/input/keyboardLocomotion.ts`. Blur / hidden tab clears held move keys.
- **Combat / interact:** `src/game/input/actionMap.ts` — **U**/**I** punches, **J**/**K** kicks, **Shift** guard/dock, **Enter** interact mode.
