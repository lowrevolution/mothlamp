# Mothlamp

The site for **Mothlamp**, the tiny-games label of Low Revolution. A static page for GitHub Pages: the home page, all three games playable in the browser, and a press section.

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
| `play/` | Single-file game builds, copied from each game's `dist/` |
| `assets/shots/` | Title and gameplay screenshots, 1280×800 |
| `assets/logo/` | Mark SVGs (on ink, on cream, one colour) and PNG lockups |
| `assets/og.png` | Link-preview image (1200×630) |
| `tools/sync.js` | Copies the latest builds from the sibling game folders into `play/` |
| `tools/shots.js` | Captures fresh screenshots with headless Chrome (needs the preview server on 5320) |
| `tools/logos.js` | Renders the PNG logos, link-preview image and touch icon from the SVG marks |
| `tools/cdp.js` | Tiny headless-Chrome driver (copied from Porchlight) |

## Updating after a game changes

```bash
node tools/sync.js     # pull new builds into play/
node tools/shots.js    # optional: new screenshots
```

Adding a game: add it to `GAMES` in `tools/sync.js`, a capture block in `tools/shots.js`, and an `<article class="game">` in `index.html`.
