# Physics engine (John Stick)

## Choice — GP §4.2.1

**Engine:** [`@dimforge/rapier3d-compat`](https://www.npmjs.com/package/@dimforge/rapier3d-compat) (Rapier 3D, compat build with inlined WASM).

**Why Rapier**

- **Web-first:** official JS bindings; `compat` loads cleanly from Vite without extra WASM URL wiring.
- **Feature fit:** rigid bodies, joints, and collision groups map to planned ragdoll and prop work (GP §6, §7).
- **Performance:** Rust + WASM is a common baseline for browser games; we can cap active ragdolls and solver settings per min-spec (GP §11.1.1).

**Alternatives considered**

- **cannon-es:** lighter, but fewer guarantees around joints and long-term maintenance for ragdoll-scale setups.
- **ammo.js:** Bullet bindings are powerful but heavier to bundle and more awkward to type and tune in TypeScript.

**Integration**

- **Timestep:** `world.timestep` matches `FIXED_DT` from `src/game/gameLoop.ts` (60 Hz).
- **Layers:** `src/game/physics/collisionLayers.ts` — membership + filter masks packed for Rapier `InteractionGroups` (GP §4.2.2).

## Tuning stub (principal defaults)

```yaml
engine: rapier3d-compat
timestep: 1/60
gravity_y: -28
max_ragdolls: 6   # target cap until profiled (role-physics-programmer)
sleep_threshold:  # tune with piles / bags when content exists
impulse_clamp_linear:  # apply at gameplay resolve, not inside Rapier internals
layers: [player, enemy, prop, ragdollLimb, trigger, staticWorld]
```

## Render interpolation — GP §4.2.3

The game loop calls optional `beforeFixedSteps`, runs `fixedStep`, then `lateUpdate(dt, fixedStepAlpha)` with `fixedStepAlpha = accumulator / FIXED_DT`. Use that to blend **previous** and **current** simulation poses once per-substep snapshots are stored (see “Fix Your Timestep” pattern). The WS-011 demo mesh reads the body pose after integration; articulated actors should add explicit buffers.
