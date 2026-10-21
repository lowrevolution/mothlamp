// Captures a title and a gameplay screenshot of each game's demo build (headless Chrome via tools/cdp.js).
// Reads ../<Game>/dist/<game>-demo.html directly, so build the games first:  node tools/shots.js
'use strict';
var fs = require('fs');
var path = require('path');
var cdp = require('./cdp');

var GAMES = path.join(__dirname, '..', '..');
function demo(folder, file) { return 'file:///' + path.join(GAMES, folder, 'dist', file).replace(/\\/g, '/'); }
var OUT = path.join(__dirname, '..', 'assets', 'shots');
function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
function clickText(t) {
  return '(function(){var e=[].slice.call(document.querySelectorAll("button,a,[role=button]")).find(function(e){return e.textContent.indexOf(' +
    JSON.stringify(t) + ')>=0});if(!e)throw new Error("no button: "+' + JSON.stringify(t) + ');e.click()})()';
}

(async function () {
  var B = await cdp.launch({ width: 1280, height: 800, settle: 2200 });
  async function shot(name) {
    var r = await B.send('Page.captureScreenshot', { format: 'jpeg', quality: 86 });
    fs.writeFileSync(path.join(OUT, name + '.jpg'), Buffer.from(r.data, 'base64'));
    console.log('assets/shots/' + name + '.jpg');
  }
  fs.mkdirSync(OUT, { recursive: true });

  await B.go(demo('Chainbloom', 'chainbloom-demo.html') + '?skip');
  await shot('chainbloom-title');
  await B.eval(clickText('Play')); await sleep(2000);
  await B.tap(600, 420); await sleep(1200);
  await shot('chainbloom-play');

  await B.go(demo('Porchlight', 'porchlight-demo.html'));
  await shot('porchlight-title');
  await B.eval(clickText('Tonight')); await sleep(1500);
  await B.eval(clickText('Investigate')); await sleep(1000);
  for (var i = 0; i < 3; i++) { await B.key('h'); await sleep(900); }
  await sleep(2500);
  await shot('porchlight-play');

  if (B.logs.length) console.log(B.logs.join('\n'));
  await B.close();
})();
