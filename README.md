# Mothlamp

The site for **Mothlamp**, the tiny-games label of Low Revolution. A static page for GitHub Pages: the home page, the CHAINBLOOM and PORCHLIGHT demos playable in the browser, a "coming later" teaser for PEPPERED (paused, pre-alpha), and a press section.

Planned address: <https://lowrevolution.github.io/mothlamp/> (repo `lowrevolution/Mothlamp`, private for now; to launch, make it public and turn on Pages from `main` at `/`). The game source repos stay private; only their single-file builds are copied here.

## Preview

```bash
python -m http.server 5320 --directory .
```

Then open <http://localhost:5320/>.

## What's here

| Path | What |
|---|---|
| `index.html` | The whole site: hero, games, about, press. Palette and type from the brand sheet in `Chainbloom/studio/brand.html` |
| `play/` | Preview copies of demo builds for games not on itch.io yet (now just PORCHLIGHT). CHAINBLOOM's Play buttons go to https://mothlampstudios.itch.io/chainbloom |
| `assets/teaser/` | PEPPERED teaser clip (MP4 + WebM, 4:5) and poster |
| `assets/shots/` | Title and gameplay screenshots, 1280×800 |
| `assets/logo/` | Mark SVGs (on ink, on cream, one colour) and PNG lockups |
| `assets/og.png` | Link-preview image (1200×630) |
| `tools/sync.js` | Copies demo builds into `play/` for games not on itch.io yet |
| `tools/shots.js` | Captures fresh screenshots with headless Chrome (needs the preview server on 5320) |
| `tools/teaser.js` | Records the PEPPERED teaser from `../Peppered/dist/peppered.html` (needs ffmpeg) |
| `tools/logos.js` | Renders the PNG logos, link-preview image and touch icon from the SVG marks |
| `tools/cdp.js` | Tiny headless-Chrome driver (copied from Porchlight, plus `B.on` for CDP events) |

## Updating after a game changes

```bash
node tools/sync.js     # pull new builds into play/
node tools/shots.js    # optional: new screenshots
```

Adding a game: add it to `GAMES` in `tools/sync.js`, a capture block in `tools/shots.js`, and an `<article class="game">` in `index.html`.

## Before launch

The repo stays private until these are done:

1. ~~**Email sign-up.**~~ Done 21 Oct 2026. The `#signup` form posts to FormSubmit's alias for mothlampstudios@pm.me (no account; activated and tested). The demos' "Get updates" buttons point to `#updates` here.
2. **Play links to itch.io.** The demos ship on itch.io first (`dist/itch/*-demo.zip` in each game). Saves live with the itch version, so each game's Play buttons point to its itch.io page and its copy leaves `play/`.
   - CHAINBLOOM: done, https://mothlampstudios.itch.io/chainbloom. Publish the itch page before the site goes live; it shows "not found" while it's a draft.
   - PORCHLIGHT: still a preview copy in `play/`. Waiting for its itch.io page.
3. **Demo gates.** `node tools/demo-check.js` in Chainbloom and Porchlight passes, and the manual gates (sound, real phones, cold playtests) are done.
4. Make the repo public and turn on Pages from `main` at `/`.
