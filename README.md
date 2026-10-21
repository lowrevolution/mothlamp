# Mothlamp

The site for **Mothlamp**, the tiny-games label of Low Revolution. A static page for GitHub Pages: the home page, links to the CHAINBLOOM and PORCHLIGHT demos on itch.io, "coming later" teasers for PEPPERED (paused, pre-alpha) and SHAVINGS (prototype), a "coming soon" card for MOTHY (the desktop moth), a moth from MOTHY that visits the page and links to that card, and a press section.

Live at <https://lowrevolution.github.io/mothlamp/> since 21 Oct 2026 (public repo `lowrevolution/mothlamp`, Pages from `main` at `/`). The repo name must stay lowercase: Pages paths are case-sensitive, and the site's tags and both demos' links use `/mothlamp/`. The game source repos stay private, and no builds are copied here: the demos live on itch.io.

## Preview

```bash
python -m http.server 5320 --directory .
```

Then open <http://localhost:5320/>.

## What's here

| Path | What |
|---|---|
| `index.html` | The whole site: hero, games, about, press. Palette and type from the brand sheet in `Chainbloom/studio/brand.html` |
| `assets/teaser/` | PEPPERED and SHAVINGS teaser clips (MP4 + WebM, 4:5) and posters |
| `assets/shots/` | Title and gameplay screenshots, 1280×800 |
| `assets/logo/` | Mark SVGs (on ink, on cream, one colour) and PNG lockups |
| `assets/mothy/` | The page moth (`mothy.js`), one sprite strip per moth, `moths.json`, and MOTHY's card art. Regenerate the art from the Mothy repo with `Mothy.exe --web <this folder>` |
| `news.json` | The news feed the Mothy app reads; the Lampmoth delivers new items. Ids must be unique and never reused |
| `assets/og.png` | Link-preview image (1200×630) |
| `tools/shots.js` | Captures fresh screenshots with headless Chrome from each game's `dist/*-demo.html` |
| `tools/teaser.js` | Records the teasers from `../Peppered` and `../Shavings` dist builds: `node tools/teaser.js [peppered\|shavings]` (needs ffmpeg) |
| `tools/logos.js` | Renders the PNG logos, link-preview image and touch icon from the SVG marks |
| `tools/cdp.js` | Tiny headless-Chrome driver (copied from Porchlight, plus `B.on` for CDP events) |

## Updating after a game changes

Upload the new `dist/itch/*-demo.zip` to the game's itch.io page. Nothing here needs to change unless the screenshots do:

```bash
node tools/shots.js    # optional: new screenshots
```

Adding a game: publish it on itch.io, then add a capture block in `tools/shots.js` and an `<article class="game">` in `index.html` whose Play links go to its itch.io page.

| Game | itch.io |
|---|---|
| CHAINBLOOM | https://mothlampstudios.itch.io/chainbloom |
| PORCHLIGHT | https://mothlampstudios.itch.io/porchlight |

## Before launch

The repo stays private until these are done:

1. ~~**Email sign-up.**~~ Done 21 Oct 2026. The `#signup` form posts to FormSubmit's alias for mothlampstudios@pm.me (no account; activated and tested). The demos' "Get updates" buttons point to `#updates` here.
2. ~~**Play links to itch.io.**~~ Done 21 Oct 2026. Saves live with the itch version, so each game's Play buttons point to its itch.io page (CHAINBLOOM, then PORCHLIGHT) and the `play/` preview copies are gone.
3. **Demo gates.** `node tools/demo-check.js` in Chainbloom and Porchlight passes, and the manual gates (sound, real phones, cold playtests) are done.
4. ~~Make the repo public and turn on Pages from `main` at `/`.~~ Done 21 Oct 2026.
