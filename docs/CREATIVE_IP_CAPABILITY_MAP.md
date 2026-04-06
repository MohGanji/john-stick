# Creative IP capability map (WS-132)

**Purpose:** Define **classes** of creative production for John Stick — **inputs**, **outputs**, **review gates**, and **who owns prompts/briefs** — without naming a single vendor. Tools are expressed as **placeholders** (e.g. “image gen API”, “DAW”) so integrations can change.

**Canon:** `docs/GAME_PLAN.md` (art, audio, static delivery); glTF discipline in `docs/GLTF_EXPORT.md` and `npm run validate:gltf`.

**Related:** `docs/TOOLCHAIN_ACCESS.md` (where secrets live; **never** in repo), `docs/DCC_AUTOMATION_PIPELINE.md` (Blender vs automation), `docs/CHARACTER_RIG_MAP.md` (hero skeleton contract).

---

## How to use this doc

1. Pick a **class** row for the work you are doing.
2. Gather **inputs**; run your chosen **tooling** (any vendor that fits license + quality).
3. Produce **outputs** in the listed formats; land files in the **handoff** path.
4. Pass **review gate** before merge; add **CREDITS.md** lines for non-original sources.

**Existing brief templates** (copy from role rules — do not duplicate long-form templates here):

| Template | Location |
|----------|----------|
| Mood / style bible **image prompt**, material YAML snippet | `.cursor/rules/role-art-director.mdc` |
| **Sound Brief** YAML, **AI SFX** text prompt | `.cursor/rules/role-audio.mdc` |
| Narrative / string discipline | `.cursor/rules/role-narrative-designer.mdc` |
| VFX hit / particle prompts | `.cursor/rules/role-vfx-artist.mdc` |
| Character gen prompts | `.cursor/rules/role-character-artist.mdc` |

---

## Class index (quick reference)

| Class | Brief / prompt owner | Review gate |
|-------|---------------------|-------------|
| A. Reference & mood boards | `role-art-director` | Art Director + Creative Director |
| B. Style-lock stills (pitch / alignment) | `role-art-director` | Creative Director (**ship / revise / cut**) |
| C. Character turnaround | `role-character-artist` | Art Director |
| D. Per-move / pose stills | `role-character-artist` | Art Director + `role-technical-animator` (pose sanity) |
| E. UI & HUD icons | `role-ux-ui-designer` | Art Director + Creative Director (readability) |
| F. Texture tiles & trims | `role-environment-artist` or `role-art-director` | Art Director (tiling + scale at camera) |
| G. Environment kit concepts | `role-environment-artist` | Art Director |
| H. VFX concept / flipbook briefs | `role-vfx-artist` | Art Director + Creative Director (juice bounds) |
| I. Narrative & string IDs | `role-narrative-designer` | Creative Director (tone) |
| J. SFX one-shots & stems | `role-audio` | Audio + Creative Director (spam/fatigue) |
| K. Music loops & stingers | `role-audio` | Audio + Creative Director |
| L. Marketing / trailer frames | `role-marketing-trailer` | Creative Director |

---

## A. Reference & mood boards

| | |
|---|---|
| **Inputs** | Pillars from `GAME_PLAN`; optional licensed refs (film stills, photography) with **license** recorded; palette words (max 2 questions per creative director rule). |
| **Tooling** | Image gen API **or** collage tool **or** DCC viewport grabs **or** curated web mood boards (legal). |
| **Outputs** | Labelled board (grid or PDF); hex codes / material notes; **no** unlicensed logos or recognizable third-party IP. |
| **Review gate** | Art Director + Creative Director agree palette **ΔL** and dojo **warm/cool** separation per art pillars. |
| **Handoff** | `docs/reference/` (project convention); link from relevant WS or feature ticket. |

---

## B. Style-lock stills (alignment frames)

| | |
|---|---|
| **Inputs** | Locked mood board; camera lens / framing notes for gameplay cam. |
| **Tooling** | Image gen API, paint-over on 3D grab, or offline render from DCC. |
| **Outputs** | Few hero frames (e.g. idle + one strike read) at **target FOV**; grayscale variants for silhouette check. |
| **Review gate** | Creative Director verdict + art director material grammar (PBR-lite vs toon-rim hybrid). |
| **Handoff** | `docs/reference/`; informs WS-141 / shader presets when applicable. |

---

## C. Character turnaround

| | |
|---|---|
| **Inputs** | `docs/CHARACTER_RIG_MAP.md`; stickman proportions note; costume / faction bullet list. |
| **Tooling** | DCC ortho camera **or** image gen API **with** human cleanup in DCC before rig. |
| **Outputs** | Ortho set (F/B/L/R), neutral pose; optional T-pose / bind pose callout for TD. |
| **Review gate** | Art Director (silhouette); Technical Artist (export feasibility). |
| **Handoff** | `docs/reference/character/`; feeds WS-133+ mesh work. |

---

## D. Per-move / pose stills

| | |
|---|---|
| **Inputs** | Move list / clip names (e.g. `strikePresentation.ts`, `compoundMoveTable.ts`); timing notes (windup / active). |
| **Tooling** | Storyboard tool, image gen API, or keyframe caps from anim WIP. |
| **Outputs** | One sheet per move or grouped tier: readable **silhouette**, **weapon/hands** clear, chord telegraph if required by design. |
| **Review gate** | Art Director + Technical Animator (pose vs hitbox expectations). |
| **Handoff** | `docs/reference/` alongside animation tickets; not a substitute for final glTF animation. |

---

## E. UI & HUD icons

| | |
|---|---|
| **Inputs** | UX flow doc or wireframe; optional string IDs from narrative. |
| **Tooling** | Vector tool **or** image gen API → traced SVG **or** hand-painted PNG at **fixed** base size. |
| **Outputs** | SVG preferred **or** PNG atlas w/ manifest; high-contrast **and** `prefers-reduced-motion` consideration for animated icons. |
| **Review gate** | UX/UI + Art Director (style grammar) + Creative Director (**E-tier** clarity). |
| **Handoff** | `public/` or `src/` asset tree per `REPO_CONVENTIONS`; document scale in ticket. |

---

## F. Texture tiles & trim sheets

| | |
|---|---|
| **Inputs** | Surface list (floor, wall, bag); texel density target; **worst-case** camera distance (see performance WS). |
| **Tooling** | Substance-class authoring **or** photo scan + processing **or** image gen API for **base** only + manual seamless fix. |
| **Outputs** | `metal_roughness` glTF-friendly maps; power-of-two sizes; **test** for moiré at gameplay distance. |
| **Review gate** | Art Director + Environment Artist (modularity); Technical Artist (export validation). |
| **Handoff** | glTF materials **or** `public/` textures; run validation pipeline per `docs/GLTF_EXPORT.md`. |

---

## G. Environment modular kit concepts

| | |
|---|---|
| **Inputs** | Blockout metrics; lighting setup from `GAME_PLAN` §7; kit naming (dojo modules). |
| **Tooling** | DCC blockout **or** image gen API for concept only — geo authored in DCC for shipping. |
| **Outputs** | Module sketches + dimension hints; trim / prop list; mood refs. |
| **Review gate** | Art Director; Level Designer (camera-safe, metrics) when tied to WS-100 blockouts. |
| **Handoff** | `docs/reference/environment/`; guides glTF kit export. |

---

## H. VFX concept / flipbook briefs

| | |
|---|---|
| **Inputs** | Move tier, blood tier, preset tier `[N]` from game plan; one-line creative call from Creative Director. |
| **Tooling** | Text prompts for flipbook gen **or** simulation in DCC → sprite sheets. |
| **Outputs** | Frame counts, blend mode, LOD notes; **variant** list for `[N]` presets. |
| **Review gate** | VFX + Art Director + Creative Director (fatigue rubric); Graphics Programmer when GPU cost is non-trivial. |
| **Handoff** | Texture sheets under `public/…` per project layout; wire to effect system in ticket. |

---

## I. Narrative & string IDs

| | |
|---|---|
| **Inputs** | Beat sheet; UI screen list; `GAME_PLAN` tone constraints. |
| **Tooling** | Text LLM API **or** writer; CAT optional — **not** required by this map. |
| **Outputs** | Tables: `string_id` → copy → max length → VO flag; localization notes if any. |
| **Review gate** | Narrative Designer + Creative Director (tone / spoilers / keyboard-first UX). |
| **Handoff** | Source-of-truth doc or JSON under agreed path; consumption tracked in code tickets. |

---

## J. SFX one-shots & stems

| | |
|---|---|
| **Inputs** | Sound Brief fields (`role-audio.mdc`); event IDs; gameplay sync point (hit-stop, foot plant). |
| **Tooling** | DAW / stem export **or** library sampler **or** AI SFX API (label path in CREDITS). |
| **Outputs** | Layered stems optional; **≥3** variants for spammy events where specified; Ogg/Opus **or** short WAV per repo convention; target under **300 KB** per variant when reasonable. |
| **Review gate** | Audio Director + Creative Director; loudness parity vs baseline SFX. |
| **Handoff** | `public/audio/` (or agreed); **CREDITS.md** for third-party / AI. |

---

## K. Music loops & stingers

| | |
|---|---|
| **Inputs** | Loop BPM / mood; ducking rules vs combat; sting list (menu open, round start). |
| **Tooling** | DAW export **or** AI music tooling (license cleared) **or** licensed library stems. |
| **Outputs** | Seamless loops (zero-crossing); **stems** optional for mix; loudness notes (not mastering for broadcast — game mix). |
| **Review gate** | Audio + Creative Director; verify **no** full-spectrum mud under transient peaks (`role-audio` anti-patterns). |
| **Handoff** | `public/audio/`; document sidechain / bus expectations for programmer. |

---

## L. Marketing / trailer frames

| | |
|---|---|
| **Inputs** | Pillars; capture SOP; honest scope copy (no false feature claims). |
| **Tooling** | Engine capture **or** offline render **or** image gen for **non-shipping** composites (label clearly). |
| **Outputs** | Shot list deliverables; legal-safe captions; dates / platform truth. |
| **Review gate** | Creative Director + Marketing role owner. |
| **Handoff** | `docs/reference/` or marketing repo folder per team convention. |

---

## Vendor & license hygiene (all classes)

- Document **which integration** you used in the ticket or `CREATIVE_IP_CAPABILITY_MAP.md` appendix **by class**, not secret names — actual API keys stay in `.env.local` per `docs/TOOLCHAIN_ACCESS.md`.
- Before merge: **CREDITS.md** line, license tag (e.g. CC0, owned, licensed pack name), and **human** vs **AI-assisted** disclosure if your studio policy requires it.
- **3D shipping assets** must still pass **Technical Artist** export checks (`validate:gltf`) regardless of concept tooling upstream.

---

## Appendix — optional per-ticket stub (copy-paste)

Use this when a class does not yet have a dedicated template file:

```yaml
ws_ref: WS-132
class: <A–L from index>
title: <short name>
inputs_done: <links>
tooling_used: <e.g. "image gen API", "DAW", "Blender 4.x">  # no secrets
outputs: <paths, formats>
review_gate: <names / roles>
license: <original | CC0 | …>
credits_ready: true | false
```
