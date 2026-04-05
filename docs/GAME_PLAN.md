# John Stick — Web 3D Stickman Brawler — Orchestration Plan

**Document purpose:** Single source of truth for *what must exist* to ship a browser-based, third-person, physics-heavy stickman fighter with exaggerated hits and ragdoll reactions. **Control intent:** **keyboard-only** shipping path (laptop-friendly, no mouse required); **exact bindings** are iterated in **§3** and **3.4**, not frozen here. Work is phased: **first playable** = dojo + bag + signs + core combat; **full client** = multiple levels with **no server** (static hosting, immediate play).

---

## Locked product decisions (no longer open questions)

| Topic | Decision |
|--------|-----------|
| **Platform** | **Desktop only**; **keyboard-only is the target** — playable on a **laptop with no mouse** (Need for Speed–style: no pointer required). **Mouse** may later add **optional yaw-only** look; it is **not** part of the narrow v1 focus. |
| **Business model** | **Free**; **no login**, no accounts. |
| **Backend** | **None** — game runs entirely in the browser from static assets; **minimal loading** (tight bundles, aggressive caching). |
| **Leaderboard** | **Optional / later**; not required for current scope. *Note:* a real leaderboard eventually implies a hosted API or third-party service — **not** part of the no-backend rule until you explicitly add it. |
| **Structure** | A **bunch of levels**; the experience **starts in the dojo** (training / first level or hub-adjacent). |
| **Multiplayer** | **No** — single-player only; no netcode, no shared physics authority. |
| **Story (V2+)** | Briefings delivered **in-world**: **visuals + text** via **signs**, **inspectable items**, or **specific NPCs the player cannot kill** (interaction-only). |
| **Violence presentation** | **Blood sprays / decals** = **bonus tier** — ship without them first; add if desired for extra punch. |

---

## Priority tiers (every L3 leaf is labeled)

These labels apply to **ingredients** in the index and in the tables below.

| Tag | Name | Meaning |
|-----|------|---------|
| **`[E]`** | **Essential** | Without this, you do **not** have a coherent, shippable *John Stick* (dojo path + path to multi-level client-only game). |
| **`[C]`** | **Core engagement** | The game might **boot** or be **technically playable** without it, but it will feel **flat**, **unfair**, **unclear**, or **not worth returning to** — not a “good” action game. |
| **`[N]`** | **Nice-to-have** | **Polish, optional modes, cosmetics, deferred systems**, or features that **elevate** the game but are not required for a strong first release. |

**Sorting rule:** Within each **L2** group in the index and in each **subsection table**, items are ordered **`[E]` → `[C]` → `[N]`** (then by id).

---

## Index — three-level breakdown (L1 → L2 → L3)

*Exactly three levels. Each L3 line includes its tier tag. Under each L2, leaves are sorted Essential → Core engagement → Nice-to-have.*

```
1 PRODUCT & POSITIONING
├── 1.1 Player fantasy & promise
│   ├── [E] 1.1.2 Exaggerated cause → effect (launch, spin, slide, pile-ups)
│   ├── [C] 1.1.1 One-versus-many power fantasy (readable, not punishing)
│   └── [C] 1.1.3 Sensory density without UI clutter (juice + clarity)
├── 1.2 Scope & phasing
│   ├── [E] 1.2.1 V1 slice: dojo + bag + signs + control mastery loop
│   ├── [E] 1.2.2 Multi-level client game (levels after dojo, still no backend)
│   └── [C] 1.2.3 Deferred / gated: guns, deep RPG, multiplayer, online leaderboard
└── 1.3 Success criteria
    ├── [E] 1.3.2 Combat readability at third-person camera distance
    ├── [E] 1.3.3 Stable frame time on agreed desktop “min spec”
    └── [C] 1.3.1 “Fun in 60 seconds” onboarding in dojo

2 GAME DESIGN — CORE LOOP & SYSTEMS
├── 2.1 Moment-to-moment loop
│   ├── [E] 2.1.2 Enemy / target states (idle, alert, attack, stagger, ragdoll, recover)
│   ├── [C] 2.1.1 Approach → strike → chain → reposition → environmental payoff
│   └── [C] 2.1.3 Risk/reward (commitment windows, whiff punish, crowd control)
├── 2.2 Moveset (V1+)
│   ├── [E] 2.2.1 Four limb inputs (R/L punch, R/L kick) + chord/sequence → compound moves (e.g. bicycle kick)
│   ├── [E] 2.2.3 Hit types (launch, sweep, pop-up) mapped to move IDs (data-driven)
│   └── [C] 2.2.2 Cancels, combo caps, anti-infinite rules
├── 2.3 Difficulty & tuning
│   ├── [E] 2.3.2 Enemy / training tiers (bag, dummy, later grunts / elites)
│   ├── [C] 2.3.3 Pacing curves per level / mission
│   └── [N] 2.3.1 Assist options (magnetism, extra i-frames, chill damage tuning)
├── 2.4 Training content (dojo)
│   ├── [E] 2.4.2 Signage UX: full keyboard control map + “try this” hints
│   ├── [C] 2.4.1 Punching bag as damage + impulse + audio feedback lab
│   └── [N] 2.4.3 Optional micro-challenges (combo count, launch height)
└── 2.5 Progression & level flow (client-only)
    ├── [E] 2.5.1 Level order data (dojo first; defines which level loads next)
    ├── [E] 2.5.2 Level load / restart without server (in-memory + optional local save)
    └── [N] 2.5.3 Per-level score / rank display (local only unless leaderboard exists)

3 CAMERA, CONTROLS & CHARACTER MOTION
├── 3.1 Third-person camera (no free look)
│   ├── [E] 3.1.1 Fixed follow camera: locked pitch, follows character, collision pull-in
│   ├── [E] 3.1.4 Keyboard yaw / facing (**WASD** prototype: **A/D** strafe + hold-to-yaw; camera follows shared facing)
│   ├── [C] 3.1.2 Combat framing (slight FOV punch; safe defaults for motion comfort)
│   └── [C] 3.1.3 Accessibility (camera turn speed, reduce shake / flash; invert if optional mouse added)
├── 3.2 Input scheme (keyboard-only target)
│   ├── [E] 3.2.1 Laptop-safe layout: move (**WASD**), Space jump, Shift modifier, four limb keys (**exact bindings TBD**)
│   ├── [E] 3.2.4 Chord / sequence interpreter: limb combos → compound actions + distinct visuals
│   ├── [C] 3.2.3 Buffering, coyote time, input priority graph
│   ├── [N] 3.2.2 Optional mouse for **yaw only** (does not gate shipping)
│   └── [N] 3.2.5 Gamepad mapping (still no multiplayer)
├── 3.3 Locomotion
│   ├── [E] 3.3.1 Walk/run, jump, air control (dojo-validated)
│   ├── [C] 3.3.3 Slope / stair handling in dojo and later levels
│   └── [C] 3.3.2 Root motion vs procedural blend policy (documented per move)
└── 3.4 Controls & camera iteration (process)
    ├── [C] 3.4.1 Prototype → playtest loop on **laptop without mouse**; document binding decisions
    └── [C] 3.4.2 Dojo signs + pause help updated when defaults change

4 TECH STACK — WEB RUNTIME & ENGINE LAYER
├── 4.1 Rendering & scene
│   ├── [E] 4.1.1 Three.js (or R3F) scene graph, lights, shadows, materials
│   ├── [C] 4.1.2 Coherent art direction (PBR-lite vs toon-rim) for stickmen + world
│   └── [N] 4.1.3 Post stack (bloom, color grade, optional motion blur)
├── 4.2 Physics & collision
│   ├── [E] 4.2.1 Chosen physics engine for web (Rapier / cannon-es / ammo.js — pick & document)
│   ├── [E] 4.2.2 Collision layers (player, enemies, props, ragdoll limbs, triggers)
│   └── [E] 4.2.3 Fixed timestep + render interpolation
├── 4.3 Application architecture
│   ├── [E] 4.3.1 Game loop (update, fixedUpdate, lateUpdate, render)
│   ├── [E] 4.3.2 Entity / component or modular actors (player, enemy, props)
│   └── [C] 4.3.3 State machines + event bus for combat / UI reactions
├── 4.4 Build, assets & static delivery
│   ├── [E] 4.4.1 Bundler (e.g. Vite) + TypeScript + asset pipeline
│   ├── [E] 4.4.2 Static hosting (CDN), cache headers, compression (mesh/textures)
│   ├── [E] 4.4.4 No-backend rule: no auth APIs, no game state server in scope
│   ├── [C] 4.4.5 Cold-start budget (time-to-play after first visit)
│   └── [N] 4.4.3 Local analytics / error hooks only (no PII; optional)
└── 4.5 Optional services (explicitly out of core rule)
    ├── [N] 4.5.1 Online leaderboard (third-party or custom backend — future)
    └── [N] 4.5.2 Cloud saves (would break pure static rule — future)

5 STICKMAN RIG — ART DIRECTION & IMPLEMENTATION
├── 5.1 Visual language
│   ├── [E] 5.1.1 Silhouette readability (limb thickness, joint read)
│   ├── [C] 5.1.3 Hit flash / brief feedback rules (readable, not noisy)
│   └── [N] 5.1.2 Modular outfit vocabulary (hats, suits) for later levels / factions
├── 5.2 Rig & animation approach
│   ├── [E] 5.2.1 Joint hierarchy compatible with ragdoll mapping
│   ├── [C] 5.2.2 Keyframed + procedural strike blend strategy
│   └── [N] 5.2.3 Facial detail (omit or symbolic props only)
└── 5.3 Technical assets
    ├── [E] 5.3.1 Blender → glTF export conventions + validation
    ├── [C] 5.3.2 Material variants for outfits (masks / instances)
    └── [N] 5.3.3 LOD policy for stick figures (often trivial)

6 RAGDOLL, HIT REACTION & COMBAT RESOLUTION
├── 6.1 Authoritative vs visual physics
│   ├── [E] 6.1.1 Gameplay capsule vs ragdoll ownership handoff
│   ├── [E] 6.1.2 Stagger → ragdoll thresholds (damage, impulse, edge cases)
│   └── [C] 6.1.3 Recovery / get-up without floor clipping
├── 6.2 Impulses & hit detection
│   ├── [E] 6.2.1 Active frames + hurtboxes / sweeps (debug visualization in dev)
│   ├── [C] 6.2.2 Directional impulse scaling (charge tiers, optional crit zones)
│   └── [C] 6.2.3 Crowd knockback chains + falloff + perf caps
├── 6.3 Juice, timing & optional gore
│   ├── [C] 6.3.1 Hit-stop, camera shake, flash frames (tunable + accessibility)
│   ├── [C] 6.3.2 Sound + particle spawn tied to combat events
│   ├── [C] 6.3.3 Bag-specific feedback (swing, spring, shader displacement)
│   └── [N] 6.3.4 Blood sprays / decals on hits (bonus presentation layer)
└── 6.4 Stability safeguards
    ├── [E] 6.4.1 Joint limits, sleeping bodies, penetration handling
    ├── [E] 6.4.2 Performance caps on simultaneous ragdolls
    └── [N] 6.4.3 Determinism / replay tooling (future curiosity)

7 LEVEL DESIGN — DOJO, LEVELS & FUTURE SET PIECES
├── 7.1 Dojo blockout
│   ├── [E] 7.1.1 Training floor scale, sightlines, safe fixed-follow third-person camera
│   ├── [E] 7.1.3 Sign kiosks + interaction volumes (proximity / use key)
│   └── [C] 7.1.2 Punching bag placement + anchored physics (stand / chain)
├── 7.2 Boundaries & navigation
│   ├── [E] 7.2.1 World boundaries (no fall-through; diegetic or invisible walls)
│   ├── [C] 7.2.3 Lighting identity (readable, mood for dojo + later maps)
│   └── [N] 7.2.2 Reserved spawn markers for future waves (planner convenience)
├── 7.3 Mission / level template (post-dojo content)
│   ├── [E] 7.3.1 Objective types per level (survive, reach point, clear room, etc.)
│   ├── [C] 7.3.2 Encounter scripting (spawn director tied to triggers / progress)
│   └── [N] 7.3.3 Heavy set dressing for “action movie” beats
└── 7.4 Diegetic interaction props (V2+ narrative carriers)
    ├── [C] 7.4.1 Inspectable objects carrying story text / objectives
    ├── [C] 7.4.2 Story signs / boards (reuse dojo sign tech)
    └── [C] 7.4.3 Unkillable NPCs with dialogue / briefing interactions

8 AUDIO & HAPTICS
├── 8.1 Sound design
│   ├── [C] 8.1.1 Impact library (whoosh, thud, flesh; bag-specific layers)
│   ├── [C] 8.1.3 Music stinger / loop philosophy (tension without mud)
│   └── [N] 8.1.2 VO stance (silent hero; optional enemy barks later)
├── 8.2 Implementation
│   ├── [C] 8.2.1 Web Audio busses (SFX, music, UI) + loudness discipline
│   ├── [N] 8.2.2 Randomization containers (pitch, alternates)
│   └── [N] 8.2.3 Dynamic mix (e.g. low-pass under chaos)
└── 8.3 Controller rumble
    ├── [N] 8.3.1 Gamepad haptics via Gamepad API
    ├── [N] 8.3.2 Hit magnitude → rumble patterns
    └── [N] 8.3.3 Graceful fallback without rumble hardware

9 UI, UX & ONBOARDING
├── 9.1 HUD
│   ├── [E] 9.1.2 Context prompts (interact with signs, critical actions)
│   ├── [C] 9.1.1 Minimal combat feedback (stamina only if you add stamina; else skip)
│   └── [N] 9.1.3 Floating damage numbers (default off)
├── 9.2 Menus (client-only)
│   ├── [E] 9.2.1 Title → play → level flow entry (dojo first)
│   ├── [C] 9.2.2 Graphics / performance presets
│   └── [N] 9.2.3 Full control remapping UI (nice; document defaults in README if cut)
└── 9.3 Tutorialization
    ├── [E] 9.3.1 Sign-readable content hierarchy (basics → advanced)
    ├── [C] 9.3.3 Pause / help screen for stuck players
    └── [N] 9.3.2 Progressive unlock of move hints on signs

10 NARRATIVE — LEVEL TEXT, CAST, OUTFITS (V2+ FRAMEWORK)
├── 10.1 Story spine & delivery
│   ├── [C] 10.1.2 Level structure as “movie beats” (setup → fight → payoff)
│   ├── [C] 10.1.4 Diegetic delivery only (no mandatory external lore wiki)
│   └── [N] 10.1.1 Tone bible (Wick / Transporter echo — reference, not copy)
├── 10.2 Enemy factions & outfits
│   ├── [C] 10.2.1 Visual faction read (silhouette + color discipline)
│   ├── [N] 10.2.2 Boss conceits (personality without mechanic bloat)
│   └── [N] 10.2.3 Cosmetic / narrative gating for outfits
└── 10.3 Content authoring
    ├── [C] 10.3.1 Level / mission data format (TS or JSON in repo)
    ├── [N] 10.3.2 Localization-ready string tables
    └── [N] 10.3.3 Writer one-pagers per level

11 QUALITY, PERFORMANCE & RISK
├── 11.1 Profiling & budgets
│   ├── [E] 11.1.1 Desktop min-spec: draw calls, shadows, physics body budget
│   ├── [C] 11.1.3 Worst-case ragdoll pile stress test
│   └── [N] 11.1.2 Memory streaming strategy (if you add streaming later)
├── 11.2 Testing strategy
│   ├── [C] 11.2.2 Playtest rubric (feel, readability, fatigue)
│   ├── [C] 11.2.3 Desktop browser matrix (Chrome, Firefox, Safari)
│   └── [N] 11.2.1 Automated tests for pure combat math (where extractable)
└── 11.3 Risk register
    ├── [E] 11.3.1 Ragdoll stability vs exaggerated impulses
    ├── [C] 11.3.3 Scope creep before core combat + dojo are “sticky”
    └── [N] 11.3.2 Mobile Safari / GPU (out of scope until you expand platforms)

12 TEAM ROLES — WHO OWNS WHAT (CAST OF DELIVERY)
├── 12.1 Creative leadership
│   ├── [C] 12.1.1 Creative Director (tone, pillars, final feel calls)
│   ├── [C] 12.1.2 Game Director (cuts scope, sequencing)
│   └── [C] 12.1.3 Art Director (silhouette, materials, VFX grammar)
├── 12.2 Production & design
│   ├── [E] 12.2.1 Lead Game Designer (moves, tuning, encounter intent)
│   ├── [E] 12.2.2 Level Designer (dojo + level blockouts)
│   └── [N] 12.2.3 Narrative Designer (in-world text, NPC lines — V2+)
├── 12.3 Engineering
│   ├── [E] 12.3.1 Lead Gameplay Programmer (combat, input, camera, flow)
│   ├── [E] 12.3.2 Physics Programmer (ragdoll, constraints, performance)
│   ├── [C] 12.3.3 Graphics Programmer (lighting, post, profiling)
│   └── [E] 12.3.4 Web / Tools Engineer (Vite, static deploy, asset pipeline)
├── 12.4 Content crafts
│   ├── [E] 12.4.1 Technical Animator (rig, states, ragdoll sync)
│   ├── [C] 12.4.2 Environment Artist (dojo set, later kits)
│   ├── [N] 12.4.3 Character Artist (outfit variants)
│   └── [C] 12.4.4 Sound Designer + implementer (Web Audio integration)
└── 12.5 Quality & ops
    ├── [C] 12.5.1 QA / playtest owner (regressions, feel checks)
    ├── [C] 12.5.2 UX / UI Designer (menus, prompts, readability)
    └── [N] 12.5.3 Marketing / trailer voice (when sharing publicly)
```

---

## 1. Product & positioning

### 1.1 Player fantasy & promise

*Sorted: `[E]` → `[C]` → `[N]`.*

| Tier | ID | Ingredient | What “done” looks like | Best owner (role) |
|------|-----|------------|------------------------|-------------------|
| **E** | **1.1.2** | Exaggerated cause → effect | Hits produce **readable, physical** payoffs (launch, slide, tumbles) with stable rules. | Physics Programmer + Gameplay Programmer + VFX-minded artist |
| **C** | **1.1.1** | One-vs-many fantasy | Crowds remain **readable**; player tools feel powerful but not opaque. | Lead Game Designer + Creative Director |
| **C** | **1.1.3** | Sensory density | Juice supports clarity; silhouette and UI stay primary. | Art Director + Sound Designer + UX Designer |

### 1.2 Scope & phasing

| Tier | ID | Ingredient | What “done” looks like | Best owner |
|------|-----|------------|------------------------|------------|
| **E** | **1.2.1** | V1 dojo slice | Dojo + bag + signs + tight controls; shippable training vertical slice. | Game Director + Level Designer |
| **E** | **1.2.2** | Multi-level client game | Additional levels ship as **bundled data**; still **no backend**. | Game Director + Web Engineer + Lead Game Designer |
| **C** | **1.2.3** | Deferred systems | Guns, RPG depth, multiplayer, **online** leaderboard explicitly gated. | Game Director |

### 1.3 Success criteria

| Tier | ID | Ingredient | What “done” looks like | Best owner |
|------|-----|------------|------------------------|------------|
| **E** | **1.3.2** | Third-person readability | Facing, windups, and hit targets are always parseable. | Gameplay Programmer + Art Director |
| **E** | **1.3.3** | Desktop performance | Agreed min-spec holds target frame time with worst-case ragdolls. | Graphics/Physics Programmer + QA |
| **C** | **1.3.1** | Fun in 60 seconds | New player hits bag with **≥3 distinct moves** (single limb or chord) without external docs. | UX Designer + Gameplay Programmer |

---

## 2. Game design — core loop & systems

### 2.1 Moment-to-moment loop

| Tier | ID | Ingredient | What “done” looks like | Best owner |
|------|-----|------------|------------------------|------------|
| **E** | **2.1.2** | Target states | State machine for enemies/training dummies: idle → combat → stagger → ragdoll → recover. | Gameplay Programmer |
| **C** | **2.1.1** | Strike loop | Attacks have roles (poke, launcher, sweep); flow rewards repositioning. | Lead Game Designer |
| **C** | **2.1.3** | Risk/reward | Whiff windows and crowd pressure matter in non-dojo levels. | Lead Game Designer |

### 2.2 Moveset (V1+)

| Tier | ID | Ingredient | What “done” looks like | Best owner |
|------|-----|------------|------------------------|------------|
| **E** | **2.2.1** | Four-limb + compound moves | **Four discrete inputs**: right punch, left punch, right kick, left kick — each maps to a base move; **chords or short sequences** (same frame or ordered) resolve to **compound** attacks (e.g. bicycle kick) with their own animation, hitbox, and impulse. | Gameplay Programmer + Technical Animator |
| **E** | **2.2.3** | Hit-type data | Move ID → damage, stun, impulse template, reaction tier (data-driven); includes chord IDs. | Gameplay Programmer |
| **C** | **2.2.2** | Cancels & caps | Designer-tunable combo limits; prevents degenerate corner loops. | Lead Game Designer |

### 2.3 Difficulty & tuning

| Tier | ID | Ingredient | What “done” looks like | Best owner |
|------|-----|------------|------------------------|------------|
| **E** | **2.3.2** | Training / enemy tiers | Bag reacts physically; dummy/enemy tiers defined for later levels. | AI/Gameplay Programmer |
| **C** | **2.3.3** | Pacing per level | Tension curve per level (spawn timing, intensity). | Lead Game Designer + Level Designer |
| **N** | **2.3.1** | Assist options | Optional aim/framing assists and gentler tuning profiles. | Lead Game Designer + UX |

### 2.4 Training content (dojo)

| Tier | ID | Ingredient | What “done” looks like | Best owner |
|------|-----|------------|------------------------|------------|
| **E** | **2.4.2** | Control signage | **All keyboard actions** documented in-world; optional “try this” lines. | UX Designer + Level Designer |
| **C** | **2.4.1** | Bag as lab | Bag proves damage/impulse/audio; player **feels** upgrades to force. | Sound Designer + Gameplay Programmer |
| **N** | **2.4.3** | Micro-challenges | Optional goals (combo count, launch height) with tiny rewards. | Lead Game Designer |

### 2.5 Progression & level flow (client-only)

| Tier | ID | Ingredient | What “done” looks like | Best owner |
|------|-----|------------|------------------------|------------|
| **E** | **2.5.1** | Level order data | **Dojo (or level 1) first**; defines unlock / linear order in bundle. | Lead Game Designer + Web/Gameplay Programmer |
| **E** | **2.5.2** | Load / restart | Restart level, die → retry, next level — **all client-side**, no fetch to game server. | Gameplay Programmer |
| **N** | **2.5.3** | Local scoring UI | Stars/time/score displayed **locally**; ties to future leaderboard only if added. | UX + Gameplay Programmer |

---

## 3. Camera, controls & character motion

### Working assumptions — keyboard-only (bindings are **not** locked here)

Ship criteria: the game is **fully playable without a mouse** so laptops (trackpad unused) match desktop. **Individual keys** (which letter does right punch, etc.) stay **project decisions** you settle through prototypes; this plan only captures **intent**:

| Intent | Direction (prototype against this) |
|--------|----------------------------------|
| **Move** | **WASD** (dojo prototype; arrow keys **off** for now). |
| **Strikes** | **Four keys** — right punch, left punch, right kick, left kick. |
| **Compound moves** | **Combinations** of those four (same-frame chord and/or short sequence) produce **different** moves, VFX, and hit profiles (designer data table). |
| **Jump** | **Space** (default candidate). |
| **Guard / dodge** | **Shift** as modifier; exact behavior (hold + direction vs tap vs + other key) **TBD** — must not require mouse. |
| **Camera** | **Third-person**, **fixed pitch** (no looking up/down); follows the character; **no** mouse-look orbit for v1 focus. |
| **Yaw / “where you face”** | **Keyboard-only:** **A**/**D** — **hold-to-yaw** plus lateral strafe on the same keys (with **WASD** move). Optional later: mouse **yaw only** — **`[N]`**, never required. |

**Process:** treat **controls + camera** as their own **iteration component**: build a throwaway or flags-driven binding layer, playtest on a **closed laptop**, then lock defaults and refresh dojo signs (see **3.4**).

### 3.1 Third-person camera (no free look)

| Tier | ID | Ingredient | What “done” looks like | Best owner |
|------|-----|------------|------------------------|------------|
| **E** | **3.1.1** | Fixed follow + collision | Camera maintains a **fixed pitch** (or very narrow clamp), **follows** the player, and **pulls in** through geometry so the character stays readable — **without** mouse look. | Gameplay Programmer |
| **E** | **3.1.4** | Keyboard yaw / facing | Player changes **horizontal** facing using **keys only** — prototype: **A**/**D** **hold-to-yaw** combined with strafe on **WASD**; retune strafe vs turn rate with rig/playtests (`FUTURE_DESIGN_NOTES.md`). | Gameplay Programmer |
| **C** | **3.1.2** | Combat framing | Subtle FOV punch on big hits; comfortable defaults. | Creative Director + Gameplay Programmer |
| **C** | **3.1.3** | Accessibility | **Keyboard:** camera turn speed, reduce shake/flash. If optional mouse yaw ships: invert X, sensitivity. | UX Designer |

### 3.2 Input scheme (keyboard-only target)

| Tier | ID | Ingredient | What “done” looks like | Best owner |
|------|-----|------------|------------------------|------------|
| **E** | **3.2.1** | Keyboard-only playability | **No mouse required:** movement, jump, defensive modifier (**Shift** — punches guard, kicks dock), **interact** (**Enter** toggles sign/UI open and closed), and **four limb attacks** (**U**/**I** punch, **J**/**K** kick) on discrete keys; dojo uses **WASD** move + **A**/**D** yaw/strafe (revisit arrows/accessibility via **3.4** if needed). | Gameplay Programmer |
| **E** | **3.2.4** | Chord / sequence interpreter | Input system resolves **simultaneous** and/or **ordered** limb inputs into **compound** move IDs; conflicts use a clear priority rule (documented). | Gameplay Programmer |
| **C** | **3.2.3** | Buffering & priority | Coyote time for jump; small input buffer for chords; conflict matrix (guard vs attack, etc.). | Gameplay Programmer |
| **N** | **3.2.2** | Optional mouse yaw | Pointer adjusts **horizontal** look only; **off** by default or absent on laptop — shipping build remains complete without it. | Gameplay Programmer |
| **N** | **3.2.5** | Gamepad | Standard layout when connected; **not** required for current focus. | Gameplay Programmer |

### 3.3 Locomotion

| Tier | ID | Ingredient | What “done” looks like | Best owner |
|------|-----|------------|------------------------|------------|
| **E** | **3.3.1** | Walk / run / jump | Responsive baseline validated in dojo geometry. | Technical Animator + Gameplay Programmer |
| **C** | **3.3.3** | Slopes / stairs | Clean movement on dojo steps/ramps and future levels. | Physics Programmer |
| **C** | **3.3.2** | Root motion policy | Per-move documentation: animation vs code-driven slide. | Technical Animator |

### 3.4 Controls & camera iteration (process)

| Tier | ID | Ingredient | What “done” looks like | Best owner |
|------|-----|------------|------------------------|------------|
| **C** | **3.4.1** | Playtest loop | Regular passes **without mouse** (laptop); short changelog of binding/camera decisions (A/D turn rate vs strafe, Shift behavior, etc.). | Game Director + Gameplay Programmer |
| **C** | **3.4.2** | Docs in sync | Dojo signs, pause help, and README default controls match the build; no orphaned key art. | UX Designer + Gameplay Programmer |

---

## 4. Tech stack — web runtime & engine layer

### 4.1 Rendering & scene

| Tier | ID | Ingredient | What “done” looks like | Best owner |
|------|-----|------------|------------------------|------------|
| **E** | **4.1.1** | Three.js scene | Lights, shadows, materials; maintainable scene graph. | Graphics Programmer |
| **C** | **4.1.2** | Art direction lock | One coherent look for stickmen + environments. | Art Director + Graphics Programmer |
| **N** | **4.1.3** | Post FX | Bloom/grade used sparingly for highlights. | Graphics Programmer |

### 4.2 Physics & collision

| Tier | ID | Ingredient | What “done” looks like | Best owner |
|------|-----|------------|------------------------|------------|
| **E** | **4.2.1** | Physics engine choice | Pick web-capable engine; validate ragdolls + perf; **document rationale**. | Physics Programmer |
| **E** | **4.2.2** | Layers / masks | Clean separation: player, enemies, props, ragdoll parts, triggers. | Physics Programmer |
| **E** | **4.2.3** | Fixed timestep | Stable simulation step + interpolation for rendering. | Physics + Gameplay Programmer |

### 4.3 Application architecture

| Tier | ID | Ingredient | What “done” looks like | Best owner |
|------|-----|------------|------------------------|------------|
| **E** | **4.3.1** | Game loop | `update` / `fixedUpdate` / `render`; no simulation in render pass. | Lead Gameplay Programmer |
| **E** | **4.3.2** | Actor model | Composable player/enemy/prop modules. | Lead Gameplay Programmer |
| **C** | **4.3.3** | Events & FSM | Combat and UI subscribe to shared events; state machines debuggable. | Gameplay Programmer |

### 4.4 Build, assets & static delivery

| Tier | ID | Ingredient | What “done” looks like | Best owner |
|------|-----|------------|------------------------|------------|
| **E** | **4.4.1** | Bundler + TS | Fast dev build; typed codebase. | Web/Tools Engineer |
| **E** | **4.4.2** | Static hosting | CDN deploy, hashed filenames, compression for 3D assets. | Web/Tools Engineer |
| **E** | **4.4.4** | No-backend rule | **No** server-authoritative gameplay, **no** login API in product scope. | Web/Tools Engineer + Game Director |
| **C** | **4.4.5** | Cold-start budget | First interactive frame within agreed time on target desktop network. | Web/Tools + Graphics Programmer |
| **N** | **4.4.3** | Optional local telemetry | Error/perf breadcrumbs **opt-in**, no accounts. | Web Engineer |

### 4.5 Optional services (future)

| Tier | ID | Ingredient | What “done” looks like | Best owner |
|------|-----|------------|------------------------|------------|
| **N** | **4.5.1** | Online leaderboard | Requires hosted endpoint or vendor — **contradicts pure static rule** until built. | Web Engineer |
| **N** | **4.5.2** | Cloud saves | Same as above; defer. | Web Engineer |

---

## 5. Stickman rig — art direction & implementation

### 5.1 Visual language

| Tier | ID | Ingredient | What “done” looks like | Best owner |
|------|-----|------------|------------------------|------------|
| **E** | **5.1.1** | Silhouette | Limbs readable at gameplay camera distance. | Art Director + Character/Technical Artist |
| **C** | **5.1.3** | Hit feedback rules | Short flash/rim; consistent across enemies. | Art Director + graphics TD |
| **N** | **5.1.2** | Outfit vocabulary | Modular hats/clothes for variety in later levels. | Character Artist |

### 5.2 Rig & animation approach

| Tier | ID | Ingredient | What “done” looks like | Best owner |
|------|-----|------------|------------------------|------------|
| **E** | **5.2.1** | Ragdoll-ready rig | Bone ↔ physics body map documented. | Technical Animator + Physics Programmer |
| **C** | **5.2.2** | Strike blending | Key poses + procedural exaggeration pass. | Technical Animator |
| **N** | **5.2.3** | Face / head detail | Omit or use hats/masks for scope. | Art Director |

### 5.3 Technical assets

| Tier | ID | Ingredient | What “done” looks like | Best owner |
|------|-----|------------|------------------------|------------|
| **E** | **5.3.1** | glTF pipeline | Export checks, naming, validation in CI or script. | Technical Artist |
| **C** | **5.3.2** | Material variants | Outfit masks/instances without breaking rig. | Character Artist + Graphics Programmer |
| **N** | **5.3.3** | LOD | Policy documented; often single LOD for sticks. | Graphics Programmer |

---

## 6. Ragdoll, hit reaction & combat resolution

### 6.1 Authoritative vs visual physics

| Tier | ID | Ingredient | What “done” looks like | Best owner |
|------|-----|------------|------------------------|------------|
| **E** | **6.1.1** | Ownership handoff | One controller “owns” character at a time; no tug-of-war. | Physics + Gameplay Programmer |
| **E** | **6.1.2** | Thresholds | Data-driven stagger/ragdoll entry tuned with bag + enemies. | Lead Game Designer + Physics Programmer |
| **C** | **6.1.3** | Recovery | Get-ups snap cleanly; no underground ragdoll. | Technical Animator + Physics Programmer |

### 6.2 Impulses & hit detection

| Tier | ID | Ingredient | What “done” looks like | Best owner |
|------|-----|------------|------------------------|------------|
| **E** | **6.2.1** | Hit detection | Active frames as volumes/sweeps; dev-only debug draw. | Gameplay Programmer |
| **C** | **6.2.2** | Impulse scaling | Charged/heavy hits multiply force predictably. | Lead Game Designer |
| **C** | **6.2.3** | Crowd chains | Knockback chains with energy falloff + hard perf cap. | Physics Programmer |

### 6.3 Juice, timing & optional gore

| Tier | ID | Ingredient | What “done” looks like | Best owner |
|------|-----|------------|------------------------|------------|
| **C** | **6.3.1** | Hit-stop / shake | Tunable curves; respect accessibility toggles. | Gameplay Programmer + Creative Director |
| **C** | **6.3.2** | SFX / particles | Combat event spawns consistent VFX/audio hooks. | Sound + Graphics Programmer |
| **C** | **6.3.3** | Bag-specific juice | Unique motion/audio for bag impacts. | Sound Designer + Tech Artist |
| **N** | **6.3.4** | Blood / decals | **Bonus layer** — pooled decals or particles; gate behind setting if added. | VFX Artist + Gameplay Programmer |

### 6.4 Stability safeguards

| Tier | ID | Ingredient | What “done” looks like | Best owner |
|------|-----|------------|------------------------|------------|
| **E** | **6.4.1** | Joint limits / sleep | Prevents spaghetti; sleeping bodies when settled. | Physics Programmer |
| **E** | **6.4.2** | Ragdoll perf caps | Max bodies / simplification at distance. | Physics Programmer + QA |
| **N** | **6.4.3** | Determinism / replay | Document non-determinism; optional future work. | Lead Gameplay Programmer |

---

## 7. Level design — dojo, levels & set pieces

### 7.1 Dojo blockout

| Tier | ID | Ingredient | What “done” looks like | Best owner |
|------|-----|------------|------------------------|------------|
| **E** | **7.1.1** | Floor scale / sightlines | Space for **facing yaw / strafe** + follow camera + sprint + bag swings without clipping. | Level Designer |
| **E** | **7.1.3** | Signs + interaction | Proximity or “use” to read **full** control scheme. | UX + Level Designer |
| **C** | **7.1.2** | Bag anchor | Physically satisfying swing/recoil when struck. | Level Designer + Physics Programmer |

### 7.2 Boundaries & navigation

| Tier | ID | Ingredient | What “done” looks like | Best owner |
|------|-----|------------|------------------------|------------|
| **E** | **7.2.1** | Boundaries | No falling out of world; clear collision. | Level Designer + Physics Programmer |
| **C** | **7.2.3** | Lighting | Readable, on-brand dojo mood. | Environment Artist + Art Director |
| **N** | **7.2.2** | Future spawn markers | Editor-only or inactive helpers for later waves. | Level Designer |

### 7.3 Mission / level template (post-dojo)

| Tier | ID | Ingredient | What “done” looks like | Best owner |
|------|-----|------------|------------------------|------------|
| **E** | **7.3.1** | Objectives | Data-driven goals per bundled level. | Lead Game Designer |
| **C** | **7.3.2** | Encounter scripting | Triggers + spawn director drive fights. | Gameplay Programmer |
| **N** | **7.3.3** | Set dressing density | Hero props for “movie” feel without bloating perf. | Environment Artist |

### 7.4 Diegetic interaction props (V2+ narrative)

| Tier | ID | Ingredient | What “done” looks like | Best owner |
|------|-----|------------|------------------------|------------|
| **C** | **7.4.1** | Inspectable objects | Pick up / look at props showing objective or lore text. | Gameplay Programmer + Narrative Designer |
| **C** | **7.4.2** | Story signs | Reuse sign tech for mission context in-level. | Level Designer + Narrative Designer |
| **C** | **7.4.3** | Unkillable NPCs | Interact-only characters; **cannot** enter ragdoll death state. | Gameplay Programmer + Narrative Designer |

---

## 8. Audio & haptics

### 8.1 Sound design

| Tier | ID | Ingredient | What “done” looks like | Best owner |
|------|-----|------------|------------------------|------------|
| **C** | **8.1.1** | Impact library | Whoosh/thud/flesh + bag-specific layers. | Sound Designer |
| **C** | **8.1.3** | Music approach | Loop-friendly; intensity can follow combat state. | Composer / Audio Director |
| **N** | **8.1.2** | VO | Optional barks; silent protagonist OK. | Narrative + Sound |

### 8.2 Implementation

| Tier | ID | Ingredient | What “done” looks like | Best owner |
|------|-----|------------|------------------------|------------|
| **C** | **8.2.1** | Web Audio busses | SFX/music/UI separation; loudness normalized. | Sound implementer + programmer |
| **N** | **8.2.2** | Randomization | Pitch/alternate layers to reduce fatigue. | Sound Designer |
| **N** | **8.2.3** | Dynamic mix | Simple filters under heavy combat. | Sound implementer |

### 8.3 Controller rumble

| Tier | ID | Ingredient | What “done” looks like | Best owner |
|------|-----|------------|------------------------|------------|
| **N** | **8.3.1** | Gamepad API rumble | Patterns tied to hit tier. | Gameplay Programmer |
| **N** | **8.3.2** | Magnitude mapping | Big hits rumble more. | Gameplay Programmer |
| **N** | **8.3.3** | Fallback | No-op when no gamepad/rumble. | Gameplay Programmer |

---

## 9. UI, UX & onboarding

### 9.1 HUD

| Tier | ID | Ingredient | What “done” looks like | Best owner |
|------|-----|------------|------------------------|------------|
| **E** | **9.1.2** | Context prompts | “Press … to interact with sign”, etc. | UX Designer |
| **C** | **9.1.1** | Minimal HUD | Only show resources you actually implement (skip stamina bar if no stamina). | UX Designer |
| **N** | **9.1.3** | Damage numbers | Optional toggle; default **off** for cinematic feel. | UX Designer |

### 9.2 Menus (client-only)

| Tier | ID | Ingredient | What “done” looks like | Best owner |
|------|-----|------------|------------------------|------------|
| **E** | **9.2.1** | Title → play flow | Entry into **dojo-first** experience or level list per your flow. | UX + UI Engineer |
| **C** | **9.2.2** | Graphics presets | Shadows/post/physics quality toggles for min-spec machines. | UX + Graphics Programmer |
| **N** | **9.2.3** | Remapping UI | Full rebind screen; if cut, ship **controls manifest** in README. | UX + Gameplay Programmer |

### 9.3 Tutorialization

| Tier | ID | Ingredient | What “done” looks like | Best owner |
|------|-----|------------|------------------------|------------|
| **E** | **9.3.1** | Sign hierarchy | Basics visible first; advanced moves on same or adjacent signs. | UX + Narrative (copy) |
| **C** | **9.3.3** | Pause help | Lists controls when stuck. | UX Designer |
| **N** | **9.3.2** | Progressive hints | Signs unlock sections after player completes basics. | Lead Game Designer |

---

## 10. Narrative — level text, cast, outfits (V2+ framework)

### 10.1 Story spine & delivery

| Tier | ID | Ingredient | What “done” looks like | Best owner |
|------|-----|------------|------------------------|------------|
| **C** | **10.1.2** | Movie-beat levels | Each bundled level has setup → fight → payoff structure. | Narrative + Lead Game Designer |
| **C** | **10.1.4** | Diegetic-only primaries | Story told through **signs, props, NPC interactions** — not external wiki. | Narrative Designer |
| **N** | **10.1.1** | Tone bible | Reference tone doc (Wick/Transporter **echo**). | Creative Director |

### 10.2 Enemy factions & outfits

| Tier | ID | Ingredient | What “done” looks like | Best owner |
|------|-----|------------|------------------------|------------|
| **C** | **10.2.1** | Faction read | Color/silhouette distinguish enemy types. | Art Director + Lead Game Designer |
| **N** | **10.2.2** | Boss flavor | Personality via animation/posture, not always new mechanics. | Lead Game Designer |
| **N** | **10.2.3** | Outfit gating | Cosmetic or narrative unlocks tied to level progress. | Narrative + Character Artist |

### 10.3 Content authoring

| Tier | ID | Ingredient | What “done” looks like | Best owner |
|------|-----|------------|------------------------|------------|
| **C** | **10.3.1** | Level data format | TS/JSON modules colocated with build (**no server fetch**). | Tools/Gameplay Programmer |
| **N** | **10.3.2** | Localization tables | String IDs for future translation. | Narrative + Engineer |
| **N** | **10.3.3** | Writer one-pagers | Brief per level before art lock. | Narrative Designer |

---

## 11. Quality, performance & risk

### 11.1 Profiling & budgets

| Tier | ID | Ingredient | What “done” looks like | Best owner |
|------|-----|------------|------------------------|------------|
| **E** | **11.1.1** | Desktop min-spec budget | Documented caps for draws/shadows/physics. | Graphics + Physics Programmer |
| **C** | **11.1.3** | Ragdoll stress test | Worst-case pile still playable or degrades gracefully. | QA + Physics Programmer |
| **N** | **11.1.2** | Streaming memory | Plan only if you add streaming later. | Graphics Programmer |

### 11.2 Testing strategy

| Tier | ID | Ingredient | What “done” looks like | Best owner |
|------|-----|------------|------------------------|------------|
| **C** | **11.2.2** | Playtest rubric | Feel, readability, session fatigue scored each build. | QA + Game Director |
| **C** | **11.2.3** | Desktop browser matrix | Chrome, Firefox, Safari on **desktop** per locked decision. | QA Lead |
| **N** | **11.2.1** | Automated combat tests | Pure functions for damage/stun where extractable. | Gameplay Programmer |

### 11.3 Risk register

| Tier | ID | Ingredient | What “done” looks like | Best owner |
|------|-----|------------|------------------------|------------|
| **E** | **11.3.1** | Ragdoll vs exaggeration | Explicit tuning time; avoid physics explosions. | Physics Programmer |
| **C** | **11.3.3** | Scope creep | No new level themes until dojo combat is “sticky”. | Game Director |
| **N** | **11.3.2** | Mobile GPUs | Documented **out of scope** until platform decision changes. | Game Director |

---

## 12. Team roles — cast of delivery

*Here tiers mean: **`[E]`** must be covered for **dojo + client-only multi-level path**, **`[C]`** strongly affects quality/wow, **`[N]`** scales marketing/narrative depth.*

### 12.1 Creative leadership

| Tier | ID | Role | Notes |
|------|-----|------|------|
| **C** | **12.1.1** | Creative Director | Taste + pillar enforcement. |
| **C** | **12.1.2** | Game Director | Sequencing, cuts, anti-scope-creep. |
| **C** | **12.1.3** | Art Director | Visual coherence. |

### 12.2 Production & design

| Tier | ID | Role | Notes |
|------|-----|------|------|
| **E** | **12.2.1** | Lead Game Designer | Moves, tuning, encounter intent. |
| **E** | **12.2.2** | Level Designer | Dojo + level blockouts. |
| **N** | **12.2.3** | Narrative Designer | In-world text / NPC copy (V2+ heavy). |

### 12.3 Engineering

| Tier | ID | Role | Notes |
|------|-----|------|------|
| **E** | **12.3.1** | Lead Gameplay Programmer | Combat, camera, input, level flow. |
| **E** | **12.3.2** | Physics Programmer | Ragdolls, constraints, stability. |
| **C** | **12.3.3** | Graphics Programmer | Lighting, post, profiling. |
| **E** | **12.3.4** | Web / Tools Engineer | Vite, static deploy, asset pipeline, no-backend discipline. |

### 12.4 Content crafts

| Tier | ID | Role | Notes |
|------|-----|------|------|
| **E** | **12.4.1** | Technical Animator | Rig, states, hit reactions. |
| **C** | **12.4.2** | Environment Artist | Dojo + kits. |
| **N** | **12.4.3** | Character Artist | Outfit variants. |
| **C** | **12.4.4** | Sound designer + implementer | Without **C** tier audio, combat feels hollow. |

### 12.5 Quality & ops

| Tier | ID | Role | Notes |
|------|-----|------|------|
| **C** | **12.5.1** | QA / playtest owner | Regression + feel. |
| **C** | **12.5.2** | UX / UI Designer | Menus, prompts, readability. |
| **N** | **12.5.3** | Marketing / trailer | When sharing publicly. |

---

## Suggested implementation order (practical spine)

**Operational DAG + checkboxes + parallel tags:** `docs/WORK_STREAMS.md` (task IDs **WS-001**…**WS-120**, Mermaid graph, suggested `@` rules per stream).

1. **Static app shell** — Vite + Three.js, **no backend**, one-command deploy to static host.  
2. **Fixed-pitch follow camera + keyboard facing** (**WASD**, **A/D** yaw + strafe) on a placeholder mesh — **no mouse**.  
3. **Physics world + player capsule** + dojo floor + boundaries (**4.4.4**, **7.2.1**).  
4. **Stick rig** locomotion (**5.2.1**, **3.3.1**).  
5. **Hit detection + bag** reaction (**6.2.1**, **2.4.1**).  
6. **Juice pass** — hit-stop, particles, **C-tier** audio (**6.3.1–6.3.2**).  
7. **Ragdoll + recover** on a dummy enemy (**6.1.x**, **2.1.2**).  
8. **Signs + prompts** + pause help (**2.4.2**, **9.x**).  
9. **Level order + load/restart** in bundle (**2.5.x**, **7.3.1**).  
10. **V2+** — inspectables, unkillable NPCs, faction outfits (**7.4**, **10.x**).  
11. **`[N]` polish** — blood/decals (**6.3.4**), rumble (**8.3**), leaderboard (**4.5.1**) only if you accept non-static services.

---

## Cursor: discipline persona rules (optional invocation)

For AI-assisted work, each **best-owner role** from this plan has a matching **Cursor rule** under `.cursor/rules/`: start with **`john-stick-role-index.mdc`** for the full table and **shared prompt/brief skeletons**, then `@`-mention a role file (e.g. `role-audio.mdc`) and paste a **task** (free text or a **GAME_PLAN** ingredient id such as `6.3.2`). Rules are written at **staff/principal** bar: **opinionated defaults**, **research when facts may be stale** (e.g. current Three.js docs), **copy-paste deliverables** the user cannot easily author alone (e.g. **full image prompts** per move phase for `@role-character-artist`, **YAML sound briefs** + **AI SFX prompt text** for `@role-audio`, **effect specs** + **flipbook prompts** for `@role-vfx-artist`).

---

*End of orchestration plan. When tiers feel wrong for a milestone, add a one-line note in your changelog (e.g. “V0.1: audio temporarily `[N]` until week 6”) — but keep the canonical priority labels here as the north star.*
