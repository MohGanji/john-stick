# Title logo — art & layout references

Mood, **scale**, **two-line stagger**, **letter-as-silhouette**, and **distressed action** targets for the diegetic **JOHN STICK** wall treatment (`dojoTitleLogoWall.ts`, **WS-110** / GP §9.2.1). Use with `@role-art-director` · `@role-ux-ui-designer` when replacing the procedural canvas with **authored PNG / glTF** or marketing stills.

**Note:** Some refs show third-party titles or games for **composition and texture language** only — do **not** ship trademarked logos or unlicensed likenesses; reinterpret for **John Stick**.

| File | Use |
|------|-----|
| `ref-wick-title-italic-condensed.png` | **Typography** — heavy condensed **italic** sans, forward lean. |
| `ref-wick-wick-letter-i-figure-silhouette.png` | **“I” replacement** — full-height figure as vertical bar between word parts. |
| `ref-wick-poster-two-line-stagger-distressed.png` | **Lockup** — **two lines**, second line **inset**; **distress**, internal voids, **blood/grime** read; subline hierarchy. |
| `ref-john-stick-in-game-logo-scale-mockup.png` | **In-engine scale** — wall placement + desired **hero size** (scribble overlay = intent). |
| `ref-skyrim-menu-logo-scale.png` | **Screen dominance** — logo occupies a **large fraction** of the view (translate to wall real estate + camera). |
| `ref-skyrim-title-metallic-distressed.png` | **Material** — chiseled / **metallic**, high contrast, weathered edges. |
| `ref-martial-torii-rising-sun-silhouette.png` | **Silhouette action** — bold martial pose, high-contrast graphic. |
| `ref-martial-custom-name-decal-silhouette-bars.png` | **Type + bars** — heavy sans between horizontals; silhouette band energy. |
| `ref-gangster-stickman-katana-silhouette.png` | **“I” silhouette** — early thin-line mood; hero target is **thick capsule** (see character refs). |
| `dojo-stickman-i.svg` | **“I” silhouette (vector)** — optional editable twin of the PNG. |
| `dojo-stickman-i.png` | **“I” silhouette (shipped)** — clean flat-black hero art; runtime loads `public/logo/dojo-stickman-i.png` (keep copies in sync). |

**Code today:** runtime `CanvasTexture`; **I** = **PNG** composited **after** weathering using the **same skew** as the metallic type so the lockup reads as one piece. Procedural `drawStickmanAsI` only if the image fails to load.
