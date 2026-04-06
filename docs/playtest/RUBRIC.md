# Agent playtest rubric — John Stick

**Operator:** Cursor agent using **browser automation** (e.g. Cursor IDE browser MCP).  
**Environment:** Treat **laptop + keyboard only** as canonical: **no mouse** for movement, combat, menus, or signs (aligns with `docs/GAME_PLAN.md` input goals and WS-050).

## Scoring: integers **0–100** (granular)

**Reference quality for 100:** **Call of Duty–class or Far Cry–class** shipped AAA: combat that millions of players accept as **tight, readable, and premium** — input latency, hit confirmation, camera, SFX/VFX/mix, enemy reactions, and stability are **indistinguishable from “this is a finished blockbuster”** for that dimension (within fair scope: we are a **browser** stick-fighter, but the **bar** is still that tier of discipline and polish).

### Scoring ethos (read this first)

- **Be brutal.** If you are unsure, **score lower** and justify in the session notes. **Inflated scores are worse than harsh ones** — they erase signal in `history.jsonl`.
- **“Okay for a prototype” is not 50.** A rough internal build with visible gaps should usually sit **below ~40** on feel/read/camera/audio unless you can cite concrete, observed wins vs AAA norms.
- **50** means **honestly mid commercial** — “I could imagine this in a small Steam release that reviewers call competent.”
- **70+** means **strong** — “approaching a polished indie or AA feel in this dimension.”
- **85+** means **exceptional** — rare; needs evidence.
- **95–100** is **almost never** — reserve for “this could ship in a top-tier franchise module tomorrow” **for this dimension**.

### Band guide (all dimensions)

| Range | Meaning |
|------:|---------|
| **0–15** | Broken, misleading, or untestable; blocks meaningful judgment. |
| **16–30** | Early prototype / lab: obvious gaps; would frustrate or confuse a paying player. |
| **31–45** | Playable with caveats; identity and feedback still thin vs commercial expectations. |
| **46–60** | **Competent indie** territory — loop works; polish and read still clearly below AAA. |
| **61–75** | **Strong** — could credibly ship in a scoped product; remaining issues are refinement. |
| **76–90** | **Excellent** — most players would not complain; competitive with strong commercial titles in spots. |
| **91–100** | **AAA reference** (CoD / Far Cry bar above) — world-class for that axis; document *why* or you are overscoring. |

If a dimension is **untestable** (crash, hard blocker), score **0–10** and list under **blockers**.

---

## Dimensions (map to `history.jsonl` → `scores`)

Each key is an **integer 0–100**. Score **independently** after scripted tasks.

### 1. `feel_striking`

**100 (CoD / Far Cry):** Frame-accurate commitment; hits **read instantly** (pose, SFX, VFX, hit-stop, recovery) as **one believable impact**; whiffs and connects are **distinct**; no mushy or “hollow” contact; tuning supports skill expression without jank.

**Low scores:** Floaty contact, unclear active frames, weak or chaotic juice, stamina/combat loop fighting the player, browser jank ignored when attributing “feel.”

### 2. `readability_combat`

**100:** Silhouette + animation + UI tell **state and threat** at a glance (player + targets); no guessing what phase of a move you are in; hits and staggers **telegraph** like a shipped action title.

**Low scores:** Stick abstraction without compensating read aids; busy or flat lighting hiding pose; particles/camera obscuring contact; enemy state opaque.

### 3. `fatigue_keyboard`

**100 (inverted fatigue):** **100 = most comfortable** — layout, chord timing, and session strain feel **designed for long sessions** like a premium PC/console port (not “tolerable”). **0 = physically or cognitively painful** for default bindings.

**Low scores:** Chords that misfire in practice, punishing finger yoga, conflict with browser/OS shortcuts without mitigation.

### 4. `camera_comfort`

**100:** Follow, collision, and combat framing match **AAA third-person** expectations — no nausea, no lost player, no fight-the-camera moments during bag/dummy/combat.

**Low:** Clipping, laggy or jitter follow, wrong FOV for read, disorientation on strikes.

### 5. `audio_clarity`

**100:** **Battlefield / Far Cry–grade** readability through sound — layers, distance, impact types, and UI cues are **mix-balanced** and **distinct**; nothing critical is buried.

**Low:** Silent or generic hits, ear fatigue, missing feedback, cannot distinguish events (agent: if you **cannot hear**, score **low** and say **not measured** — do **not** assume “fine”).

### 6. `stability_ragdoll_physics`

**100:** Ragdolls and props behave **believably** under chaos — no explosions, no runaway energy, recoveries and contacts feel **authored**, not **simulation lottery** (Far Cry–level stability expectations).

**Low:** Pops, tunnels, jitter, bodies launching, inconsistent recovery — **any** “physics meme” moment caps this dimension hard.

---

## Gates (booleans; **not** 0–100)

Record in `history.jsonl` at the **root** (see `README.md` **schema_version 2**):

- **`fun_60s_gate`** — **GP §1.3.1:** Within **60 seconds** of first meaningful control, a **naive** tester could land **≥3 distinct moves** on a **training target** without external docs (on-screen signs / pause help allowed). **false** if automation or UX blocks that path.
- **`smoke_all_pass`** — Every item in **Smoke checklist** below passes.

---

## Scripted tasks (do in order)

1. **Cold open:** Load game from configured URL; note time-to-interactive (rough).  
2. **Reach bag / training target:** Keyboard only; from default spawn, reach a strike surface.  
3. **Three distinct moves:** Land **≥3** clearly different attacks (e.g. different limbs and/or chord) on bag or dummy.  
4. **Chord sample:** Fire **at least one** compound/chord if the build exposes one from signs or pause help.  
5. **Sign / help:** Open a **sign** if present; open **pause** help; confirm text matches **live** bindings.  
6. **Stress (short):** ~**2–3 minutes** of varied strikes + movement; watch for **physics blow-ups**, stuck input, or memory climb (note qualitatively).  
7. **Optional second level:** If `?level=` is supported and safe, spot-check load/restart copy (no mouse).

## Smoke checklist (pass/fail → `smoke_all_pass`)

Mirror of QA smoke (`role-qa-playtest`); all must pass for `true`:

- [ ] New session, **keyboard only**, can reach bag (or clear training target).  
- [ ] Each **limb** strike fires a **distinct** anim/SFX (as far as agent can observe).  
- [ ] **Chord** sample matches **expected** move (per on-screen or pause copy).  
- [ ] **Sign** interact readable; **Esc** / flow does not trap focus.  
- [ ] **Pause** shows **correct** bindings vs `actionMap` / help strings.  
- [ ] **Ragdoll** targets: no **explode** / flyaway.  
- [ ] **~5 min** spam: no obvious **runaway** memory (agent: rough devtools/memory if available; else note “not measured”).

## Evidence (required in session Markdown)

- **Commit hash** (short + full if easy).  
- **URL** + query (e.g. level index).  
- **Browser/tool** string.  
- **Per-dimension:** one sentence **why this number** (especially if **below 40** or **above 70**).  
- Optional: **console** errors/warnings summary.

## `history.jsonl` → **`blockers`**

List **actionable** problems only (what engineering or design should **do**). **Do not** use `blockers` for audit meta (e.g. “switched to schema v2”) — that belongs in session prose. **`/playtest`** merges these strings into **`WS-###`** rows in `docs/WORK_STREAMS.md` (**WS-120** placement rules).

## Anti-patterns

- **Defaulting to 40–60** without evidence — that is **grade inflation**.  
- Scoring **without** running the scripted tasks.  
- Using **mouse** for core loop then scoring **fatigue_keyboard** as if keyboard-only.  
- Writing **only** prose in chat — scores must land in **`sessions/*.md`** and **`history.jsonl`**.
