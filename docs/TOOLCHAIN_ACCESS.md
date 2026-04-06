# Toolchain access

Static **browser** client: **do not** put API keys in tracked source. **Never** use **`VITE_`** for secrets.

## Secrets

| Store | Use |
|--------|-----|
| **`.env.local`** (repo root, gitignored) | Local CLI / scripts — copy names from **`.env.example`** |
| **CI / host UI** | Future automation — not files in the repo |

`npm run dev` / `npm run build` do not require these keys today.

## Keys (`.env.local`)

| Variable | Use |
|----------|-----|
| **`GEMINI_API_KEY`** | Gemini — text, **image asset** generation, **image understanding** ([quickstart](https://ai.google.dev/gemini-api/docs/quickstart)) |
| **`ELEVENLABS_API_KEY`** | **Audio asset** generation — voice / SFX / related API ([quickstart](https://elevenlabs.io/docs/eleven-api/quickstart)) |

Ship any scripts under e.g. `scripts/` loading env from **`.env.local`** — **never** import these into `src/` for the browser.

## Blender MCP

Configured in **`.cursor/mcp.json`**. Add-on: **`tools/blender-mcp/addon.py`** → Blender Preferences → enable **Blender MCP** → sidebar **Connect** while using agents.

## Human checklist

Accounts, billing, DCC licenses, and asset rights stay with humans — document *what* you use, not secret values.
