# Agent browser runbook — playtest execution

**Tooling:** Cursor **IDE browser** MCP (or equivalent). Follow server instructions: **lock → navigate → snapshot → interact → unlock**.

## Preconditions

1. Game running locally: from repo root, `npm run dev` (default Vite URL is usually `http://localhost:5173` — confirm terminal output).  
2. Agent has **no** reliance on mouse for **gameplay**; mouse may be unavailable in automation anyway — still **do not** assume click-to-move or click-to-strike. **Exception:** one **focus-only** click on the **WebGL `<canvas>`** is required so the page receives keyboard events (see below) — not a strike or movement command.

## Session start

1. **`browser_tabs`** `list` — know current tabs.  
2. **`browser_lock`** `action: "lock"` on the tab you will use (if policy requires lock first).  
3. **`browser_navigate`** to dev URL (include `?level=0` or project default if documented).  
4. **`browser_snapshot`** — wait until canvas/game UI is present; if loading, short incremental **wait** + snapshot (see MCP perf note: 1–3s loops, not one long sleep).  
5. If a **dialog** appears, use **`browser_handle_dialog`** before the triggering action when testing cancel/accept paths.

## Focus the `<canvas>` (required after load / reload)

John Stick’s input listeners expect the **canvas** to be focused. **Right after navigation or full reload, `browser_press_key` may do nothing until the canvas is clicked.**

**Cursor IDE browser (embedded webview):** If you **leave the Cursor window or switch to another app tab**, then return and **reload** the Simple Browser tab, the webview often **does not forward keyboard** to the page until you **click inside the game view** once. This matches host focus/activation behavior, not a John Stick bug — **Chrome / Firefox / Safari** at the same URL usually do not need that extra step. Treat the canvas click as **automation glue** for Cursor MCP runs, not a product defect to chase unless we move playtests to an external browser.

1. **`browser_take_screenshot`** (viewport) — then **immediately** (no other browser MCP calls in between) **`browser_mouse_click_xy`** using coordinates that land on the **3D view** (typically **left/center** of the viewport when the dev tuning drawer is on the **right**). The tool should report target **`<canvas>`**.  
2. If the screenshot does not match the current layout, **retake** screenshot and repeat click (MCP rule: do not reuse stale coordinates).  
3. After **pause menu** (`Esc`) / **Resume** or other UI chrome, **click the canvas again** before **WASD** or strikes.  
4. Then **`Period`** (if needed) toggles the dev tuning overlay — with focus on the canvas, the overlay handler is not blocked by `HTMLInputElement` focus on sliders.

## Keyboard input

- Use **`browser_press_key`** for game keys (limb keys, Shift, Enter, Esc, arrows if used).  
- After **any** action that can change DOM or canvas state, take a **fresh `browser_snapshot`** before the next structural decision.  
- **Chord / simultaneous keys:** If the tool cannot emit true chord, document limitation in session file and still score **readability** / **feel** with **note: chord tooling limitation**; list in **`blockers`** if production behavior cannot be exercised.

## Verification

- Prefer **snapshot** + **optional screenshot** (`take_screenshot_afterwards` on snapshot) for evidence.  
- On failure, capture **`browser_console_messages`** once before spamming retries.  
- **Four failed attempts** on the same step: stop; record blocker; score dimension **1** with explanation.

## Session end

1. Append **`history.jsonl`** line (valid JSON, one object).  
2. Write **`sessions/YYYY-MM-DD-<commit>-r<nn>.md`**.  
3. **`browser_unlock`** when fully done.

## Repro recipe (blockers)

When filing a **bug** (or handing off to a human), include (`role-qa-playtest`):

```text
Title: ...
Severity: P0|P1|P2
Environment: <browser>, NO MOUSE
Build: <commit> / URL
Steps: 1..n
Expected: ...
Actual: ...
Frequency: always | intermittent
```
