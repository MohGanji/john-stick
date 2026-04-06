# Future / maybe (non-binding)

**Purpose:** **Future / maybe** — ideas not confused with **scheduled work** in `WORK_STREAMS.md`. The gap this file closes: **“might do, not on the board yet”** vs **“listed as a WS in the DAG.”** Nothing here is a commitment.

**How to use:** Short dated or titled bullets. When an idea is **real next work**, add or extend a **WS** (and GP anchor if needed), then **delete or trim** the note here so the doc does not go stale. If an idea is **dead**, **remove** it — we do not keep deprecated narratives. If it stays a **long-lived optional** (e.g. coyote time), it can remain until someone schedules it or cuts it.

---

## UI: global pause + Esc menu (future)

**Context (2026-04):** `src/game/runtime/gamePause.ts` centralizes **simulation** vs **presentation** freeze flags. Today **`syncGamePause({ interactModalOpen })`** mirrors the sign-read / Enter modal (WS-101); **`pauseMenuOpen`** is reserved for a future **system pause** (e.g. **Esc** → WS-111-style menu).

**Future work:** Wire **`pauseMenuOpen: true`** from a pause UI module; ensure **input** (combat intent, limb keys) is suppressed or routed the same way as interact so attacks cannot fire behind the menu; optionally **mute duck** music/SFX; **resume** on the same toggle. Prefer **one** place (`syncGamePause`) over ad-hoc checks in `bootstrap.ts` when adding new modal types.

**Related:** `gamePause.ts`, `bootstrap.ts` (`accumulatorTimeScale`, `lateUpdate` presentation dt), GP §9.3.x, WS-110 / WS-111.

---

## UI: onboarding & interact affordances (future)

**Context (2026-04):** Players cannot guess **Enter** reads a sign without a hint. Shipped: **`attachContextPromptHud`** (WS-102) shows **`[Enter]` + “Read sign”** when **in kiosk volume** and **facing** the board (`getDojoSignReadPromptState` in `dojoSignKiosks.ts`), plus stamina context lines.

**Future ideas:** Context prompts for **bag**, **dummy**, **sparring partner** (what you can do from range); **first-time** tooltips or a **short scripted beat** on first spawn; **progressive** sign hints (GP §9.3.2, WS-215); **accessibility**: screen-reader strings, reduce-motion (prompts without pulse animations); unify prompt styling with WS-102 HUD spec.

**Related:** `attachContextPromptHud.ts`, `contextPromptResolve.ts`, `dojoSignKiosks.ts`, WS-102, `role-ux-ui-designer`.

---

## Locomotion: WASD strafe + yaw on A/D (**shipped** in prototype, 2026-04-05)

**What shipped first:** **No Q/E, no arrow-move** — **WASD only** for locomotion. **W/S** forward/back along facing; **A/D** apply **both** lateral **strafe** and **hold-to-yaw** at the same rate class as the old Q/E prototype (`KEYBOARD_LOCOMOTION.yawDegPerSec` in `src/game/input/keyboardLocomotion.ts`).

**Playfeel:** Fast, dynamic, and fairly natural in the dojo; good enough to **standardize on WASD-only** for facing + locomotion until the rig argues otherwise.

**Still to tune (after rig + real locomotion physics/clips):** The **balance** between lateral slide and turn — e.g. **reduce strafe** while keeping yaw, **increase yaw** and soften strafe, or a **~50% strafe** with current yaw. That is **data + animation** work, not a binding change; expect tuning passes in combat spacing playtests.

**Related:** `docs/REPO_CONVENTIONS.md` (prototype input), GP §3.1.4, §3.3.1, WS-032 / WS-040.

---

## Locomotion: walk vs run speed (deferred)

**Context (2026-04):** The playable default is a **single horizontal speed** tuned to feel like an **almost-run** brawler baseline. We are **not** adding a **Shift** walk/run split (or any speed lerp) yet — that would multiply tuning work on the kinematic character controller, input edge cases, and later **animation matching** (walk vs run cycles).

**Future idea:** Introduce an optional **slower walk** once the rig and clips exist — e.g. hold **Shift** to walk (or the inverse: default walk + **Shift** sprint; pick after laptop playtests). Implementation would be a second `moveSpeed` constant (or curve) plus whatever animation/state hooks we add for locomotion, not a physics refactor unless something feels wrong.

**Related:** `PLAYER_CAPSULE.moveSpeed` in `src/game/player/playerCapsuleConfig.ts`, GP §3.3.1, WS-040+ polish.

---

## Locomotion: coyote time + jump buffer (polish, deferred)

**Coyote time:** After the player leaves a ledge, keep them **jump-eligible** for a **short window** (tens of milliseconds) as if they were still grounded — forgives late jump inputs when the character has visually “just” left the floor.

**Jump buffer (related):** If the player presses jump **slightly before** landing, **honor it on touchdown** within a small time window — feels less input-strict on laptop keyboards.

**Context:** WS-040 jump is **strict** (latched edge + grounded check) to ship a simple baseline. Adding either feature means tuning windows, multi-substep interaction, and playtest on **dojo edges** and future combat platforms so it doesn’t feel cheaty or double-jump by accident.

**Related:** GP §3.2.3 (buffering & priority, C-tier), `src/game/player/stepPlayerCapsule.ts`, `keyboardLocomotion` jump latch.

---

## Combat: strike lunge & momentum (v2 polish)

**What shipped (2026):** A small **forward lunge** along facing on strike start (one kinematic step), driven by `gameplayTuning.combatStamina.strikeLungeForwardMeters` — **same scalar for all moves**; grounded vs air not differentiated.

**Future idea:** **Per-`MoveId` lunge** (punch vs kick vs compound), **blend with current planar velocity**, **airborne** rules (reduce, zero, or aim-only), interaction with **hit-stop**, and optional **connection recoil** or **bag-side** momentum trade so hits feel less “ice-skate in place.”

**Related:** `stepPlayerCapsule` `StepPlayerCapsuleOpts`, `combatStamina.ts`, GP §2.2.1.

---

## Character: airborne / in-air animation clip (deferred)

**Context (2026-04):** Locomotion uses **Idle** + **Walk** only; when the capsule is **not** grounded, the mixer stays on **Idle** so there is no dedicated jump / fall / aerial combat pose yet.

**Future idea:** Add a third glTF clip (e.g. **`Air`** or split **`JumpAscent` / `Fall`**) driven by grounded + vertical velocity (and later combat state). Cross-fade from walk/idle when leaving the floor; optional **frozen last frame** on apex for readability; align with hit-receive ragdoll handoff (GP §6.1) so ownership doesn’t fight the clip.

**Related:** `src/game/player/playerCharacter.ts`, `PLAYER_ANIM_*` naming, WS-041 follow-up / WS-090+ aerial combat, `docs/CHARACTER_RIG_MAP.md`.

---

## Character: smooth blends where cylinders meet (nice-to-have)

**Context:** V1 hero mesh is **composed cylinders** + **sphere head** (see `scripts/export-stick-character.mjs`). Joints are **hard cylinder caps** — readable and cheap, but not a single continuous “tube” silhouette.

**Future idea:** Soften transitions at segment joins — e.g. **small shared sphere** at each joint, **fillet/bevel** in DCC, **metaball/sdf** blob pass, or **subdivision + sculpt** on a merged mesh — pick based on art target and perf. Not required for combat readability; ship plain cylinders first.

**Related:** WS-041 procedural mesh, Blender export `docs/GLTF_EXPORT.md`.

---

## Character: `Neck` bone between `Chest` and `Head` (deferred)

**Context (2026-04):** The procedural rig parents **`Head` directly under `Chest`**. Reference art (`docs/reference/character/john-stick-ref-hinge-combat.png`) shows a **neck hinge** so the head can tilt/recoil **independently** of the upper torso — clearer for hits, whiplash, and ragdoll than rotating the whole chest.

**Future idea:** Insert a **`Neck`** bone: `Chest` → `Neck` → `Head`. Optionally a **short neck cylinder** (or invisible segment) skinned 100% to `Neck`; retarget **Idle/Walk** head motion onto `Neck` ± `Head`; update `CHARACTER_RIG_MAP.md` and any WS-091 bone ↔ collider tables. Coordinate with clip re-export so `PLAYER_ANIM_*` contracts stay stable.

**Related:** `docs/CHARACTER_RIG_MAP.md` (visual vs physics, hinge table), `scripts/export-stick-character.mjs`, WS-091 ragdoll mapping.

---

## Character: eyes, faces, and vector-style hit VFX (idea)

**Context (2026-04):** The hero mesh is a **matte black** silhouette; refs show **stateful** faces without rebuilding the head mesh.

**Reference:** `docs/reference/character/john-stick-ref-eyes-and-vector-blood.png` — **Aggro / strike intent:** white eye shapes with **red outer glow**, top edge slanted inward; **Neutral / victim:** no facial features (plain black sphere). **Blood:** scattered **flat red circles** (vector spray), not realistic fluid. **Weapon read:** light blade, **orange/tan** guard and grip for silhouette separation from the body.

**Future ideas:** Drive **expression** from FSM or combat phase (idle vs wind-up vs hit-stun): e.g. **emissive** eye quads on the head, **small billboard** sprites, or a **second material slot** / light mask on the head `SphereGeometry`. Keep **optional** so enemies and the player can share the same rig with different face rules. Coordinate with `role-vfx-artist` blood tier notes and `hitBurstVfxPresets` for circle-cluster reads.

**Related:** `docs/CHARACTER_RIG_MAP.md` (new ref bullet), `john-stick-ref-combat-katana-ready-stance.png` (pose / weapon staging), `.cursor/rules/role-character-artist.mdc`, GP blood tier / VFX streams.

---

## Character: one motion system (clips + physics on the same rig)

**Context (2026-04):** The target is **a single implementation**, not two parallel engines. **One** foundational skeleton (`CHARACTER_RIG_MAP` + `STICKMAN_BASE_GLTF_URL`) feeds **authored glTF clips** (locomotion, strikes) and **Rapier** bodies/constraints/ragdoll for **hit receive, knockback, balance loss, and falls**. **Per game state**, **clips**, **kinematic capsule**, or **simulation** owns the pose — that split is **policy inside one stack**, tuned until it feels right. **WS-133** locks the **foundational** hero to **`STICKMAN_BASE_GLTF_URL`** (**Stick_FRig** `stick_frig_v15_hero.glb`; **`char_player_stick_v01.glb`** stays **`PLAYER_GLTF_URL_PROCEDURAL`** for tooling). **DCC order:** **`WS-228`** (mesh + file standardize) → **`WS-229`** (Blender **animation** repair / NLA export) → **`WS-224`/225** (looping locomotion + strike set). **Blender** refines silhouette vs refs — bad packs are fixed in DCC, not papered over in code.

**Default division of labor:** **Player** — **clips + capsule** for movement and authored strikes (**WS-139** presentation). **Targets (dummy first)** — **WS-091 / WS-094** prove **the same bone map** in Rapier. Extending full receive to **player** or **sparring** is **scheduling the same stack** (**WS-223**), not starting a separate physics product.

**Streams:** **WS-133** (canonical glb + clip catalog), **WS-228** / **WS-229** (Mixamo hero mesh std + Blender anims), **WS-139** (strike blend / read), **WS-091 / WS-094** (ragdoll + articulated receive on shared bones). **WS-223** — written contract: naming, validation, **per-state ownership**, and refactor touchpoints so asset and handoff changes do not fork behavior.

**Related:** `docs/CHARACTER_RIG_MAP.md`, `docs/GLTF_EXPORT.md`, `playerCharacter.ts`, **WS-223**.

---

## Audio: reference clip URL (optional sound-design shortcut)

**What it is:** An **optional** workflow aid, not a requirement. Someone pastes a link to a **short clip** (gameplay capture, trailer moment, longplay timestamp, etc.) whose **punch / bag / impact** feel should be the north star.

**Why it helps:** It gives a **shared target** (“snappier than Street Fighter, drier than Mortal Kombat”) so procedural presets, authored **Ogg** stems, or mix tweaks can be tuned **toward** that vibe instead of swapping adjectives without a concrete reference.

**How it could show up later:** A line in a sound brief, a pinned note in `docs/` or issue, or a field in a tooling checklist — **not** something the runtime or repo needs to fetch automatically.

**Related:** `.cursor/rules/role-audio.mdc`, `src/game/audio/trainingBagSfxPresets.ts` (dev preset spectrum until real SFX), GP §8.

---

## Combat: strike recovery — whiff vs connect (idea)

**Context (2026-04):** After a base strike’s **active window** ends, input cooldown uses the **same** duration whether the strike **hit** anything or **whiffed**. Simple for the dojo lab and keeps tuning one number per move in the dev HUD.

**Future idea:** Shorter recovery on **whiff**, longer on **connect** (or the inverse for commitment-heavy designs), optionally scaled by target type. Would need hit vs no-hit resolution to feed the cooldown gate (still one global “next strike” clock unless we move to per-limb cooldowns).

**Related:** `strikeCooldownGate.ts`, `baseMoveTable` / dev HUD “Input cooldown after window”, WS-080.

---

## Combat: player knockdown / ragdoll — only after combos or power shots (idea, not implemented)

**Context (2026-04):** Knockdown-style reactions in the dojo prototype target the **training dummy** (lab damage threshold → ragdoll, etc.). The **player** does not yet use the same articulated / ownership handoff pipeline (GP §6.1.1).

**Future idea:** When the player can be **hit by enemies**, avoid “fall over on every light tap.” Gate **full knockdown or ragdoll** so it triggers mainly from **compound / sequence hits** (combo finishers, chord windows) or **power / charged** strikes — light jabs might only **stagger**, **hit-stop**, or **camera juice** without a full floor ragdoll. Designer knobs could include: `MoveId` or attack **tier**, **combo depth** or **scaling impulse** from chain position, and a **stagger → ragdoll** threshold curve (related to WS-092 on the dummy side).

**Why defer:** Needs enemy hit resolution on the player, shared tuning with `trainingDummyFeel`-style scalars, and clarity on **PvE vs future PvP** before locking rules.

**Related:** `trainingDummyFsm.ts` / `applyTrainingDummyHitFromStrike.ts` (reference receiver pipeline), `compoundMoveTable` / charge tiers, GP §6.1, WS-092, WS-094 (articulated ragdoll as visual/physics target).

---

## Audio: combo identity + variation (per-move → per-chord)

**Context (2026-04):** Training-bag hits now pick a **procedural preset per limb** (`CombatHitAttackKind`); each `playTrainingBagImpact` call still **randomizes pitch** within the preset’s `pitchCents` list so repeats don’t sound identical.

**Future idea:** When compound / sequence `MoveId`s drive hits (WS-081+), map **`attackKind` or `MoveId` → preset** (or small preset **pool**) so **each combo has its own sonic identity**, with optional **deterministic seed** from combo id + hit index in a chain for reproducible takes, plus **authoritative Ogg** stems when assets land.

**Related:** `attachCombatHitAudio.ts`, `trainingBagSfxPresets.ts`, `GameplayRuntimeTuning.audio.trainingBagSfxByAttackKind`, GP §8, WS-081.

---

## Enemies: training dummy as canonical feel + size scaling (future)

**Intent (2026-04):** The **training dummy** is not a one-off prop — it is the **reference implementation** for how **every enemy** should look and move under hits: same **FSM shape** (hit / stagger / stand-up / ragdoll / recover), same **impulse split** (COM vs fist), **damping**, **timing**, and **dev-tuned scalars** in `GameplayRuntimeTuning.trainingDummyFeel` and `combatBasics`. New enemies should **reuse** this pipeline first, then vary **data** (HP multiplier, move set, AI), not reinvent hit physics.

**Future idea — proportional scaling by enemy size / mass:** When enemies have **different scale** (e.g. giant vs mook), **derive** effective impulses, damping, and possibly timing from a **reference height/mass** (today’s dummy) × a **per-enemy scale factor**. Heavier / larger bodies should **accelerate less** from the same strike impulse (and may need **collider + mass** scaled with volume so Rapier already does part of the job). Explicit **gameplay multipliers** can still sit on top (boss armor, etc.), but the **default** should be: *same tuning sheet, scaled dimensions → naturally weaker relative kickback on huge targets* without hand-authoring every giant’s “kickback slider.”

**Implementation sketch (later):** `enemyScale` or `massRatio` vs dummy reference; multiply **incoming strike impulse** by `1 / massRatio` (or similar), scale **linear/angular damping** and **settle thresholds** if needed so ragdoll exit still feels fair; keep **FSM timings** in sim seconds or optionally stretch slightly with scale for readability.

**Related:** `src/game/tuning/gameplayRuntimeTuning.ts` (`TrainingDummyFeelScalars`, `CombatBasicsScalars`), `src/game/combat/trainingDummyFeel.ts`, `applyTrainingDummyHitFromStrike.ts`, `trainingDummyFsm.ts`, `trainingDummyAuthority.ts`, GP §6.1, WS-093+ harmless NPCs.
