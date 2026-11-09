// Everything shared across pages: page turns, ribbon, fridge, filters, cooking mode.
(function () {
  var html = document.documentElement, ROOT = html.dataset.root || '', GA = window.GA;
  var $ = function (s) { return document.getElementById(s); };
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, fine = matchMedia('(pointer: fine)').matches;
  var byId = {}; GA.recipes.forEach(function (r) { byId[r.id] = r; });
  var LV = ['', 'Easy', 'Medium', 'Hard'];
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  function meta(r) { return r.t + ' min · ' + LV[r.lv]; }
  function card(r, extra) {
    var c = GA.conts[r.c];
    return '<a class="card tilt rev in flip" href="' + ROOT + 'r/' + r.id + '/" style="--acc:' + c.a + ';--acc2:' + c.b + '"><img src="' + ROOT + 'images/' + r.id + '/card.webp" alt="' + esc(r.n) + '" width="640" height="480" loading="lazy"><span class="card-b"><span class="tag">' + esc(r.cn) + '</span><strong>' + esc(r.n) + '</strong><small>' + meta(r) + (r.sh ? ' · Vegetarian version' : '') + '</small></span>' + (extra || '') + '<span class="card-more"><b>What you need</b><span>' + esc(r.pv) + '</span><em>Open recipe →</em></span></a>';
  }

  // ----- page turn -----
  if (!html.hasAttribute('data-home')) document.body.classList.add('arrive');
  addEventListener('pageshow', function () { document.body.classList.remove('turn'); });
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a.flip');
    if (!a || reduce || e.ctrlKey || e.metaKey || e.shiftKey || a.target) return;
    e.preventDefault();
    document.body.classList.remove('arrive'); document.body.classList.add('turn');
    setTimeout(function () { location.href = a.href; }, 300);
  });

  // ----- reveal, section colours, tilt -----
  function setAcc(c) { if (!c) return; html.style.setProperty('--acc', c.a); html.style.setProperty('--acc2', c.b); if (window.GA_tint) window.GA_tint(c.a); }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -7% 0px' });
    document.querySelectorAll('.rev').forEach(function (el) { io.observe(el); });
    var sec = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) setAcc(GA.conts[e.target.dataset.acc || e.target.dataset.c]); }); }, { rootMargin: '-40% 0px -50% 0px' });
    document.querySelectorAll('[data-acc],.sf-c[data-c]').forEach(function (el) { sec.observe(el); });
  } else document.querySelectorAll('.rev').forEach(function (el) { el.classList.add('in'); });
  if (fine && !reduce) {
    var tilted = null;
    document.addEventListener('pointermove', function (e) {
      var t = e.target.closest && e.target.closest('.tilt');
      if (tilted && tilted !== t) { tilted.style.transform = ''; tilted = null; }
      if (!t || !t.classList.contains('in')) return;
      var b = t.getBoundingClientRect(), x = (e.clientX - b.left) / b.width - .5, y = (e.clientY - b.top) / b.height - .5;
      t.style.transform = 'perspective(800px) rotateX(' + (-y * 8).toFixed(2) + 'deg) rotateY(' + (x * 10).toFixed(2) + 'deg) translateZ(6px)';
      tilted = t;
    });
  }

  // ----- the journey ribbon -----
  var route = $('route');
  if (route) {
    var svg = $('routeSvg'), NS = 'http://www.w3.org/2000/svg', track = document.createElementNS(NS, 'path'), line = document.createElementNS(NS, 'path'), defs = document.createElementNS(NS, 'defs'), grad = document.createElementNS(NS, 'linearGradient');
    grad.id = 'rg'; grad.setAttribute('gradientUnits', 'userSpaceOnUse'); grad.setAttribute('x1', 0); grad.setAttribute('x2', 0); defs.appendChild(grad); svg.appendChild(defs);
    var keys = ['asia', 'europe', 'africa', 'north-america', 'south-america', 'oceania'];
    keys.forEach(function (k, i) { var s = document.createElementNS(NS, 'stop'); s.setAttribute('offset', (i / (keys.length - 1)).toFixed(3)); s.setAttribute('stop-color', GA.conts[k].a); grad.appendChild(s); });
    track.setAttribute('fill', 'none'); track.setAttribute('stroke', 'rgba(244,237,221,.10)'); track.setAttribute('stroke-width', 16); track.setAttribute('stroke-linecap', 'round');
    line.setAttribute('fill', 'none'); line.setAttribute('stroke', 'url(#rg)'); line.setAttribute('stroke-width', 16); line.setAttribute('stroke-linecap', 'round'); line.setAttribute('pathLength', 1); line.setAttribute('stroke-dasharray', '1 1');
    svg.appendChild(track); svg.appendChild(line);
    var layout = function () {
      var b = route.getBoundingClientRect(), pts = [{ x: b.width / 2, y: 0 }];
      route.querySelectorAll('.sf-i').forEach(function (i) { var r = i.getBoundingClientRect(); pts.push({ x: r.left - b.left + r.width / 2, y: r.top - b.top + r.height / 2 }); });
      pts.push({ x: b.width / 2, y: b.height });
      var d = 'M' + pts[0].x.toFixed(1) + ' ' + pts[0].y.toFixed(1);
      for (var i = 0; i < pts.length - 1; i++) { var p = pts[i], q = pts[i + 1], my = (p.y + q.y) / 2; d += 'C' + p.x.toFixed(1) + ' ' + my.toFixed(1) + ' ' + q.x.toFixed(1) + ' ' + my.toFixed(1) + ' ' + q.x.toFixed(1) + ' ' + q.y.toFixed(1); }
      track.setAttribute('d', d); line.setAttribute('d', d);
      svg.setAttribute('viewBox', '0 0 ' + b.width + ' ' + b.height);
      grad.setAttribute('y1', 0); grad.setAttribute('y2', b.height);
      paint();
    };
    var paint = function () { var b = route.getBoundingClientRect(), f = reduce ? 1 : Math.max(0, Math.min(1, (innerHeight * .7 - b.top) / b.height)); line.setAttribute('stroke-dashoffset', (1 - f).toFixed(4)); };
    addEventListener('resize', layout); addEventListener('scroll', paint, { passive: true }); addEventListener('load', layout); layout();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
  }

  // ----- today's recipe -----
  if ($('today')) {
    var r = byId[GA.order[Math.floor(Date.now() / 864e5) % GA.order.length]];
    $('today').href = 'r/' + r.id + '/';
    $('tImg').src = 'images/' + r.id + '/hero.webp'; $('tImg').alt = r.n;
    $('tName').textContent = r.n; $('tCountry').textContent = r.cn; $('tDesc').textContent = r.d; $('tMeta').textContent = meta(r);
  }

  // ----- fridge -----
  var have = new Set(store.get('ga:fridge', []));
  function saveFridge() { store.set('ga:fridge', Array.from(have)); }
  function score(r) { return r.f.filter(function (k) { return !have.has(k); }); }
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
    var hf = function () { $('hfN').textContent = have.size ? GA.recipes.filter(function (r) { return score(r).length <= 2 && r.f.some(function (k) { return have.has(k); }); }).length : 0; };
    bindTicks($('hfChips'), hf); hf();
  }
  if ($('fridge')) {
    var fr = $('fridge');
    var renderF = function () {
      var ready = [], almost = [];
      if (have.size) GA.recipes.forEach(function (r) {
        if (!r.f.some(function (k) { return have.has(k); })) return;
        var m = score(r);
        if (!m.length) ready.push(r); else if (m.length <= 2) almost.push({ r: r, m: m });
      });
      almost.sort(function (a, b) { return a.m.length - b.m.length; });
      $('fPick').hidden = have.size > 0; $('fRH').hidden = !ready.length; $('fAH').hidden = !almost.length;
      $('fRN').textContent = ready.length; $('fAN').textContent = almost.length;
      $('fR').innerHTML = ready.map(function (r) { return card(r); }).join('');
      $('fA').innerHTML = almost.map(function (x) { return card(x.r, '<span class="miss">Missing: ' + x.m.map(function (k) { return esc(GA.ing[k][1]); }).join(', ') + '</span>'); }).join('');
    };
    bindTicks(fr.querySelector('.fg-l'), renderF);
    $('fClear').addEventListener('click', function () { have.clear(); saveFridge(); syncTicks(fr); renderF(); });
    renderF();
  }

  // ----- browse and filters -----
  if ($('browse')) {
    var cards = {}, res = $('res'), text = {};
    GA.recipes.filter(function (r) { return !r.drink; }).forEach(function (r, i) { cards[r.id] = res.children[i]; text[r.id] = [r.n, r.cn, r.d, r.de, GA.conts[r.c].n].concat(r.f.map(function (k) { return GA.ing[k].join(' '); })).join(' ').toLowerCase(); });
    var apply = function () {
      var q = $('q').value.trim().toLowerCase(), c = $('fC').value, m = $('fM').value, qk = $('fQ').checked, ez = $('fE').checked, npg = $('fN').checked, n = 0;
      GA.recipes.filter(function (r) { return !r.drink; }).forEach(function (r) {
        var ok = (!q || text[r.id].indexOf(q) >= 0) && (!c || r.c === c) && (!m || r.m.indexOf(m) >= 0) && (!qk || r.t < 20) && (!ez || r.lv === 1) && (!npg || r.npg);
        cards[r.id].style.display = ok ? '' : 'none'; if (ok) { n++; cards[r.id].classList.add('in'); }
      });
      $('cnt').textContent = n; $('none').hidden = n > 0;
    };
    ['q', 'fC', 'fM', 'fQ', 'fE', 'fN'].forEach(function (id) { $(id).addEventListener(id === 'q' ? 'input' : 'change', apply); });
    var pre = new URLSearchParams(location.search);
    if (pre.get('q')) $('q').value = pre.get('q');
    if (pre.get('c')) $('fC').value = pre.get('c');
    if (pre.get('m')) $('fM').value = pre.get('m');
    if (pre.get('quick')) $('fQ').checked = true;
    if (location.search) apply();
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
    var paint2 = function () { var on = list.indexOf(id) >= 0; sv.textContent = on ? 'Saved' : 'Save'; sv.classList.toggle('pri', on); };
    sv.addEventListener('click', function () { var i = list.indexOf(id); if (i >= 0) list.splice(i, 1); else list.push(id); store.set('ga:saved', list); paint2(); });
    paint2();
    var hero = $('rHero');
    if (hero && !reduce) addEventListener('scroll', function () { hero.style.transform = 'translateY(' + Math.min(scrollY * .16, 100) + 'px)'; }, { passive: true });

    var R = window.GA_R, cm = $('cm'), i = 0, left = 0, iv = 0, lock = null;
    var clock = function () { var m = Math.floor(left / 60), s = left % 60; $('cmClock').textContent = m + ':' + (s < 10 ? '0' : '') + s; };
    var stop = function () { clearInterval(iv); iv = 0; $('cmStart').textContent = 'Start timer'; };
    var show = function () {
      stop();
      var st = R.steps[i], mins = st[1];
      $('cmI').textContent = 'Step ' + (i + 1) + ' of ' + R.steps.length;
      $('cmT').textContent = st[0];
      $('cmTimer').hidden = !mins;
      left = mins * 60; clock(); $('cmClock').classList.remove('up');
      $('cmP').style.visibility = i ? 'visible' : 'hidden';
      $('cmN').textContent = i === R.steps.length - 1 ? 'Finished' : 'Next';
    };
    var wake = function () { if (navigator.wakeLock) navigator.wakeLock.request('screen').then(function (l) { lock = l; }).catch(function () {}); };
    var closeCm = function () { stop(); cm.hidden = true; document.body.style.overflow = ''; if (lock) { lock.release().catch(function () {}); lock = null; } $('cookBtn').focus(); };
    $('cookBtn').addEventListener('click', function () { i = 0; cm.hidden = false; document.body.style.overflow = 'hidden'; show(); wake(); $('cmN').focus(); });
    $('cmX').addEventListener('click', closeCm);
    $('cmP').addEventListener('click', function () { if (i > 0) { i--; show(); } });
    $('cmN').addEventListener('click', function () { if (i < R.steps.length - 1) { i++; show(); } else closeCm(); });
    $('cmStart').addEventListener('click', function () {
      if (iv) { stop(); return; }
      $('cmStart').textContent = 'Stop timer';
      iv = setInterval(function () { left--; clock(); if (left <= 0) { stop(); $('cmClock').textContent = "Time's up"; $('cmClock').classList.add('up'); if (navigator.vibrate) navigator.vibrate([250, 120, 250]); } }, 1000);
    });
    document.addEventListener('keydown', function (e) { if (cm.hidden) return; if (e.key === 'Escape') closeCm(); if (e.key === 'ArrowRight') $('cmN').click(); if (e.key === 'ArrowLeft') $('cmP').click(); });
    document.addEventListener('visibilitychange', function () { if (!cm.hidden && document.visibilityState === 'visible') wake(); });
  }

  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register(ROOT + 'sw.js').catch(function () {});
})();
