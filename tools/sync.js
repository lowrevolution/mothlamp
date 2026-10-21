// Copies each game's single-file demo build from its sibling folder into play/, and its store art (dist/itch/*.png,
// from tools/itch-art.js) into assets/store/<game>/ for store-assets.html.
// Run after `node tools/build.js` (and `node tools/itch-art.js`) in a game folder:  node tools/sync.js
// Only demo-ready games go in play/. PEPPERED is paused (pre-alpha) and appears as a teaser clip instead (tools/teaser.js).
'use strict';
var fs = require('fs');
var path = require('path');

var ROOT = path.join(__dirname, '..');
var GAMES = [
  { folder: 'Chainbloom', src: 'chainbloom-demo.html', file: 'chainbloom.html' },
  { folder: 'Porchlight', src: 'porchlight-demo.html', file: 'porchlight.html' }
];

GAMES.forEach(function (g) {
  var src = path.join(ROOT, '..', g.folder, 'dist', g.src);
  var dst = path.join(ROOT, 'play', g.file);
  var version = fs.readFileSync(path.join(ROOT, '..', g.folder, 'VERSION'), 'utf8').trim();
  fs.copyFileSync(src, dst);
  console.log(g.folder.padEnd(11) + ' v' + version + '  ' + Math.round(fs.statSync(dst).size / 1024) + ' KB  -> play/' + g.file);

  var art = path.join(ROOT, '..', g.folder, 'dist', 'itch'), store = path.join(ROOT, 'assets', 'store', g.folder.toLowerCase());
  var pngs = fs.existsSync(art) ? fs.readdirSync(art).filter(function (f) { return /\.png$/.test(f); }) : [];
  fs.mkdirSync(store, { recursive: true });
  pngs.forEach(function (f) { fs.copyFileSync(path.join(art, f), path.join(store, f)); });
  console.log(''.padEnd(11) + ' ' + pngs.length + ' store images  -> assets/store/' + g.folder.toLowerCase() + '/');
});
