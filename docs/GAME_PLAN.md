# Game plan

## Vision

A **3D “Stick Fight”–style** brawler with **Bruce Lee–flavored** combat, built in **Three.js**.

**Animations:** Authoring Bruce Lee–quality motion from scratch is out of scope — **do not** attempt it.

**Mixamo hack:** Use Mixamo’s free **Martial Arts** library (mawashi geri, hooks, etc.). Download a small set as **`.fbx`**, then retarget / bind onto a **simple stickman** (spheres + cylinders) in the pipeline; runtime plays clips in Three.js like today’s direction, with **idle**, **walk**, and **jump** plus strike clips the player will specify.

## Movement and physics

- **Plane-only locomotion:** Left/right, forward/back, **fixed-height jump** — keeps combat math tractable (no full 3D chase gymnastics while we iterate).
- **Rapier** + Three.js: use Rapier’s **character controller** for gravity, grounding, and jumps.
- **Camera / input:** Keep the **current-style** follow view and **keyboard-only** play.
- **Stature:** Player and enemies share the **same height** baseline unless design explicitly changes it.
- **Hit detection:** Prefer simple colliders first. If per-limb meshes are too heavy, use a **tall cylinder** (head diameter, feet to head) for **player and enemies** as the main hit volume and iterate.

## Hit reactions (stickman cheat)

Avoid solving full impact-driven animation by hand.

1. Attacker plays the strike clip **kinematically**.
2. **Overlap / contact** test for a hit.
3. On hit: **ragdoll on** for the target (~**0.5 s**), apply a **strong impulse** at center (or policy-defined point).
4. Target **flies** under physics, then **stands up** and blends back to **idle** (tunable).

## Controls (v1)

Only **punch** and **kick**, plus **jump punch** and **jump kick**. Richer **combos** = ordered sequences of these + jump, with different clips, damage, reach, and hitboxes — **after** the dojo foundation works.

## Priority — dojo / stickman first

**First goal:** One stickman (and the same recipe for enemies) that **walks, jumps, punches, and kicks** with **good-looking clips**, **Rapier** movement, and **tunable** values. Keep the **dev HUD** so we can tune **player**, **enemy instances**, and shared combat constants.

Enemies are **the same kind of instance** as the hero; only data/tuning differs until later systems land.

## Next (brief)

- **Stickman customization** — different looks / outfits on the shared rig.
- **Enemy tuning** — notice range, attack delay, damage, health, etc.
- **Story / missions** — a **mission designer** that places objects, player spawn, enemies, and stitches a **map** / flow.
- **Combo animations** — ordered punch/kick/jump chains → distinct clips, damage, hitboxes, range.

## Juice — hit stop

On **big** hits, **time scale** the simulation to about **0.2×** for a **short** window (**hit stop**) so a simple punch reads heavy — tune duration and eligibility in the HUD.
