# Future design notes (non-binding)

**Purpose:** Park **ideas**, **maybes**, and **things we might simplify or replace** without editing `GAME_PLAN.md` or `WORK_STREAMS.md` until there is evidence (playtests, rig, combat interactions). Nothing here is a commitment.

**How to use:** Add short dated or titled bullets. When something graduates to a real decision, move it into `GAME_PLAN.md`, `REPO_CONVENTIONS.md`, or a work stream, then trim or strike the note here.

---

## Locomotion: strafe vs steering vs WASD-only hybrid (open)

**Context:** Today we have separate **Q/E facing yaw** (WS-032) and will eventually add **movement** (WS-040+). Lateral keys could mean pure strafe, pure steering (yaw), or something in between.

**Idea A (minimal):** Drop separate lateral strafe and use **left/right only to yaw** (what Q/E do now), with **forward/back** along facing — steering while moving forward avoids a sidestep “tap-dance” once there is a walk cycle and rig. Risk: can feel **sluggish** or wrong in a brawler if you cannot adjust spacing quickly.

**Idea B (WASD end state, brawler-friendly):** Eventually keep **only WASD** for locomotion + facing on one hand: **A** and **D** each do a **mix** of what **Q+A** and **E+D** would mean together today — i.e. **both** a **lateral strafe** component **and** a **yaw (steer)** component in that direction. Goal: **spacing** (strafe) **and** **snappier facing** (yaw) without needing a separate yaw column, less sluggish than pure steering-only, still readable once the rig and animations exist. **W**/**S** stay along forward/back relative to current facing (or as tuned).

**Uncertainty:** The **strafe vs yaw blend** on A/D (rates, when forward is held vs standstill, combat vs explore) needs playtest with **rig**, **locomotion clips**, and **real encounters**. Q/E might remain as legacy or accessibility, or disappear if A/D fully subsumes them — TBD.

**Related:** `docs/REPO_CONVENTIONS.md` (prototype input / shared yaw), `docs/GAME_PLAN.md` §3.1.4, WS-040 / WS-050.
