// Captures a title and a gameplay screenshot of each game in play/ (headless Chrome via tools/cdp.js).
// Needs the site served on 5320 (the "mothlamp" launch config):  node tools/shots.js
'use strict';
var fs = require('fs');
var path = require('path');
var cdp = require('./cdp');

var BASE = 'http://127.0.0.1:5320/play/';
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

  await B.go(BASE + 'chainbloom.html?skip');
  await shot('chainbloom-title');
  await B.eval(clickText('Play')); await sleep(2000);
  await B.tap(600, 420); await sleep(1200);
  await shot('chainbloom-play');

  await B.go(BASE + 'peppered.html?skip');
  await shot('peppered-title');
  await B.eval(clickText('Night Walk')); await sleep(800);
  await B.eval(clickText('Walk 1')); await sleep(1500);
  await B.eval(clickText('Light the lamp')); await sleep(800);
  for (var x = 520; x <= 700; x += 30) { await B.mouse('mouseMoved', x, 330 + (x - 520) / 3); await sleep(60); }
  await sleep(500);
  await shot('peppered-play');

  await B.go(BASE + 'porchlight.html');
  await shot('porchlight-title');
  await B.eval(clickText('Tonight')); await sleep(1500);
  await B.eval(clickText('Investigate')); await sleep(1000);
  for (var i = 0; i < 3; i++) { await B.key('h'); await sleep(900); }
  await sleep(2500);
  await shot('porchlight-play');

  if (B.logs.length) console.log(B.logs.join('\n'));
  await B.close();
})();
