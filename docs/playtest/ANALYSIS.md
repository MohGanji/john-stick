# Reading playtest history (agents + maintainers)

## Playtest → schedule

- **`/playtest`** adds or extends **`WS-###`** rows in **`docs/WORK_STREAMS.md`** from **`blockers`** + session notes (**WS-120**). Track new work alongside JSONL trends.

## Schema versions

- **`schema_version: 2`** — Six **`scores`** keys, each **0–100**; **`fun_60s_gate`** and **`smoke_all_pass`** at **root**. This is the **only** format for new rows.  
- **`schema_version: 1`** (legacy) — **1–5** per dimension; **`fun_60s_gate`** may appear inside `scores`. **Do not mix v1 and v2 in the same trend chart** without rescaling (v1 × 20 is a crude mapping, not equivalent to the v2 rubric intent).

## What `history.jsonl` is good for

- **Trend lines:** Same `scores.*` keys over commits — did **camera_comfort** move after a cam PR?  
- **Regression radar:** Sudden drop in **`stability_ragdoll_physics`** or **`smoke_all_pass: false`**.  
- **Gate tracking:** **`fun_60s_gate`** and **`smoke_all_pass`** are coarse **quality bars**, not nuance.

## What it is **not**

- **Proof of player fun.** Agents are not players; browser automation may miss timing feel.  
- **Proof that “higher rubric = better game.”** Scores can rise because the **agent got lenient**, or because **one** dimension improved while another regressed. The v2 rubric is **explicitly harsh** — use session **“why this number”** text as ground truth.  
- **Statistical rigor** without discipline: vary URL, machine, and browser tool rarely → confounded.

## Improving correlation with real quality

- **Freeze the rubric** (`RUBRIC.md`) between comparisons; bump `schema_version` if keys or anchors change.  
- **Always record `commit`** and prefer **one dev URL** convention.  
- **Narrative in `sessions/*.md`** carries *why* a score moved — use it when JSONL looks ambiguous.  
- Occasionally add a **USER** or human spot-check when scores jump unexpectedly.

## Suggested lightweight review

Every few sessions, scan:

1. **`fun_60s_gate`** and **`smoke_all_pass`** — any flip to false?  
2. **Lowest dimension** across last *N* runs — tuning candidate.  
3. **`blockers`** in JSONL — triage before trusting the rest of the run.  
4. **Cluster check:** if most dimensions sit **45–55** without strong notes, suspect **grade inflation** vs `RUBRIC.md`.
