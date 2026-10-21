// Copies a game's single-file demo build from its sibling folder into play/, for games without an itch.io page yet.
// Once a game is on itch.io the site links there instead (saves live with the itch version), and it leaves this list:
// CHAINBLOOM → https://mothlampstudios.itch.io/chainbloom
// Run after `node tools/build.js` in a game folder:  node tools/sync.js
// Only demo-ready games go in play/. PEPPERED is paused (pre-alpha) and appears as a teaser clip instead (tools/teaser.js).
'use strict';
var fs = require('fs');
var path = require('path');

var ROOT = path.join(__dirname, '..');
var GAMES = [
  { folder: 'Porchlight', src: 'porchlight-demo.html', file: 'porchlight.html' }
];

GAMES.forEach(function (g) {
  var src = path.join(ROOT, '..', g.folder, 'dist', g.src);
  var dst = path.join(ROOT, 'play', g.file);
  var version = fs.readFileSync(path.join(ROOT, '..', g.folder, 'VERSION'), 'utf8').trim();
  fs.copyFileSync(src, dst);
  console.log(g.folder.padEnd(11) + ' v' + version + '  ' + Math.round(fs.statSync(dst).size / 1024) + ' KB  -> play/' + g.file);
});
