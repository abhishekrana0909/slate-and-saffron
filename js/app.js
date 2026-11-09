// Everything shared across pages: page turns, effects, fridge, filters, cooking mode.
(function () {
  var html = document.documentElement, ROOT = html.dataset.root || '', LANG = html.dataset.lang || 'en', li = LANG === 'hi' ? 1 : 0, GA = window.GA;
  var $ = function (s) { return document.getElementById(s); };
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, fine = matchMedia('(pointer: fine)').matches;
  var byId = {}; GA.recipes.forEach(function (r) { byId[r.id] = r; });
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  function meta(r) { return r.t + ' ' + GA.meta.min[li] + ' · ' + GA.meta.lv[li][r.lv]; }
  function card(r, extra) {
    var c = GA.conts[r.c];
    return '<a class="card tilt rev in flip" href="' + ROOT + LANG + '/r/' + r.id + '/" style="--acc:' + c.a + ';--acc2:' + c.b + '"><img src="' + ROOT + 'images/' + r.id + '/card.webp" alt="' + esc(r.n[li]) + '" width="640" height="480" loading="lazy"><span class="card-b"><span class="tag">' + esc(r.cn[li]) + '</span><strong>' + esc(r.n[li]) + '</strong><small>' + meta(r) + (r.sh ? ' · ' + GA.meta.sh[li] : '') + '</small></span>' + (extra || '') + '</a>';
  }

  // ----- page turn -----
  document.body.classList.add('arrive');
  addEventListener('pageshow', function () { document.body.classList.remove('turn'); });
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a.flip');
    if (!a || reduce || e.ctrlKey || e.metaKey || e.shiftKey || a.target) return;
    e.preventDefault();
    document.body.classList.remove('arrive');
    document.body.classList.add('turn');
    setTimeout(function () { location.href = a.href; }, 300);
  });
  document.querySelectorAll('[data-lang-switch]').forEach(function (a) { a.addEventListener('click', function () { try { localStorage.setItem('ga:lang', a.dataset.langSwitch); } catch (e) {} }); });

  // ----- reveal, section colours, tilt -----
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -7% 0px' });
    document.querySelectorAll('.rev').forEach(function (el) { io.observe(el); });
    var sec = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { var c = GA.conts[e.target.dataset.acc]; html.style.setProperty('--acc', c.a); html.style.setProperty('--acc2', c.b); } });
    }, { rootMargin: '-40% 0px -50% 0px' });
    document.querySelectorAll('[data-acc]').forEach(function (el) { sec.observe(el); });
  } else document.querySelectorAll('.rev').forEach(function (el) { el.classList.add('in'); });
  if (fine && !reduce) {
    document.addEventListener('pointermove', function (e) {
      var t = e.target.closest && e.target.closest('.tilt');
      if (window.__tilt && window.__tilt !== t) { window.__tilt.style.transform = ''; window.__tilt = null; }
      if (!t || !t.classList.contains('in')) return;
      var b = t.getBoundingClientRect(), x = (e.clientX - b.left) / b.width - .5, y = (e.clientY - b.top) / b.height - .5;
      t.style.transform = 'perspective(800px) rotateX(' + (-y * 9).toFixed(2) + 'deg) rotateY(' + (x * 11).toFixed(2) + 'deg) translateZ(6px)';
      window.__tilt = t;
    });
  }

  // ----- spice trail behind the cursor -----
  var fx = $('fx');
  if (fx && fine && !reduce) {
    var ctx = fx.getContext('2d'), W = 0, H = 0, dots = [], lastX = 0, lastY = 0, running = false;
    var colors = ['#EE7F0E', '#FFC22E', '#E0322B', '#2F9E5B', '#8ECB2B', '#C9601A'];
    var size = function () { W = innerWidth; H = innerHeight; fx.width = W; fx.height = H; };
    size(); addEventListener('resize', size);
    var tick = function () {
      ctx.clearRect(0, 0, W, H);
      for (var i = dots.length - 1; i >= 0; i--) {
        var d = dots[i]; d.vy += .09; d.x += d.vx; d.y += d.vy; d.l -= .024;
        if (d.l <= 0) { dots.splice(i, 1); continue; }
        ctx.globalAlpha = d.l; ctx.fillStyle = d.c; ctx.beginPath(); ctx.ellipse(d.x, d.y, d.r, d.r * .62, d.x * .05, 0, 6.3); ctx.fill();
      }
      if (dots.length) requestAnimationFrame(tick); else { running = false; ctx.clearRect(0, 0, W, H); }
    };
    addEventListener('pointermove', function (e) {
      var dx = e.clientX - lastX, dy = e.clientY - lastY, n = Math.min(2, Math.floor(Math.hypot(dx, dy) / 20));
      if (!n) return;
      lastX = e.clientX; lastY = e.clientY;
      for (var i = 0; i < n && dots.length < 90; i++) dots.push({ x: e.clientX, y: e.clientY, vx: (Math.random() - .5) * 1.1, vy: -.7 - Math.random() * .8, r: 1.3 + Math.random() * 2.1, l: 1, c: colors[Math.random() * colors.length | 0] });
      if (!running) { running = true; requestAnimationFrame(tick); }
    });
  } else if (fx) fx.remove();

  // ----- today's recipe -----
  if ($('today')) {
    var r = byId[GA.order[Math.floor(Date.now() / 864e5) % GA.order.length]];
    $('today').href = 'r/' + r.id + '/';
    $('tImg').src = '../images/' + r.id + '/hero.webp'; $('tImg').alt = r.n[li];
    $('tName').textContent = r.n[li]; $('tCountry').textContent = r.cn[li]; $('tDesc').textContent = r.d[li]; $('tMeta').textContent = meta(r);
  }

  // ----- fridge -----
  var have = new Set(store.get('ga:fridge', []));
  function saveFridge() { store.set('ga:fridge', Array.from(have)); }
  function score(r) { var miss = r.f.filter(function (k) { return !have.has(k); }); return miss; }
  function syncTicks(root) { root.querySelectorAll('.tick').forEach(function (b) { b.setAttribute('aria-pressed', have.has(b.dataset.k) ? 'true' : 'false'); }); }
  function bindTicks(root, after) {
    syncTicks(root);
    root.addEventListener('click', function (e) {
      var b = e.target.closest('.tick'); if (!b) return;
      if (have.has(b.dataset.k)) have.delete(b.dataset.k); else have.add(b.dataset.k);
      saveFridge(); syncTicks(root); after();
    });
  }
  if ($('hfChips')) {
    var hf = function () {
      var n = have.size ? GA.recipes.filter(function (r) { return score(r).length <= 2 && r.f.some(function (k) { return have.has(k); }); }).length : 0;
      $('hfN').textContent = n;
    };
    bindTicks($('hfChips'), hf); hf();
  }
  if ($('fridge')) {
    var renderF = function () {
      var ready = [], almost = [];
      if (have.size) GA.recipes.forEach(function (r) {
        if (!r.f.some(function (k) { return have.has(k); })) return;
        var m = score(r);
        if (!m.length) ready.push(r); else if (m.length <= 2) almost.push({ r: r, m: m });
      });
      almost.sort(function (a, b) { return a.m.length - b.m.length; });
      $('fPick').hidden = have.size > 0;
      $('fRH').hidden = !ready.length; $('fAH').hidden = !almost.length;
      $('fRN').textContent = ready.length; $('fAN').textContent = almost.length;
      $('fR').innerHTML = ready.map(function (r) { return card(r); }).join('');
      $('fA').innerHTML = almost.map(function (x) {
        return card(x.r, '<span class="miss">' + window.GA_F.missing + ': ' + x.m.map(function (k) { return esc(GA.ing[k][li]); }).join(', ') + '</span>');
      }).join('');
    };
    var fr = $('fridge');
    bindTicks(fr.querySelector('.fg-l'), renderF);
    $('fClear').addEventListener('click', function () { have.clear(); saveFridge(); syncTicks(fr); renderF(); });
    renderF();
  }

  // ----- browse and filters -----
  if ($('browse')) {
    var cards = {}, res = $('res');
    GA.recipes.forEach(function (r, i) { cards[r.id] = res.children[i]; });
    var text = {};
    GA.recipes.forEach(function (r) { text[r.id] = [r.n[0], r.n[1], r.cn[0], r.cn[1], r.d[0], r.d[1], GA.conts[r.c].n[0], GA.conts[r.c].n[1]].concat(r.f.map(function (k) { return GA.ing[k].join(' '); })).join(' ').toLowerCase(); });
    var apply = function () {
      var q = $('q').value.trim().toLowerCase(), c = $('fC').value, m = $('fM').value, qk = $('fQ').checked, ez = $('fE').checked, npg = $('fN').checked, n = 0;
      GA.recipes.forEach(function (r) {
        var ok = (!q || text[r.id].indexOf(q) >= 0) && (!c || r.c === c) && (!m || r.m.indexOf(m) >= 0) && (!qk || r.t < 20) && (!ez || r.lv === 1) && (!npg || r.npg);
        cards[r.id].hidden = !ok; cards[r.id].style.display = ok ? '' : 'none'; if (ok) { n++; cards[r.id].classList.add('in'); }
      });
      $('cnt').textContent = n; $('none').hidden = n > 0;
    };
    ['q', 'fC', 'fM', 'fQ', 'fE', 'fN'].forEach(function (id) { $(id).addEventListener(id === 'q' ? 'input' : 'change', apply); });
    var pre = new URLSearchParams(location.search);
    if (pre.get('q')) { $('q').value = pre.get('q'); apply(); }
  }

  // ----- saved -----
  if ($('savedG')) {
    var ids = store.get('ga:saved', []).filter(function (id) { return byId[id]; });
    $('savedG').innerHTML = ids.map(function (id) { return card(byId[id]); }).join('');
    $('savedN').hidden = ids.length > 0;
  }

  // ----- recipe page -----
  var paper = document.querySelector('.paper[data-id]');
  if (paper) {
    var id = paper.dataset.id, base = 4, serv = 4;
    var fmt = function (q, u) {
      if (u === 'g' || u === 'ml') return String(Math.round(q / 5) * 5 || Math.round(q));
      var v = Math.round(q * 4) / 4, w = Math.floor(v), f = { .25: '¼', .5: '½', .75: '¾' }[v - w] || '';
      return ((w || '') + f) || '¼';
    };
    var draw = function () {
      $('sN').textContent = serv;
      paper.querySelectorAll('.q').forEach(function (b) { if (b.dataset.u !== 't') b.textContent = fmt(parseFloat(b.dataset.q) * serv / base, b.dataset.u); });
    };
    $('sMinus').addEventListener('click', function () { if (serv > 1) { serv--; draw(); } });
    $('sPlus').addEventListener('click', function () { if (serv < 12) { serv++; draw(); } });
    var sv = $('saveBtn'), list = store.get('ga:saved', []);
    var paint = function () { var on = list.indexOf(id) >= 0; sv.textContent = on ? sv.dataset.b : sv.dataset.a; sv.classList.toggle('pri', on); };
    sv.addEventListener('click', function () { var i = list.indexOf(id); if (i >= 0) list.splice(i, 1); else list.push(id); store.set('ga:saved', list); paint(); });
    paint();
    var hero = $('rHero');
    if (hero && !reduce) addEventListener('scroll', function () { hero.style.transform = 'translateY(' + Math.min(scrollY * .16, 100) + 'px)'; }, { passive: true });

    // cooking mode
    var R = window.GA_R, cm = $('cm'), i = 0, left = 0, iv = 0, lock = null;
    var clock = function () { var m = Math.floor(left / 60), s = left % 60; $('cmClock').textContent = m + ':' + (s < 10 ? '0' : '') + s; };
    var stop = function () { clearInterval(iv); iv = 0; $('cmStart').textContent = R.start; };
    var show = function () {
      stop();
      var st = R.steps[i], mins = st[1];
      $('cmI').textContent = R.step + ' ' + (i + 1) + ' ' + R.of + ' ' + R.steps.length;
      $('cmT').textContent = st[0];
      $('cmTimer').hidden = !mins;
      left = mins * 60; clock(); $('cmClock').classList.remove('up');
      $('cmP').style.visibility = i ? 'visible' : 'hidden';
      $('cmN').textContent = i === R.steps.length - 1 ? R.done : R.next;
    };
    var wake = function () { if (navigator.wakeLock) navigator.wakeLock.request('screen').then(function (l) { lock = l; }).catch(function () {}); };
    var closeCm = function () { stop(); cm.hidden = true; document.body.style.overflow = ''; if (lock) { lock.release().catch(function () {}); lock = null; } $('cookBtn').focus(); };
    $('cookBtn').addEventListener('click', function () { i = 0; cm.hidden = false; document.body.style.overflow = 'hidden'; show(); wake(); $('cmN').focus(); });
    $('cmX').addEventListener('click', closeCm);
    $('cmP').addEventListener('click', function () { if (i > 0) { i--; show(); } });
    $('cmN').addEventListener('click', function () { if (i < R.steps.length - 1) { i++; show(); } else closeCm(); });
    $('cmStart').addEventListener('click', function () {
      if (iv) { stop(); return; }
      $('cmStart').textContent = R.stop;
      iv = setInterval(function () {
        left--; clock();
        if (left <= 0) { stop(); $('cmClock').textContent = R.up; $('cmClock').classList.add('up'); if (navigator.vibrate) navigator.vibrate([250, 120, 250]); }
      }, 1000);
    });
    document.addEventListener('keydown', function (e) { if (cm.hidden) return; if (e.key === 'Escape') closeCm(); if (e.key === 'ArrowRight') $('cmN').click(); if (e.key === 'ArrowLeft') $('cmP').click(); });
    document.addEventListener('visibilitychange', function () { if (!cm.hidden && document.visibilityState === 'visible') wake(); });
  }

  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register(ROOT + 'sw.js').catch(function () {});
})();
