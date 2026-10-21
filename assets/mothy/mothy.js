// The page moth: one of MOTHY's twelve moths drops by, a different one each visit. It lands on the top edges of
// things on the page, follows you down when you scroll away, and flees a quick mouse (three shoos and it leaves).
// Clicking or tapping it goes to MOTHY's card. Sprites come from the Mothy app's own renderer (Mothy.exe --web).
// Reduced motion: it just sits on a card, still a link.
(function () {
  var card = document.getElementById('mothy');
  if (!card) return;
  var base = 'assets/mothy/';
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var PERCHES = '.shot, .soon, .updates-card, .copy, .logo-tile, .principle, .facts, .gallery a, .head h2';

  fetch(base + 'moths.json').then(function (r) { return r.json(); }).then(function (meta) {
    var m = meta.moths[Math.floor(Math.random() * meta.moths.length)];
    var img = new Image();
    img.onload = function () { setTimeout(function () { start(meta, m); }, reduced ? 0 : 2500); };
    img.src = base + m.id + '.png';
  }).catch(function () {});

  function start(meta, m) {
    var el = document.createElement('a');
    el.className = 'pagemoth';
    el.href = '#mothy';
    el.setAttribute('aria-label', 'A ' + m.name + ' from MOTHY. Go to the MOTHY card');
    el.innerHTML = '<span class="pm-body"></span><span class="pm-tip" aria-hidden="true">Meet MOTHY</span>';
    el.style.width = m.w + 'px'; el.style.height = m.h + 'px';
    el.style.marginLeft = -m.w / 2 + 'px'; el.style.marginTop = -m.h / 2 + 'px';
    var body = el.firstChild;
    body.style.backgroundImage = 'url(' + base + m.id + '.png)';
    body.style.backgroundSize = meta.frames * m.w + 'px ' + m.h + 'px';
    document.body.appendChild(el);

    var radius = Math.max(m.w, m.h) * 0.45;
    var pos = { x: 0, y: 0 }, vel = { x: 0, y: 0 }, target = { x: 0, y: 0 };
    var heading = 0, restHeading = 0, alt = 1, phase = 0, twitch = 0;
    var state = 'fly', stateT = 0, restFor = 0, nextFidget = 0, unseenFor = 0, shoos = [], t = 0;
    var perch = null, perchOff = { x: 0, y: 0 };
    var ph1 = Math.random() * 10, ph2 = Math.random() * 10;
    var lastFrame = -1, lastShadow = '';

    el.addEventListener('click', function () {
      card.classList.add('lit');
      setTimeout(function () { card.classList.remove('lit'); }, 2400);
      if (!reduced) setTimeout(function () { flee(pos.x + 1, pos.y + 1, 1.4); }, 30);
    });

    if (reduced) { settleStill(); return; }

    enterFromEdge();
    choose();
    var mouse = { x: -1e4, y: -1e4, vx: 0, vy: 0, at: 0 };
    addEventListener('mousemove', function (e) {
      var now = performance.now(), dt = Math.max(1, now - mouse.at) / 1000;
      var x = e.pageX, y = e.pageY;
      if (mouse.at && dt < 0.2) { mouse.vx = mouse.vx * 0.4 + (x - mouse.x) / dt * 0.6; mouse.vy = mouse.vy * 0.4 + (y - mouse.y) / dt * 0.6; }
      mouse.x = x; mouse.y = y; mouse.at = now;
      if (state === 'leave' || state === 'gone' || state === 'flee' || performance.now() < calmUntil) return;
      // Only a real swipe scares it: someone aiming at it to click slows down well before they arrive.
      var d = Math.hypot(x - pos.x, y - pos.y), sp = Math.hypot(mouse.vx, mouse.vy);
      if (sp > 1500 && d < radius + 40) flee(x, y, 1);
    }, { passive: true });
    var calmUntil = 0;
    el.addEventListener('mouseenter', function () { calmUntil = performance.now() + 1500; });

    var last = performance.now();
    requestAnimationFrame(function loop(now) {
      var dt = Math.min(0.05, (now - last) / 1000); last = now;
      step(dt);
      draw();
      if (state !== 'gone') requestAnimationFrame(loop); else el.remove();
    });

    function step(dt) {
      t += dt; stateT += dt;
      if (twitch > 0) twitch -= dt;
      phase += dt * m.hz * ((alt > 0.02 || twitch > 0) ? 1 : 0);
      if (state === 'fly') {
        if (perch) trackPerch();
        alt = approach(alt, 1, dt * 3);
        flyTo(target, m.speed, 90, dt);
        if (Math.hypot(target.x - pos.x, target.y - pos.y) < 6 && Math.hypot(vel.x, vel.y) < 70) {
          state = 'land'; stateT = 0;
          restHeading = Math.random() < 0.3 ? heading : (Math.random() - 0.5) * 1.6;
        } else if (stateT > 20) choose();
      } else if (state === 'land') {
        if (perch) trackPerch();
        alt = approach(alt, 0, dt * 2.2);
        pos.x += (target.x - pos.x) * Math.min(1, dt * 6); pos.y += (target.y - pos.y) * Math.min(1, dt * 6);
        heading = turnTo(heading, restHeading, dt * 3);
        if (alt <= 0) { state = 'rest'; stateT = 0; restFor = 20 + Math.random() * 40; nextFidget = t + 3 + Math.random() * 7; }
      } else if (state === 'rest') {
        if (perch) trackPerch();
        pos.x = target.x; pos.y = target.y;
        heading = turnTo(heading, restHeading, dt * 1.5);
        if (t > nextFidget) { if (Math.random() < 0.6) twitch = 0.3; else restHeading += (Math.random() - 0.5); nextFidget = t + 4 + Math.random() * 12; }
        // scrolled away from it for a while: it comes and finds you
        var vy = pos.y - scrollY;
        unseenFor = (vy < -m.h || vy > innerHeight + m.h) ? unseenFor + dt : 0;
        if (unseenFor > 5) { unseenFor = 0; enterFromEdge(); choose(); }
        else if (stateT > restFor) choose();
      } else if (state === 'flee') {
        var ax = pos.x - mouse.x, ay = pos.y - mouse.y, al = Math.hypot(ax, ay) || 1;
        if (al < 260) { vel.x += ax / al * 2600 * dt; vel.y += ay / al * 2600 * dt; }
        var sp = Math.hypot(vel.x, vel.y), max = m.speed * 3.2;
        if (sp > max) { vel.x *= max / sp; vel.y *= max / sp; }
        pos.x += vel.x * dt; pos.y += vel.y * dt;
        alt = approach(alt, 1, dt * 8);
        if (sp > 20) heading = turnTo(heading, Math.atan2(vel.x, -vel.y), dt * 12);
        if (stateT > 1) {
          shoos = shoos.filter(function (s) { return t - s < 90; });
          if (shoos.length >= 3) leave(); else choose(true);
        }
      } else if (state === 'leave') {
        alt = approach(alt, 1, dt * 3);
        flyTo(target, m.speed * 1.4, 1, dt);
        var x0 = scrollX, y0 = scrollY;
        if (pos.x < x0 - m.w || pos.x > x0 + innerWidth + m.w || pos.y < y0 - m.h || pos.y > y0 + innerHeight + m.h || stateT > 20) state = 'gone';
      }
    }

    function flyTo(tg, speed, arrive, dt) {
      var dx = tg.x - pos.x, dy = tg.y - pos.y, d = Math.hypot(dx, dy) || 0.001;
      var want = speed * Math.min(1, d / arrive);
      var wob = (Math.sin(t * 5.3 + ph1) + 0.7 * Math.sin(t * 8.9 + ph2)) * m.erratic * speed * Math.min(1, d / 60);
      var desX = dx / d * want - dy / d * wob, desY = dy / d * want + dx / d * wob;
      if (Math.random() < dt * 2 * m.erratic) { var a = Math.random() * 6.283; vel.x += Math.cos(a) * speed * 0.5 * m.erratic; vel.y += Math.sin(a) * speed * 0.5 * m.erratic; }
      var k = Math.min(1, dt * 4.5);
      vel.x += (desX - vel.x) * k; vel.y += (desY - vel.y) * k;
      pos.x += vel.x * dt; pos.y += vel.y * dt;
      if (Math.hypot(vel.x, vel.y) > 20) heading = turnTo(heading, Math.atan2(vel.x, -vel.y), dt * 7);
    }

    function flee(x, y, force) {
      shoos.push(t);
      var dx = pos.x - x, dy = pos.y - y, d = Math.hypot(dx, dy) || 1;
      vel.x = dx / d * m.speed * 2.6 * force; vel.y = dy / d * m.speed * 2.6 * force;
      perch = null; twitch = 0;
      state = 'flee'; stateT = 0;
    }

    function leave() {
      var vx = scrollX, vy = scrollY;
      target = pos.x - vx < innerWidth / 2 ? { x: vx - m.w * 2, y: pos.y - 120 } : { x: vx + innerWidth + m.w * 2, y: pos.y - 120 };
      perch = null; state = 'leave'; stateT = 0;
    }

    // Somewhere to land: the top edge of something on screen, or now and then just the glass.
    function choose(avoidMouse) {
      perch = null;
      var vx = scrollX, vy = scrollY, top = vy + 72, bottom = vy + innerHeight - 20;
      var options = [].slice.call(document.querySelectorAll(PERCHES)).filter(function (e) {
        var r = e.getBoundingClientRect();
        return r.width > m.w * 1.6 && r.top + vy > top && r.top + vy < bottom && r.left >= 0 && r.right <= innerWidth;
      });
      for (var i = 0; i < 12; i++) {
        var p, e = null;
        if (options.length && Math.random() < 0.8) {
          e = options[Math.floor(Math.random() * options.length)];
          var r = e.getBoundingClientRect();
          p = { x: r.left + vx + m.w * 0.6 + Math.random() * (r.width - m.w * 1.2), y: r.top + vy + 2 };
        } else {
          p = { x: vx + m.w + Math.random() * (innerWidth - m.w * 2), y: top + 40 + Math.random() * Math.max(10, bottom - top - 80) };
        }
        if (avoidMouse && Math.hypot(p.x - mouse.x, p.y - mouse.y) < 300) continue;
        target = p;
        if (e) { var rr = e.getBoundingClientRect(); perch = e; perchOff = { x: p.x - rr.left - vx, y: p.y - rr.top - vy }; }
        break;
      }
      state = 'fly'; stateT = 0;
    }

    // Stay on the element if the layout shifts under it.
    function trackPerch() {
      var r = perch.getBoundingClientRect();
      target = { x: r.left + scrollX + perchOff.x, y: r.top + scrollY + perchOff.y };
    }

    function enterFromEdge() {
      var left = Math.random() < 0.5;
      pos = { x: scrollX + (left ? -m.w : innerWidth + m.w), y: scrollY + innerHeight * (0.2 + Math.random() * 0.5) };
      vel = { x: left ? m.speed : -m.speed, y: 0 };
      heading = left ? Math.PI / 2 : -Math.PI / 2;
      alt = 1;
    }

    function draw() {
      var frame = (alt > 0.02 || twitch > 0) ? Math.floor(phase * meta.flaps) % meta.flaps : meta.flaps;
      if (frame !== lastFrame) { body.style.backgroundPosition = -frame * m.w + 'px 0'; lastFrame = frame; }
      el.style.transform = 'translate(' + pos.x.toFixed(1) + 'px,' + pos.y.toFixed(1) + 'px)';
      body.style.transform = 'rotate(' + (heading * 57.2958).toFixed(1) + 'deg)';
      var shadow = 'drop-shadow(' + (2.5 + 9 * alt).toFixed(1) + 'px ' + (3.5 + 15 * alt).toFixed(1) + 'px ' + (2 + 3 * alt).toFixed(1) + 'px rgba(0,0,0,' + (0.5 - 0.25 * alt).toFixed(2) + '))';
      if (shadow !== lastShadow) { body.style.filter = shadow; lastShadow = shadow; }
    }

    function settleStill() {
      var r = card.getBoundingClientRect();
      pos = { x: r.left + scrollX + r.width * 0.72, y: r.top + scrollY + 2 };
      alt = 0; heading = 0.3;
      draw();
    }
  }

  function approach(v, to, s) { return v < to ? Math.min(to, v + s) : Math.max(to, v - s); }
  function turnTo(a, to, s) {
    var d = to - a;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    return Math.abs(d) <= s ? a + d : a + Math.sign(d) * s;
  }
})();
