// Copies each game's single-file build from its sibling folder into play/.
// Run after `node tools/build.js` in a game folder:  node tools/sync.js
// Only demo-ready games go in play/. PEPPERED is paused (pre-alpha) and appears as a teaser clip instead (tools/teaser.js).
'use strict';
var fs = require('fs');
var path = require('path');

var ROOT = path.join(__dirname, '..');
var GAMES = [
  { folder: 'Chainbloom', file: 'chainbloom.html' },
  { folder: 'Porchlight', file: 'porchlight.html' }
];

GAMES.forEach(function (g) {
  var src = path.join(ROOT, '..', g.folder, 'dist', g.file);
  var dst = path.join(ROOT, 'play', g.file);
  var version = fs.readFileSync(path.join(ROOT, '..', g.folder, 'VERSION'), 'utf8').trim();
  fs.copyFileSync(src, dst);
  console.log(g.folder.padEnd(11) + ' v' + version + '  ' + Math.round(fs.statSync(dst).size / 1024) + ' KB  -> play/' + g.file);
});
