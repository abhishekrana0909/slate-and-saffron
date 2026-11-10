// Fridge finder, recipe filters, ratings, saved recipes and cooking mode.
(function () {
  var ROOT = document.documentElement.dataset.root || '', GA = window.GA;
  var $ = function (s) { return document.getElementById(s); };
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  var byId = {}, LV = ['', 'Easy', 'Medium', 'Hard'];
  GA.recipes.forEach(function (r) { byId[r.id] = r; });
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  function plate(r, extra) {
    return '<a class="plate" href="' + ROOT + 'r/' + r.id + '/"><span class="p-i"><img src="' + ROOT + 'images/' + r.id + '/card.webp" alt="' + esc(r.n) + '" width="640" height="480" loading="lazy"></span><strong>' + esc(r.n) + '</strong><small>' + esc(r.cn) + ' · ' + r.t + ' min · ' + LV[r.lv] + (r.sh ? ' · Vegetarian version' : '') + '</small>' + (extra || '') + '</a>';
  }

  // ----- ratings (kept on this device) -----
  var rates = store.get('ga:rate', {});
  function starText(n) { var s = ''; for (var i = 1; i <= 5; i++) s += i <= n ? '★' : '☆'; return s; }
  function paintStars() {
    document.querySelectorAll('.stars').forEach(function (el) {
      var n = rates[el.dataset.id] || 0;
      el.textContent = starText(n); el.title = n ? 'Your rating: ' + n + ' of 5' : 'Not rated yet. Open the recipe to rate it.';
      el.classList.toggle('has', !!n);
    });
  }
  paintStars();
  var rateBox = $('rate');
  if (rateBox) {
    var rid = rateBox.dataset.id, btns = rateBox.querySelectorAll('button');
    var paintRate = function () { var n = rates[rid] || 0; btns.forEach(function (b) { b.textContent = +b.dataset.n <= n ? '★' : '☆'; b.classList.toggle('on', +b.dataset.n <= n); }); };
    btns.forEach(function (b) { b.addEventListener('click', function () { var n = +b.dataset.n; rates[rid] = rates[rid] === n ? 0 : n; store.set('ga:rate', rates); paintRate(); }); });
    paintRate();
  }

  // ----- reveal on scroll -----
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -6% 0px' });
    document.querySelectorAll('.rc, .xc, .regc, .pc, .feat-c').forEach(function (el) { el.classList.add('rv'); io.observe(el); });
  }

  // ----- menu button on small screens -----
  var burger = $('burger');
  if (burger) {
    var topbar = burger.closest('.top');
    burger.addEventListener('click', function () { var o = topbar.classList.toggle('open'); burger.setAttribute('aria-expanded', o ? 'true' : 'false'); burger.setAttribute('aria-label', o ? 'Close menu' : 'Open menu'); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && topbar.classList.contains('open')) { burger.click(); burger.focus(); } });
  }

  // ----- save hearts on cards -----
  var savedList = store.get('ga:saved', []);
  var paintHearts = function () { document.querySelectorAll('.rc-sv').forEach(function (b) { var on = savedList.indexOf(b.dataset.id) >= 0; b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.textContent = on ? '♥' : '♡'; }); };
  document.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('.rc-sv') : null; if (!b) return;
    var i = savedList.indexOf(b.dataset.id); if (i >= 0) savedList.splice(i, 1); else savedList.push(b.dataset.id);
    store.set('ga:saved', savedList); paintHearts();
  });
  paintHearts();

  // ----- newsletter (no mail service is connected yet, so the address stays on this device) -----
  var news = $('news');
  if (news) news.addEventListener('submit', function (e) {
    e.preventDefault();
    var em = $('nEmail').value.trim(), m = $('newsM');
    if (!/^[^@s]+@[^@s]+.[^@s]+$/.test(em)) { m.textContent = 'Please enter a valid email address.'; return; }
    store.set('ga:news', em); m.textContent = 'Thank you. Your seat is noted. Sunday emails begin once the newsletter is switched on.'; $('nEmail').value = '';
  });

  // ----- filters on listing pages -----
  var bar = document.querySelector('.fbar');
  if (bar) {
    var grid = $(bar.dataset.grid), cards = [].slice.call(grid.querySelectorAll('.rc'));
    var st = { q: '', f: {}, reg: '', c: '', m: '', mo: '', se: '' };
    var chips = bar.querySelectorAll('.chip[data-f]'), regs = bar.querySelectorAll('.chip[data-reg]');
    var apply = function () {
      var n = 0, q = st.q.trim().toLowerCase();
      cards.forEach(function (el) {
        var d = el.dataset;
        var ok = (!q || d.n.indexOf(q) >= 0) && (!st.f.vg || d.vg === '1') && (!st.f.gf || d.gf === '1') && (!st.f.quick || +d.t < 30) &&
          (!st.reg || d.reg.split('|').indexOf(st.reg) >= 0) && (!st.c || d.c === st.c) && (!st.m || d.m.indexOf(st.m) >= 0) &&
          (!st.mo || (d.mo || '').split(' ').indexOf(st.mo) >= 0) && (!st.se || (d.se || '').split(' ').indexOf(st.se) >= 0);
        el.style.display = ok ? '' : 'none'; if (ok) n++;
      });
      $('cnt').textContent = n; var none = $('none'); if (none) none.hidden = n > 0;
      chips.forEach(function (b) { var k = b.dataset.f; b.classList.toggle('on', k === 'all' ? !st.f.vg && !st.f.gf && !st.f.quick : !!st.f[k]); });
      regs.forEach(function (b) { b.classList.toggle('on', b.dataset.reg === st.reg); });
    };
    chips.forEach(function (b) { b.addEventListener('click', function () { var k = b.dataset.f; if (k === 'all') { st.f = {}; st.reg = ''; } else st.f[k] = !st.f[k]; apply(); }); });
    regs.forEach(function (b) { b.addEventListener('click', function () { st.reg = st.reg === b.dataset.reg ? '' : b.dataset.reg; apply(); }); });
    $('q').addEventListener('input', function (e) { st.q = e.target.value; apply(); });
    if ($('fC')) $('fC').addEventListener('change', function (e) { st.c = e.target.value; apply(); });
    if ($('fM')) $('fM').addEventListener('change', function (e) { st.m = e.target.value; apply(); });
    var pre = new URLSearchParams(location.search);
    if (pre.get('q')) { st.q = pre.get('q'); $('q').value = st.q; }
    if (pre.get('r')) st.reg = pre.get('r');
    if (pre.get('c') && $('fC')) { st.c = pre.get('c'); $('fC').value = st.c; }
    if (pre.get('m') && $('fM')) { st.m = pre.get('m'); $('fM').value = st.m; }
    if (pre.get('quick')) st.f.quick = true;
    var NAMES = { quick: 'Quick in 20 Minutes', comfort: 'Comfort Food', spicy: 'Spicy & Bold', healthy: 'Healthy & Light', festive: 'Festive Favourites', onepot: 'One-Pot Meals', summer: 'Summer Coolers', monsoon: 'Monsoon Snacks', diwali: 'Diwali Specials', winter: 'Winter Comfort Food' };
    var tg = pre.get('mood') || pre.get('season');
    if (tg && NAMES[tg]) {
      if (pre.get('mood')) st.mo = tg; else st.se = tg;
      var note = document.createElement('p'); note.className = 'tagnote'; note.innerHTML = 'Showing: <b>' + NAMES[tg] + '</b> · <a href="?">Show all recipes</a>'; bar.parentNode.insertBefore(note, bar);
    }
    apply();
  }

  // ----- fridge -----
  if ($('fridge')) {
    var have = new Set(store.get('ga:fridge', [])), fr = $('fridge'), left = fr.querySelector('.fg-l');
    var score = function (r) { return r.f.filter(function (k) { return !have.has(k); }); };
    var sync = function () { left.querySelectorAll('.tick').forEach(function (b) { b.setAttribute('aria-pressed', have.has(b.dataset.k) ? 'true' : 'false'); }); };
    var render = function () {
      var ready = [], almost = [];
      if (have.size) GA.recipes.forEach(function (r) {
        if (!r.f.some(function (k) { return have.has(k); })) return;
        var m = score(r);
        if (!m.length) ready.push(r); else if (m.length <= 2) almost.push({ r: r, m: m });
      });
      almost.sort(function (a, b) { return a.m.length - b.m.length; });
      $('fPick').hidden = have.size > 0; $('fRH').hidden = !ready.length; $('fAH').hidden = !almost.length;
      $('fRN').textContent = ready.length; $('fAN').textContent = almost.length;
      $('fR').innerHTML = ready.map(function (r) { return plate(r); }).join('');
      $('fA').innerHTML = almost.map(function (x) { return plate(x.r, '<span class="miss">Missing: ' + x.m.map(function (k) { return esc(GA.ing[k][1]); }).join(', ') + '</span>'); }).join('');
    };
    left.addEventListener('click', function (e) {
      var b = e.target.closest('.tick'); if (!b) return;
      if (have.has(b.dataset.k)) have.delete(b.dataset.k); else have.add(b.dataset.k);
      store.set('ga:fridge', Array.from(have)); sync(); render();
    });
    $('fClear').addEventListener('click', function () { have.clear(); store.set('ga:fridge', []); sync(); render(); });
    var addq = new URLSearchParams(location.search).get('add');
    if (addq) { addq.split(',').forEach(function (k) { if (GA.ing[k]) have.add(k); }); store.set('ga:fridge', Array.from(have)); }
    sync(); render();
  }

  // ----- saved -----
  if ($('savedG')) {
    var ids = store.get('ga:saved', []).filter(function (id) { return byId[id]; });
    $('savedG').innerHTML = ids.map(function (id) { return plate(byId[id]); }).join('');
    $('savedN').hidden = ids.length > 0;
  }

  // ----- recipe page -----
  var doc = document.querySelector('.doc[data-id]');
  if (doc) {
    var id = doc.dataset.id, base = 4, serv = 4;
    var fmt = function (q, u) {
      if (u === 'g' || u === 'ml') return String(Math.round(q / 5) * 5 || Math.round(q));
      var v = Math.round(q * 4) / 4, w = Math.floor(v), f = { .25: '¼', .5: '½', .75: '¾' }[v - w] || '';
      return ((w || '') + f) || '¼';
    };
    var draw = function () {
      $('sN').textContent = serv;
      doc.querySelectorAll('.q').forEach(function (b) { if (b.dataset.u !== 't') b.textContent = fmt(parseFloat(b.dataset.q) * serv / base, b.dataset.u); });
    };
    var pre2 = doc.querySelectorAll('.serv-p button');
    var drawP = function () { pre2.forEach(function (b) { b.classList.toggle('on', +b.dataset.s === serv); }); };
    pre2.forEach(function (b) { b.addEventListener('click', function () { serv = +b.dataset.s; draw(); drawP(); }); });
    var cooked = store.get('ga:cooked', []), ck = $('cookedBtn');
    var paintCk = function () { var on = cooked.indexOf(id) >= 0; ck.textContent = on ? 'Cooked ✓' : 'Cooked it'; ck.classList.toggle('gold', on); };
    ck.addEventListener('click', function () { var i = cooked.indexOf(id); if (i >= 0) cooked.splice(i, 1); else cooked.push(id); store.set('ga:cooked', cooked); paintCk(); });
    paintCk(); drawP();
    $('sMinus').addEventListener('click', function () { if (serv > 1) { serv--; draw(); drawP(); } });
    $('sPlus').addEventListener('click', function () { if (serv < 12) { serv++; draw(); drawP(); } });
    var sv = $('saveBtn'), list = store.get('ga:saved', []);
    var paint = function () { var on = list.indexOf(id) >= 0; sv.textContent = on ? 'Saved' : 'Save'; sv.classList.toggle('gold', on); };
    sv.addEventListener('click', function () { var i = list.indexOf(id); if (i >= 0) list.splice(i, 1); else list.push(id); store.set('ga:saved', list); paint(); });
    paint();

    var R = window.GA_R, cm = $('cm'), i = 0, left2 = 0, iv = 0, lock = null;
    var clock = function () { var m = Math.floor(left2 / 60), s = left2 % 60; $('cmClock').textContent = m + ':' + (s < 10 ? '0' : '') + s; };
    var stop = function () { clearInterval(iv); iv = 0; $('cmStart').textContent = 'Start timer'; };
    var show = function () {
      stop();
      var s = R.steps[i], mins = s[1];
      $('cmI').textContent = 'Step ' + (i + 1) + ' of ' + R.steps.length;
      $('cmT').textContent = s[0];
      $('cmTimer').hidden = !mins;
      left2 = mins * 60; clock(); $('cmClock').classList.remove('up');
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
      iv = setInterval(function () { left2--; clock(); if (left2 <= 0) { stop(); $('cmClock').textContent = "Time's up"; $('cmClock').classList.add('up'); if (navigator.vibrate) navigator.vibrate([250, 120, 250]); } }, 1000);
    });
    document.addEventListener('keydown', function (e) { if (cm.hidden) return; if (e.key === 'Escape') closeCm(); if (e.key === 'ArrowRight') $('cmN').click(); if (e.key === 'ArrowLeft') $('cmP').click(); });
    document.addEventListener('visibilitychange', function () { if (!cm.hidden && document.visibilityState === 'visible') wake(); });
  }

  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register(ROOT + 'sw.js').catch(function () {});
})();
