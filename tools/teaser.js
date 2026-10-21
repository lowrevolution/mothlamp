// Records the "coming later" teasers. Neither game is playable on the site yet, so it shows these clips instead.
//   PEPPERED (paused, pre-alpha): title screen, then the lamp sweeping a Night Walk until a moth shivers and is caught.
//   SHAVINGS (prototype): a commission's brief, then the lathe turning it and the score counting up.
//   node tools/teaser.js [peppered|shavings]   (default: both; needs ffmpeg; reads ../<Game>/dist/<game>.html)
// Writes assets/teaser/<game>.mp4, <game>.webm and <game>-poster.jpg.
'use strict';
var fs = require('fs');
var os = require('os');
var path = require('path');
var cp = require('child_process');
var cdp = require('./cdp');

var ROOT = path.join(__dirname, '..');
var OUT = path.join(ROOT, 'assets', 'teaser');
var W = 576, H = 720; // 4:5, phone-shaped: both games are played in portrait on phones
function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

var GAMES = {
  peppered: {
    file: path.join(ROOT, '..', 'Peppered', 'dist', 'peppered.html'), query: '?skip', poster: 0.08,
    play: async function (B) {
      await sleep(2400);
      await B.eval('PP.Game.startWalk(4); 1');
      await sleep(1300);
      await B.eval('(function(){var b=[].slice.call(document.querySelectorAll("button")).find(function(e){return /Light the lamp/.test(e.textContent)});b.click();return 1})()');
      await sleep(500);
      var m = await B.eval('(function(){var m=PP.Game.round.moths[0];var s=PP.Render.w2s(m.x,m.y);return {x:s.x,y:s.y}})()');
      // Sweep in from the far side in a slow S, then settle on the moth.
      var start = { x: m.x > W / 2 ? W * 0.25 : W * 0.75, y: Math.max(140, m.y - 260) };
      var steps = 70;
      for (var i = 0; i <= steps; i++) {
        var k = i / steps, e = k * k * (3 - 2 * k);
        var x = start.x + (m.x - start.x) * e + Math.sin(k * Math.PI * 2) * 50 * (1 - k);
        var y = start.y + (m.y - start.y) * e;
        await B.mouse('mouseMoved', x, y);
        await sleep(38);
      }
      await sleep(1100);
      await B.tap(m.x, m.y);
      await sleep(2200);
    }
  },
  shavings: {
    file: path.join(ROOT, '..', 'Shavings', 'dist', 'shavings.html'), query: '', poster: 0.55,
    setup: async function (B) {
      await B.eval('localStorage.clear(); SV.Game.book(5); 1'); // the candlestick: beads and coves, pencil marks
      await sleep(600);
    },
    play: async function (B) {
      await sleep(1600);
      await B.click('#go');
      await sleep(700);
      // The game's own bot turns it at the speed the playtests use. Headless Chrome draws the wood slowly, so the
      // turning takes a minute or more; the encode squeezes it into a 9-second time-lapse.
      var from = Date.now() / 1000;
      await B.eval('SV.G.autopilot = new SV.Bot(SV.G.piece, {speed: 1.6}); 1');
      for (var i = 0; i < 600; i++) { if (await B.eval('SV.G.autopilot.done')) break; await sleep(250); }
      await B.eval('SV.G.autopilot = null; 1');
      var to = Date.now() / 1000;
      await sleep(400);
      await B.click('#go'); await sleep(150); await B.click('#go');
      await sleep(5200);
      console.log('  ' + await B.eval('SV.G.result.score.pct + "%, " + SV.G.result.stars + " stars"') + ', turned in ' + (to - from).toFixed(0) + 's');
      return { from: from, to: to, secs: 9 };
    }
  }
};

async function record(name) {
  var g = GAMES[name];
  var tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mothlamp-teaser-'));
  var B = await cdp.launch({ width: W, height: H, settle: 1600 });
  await B.go('file:///' + g.file.replace(/\\/g, '/') + g.query);

  if (g.setup) await g.setup(B); // before recording starts, so the clip opens on the game's first shot
  var frames = [];
  B.on('Page.screencastFrame', function (p) {
    frames.push({ t: p.metadata.timestamp, data: p.data });
    B.send('Page.screencastFrameAck', { sessionId: p.sessionId }).catch(function () {});
  });
  await B.send('Page.startScreencast', { format: 'jpeg', quality: 88, maxWidth: W, maxHeight: H, everyNthFrame: 1 });
  var lapse = await g.play(B); // optional {from, to, secs}: wall-clock span to squeeze into secs of video
  await B.send('Page.stopScreencast');
  await sleep(200);
  if (B.logs.length) console.log(B.logs.join('\n'));
  await B.close();

  // Frames arrive only when the page changes, so hold each one until the next and encode at a steady 30 fps.
  var list = [];
  frames.forEach(function (f, i) {
    var file = path.join(tmp, String(i).padStart(4, '0') + '.jpg');
    fs.writeFileSync(file, Buffer.from(f.data, 'base64'));
    var next = frames[i + 1] ? frames[i + 1].t : f.t + 0.5, d = next - f.t;
    if (lapse && f.t >= lapse.from && f.t < lapse.to) d *= lapse.secs / (lapse.to - lapse.from);
    list.push("file '" + file.replace(/\\/g, '/') + "'\nduration " + Math.max(0.001, d).toFixed(4));
  });
  list.push("file '" + path.join(tmp, String(frames.length - 1).padStart(4, '0') + '.jpg').replace(/\\/g, '/') + "'");
  var listFile = path.join(tmp, 'frames.txt');
  fs.writeFileSync(listFile, list.join('\n'));

  function ff(args) { cp.execFileSync('ffmpeg', ['-y', '-loglevel', 'error'].concat(args), { stdio: 'inherit' }); }
  // The frames are JPEGs (full-range colour). Chrome won't decode a full-range VP9 WebM, so convert to limited range.
  var input = ['-f', 'concat', '-safe', '0', '-i', listFile, '-vf', 'fps=30,scale=out_range=tv,format=yuv420p', '-color_range', 'tv', '-an'];
  ff(input.concat(['-c:v', 'libx264', '-crf', '24', '-preset', 'slow', '-movflags', '+faststart', path.join(OUT, name + '.mp4')]));
  ff(input.concat(['-c:v', 'libvpx-vp9', '-crf', '36', '-b:v', '0', path.join(OUT, name + '.webm')]));
  fs.copyFileSync(path.join(tmp, String(Math.floor(frames.length * g.poster)).padStart(4, '0') + '.jpg'), path.join(OUT, name + '-poster.jpg'));
  fs.rmSync(tmp, { recursive: true, force: true });

  console.log(name + ': ' + frames.length + ' frames, ' + (frames[frames.length - 1].t - frames[0].t).toFixed(1) + 's');
  [name + '.mp4', name + '.webm', name + '-poster.jpg'].forEach(function (f) {
    console.log('  assets/teaser/' + f + '  ' + Math.round(fs.statSync(path.join(OUT, f)).size / 1024) + ' KB');
  });
}

(async function () {
  fs.mkdirSync(OUT, { recursive: true });
  var names = process.argv[2] ? [process.argv[2]] : Object.keys(GAMES);
  for (var i = 0; i < names.length; i++) {
    if (!GAMES[names[i]]) throw new Error('no teaser for ' + names[i] + ' (try: ' + Object.keys(GAMES).join(', ') + ')');
    await record(names[i]);
  }
})().catch(function (e) { console.error(e); process.exit(1); });
