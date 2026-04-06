---
description: Run agent browser playtest (rubric), log session + history.jsonl + merge blockers into WS-###
---

Run a full **agent playtest pass** for John Stick. The user’s message (minus the slash command) may add **constraints** (e.g. URL, level query, “smoke only”) — honor them if clear; otherwise use defaults below.

## Must read first

1. `docs/playtest/README.md` — layout, `history.jsonl` schema  
2. `docs/playtest/RUBRIC.md` — scores, gates, scripted tasks, smoke checklist  
3. `docs/playtest/AGENT_RUNBOOK.md` — browser MCP workflow  
4. `.cursor/rules/role-qa-playtest.mdc` — repro recipe, smoke alignment  
5. `docs/WORK_STREAMS.md` — **Wave 12** **WS-120** (**Playtest → schedule** rules) + nearby **`WS-223` / `WS-224`**; skim **Deferred** tail for low-impact parking (**e.g. `WS-225`–`WS-226`**)

## Execution

1. **Build / URL:** Ensure the game is reachable (usually `npm run dev` from repo root → `http://localhost:5173` unless the user or terminal output says otherwise). Check existing terminals before starting duplicate dev servers.  
2. **Browser:** Use **Cursor IDE browser** MCP per server instructions: tabs → lock → navigate → **snapshot** before structural interactions → **`AGENT_RUNBOOK.md` canvas focus** (`screenshot` → `mouse_click_xy` on `<canvas>`) after each load/reload (and after pause **Resume**) so **WASD / strikes** register → keyboard only for **gameplay** (**no mouse** for movement or strikes).  
3. **Run** scripted tasks and smoke from `RUBRIC.md`; record **0–100** scores (**brutal**, AAA-calibrated per rubric) + gate booleans using **`schema_version` 2** in `docs/playtest/README.md`.  
4. **Write** a new session file: copy `docs/playtest/sessions/_TEMPLATE.md` → `docs/playtest/sessions/YYYY-MM-DD-<short-commit>-r<nn>.md` (see `sessions/README.md`).  
5. **Append** exactly **one** JSON line to `docs/playtest/history.jsonl` (valid JSON, **`schema_version`: 2**, **0–100** `scores`, gates at root — see `docs/playtest/README.md`). **`blockers`** in that line should list **actionable** issues (not schema meta).  
6. **Merge into `WORK_STREAMS.md`:** Edit **`docs/WORK_STREAMS.md`** per **WS-120** → **Playtest → schedule** (same rules as the checklist note).  
   - For **each actionable** `blockers[]` string and each **substantive** **Follow-ups** / failed-smoke item: if **no existing `WS-###`** row covers it, add **`- [ ] **WS-NNN** — …`** with **next free ID** (max existing **WS-###** number in the file + 1).  
   - **Placement:** **High impact** or **cross-stream / keyboard-first** issues → appropriate **wave** (often **12** next to **WS-120**, or the wave that owns the dependency). **Low impact**, dev-only, or narrow console polish → **Deferred** bucket **at the bottom** (before the handoff snippet).  
   - **Skip** meta-only text (e.g. “recalibrated to rubric v2”).  
   - **Dedupe:** If covered by an existing **WS-###**, do **not** duplicate — add **`Source:`** pointer to the new session on that row or **→ see WS-xxx**.  
   - Each new row: short **title**, **Depends** / **@** / **GP** if obvious, **Source:** session path + optional `history.jsonl` quote.  
7. **Unlock** browser when finished.
