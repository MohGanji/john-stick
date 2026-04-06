# Creative & toolchain access pack

**Work stream:** WS-130 — Wave 13 (`docs/WORK_STREAMS.md`).  
**Game plan:** build/assets/static delivery (`GAME_PLAN` **4.4.1–4.4.2**), glTF pipeline hygiene (**5.3.1**) — see `docs/GAME_PLAN.md`.

This repo is a **static** client: **do not put API keys or tokens in source**, and **never** prefix secrets with `VITE_` (Vite inlines `VITE_*` into the browser bundle).

---

## Human prerequisites (you)

Complete these on a machine the team (and agents, if applicable) can use. No agent can substitute for account TOS, billing, or DCC licensing.

| Area | Done when |
|------|-----------|
| **Secrets location agreed** | Team uses one convention (below); newcomers can find it without chat archaeology. |
| **Image / audio generation** | Accounts exist for whichever vendors you adopt; usage/billing boundaries are clear; outputs license fits the game. |
| **DCC (e.g. Blender)** | Installed, licensed if required, path documented for scripts and for humans. |
| **Agent “click-through” fallback** | If automation fails:** either Cursor **browser** MCP is enabled where you run agents, **or** a documented **remote desktop** / shared machine SOP for manual export steps. |

---

## Where secrets live

| Store | Use for | Notes |
|--------|---------|--------|
| **`.env.local`** (repo root) | Local-only CLI, exporters, or scratch scripts | **Gitignored.** Copy from `.env.example`; fill values locally. Never commit. |
| **OS keychain / credential manager** | Tools that integrate natively (some CLIs, browsers, DCC logins) | Prefer for long-lived tokens when the tool supports it. |
| **CI host secrets** | Future CI that needs keys | GitHub Actions secrets, etc. — **not** files in the repo. |
| **Vendor dashboards** | OAuth apps, web-only keys | Document the *name* of the integration in this file or WS-132; not the secret. |

This project does **not** yet require env vars for `npm run dev` / `npm run build`. `.env.local` is for **creative toolchain** and future automation (see WS-131).

---

## Google Gemini (text, image understanding, image generation)

| Env (`.env.local`) | Used for |
|--------------------|----------|
| **`GEMINI_API_KEY`** | Official client libraries pick this up automatically per Google’s docs. |

**Docs (reference for local scripts only — keys stay off the web client):**

- [Gemini API quickstart (JavaScript)](https://ai.google.dev/gemini-api/docs/quickstart) — install `@google/genai`, `GoogleGenAI`, first `generateContent` call.
- [Image generation (“Nano Banana” / image models)](https://ai.google.dev/gemini-api/docs/image-generation) — e.g. `gemini-3.1-flash-image-preview`, `responseModalities`, saving `inlineData` to PNG.
- [Image understanding](https://ai.google.dev/gemini-api/docs/image-understanding) — inline image + caption / VQA; File API for larger repeats.

**Recommended creative flow (reference → better gen prompt):**

1. Run **image understanding** on a **reference image** (license-safe input you own or have rights to use).
2. Capture **structured attributes** (silhouette, proportions, materials, palette, camera) from the model text.
3. Fold those into a **text-to-image** or **image+text-to-image** prompt for **image generation**, then iterate in-chat per the image-gen guide.

Ship scripts under something like `scripts/gemini/` (add in a future task) loading `dotenv` / `process.env` from `.env.local` — never import these keys into `src/` for the browser.

---

## ElevenLabs (TTS / SFX / music via API)

| Env (`.env.local`) | Used for |
|--------------------|----------|
| **`ELEVENLABS_API_KEY`** | [Eleven API quickstart](https://elevenlabs.io/docs/eleven-api/quickstart) — dashboard key, SDK (`@elevenlabs/elevenlabs-js`), e.g. `textToSpeech.convert`. |

**Key scopes:** the project may only enable **sound effects**, **music generation**, and **read** access to models — if a script fails with **403** or “not allowed,” the owner must widen the key in the ElevenLabs dashboard; do not work around with committed secrets.

---

## 3D models: search and license first

Before modeling from scratch or heavy generation:

1. **Ask the user** to skim marketplaces and libraries for a usable base (compatible export: **glTF/GLB** preferred).
2. **Verify license** (CC, editorial-only, paid seat, redistribution) and planned **CREDITS.md** line before importing into the repo.
3. **Customize in Blender** (retopo, rig fit, materials) per `GAME_PLAN` **5.3.1** and technical-artist export checks.

**Places to search (non-exhaustive):**

| Site | Notes |
|------|--------|
| [Sketchfab](https://sketchfab.com) | Large catalog; filter **Downloadable** + license. Good for character/prop exploration (e.g. stickman search). |
| [CGTrader](https://www.cgTrader.com) | Many game-ready assets; check format and license tier. |
| [TurboSquid](https://www.turbosquid.com) | Commercial models; license varies by product. |
| [Blend Swap](https://www.blendswap.com) | Blender-native; check license on share. |
| [OpenGameArt](https://opengameart.org) | Often CC; good for placeholders and kit pieces. |
| [Kenney](https://kenney.nl/assets) | CC0-style kits; simple props/UI-friendly chunks. |
| [Mixamo](https://www.mixamo.com) | **Adobe-gated** rigged humanoids / mocap — useful as **proportion or animation reference**; re-skinning to stick silhouette is a separate art pass; read Adobe terms. |

Poly Haven and similar are stronger for **materials/environments** than hero characters — still valid for dojo trims per environment-artist briefs.

---

## `.env.example` and Vite

- **`.env.example`** lists **key names only** (empty values). Safe to commit.
- **`VITE_*`:** only for **non-secret** public config (e.g. optional analytics endpoint). **Never** use `VITE_` for generation API keys — they would ship to every player.

---

## DCC (Blender or equivalent)

### Blender MCP (enabled in this repo)

| Item | Detail |
|------|--------|
| **Config** | **`.cursor/mcp.json`** — MCP server id **`blender`**, runs **`uvx blender-mcp`** with `PATH` including `/opt/homebrew/bin` and `/usr/local/bin` so GUI Cursor finds Homebrew’s `uv` on macOS. |
| **Stack** | [ahujasid/blender-mcp](https://github.com/ahujasid/blender-mcp). **Install from this repo:** `tools/blender-mcp/addon.py` → Blender **Edit → Preferences → Add-ons → Install…** → enable **Interface: Blender MCP** → 3D View **N** sidebar → **BlenderMCP** → **Connect** while agents use tools. |
| **Cursor** | **Settings → MCP:** open this workspace, confirm **project** MCP is active, and enable the **blender** server. **Developer: Reload Window** if the server list didn’t refresh after pull. |
| **Smoke** | Blender connected + agent chat: ask to **summarize the current Blender scene**; expect real object names, not a connection timeout. See `docs/DCC_AUTOMATION_PIPELINE.md`. |

**Windows:** this `sh` wrapper is **macOS/Linux-oriented**. Use Cursor global MCP with the [upstream Windows JSON](https://github.com/ahujasid/blender-mcp) (`cmd` + `uvx`) or adjust `.cursor/mcp.json` locally (do not commit machine-specific hacks unless the team standardizes on them).

1. **Install** a supported version; note it in your session notes or `docs/DCC_AUTOMATION_PIPELINE.md`.
2. **License:** respect Blender Cloud / corporate policy if not using GPL defaults.
3. **Cursor workflow:** **Blender MCP** (above) when `uv` + add-on are available; fall back to **headless** `blender -b -P …` or manual export per `docs/DCC_AUTOMATION_PIPELINE.md`.
4. **Paths:** document the binary for scripts, e.g. macOS `/Applications/Blender.app/Contents/MacOS/Blender`, or `blender` on `PATH`.

---

## Cursor browser and remote desktop

- **Cursor IDE browser MCP:** use for official docs, vendor gated UIs, or steps that resist CLI. Follow MCP runbooks in your environment; do not store passwords in repo.
- **Remote desktop:** when DCC or browser must run on a **fixed workstation**, record **who** can access it and **how** (VPN, shared account policy) in your team wiki — not secret values here.

---

## Related docs

- **WS-131** — `docs/DCC_AUTOMATION_PIPELINE.md` (MCP vs headless vs manual; crew decision).  
- **WS-132** — [`docs/CREATIVE_IP_CAPABILITY_MAP.md`](CREATIVE_IP_CAPABILITY_MAP.md) (classes of work, review gates, vendor-neutral tooling placeholders).  
- **`docs/GAME_PLAN.md`** section 4.4 (no-backend, static delivery), 5.3.1 (glTF validation discipline).

---

## Definition of done (repo artifact)

- [x] This file and `/.env.example` exist and point to safe patterns.  
- [ ] Human checklist above completed on at least one crew machine (tracked outside git if you prefer).
