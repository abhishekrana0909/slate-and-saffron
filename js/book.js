// Digital recipe book: opens from any "Recipes" / "Explore Recipes" link.
// Desktop: closed hardcover opens, pages turn in 3D. Phones and reduced-motion: simple fades and slides.
(function () {
  var GA = window.GA;
  if (!GA) return;
  var ROOT = document.documentElement.dataset.root || '';
  var LV = ['', 'Easy', 'Medium', 'Hard'], SP = ['Mild', 'Medium', 'Spicy'], PER = 4;
  var CH = [['global', 'Global Recipes'], ['indian', 'Indian Kitchen'], ['quick', 'Quick Meals'], ['drinks', 'Drinks'], ['saved', 'Saved Recipes']];
  var reduce = function () { return matchMedia('(prefers-reduced-motion: reduce)').matches; };
  var small = function () { return matchMedia('(max-width: 760px)').matches; };
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var byId = {}; GA.recipes.forEach(function (r) { byId[r.id] = r; });

  var S = { ch: 'global', cont: '', page: 0, detail: -1 }, el = {}, built = false, opener = null, busy = false;

  function list() {
    var rs = GA.recipes;
    if (S.ch === 'global') return rs.filter(function (r) { return !r.drink && (!S.cont || r.c === S.cont); });
    if (S.ch === 'indian') return rs.filter(function (r) { return r.reg && r.reg.length; });
    if (S.ch === 'quick') return rs.filter(function (r) { return !r.drink && r.t < 30; }).sort(function (a, b) { return a.t - b.t; });
    if (S.ch === 'drinks') return rs.filter(function (r) { return r.drink; });
    return store.get('ga:saved', []).map(function (id) { return byId[id]; }).filter(Boolean);
  }
  function count(ch) { var o = S.ch, c = S.cont; S.ch = ch; S.cont = ''; var n = list().length; S.ch = o; S.cont = c; return n; }
  function pages() { return Math.max(1, Math.ceil(list().length / PER)); }

  function leftHTML() {
    var chs = CH.map(function (c) { return '<li><button type="button" data-ch="' + c[0] + '"' + (S.ch === c[0] ? ' class="on" aria-current="true"' : '') + '>' + c[1] + '<span>' + count(c[0]) + '</span></button></li>'; }).join('');
    var conts = '';
    if (S.ch === 'global') {
      conts = '<p class="bk-k">Continent</p><div class="bk-chips"><button type="button" data-cont=""' + (!S.cont ? ' class="on"' : '') + '>All</button>' + Object.keys(GA.conts).map(function (k) { return '<button type="button" data-cont="' + k + '"' + (S.cont === k ? ' class="on"' : '') + '>' + esc(GA.conts[k]) + '</button>'; }).join('') + '</div>';
    }
    var n = list().length, pn = S.detail >= 0 ? 'Recipe ' + (S.detail + 1) + ' of ' + n : 'Page ' + (S.page + 1) + ' of ' + pages();
    return '<p class="bk-k">Contents</p><h3>The recipe book</h3><ol class="bk-ch">' + chs + '</ol>' + conts + '<p class="bk-pn">' + pn + '</p>';
  }
  function card(r, i) {
    return '<a class="bk-card" href="' + ROOT + 'r/' + r.id + '/" data-i="' + i + '"><img src="' + ROOT + 'images/' + r.id + '/card.webp" alt="" width="640" height="480" loading="lazy"><strong>' + esc(r.n) + '</strong><small>' + esc(r.cn) + ' · ' + r.t + ' min · ' + LV[r.lv] + (r.drink ? '' : ' · ' + SP[r.sp || 0]) + '</small></a>';
  }
  function rightHTML() {
    var l = list(), title = CH.filter(function (c) { return c[0] === S.ch; })[0][1];
    if (S.detail >= 0 && l[S.detail]) {
      var r = l[S.detail], saved = store.get('ga:saved', []).indexOf(r.id) >= 0;
      var ing = (r.f || []).slice(0, 7).map(function (k) { return GA.ing[k] ? '<li>' + esc(GA.ing[k][1]) + '</li>' : ''; }).join('');
      return '<p class="bk-k">' + esc(title) + '</p><div class="bk-det"><img src="' + ROOT + 'images/' + r.id + '/card.webp" alt="' + esc(r.n) + '" width="640" height="480"><h3>' + esc(r.n) + '</h3><p class="bk-meta">' + esc(r.cn) + ' · ' + r.t + ' min · ' + LV[r.lv] + (r.drink ? '' : ' · ' + SP[r.sp || 0]) + '</p><p>' + esc(r.d) + '</p>' + (ing ? '<ul class="bk-ing">' + ing + '</ul>' : '') + '<div class="bk-act"><a class="bk-btn go" href="' + ROOT + 'r/' + r.id + '/">Open full recipe</a><button type="button" class="bk-btn" data-save="' + r.id + '">' + (saved ? 'Saved ♥' : 'Save ♡') + '</button><button type="button" class="bk-btn" data-back>Back to list</button></div></div>';
    }
    var part = l.slice(S.page * PER, S.page * PER + PER);
    if (!part.length) return '<p class="bk-k">' + esc(title) + '</p><p class="bk-empty">' + (S.ch === 'saved' ? 'Nothing saved yet. Tap the heart on any recipe and it will wait here for you.' : 'No recipes here.') + '</p>';
    return '<p class="bk-k">' + esc(title) + '</p><div class="bk-grid">' + part.map(function (r, i) { return card(r, S.page * PER + i); }).join('') + '</div>';
  }
  function render(which) {
    if (which !== 'r') el.L.innerHTML = leftHTML();
    if (which !== 'l') el.R.innerHTML = rightHTML();
    var n = S.detail >= 0 ? list().length : pages(), at = S.detail >= 0 ? S.detail : S.page;
    el.prev.disabled = at <= 0; el.next.disabled = at >= n - 1;
  }

  // ---- page turning ----
  function turn(dir, mutate) {
    if (busy) return;
    var fancy = !small() && !reduce() && el.book.dataset.s === 'open';
    if (!fancy) {
      mutate(); render();
      if (!reduce()) { el.R.classList.remove('sl-n', 'sl-p'); void el.R.offsetWidth; el.R.classList.add(dir > 0 ? 'sl-n' : 'sl-p'); }
      return;
    }
    busy = true;
    var src = dir > 0 ? el.R : el.L, leaf = document.createElement('div');
    leaf.className = 'bk-leaf ' + (dir > 0 ? 'nx' : 'pv');
    leaf.innerHTML = '<div class="lf-f bk-pg ' + (dir > 0 ? 'bk-r' : 'bk-l') + '">' + src.innerHTML + '</div><div class="lf-b bk-pg"></div>';
    el.spread.appendChild(leaf);
    mutate();
    render(dir > 0 ? 'r' : 'l');
    void leaf.offsetWidth;
    leaf.classList.add('go');
    setTimeout(function () { render(dir > 0 ? 'l' : 'r'); }, 430);
    setTimeout(function () { leaf.remove(); busy = false; }, 900);
  }
  function go(dir) {
    var n = S.detail >= 0 ? list().length : pages(), at = S.detail >= 0 ? S.detail : S.page, to = at + dir;
    if (to < 0 || to >= n) return;
    turn(dir, function () { if (S.detail >= 0) S.detail = to; else S.page = to; });
  }

  // ---- build and open ----
  function build() {
    var d = document.createElement('div');
    d.className = 'bk'; d.id = 'bk'; d.hidden = true; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); d.setAttribute('aria-label', 'Slate and Saffron recipe book');
    d.innerHTML = '<div class="bk-bar"><button type="button" class="bk-skip" id="bkSkip">Skip intro</button><button type="button" class="bk-x" id="bkX">Close ✕</button></div>' +
      '<div class="bk-stage"><div class="bk-book" id="bkBook" data-s="closed"><div class="bk-cover" id="bkCover"><div class="bk-front"><span class="bk-orn"></span><strong>Slate &amp; Saffron</strong><em>Vegetarian Recipes Across Continents</em><span class="bk-orn"></span></div><div class="bk-inside"></div></div>' +
      '<div class="bk-spread" id="bkSpread"><section class="bk-pg bk-l" id="bkL" aria-label="Contents"></section><section class="bk-pg bk-r" id="bkR" aria-live="polite"></section></div></div>' +
      '<button type="button" class="bk-nav bk-prev" id="bkPrev" aria-label="Previous page">‹</button><button type="button" class="bk-nav bk-next" id="bkNext" aria-label="Next page">›</button></div>';
    document.body.appendChild(d);
    el.root = d; el.book = d.querySelector('#bkBook'); el.cover = d.querySelector('#bkCover'); el.spread = d.querySelector('#bkSpread');
    el.L = d.querySelector('#bkL'); el.R = d.querySelector('#bkR'); el.prev = d.querySelector('#bkPrev'); el.next = d.querySelector('#bkNext');
    el.skip = d.querySelector('#bkSkip'); el.x = d.querySelector('#bkX');

    el.x.addEventListener('click', close);
    el.skip.addEventListener('click', function () { reveal(true); });
    el.cover.addEventListener('click', function () { reveal(false); });
    el.prev.addEventListener('click', function () { go(-1); });
    el.next.addEventListener('click', function () { go(1); });
    d.addEventListener('click', function (e) {
      var t = e.target, b;
      if ((b = t.closest('[data-ch]'))) { var ch = b.dataset.ch; if (ch !== S.ch) turn(1, function () { S.ch = ch; S.cont = ''; S.page = 0; S.detail = -1; }); return; }
      if ((b = t.closest('[data-cont]'))) { var c = b.dataset.cont; turn(1, function () { S.cont = c; S.page = 0; S.detail = -1; }); return; }
      if ((b = t.closest('.bk-card'))) { e.preventDefault(); var i = +b.dataset.i; turn(1, function () { S.detail = i; }); return; }
      if ((b = t.closest('[data-back]'))) { turn(-1, function () { S.page = Math.floor(S.detail / PER); S.detail = -1; }); return; }
      if ((b = t.closest('[data-save]'))) {
        var id = b.dataset.save, sv = store.get('ga:saved', []), k = sv.indexOf(id);
        if (k >= 0) sv.splice(k, 1); else sv.push(id);
        store.set('ga:saved', sv); b.textContent = k >= 0 ? 'Save ♡' : 'Saved ♥'; el.L.innerHTML = leftHTML(); return;
      }
    });
    // swipe or drag to turn
    var x0 = null;
    el.spread.addEventListener('pointerdown', function (e) { if (e.target.closest('a,button')) return; x0 = e.clientX; });
    window.addEventListener('pointerup', function (e) { if (x0 === null) return; var dx = e.clientX - x0; x0 = null; if (Math.abs(dx) > 60) go(dx < 0 ? 1 : -1); });
    document.addEventListener('keydown', function (e) {
      if (d.hidden) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'Tab') {
        var f = [].slice.call(d.querySelectorAll('button:not([disabled]),a[href]')).filter(function (n) { return n.offsetParent !== null; });
        if (!f.length) return;
        if (!d.contains(document.activeElement)) { f[0].focus(); e.preventDefault(); }
        else if (e.shiftKey && document.activeElement === f[0]) { f[f.length - 1].focus(); e.preventDefault(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { f[0].focus(); e.preventDefault(); }
      }
    });
    built = true;
  }
  var timer = 0;
  function reveal(instant) {
    clearTimeout(timer);
    if (el.book.dataset.s === 'open') return;
    var quick = instant || reduce();
    el.book.classList.toggle('quick', quick);
    el.book.dataset.s = 'open';
    var done = function () { el.book.classList.add('done'); el.skip.hidden = true; el.next.focus({ preventScroll: true }); };
    if (quick) done(); else timer = setTimeout(done, 1050);
  }
  function open(from) {
    if (!built) build();
    opener = from || document.activeElement;
    S = { ch: S.ch || 'global', cont: S.cont || '', page: 0, detail: -1 };
    render();
    el.book.dataset.s = 'closed'; el.book.classList.remove('done', 'quick'); el.skip.hidden = false;
    el.root.hidden = false; document.body.style.overflow = 'hidden';
    requestAnimationFrame(function () { el.root.classList.add('on'); });
    el.skip.focus({ preventScroll: true });
    if (reduce()) reveal(true); else timer = setTimeout(function () { reveal(false); }, small() ? 650 : 900);
  }
  function close() {
    clearTimeout(timer); el.root.classList.remove('on');
    setTimeout(function () { el.root.hidden = true; document.body.style.overflow = ''; if (opener && opener.focus) opener.focus(); }, reduce() ? 0 : 350);
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[data-book]') : null;
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    e.preventDefault(); open(a);
  });
})();

// The Menu: an open book on the home page. Scrolling turns the pages (desktop); buttons, arrow keys and swipes do too.
(function () {
  var sec = document.getElementById('menuBook');
  if (!sec) return;
  var mb = document.getElementById('mb'), L = document.getElementById('mbL'), R = document.getElementById('mbR'), pos = document.getElementById('mbPos');
  var spreadEl = mb.querySelector('.mb-spread');
  var src = [].slice.call(mb.querySelectorAll('.mb-src > div')).map(function (d) { return d.innerHTML; });
  var spreads = src.length / 2, cur = 0, mp = 0, busy = false, raf = 0, last = src.length - 1;
  var small = function () { return matchMedia('(max-width: 760px)').matches; };
  var reduce = function () { return matchMedia('(prefers-reduced-motion: reduce)').matches; };
  sec.style.setProperty('--sp', spreads);

  function total() { return Math.max(1, sec.offsetHeight - innerHeight); }
  function target() { var r = sec.getBoundingClientRect(), p = Math.min(1, Math.max(0, -r.top / total())); return Math.round(p * (spreads - 1)); }
  function setSpread(i) {
    L.innerHTML = src[i * 2]; R.innerHTML = src[i * 2 + 1];
    R.classList.toggle('end', i * 2 + 1 === last); L.classList.remove('end');
    pos.textContent = (i + 1) + ' / ' + spreads; cur = i;
  }
  function setSingle(p, dir) {
    L.innerHTML = ''; R.innerHTML = src[p]; R.classList.toggle('end', p === last); mp = p;
    pos.textContent = (p + 1) + ' / ' + src.length;
    if (dir && !reduce()) { R.classList.remove('sl-n', 'sl-p'); void R.offsetWidth; R.classList.add(dir > 0 ? 'sl-n' : 'sl-p'); }
  }
  function flip(dir) {
    busy = true;
    var nxt = cur + dir, leaf = document.createElement('div');
    leaf.className = 'mb-leaf ' + (dir > 0 ? 'nx' : 'pv');
    var frontEnd = dir > 0 && cur * 2 + 1 === last, backEnd = dir < 0 && nxt * 2 + 1 === last;
    leaf.innerHTML = '<div class="lf-f mb-pg ' + (dir > 0 ? 'mb-r' : 'mb-l') + (frontEnd ? ' end' : '') + '">' + (dir > 0 ? R.innerHTML : L.innerHTML) + '</div><div class="lf-b mb-pg ' + (dir > 0 ? 'mb-l' : 'mb-r') + (backEnd ? ' end' : '') + '">' + (dir > 0 ? src[nxt * 2] : src[nxt * 2 + 1]) + '</div>';
    spreadEl.appendChild(leaf);
    if (dir > 0) { R.innerHTML = src[nxt * 2 + 1]; R.classList.toggle('end', nxt * 2 + 1 === last); } else { L.innerHTML = src[nxt * 2]; }
    void leaf.offsetWidth; leaf.classList.add('go');
    setTimeout(function () { if (dir > 0) L.innerHTML = src[nxt * 2]; else { R.innerHTML = src[nxt * 2 + 1]; R.classList.toggle('end', nxt * 2 + 1 === last); } }, 450);
    setTimeout(function () { leaf.remove(); cur = nxt; pos.textContent = (cur + 1) + ' / ' + spreads; busy = false; check(); }, 920);
  }
  function check() {
    if (small() || busy) return;
    var t = target();
    if (t === cur) return;
    if (reduce()) setSpread(t); else flip(t > cur ? 1 : -1);
  }
  function onScroll() { if (raf) return; raf = requestAnimationFrame(function () { raf = 0; check(); }); }
  function go(dir) {
    if (small()) { var p = mp + dir; if (p >= 0 && p < src.length) setSingle(p, dir); return; }
    var i = Math.min(spreads - 1, Math.max(0, (busy ? cur : target()) + dir));
    var y = sec.offsetTop + (i / (spreads - 1)) * total();
    window.scrollTo({ top: y + (i === 0 ? 0 : 2), behavior: reduce() ? 'auto' : 'smooth' });
  }
  function init() { if (small()) setSingle(0); else setSpread(Math.min(spreads - 1, target())); }
  document.getElementById('mbPrev').addEventListener('click', function () { go(-1); });
  document.getElementById('mbNext').addEventListener('click', function () { go(1); });
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { var s = small(); if (s !== (L.innerHTML === '')) init(); });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    var bk = document.getElementById('bk'); if (bk && !bk.hidden) return;
    if (/input|select|textarea/i.test((document.activeElement || {}).tagName || '')) return;
    var r = sec.getBoundingClientRect(); if (r.top > innerHeight * .5 || r.bottom < innerHeight * .5) return;
    go(e.key === 'ArrowRight' ? 1 : -1);
  });
  var x0 = null;
  mb.addEventListener('pointerdown', function (e) { if (e.target.closest('a,button')) return; x0 = e.clientX; });
  window.addEventListener('pointerup', function (e) { if (x0 === null) return; var dx = e.clientX - x0; x0 = null; if (Math.abs(dx) > 60) go(dx < 0 ? 1 : -1); });
  init();
})();
