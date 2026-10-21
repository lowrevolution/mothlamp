// Renders the PNG logo files and the link-preview image from the SVG marks in assets/logo/.
//   node tools/logos.js
'use strict';
var fs = require('fs');
var path = require('path');
var cdp = require('./cdp');

var ROOT = path.join(__dirname, '..');
var LOGO = path.join(ROOT, 'assets', 'logo');
function svg(name) { return fs.readFileSync(path.join(LOGO, name), 'utf8'); }

var FONTS = '<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600&family=Figtree:wght@400;500&display=swap" rel="stylesheet">';
var BASE = '<style>html,body{margin:0;background:transparent}body{display:grid;place-items:center;width:100vw;height:100vh;overflow:hidden}' +
  '.wm{font:600 var(--s)/1 Fredoka,sans-serif;letter-spacing:.22em;margin-right:-.22em;text-transform:lowercase}' +
  '.lock{display:grid;justify-items:center;gap:calc(var(--s)*.35)}.lock svg{width:calc(var(--s)*2.4);height:auto}</style>';

var JOBS = [
  { file: 'mothlamp-mark-512.png', w: 512, h: 512, html: '<div style="width:512px;height:512px">' + svg('mothlamp-mark.svg') + '</div>' },
  { file: 'mothlamp-lockup-ink.png', w: 1200, h: 800, bg: '#0E0B1F',
    html: '<div class="lock" style="--s:96px;color:#F6E7C8">' + svg('mothlamp-mark.svg') + '<div class="wm">mothlamp</div></div>' },
  { file: 'mothlamp-lockup-cream.png', w: 1200, h: 800, bg: '#F6E7C8',
    html: '<div class="lock" style="--s:96px;color:#0E0B1F">' + svg('mothlamp-mark-cream.svg') + '<div class="wm">mothlamp</div></div>' },
  { file: '../og.png', w: 1200, h: 630, bg: '#0E0B1F',
    html: '<div style="position:absolute;left:50%;top:38%;width:900px;aspect-ratio:1;transform:translate(-50%,-50%);background:radial-gradient(circle,rgba(255,181,71,.24),rgba(255,181,71,0) 62%)"></div>' +
      '<div class="lock" style="--s:84px;color:#F6E7C8;position:relative">' + svg('mothlamp-mark.svg') + '<div class="wm">mothlamp</div>' +
      '<div style="font:500 40px/1 Fredoka,sans-serif;color:#FFB547;letter-spacing:0">Tiny games that glow.</div></div>' },
  { file: '../apple-touch-icon.png', w: 180, h: 180, bg: '#0E0B1F',
    html: '<div style="width:136px;height:136px">' + svg('mothlamp-mark.svg') + '</div>' }
];

(async function () {
  var B = await cdp.launch({ width: 1200, height: 800, settle: 1200 });
  for (var j of JOBS) {
    await B.resize(j.w, j.h);
    await B.send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } });
    var page = '<!doctype html><meta charset="utf-8">' + FONTS + BASE + (j.bg ? '<style>body{background:' + j.bg + '}</style>' : '') + j.html;
    await B.go('data:text/html;base64,' + Buffer.from(page).toString('base64'));
    await B.eval('document.fonts.ready.then(function(){return 1})');
    var r = await B.send('Page.captureScreenshot', { format: 'png' });
    var out = path.join(LOGO, j.file);
    fs.writeFileSync(out, Buffer.from(r.data, 'base64'));
    console.log(path.relative(ROOT, out).replace(/\\/g, '/'));
  }
  await B.close();
})();
