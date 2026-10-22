// Minimal headless-Chrome driver (copied from Bugdunnit; adds B.on for CDP events) (no dependencies: Node's built-in WebSocket and fetch).
//   const B = await require('./cdp').launch({ width: 390, height: 844, mobile: true });
//   await B.go(url); await B.eval('1+1'); await B.tap(x, y); await B.shot('out.png'); await B.close();
'use strict';
var cp = require('child_process');
var fs = require('fs');
var path = require('path');
var os = require('os');

var CANDIDATES = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
].filter(Boolean);

function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

async function launch(o) {
  o = o || {};
  var exe = CANDIDATES.find(function (p) { return fs.existsSync(p); });
  if (!exe) throw new Error('no Chrome/Edge found; set CHROME');
  var port = o.port || 9333;
  var dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bugdunnit-cdp-'));
  var proc = cp.spawn(exe, ['--headless=new', '--remote-debugging-port=' + port, '--user-data-dir=' + dir, '--no-first-run',
    '--hide-scrollbars', '--mute-audio', '--window-size=' + (o.width || 1280) + ',' + (o.height || 800), 'about:blank'], { stdio: 'ignore' });
  var ws, targets;
  for (var i = 0; i < 50; i++) {
    try { targets = await (await fetch('http://127.0.0.1:' + port + '/json')).json(); break; } catch (e) { await sleep(200); }
  }
  var page = targets.find(function (t) { return t.type === 'page'; });
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(function (r) { ws.onopen = r; });
  var id = 0, pending = {}, logs = [], listeners = {};
  ws.onmessage = function (m) {
    var d = JSON.parse(m.data);
    if (d.id && pending[d.id]) { pending[d.id](d); delete pending[d.id]; }
    if (d.method && listeners[d.method]) listeners[d.method].forEach(function (fn) { fn(d.params); });
    if (d.method === 'Runtime.exceptionThrown') logs.push('EXCEPTION ' + (d.params.exceptionDetails.exception && d.params.exceptionDetails.exception.description || d.params.exceptionDetails.text));
    if (d.method === 'Runtime.consoleAPICalled' && (d.params.type === 'error' || d.params.type === 'warning')) logs.push(d.params.type + ' ' + d.params.args.map(function (a) { return a.value || a.description; }).join(' '));
  };
  function send(method, params) {
    return new Promise(function (r, j) {
      var my = ++id; pending[my] = function (d) { d.error ? j(new Error(method + ': ' + d.error.message)) : r(d.result); };
      ws.send(JSON.stringify({ id: my, method: method, params: params || {} }));
    });
  }
  await send('Runtime.enable'); await send('Page.enable');
  var W = o.width || 1280, H = o.height || 800;
  await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: o.scale || 1, mobile: !!o.mobile });
  if (o.mobile) await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  var B = {
    send: send, logs: logs,
    on: function (method, fn) { (listeners[method] = listeners[method] || []).push(fn); },
    go: async function (url) { await send('Page.navigate', { url: url }); await sleep(o.settle || 900); },
    eval: async function (expr) {
      var r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
      if (r.exceptionDetails) throw new Error('eval: ' + (r.exceptionDetails.exception && r.exceptionDetails.exception.description || r.exceptionDetails.text));
      return r.result.value;
    },
    mouse: async function (type, x, y) { await send('Input.dispatchMouseEvent', { type: type, x: x, y: y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1, pointerType: 'mouse' }); },
    tap: async function (x, y) { await B.mouse('mouseMoved', x, y); await B.mouse('mousePressed', x, y); await sleep(30); await B.mouse('mouseReleased', x, y); await sleep(60); },
    drag: async function (x0, y0, x1, y1, steps) {
      await B.mouse('mouseMoved', x0, y0); await B.mouse('mousePressed', x0, y0);
      steps = steps || 8;
      for (var s = 1; s <= steps; s++) { await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: x0 + (x1 - x0) * s / steps, y: y0 + (y1 - y0) * s / steps, button: 'left', buttons: 1 }); await sleep(16); }
      await B.mouse('mouseReleased', x1, y1); await sleep(60);
    },
    key: async function (key) { await send('Input.dispatchKeyEvent', { type: 'keyDown', key: key }); await send('Input.dispatchKeyEvent', { type: 'keyUp', key: key }); },
    click: async function (selector) {
      var r = await B.eval('(function(){var e=document.querySelector(' + JSON.stringify(selector) + ');if(!e)return null;var b=e.getBoundingClientRect();return [b.x+b.width/2,b.y+b.height/2];})()');
      if (!r) throw new Error('no element ' + selector);
      await B.tap(r[0], r[1]);
    },
    shot: async function (file) {
      var r = await send('Page.captureScreenshot', { format: 'png' });
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, Buffer.from(r.data, 'base64'));
      return file;
    },
    resize: async function (w, h, mobile) { await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: !!mobile }); await sleep(300); },
    sleep: sleep,
    close: async function () { try { ws.close(); } catch (e) { } proc.kill(); await sleep(300); try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) { } }
  };
  return B;
}

module.exports = { launch: launch, sleep: sleep };
