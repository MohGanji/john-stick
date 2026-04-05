# Future design notes (non-binding)

**Purpose:** Park **ideas**, **maybes**, and **things we might simplify or replace** without editing `GAME_PLAN.md` or `WORK_STREAMS.md` until there is evidence (playtests, rig, combat interactions). Nothing here is a commitment.

**How to use:** Add short dated or titled bullets. When something graduates to a real decision, move it into `GAME_PLAN.md`, `REPO_CONVENTIONS.md`, or a work stream, then trim or strike the note here.

---

## Locomotion: WASD strafe + yaw on A/D (**shipped** in prototype, 2026-04-05)

**What shipped first:** **No Q/E, no arrow-move** — **WASD only** for locomotion. **W/S** forward/back along facing; **A/D** apply **both** lateral **strafe** and **hold-to-yaw** at the same rate class as the old Q/E prototype (`KEYBOARD_LOCOMOTION.yawDegPerSec` in `src/game/input/keyboardLocomotion.ts`).

**Playfeel:** Fast, dynamic, and fairly natural in the dojo; good enough to **standardize on WASD-only** for facing + locomotion until the rig argues otherwise.

**Still to tune (after rig + real locomotion physics/clips):** The **balance** between lateral slide and turn — e.g. **reduce strafe** while keeping yaw, **increase yaw** and soften strafe, or a **~50% strafe** with current yaw. That is **data + animation** work, not a binding change; expect iteration in combat spacing tests.

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

## Audio: reference clip URL (optional sound-design shortcut)

**What it is:** An **optional** workflow aid, not a requirement. Someone pastes a link to a **short clip** (gameplay capture, trailer moment, longplay timestamp, etc.) whose **punch / bag / impact** feel should be the north star.

**Why it helps:** It gives a **shared target** (“snappier than Street Fighter, drier than Mortal Kombat”) so procedural presets, authored **Ogg** stems, or mix tweaks can be tuned **toward** that vibe instead of iterating only on adjectives.

**How it could show up later:** A line in a sound brief, a pinned note in `docs/` or issue, or a field in a tooling checklist — **not** something the runtime or repo needs to fetch automatically.

**Related:** `.cursor/rules/role-audio.mdc`, `src/game/audio/trainingBagSfxPresets.ts` (dev preset spectrum until real SFX), GP §8.

---

## Combat: strike recovery — whiff vs connect (idea)

**Context (2026-04):** After a base strike’s **active window** ends, input cooldown uses the **same** duration whether the strike **hit** anything or **whiffed**. Simple for the dojo lab and keeps tuning one number per move in the dev HUD.

**Future idea:** Shorter recovery on **whiff**, longer on **connect** (or the inverse for commitment-heavy designs), optionally scaled by target type. Would need hit vs no-hit resolution to feed the cooldown gate (still one global “next strike” clock unless we move to per-limb cooldowns).

**Related:** `strikeCooldownGate.ts`, `baseMoveTable` / dev HUD “Input cooldown after window”, WS-080.

---

## Audio: combo identity + variation (per-move → per-chord)

**Context (2026-04):** Training-bag hits now pick a **procedural preset per limb** (`CombatHitAttackKind`); each `playTrainingBagImpact` call still **randomizes pitch** within the preset’s `pitchCents` list so repeats don’t sound identical.

**Future idea:** When compound / sequence `MoveId`s drive hits (WS-081+), map **`attackKind` or `MoveId` → preset** (or small preset **pool**) so **each combo has its own sonic identity**, with optional **deterministic seed** from combo id + hit index in a chain for reproducible takes, plus **authoritative Ogg** stems when assets land.

**Related:** `attachCombatHitAudio.ts`, `trainingBagSfxPresets.ts`, `GameplayRuntimeTuning.audio.trainingBagSfxByAttackKind`, GP §8, WS-081.
