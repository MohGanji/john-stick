# Playtest session — <SESSION_ID>

| Field | Value |
|--------|--------|
| **session_id** | `YYYY-MM-DD-<commit>-r<nn>` |
| **recorded_at** | ISO-8601 UTC |
| **commit** | `<full or short>` |
| **dev_url** | `http://localhost:5173/...` |
| **browser_tool** | `cursor-ide-browser` (or other) |
| **agent / operator** | Cursor agent / model (optional) |
| **rubric** | `schema_version` **2** — scores **0–100** (100 = CoD / Far Cry bar per `RUBRIC.md`) |

## Summary

- **fun_60s_gate:** `true` / `false` — evidence: …
- **smoke_all_pass:** `true` / `false` — failed items: …
- **blockers:** (list or “none”)

## Scores (0–100, brutal / AAA-calibrated)

| Dimension | Score | Why this number (required) |
|-----------|------:|----------------------------|
| feel_striking | | |
| readability_combat | | |
| fatigue_keyboard | | |
| camera_comfort | | |
| audio_clarity | | |
| stability_ragdoll_physics | | |

## Scripted tasks — log

1. Cold open: …
2. Reach bag: …
3. Three distinct moves: …
4. Chord: …
5. Sign / pause help: …
6. Stress: …
7. Optional level: …

## Evidence

- Snapshots / screenshots: (describe refs or attach paths if repo stores them)
- Console: …

## Follow-ups (optional)

Actionable bullets here should be **merged** into **`docs/WORK_STREAMS.md`** as **`WS-###`** rows when running **`/playtest`** (same pass as `history.jsonl`; **WS-120** rules — prioritize vs deferred tail). Skip pure observation.

- …
