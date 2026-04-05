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
