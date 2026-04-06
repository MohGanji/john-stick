# Agent playtest pack (John Stick)

**Audience:** Cursor agents (and any automation) that **drive the game through the browser** and **record rubric scores**. This is **not** a player-facing doc.

**Goal:** Repeatable runs so `history.jsonl` and `sessions/` accumulate **comparable scores over time**. Use trends as **signals**, not proof — see `ANALYSIS.md`.

**Cursor:** Slash command **`/playtest`** → `.cursor/commands/playtest.md` (orchestrates this pack end-to-end).

## Layout

| Path | Purpose |
|------|---------|
| `RUBRIC.md` | Dimensions, **0–100** scale (AAA reference = 100), gates, smoke. |
| `AGENT_RUNBOOK.md` | Browser MCP workflow: lock, navigate, snapshot, keyboard-only checks. |
| `sessions/` | One Markdown report per run (human- and agent-readable narrative + tables). |
| `history.jsonl` | **Append-only** machine log: one JSON object per line per session (for diffs, scripts, charts). |
| `ANALYSIS.md` | How to read trends; schema v1 vs v2; what correlates (and what does not). |

## Per-session workflow (agent)

1. Read `RUBRIC.md` + `AGENT_RUNBOOK.md`.
2. Copy `sessions/_TEMPLATE.md` → `sessions/YYYY-MM-DD-<commit>-r<nn>.md` (increment `nn` if multiple runs same day/commit).
3. Run the game (typically `npm run dev` — see runbook for URL). **After load/reload**, follow **`AGENT_RUNBOOK.md`** — **click the `<canvas>`** (focus-only) so **WASD / strikes** register; **do not** use the mouse for movement or combat.
4. Execute scripted tasks in the template; fill scores and evidence (snapshot refs, console notes).
5. Append **one line** to `history.jsonl` using **schema_version 2** below (valid JSON, one object per line). Put **actionable** issues in **`blockers`** (omit schema-changelog noise).  
6. **Promote to work:** Slash command **`/playtest`** updates **`docs/WORK_STREAMS.md`** — actionable **`blockers`** + session **Follow-ups** become normal **`WS-###`** rows (**WS-120** *Playtest → schedule*): prioritize by impact / dependencies; park low-impact items in **Deferred** (see command file).

## `history.jsonl` schema

### Version 2 (current)

**`scores`** contains **six integers 0–100** only. **`fun_60s_gate`** and **`smoke_all_pass`** live at **root** (not inside `scores`).

```json
{
  "schema_version": 2,
  "session_id": "2026-04-06-abc12-r01",
  "recorded_at": "2026-04-06T18:22:00Z",
  "commit": "abc1234",
  "dev_url": "http://localhost:5173",
  "browser_tool": "cursor-ide-browser",
  "scores": {
    "feel_striking": 24,
    "readability_combat": 26,
    "fatigue_keyboard": 48,
    "camera_comfort": 30,
    "audio_clarity": 14,
    "stability_ragdoll_physics": 28
  },
  "fun_60s_gate": true,
  "smoke_all_pass": false,
  "blockers": [],
  "session_file": "sessions/2026-04-06-abc12-r01.md"
}
```

- **scores:** integers **0–100** per `RUBRIC.md` — **brutal calibration**; AAA reference = **100** (CoD / Far Cry bar).  
- **blockers:** strings — empty array if none.  
- **fun_60s_gate** / **smoke_all_pass:** booleans.

### Version 1 (legacy lines only)

Older rows may have `schema_version: 1`, **1–5** integers inside `scores`, and `fun_60s_gate` incorrectly nested inside `scores`. **Do not emit v1** for new sessions. When comparing trends, **exclude or rescale v1** (see `ANALYSIS.md`).

## GAME_PLAN anchors

- **§11.2.2** — Playtest rubric (feel, readability, fatigue): covered by score dimensions + narrative.  
- **§1.3.1** — Fun in 60s: **`fun_60s_gate`** in JSONL.
