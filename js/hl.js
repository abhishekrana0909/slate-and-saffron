// Hover lists: pointing at a name swaps the big background picture and lights that name up.
// On touch screens the picture changes by itself every few seconds while the section is on screen.
(function () {
  var secs = [].slice.call(document.querySelectorAll('.hl:not(.hl-m)'));
  if (!secs.length) return;
  var coarse = matchMedia('(pointer: coarse)').matches;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  secs.forEach(function (sec) {
    var imgs = [].slice.call(sec.querySelectorAll('.hl-bg img'));
    var items = [].slice.call(sec.querySelectorAll('.hl-list li'));
    var list = sec.querySelector('.hl-list');
    var cur = 0, timer = 0;

    function show(i, light) {
      cur = i;
      imgs.forEach(function (im, k) { im.classList.toggle('on', k === i); });
      bgs.forEach(function (im, k) { im.classList.toggle('on', k === i); });
      items.forEach(function (li, k) { li.classList.toggle('act', light && k === i); });
      sec.classList.toggle('has-act', !!light);
      sec.style.setProperty('--g', items[i].dataset.g || '#D98A18');
    }
    items.forEach(function (li, k) {
      var a = li.querySelector('a');
      a.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse' || !e.pointerType) show(k, true); });
      a.addEventListener('focus', function () { show(k, true); });
    });
    list.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse' || !e.pointerType) show(cur, false); });
    list.addEventListener('focusout', function (e) { if (!list.contains(e.relatedTarget)) show(cur, false); });
    show(0, false);

    if (coarse && !reduce && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) { if (!timer) timer = setInterval(function () { show((cur + 1) % items.length, true); }, 4200); }
        else { clearInterval(timer); timer = 0; }
      }, { threshold: .35 }).observe(sec);
    }
  });
})();

// ---- Tall photo panels (continents): the panel you point at opens. On touch screens the first tap opens a panel, the second tap follows the link. ----
(function () {
  var coarse = matchMedia('(pointer: coarse)').matches;
  [].slice.call(document.querySelectorAll('.acc')).forEach(function (sec) {
    var ps = [].slice.call(sec.querySelectorAll('.acc-p'));
    function open(p) { ps.forEach(function (q) { q.classList.toggle('on', q === p); }); }
    ps.forEach(function (p) {
      p.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse' || !e.pointerType) open(p); });
      p.addEventListener('focus', function () { open(p); });
      p.addEventListener('click', function (e) { if (coarse && !p.classList.contains('on')) { e.preventDefault(); open(p); } });
    });
  });
})();

// ---- The thali (Indian regions): a round plate in the middle, names around it ----
(function () {
  var coarse = matchMedia('(pointer: coarse)').matches;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var small = function () { return matchMedia('(max-width: 760px)').matches; };
  [].slice.call(document.querySelectorAll('.th')).forEach(function (sec) {
    var stage = sec.querySelector('.th-stage');
    var imgs = [].slice.call(sec.querySelectorAll('.th-plate img'));
    var bgs = [].slice.call(sec.querySelectorAll('.th-bgs img'));
    var lis = [].slice.call(sec.querySelectorAll('.th-ring li'));
    var n = lis.length, cur = 0, timer = 0, spokes = [];
    lis.forEach(function () { var sp = document.createElement('i'); sp.className = 'th-spoke'; stage.appendChild(sp); spokes.push(sp); });

    function layout() {
      if (small()) {
        lis.forEach(function (li) { li.style.left = ''; li.style.top = ''; li.classList.remove('r', 'l', 't', 'b'); });
        return;
      }
      var S = stage.clientWidth, c = S / 2, R = S * .385, pr = S * .24 + 14;
      lis.forEach(function (li, i) {
        var a = (-90 + i * 360 / n) * Math.PI / 180, cs = Math.cos(a), sn = Math.sin(a);
        li.style.left = (c + R * cs).toFixed(1) + 'px'; li.style.top = (c + R * sn).toFixed(1) + 'px';
        li.classList.remove('r', 'l', 't', 'b');
        li.classList.add(cs > .3 ? 'r' : cs < -.3 ? 'l' : (sn < 0 ? 't' : 'b'));
        var sp = spokes[i];
        sp.style.width = Math.max(10, R - pr - 14) + 'px';
        sp.style.setProperty('--tr', 'rotate(' + (a * 180 / Math.PI).toFixed(2) + 'deg) translateX(' + pr.toFixed(1) + 'px)');
      });
    }
    function show(i, light) {
      cur = i;
      imgs.forEach(function (im, k) { im.classList.toggle('on', k === i); });
      bgs.forEach(function (im, k) { im.classList.toggle('on', k === i); });
      lis.forEach(function (li, k) { li.classList.toggle('act', light && k === i); });
      spokes.forEach(function (sp, k) { sp.classList.toggle('on', light && k === i); });
      sec.classList.toggle('has-act', !!light);
      sec.style.setProperty('--g', lis[i].dataset.g || '#D98A18');
    }
    lis.forEach(function (li, k) {
      var a = li.querySelector('a');
      a.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse' || !e.pointerType) show(k, true); });
      a.addEventListener('focus', function () { show(k, true); });
    });
    sec.querySelector('.th-ring').addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse' || !e.pointerType) show(cur, false); });
    var pw = sec.querySelector('.th-panel'), rps = pw ? [].slice.call(pw.querySelectorAll('.th-rp')) : [];
    function openRegion(k) {
      if (!pw) return;
      pw.hidden = false;
      rps.forEach(function (p, i) { p.hidden = i !== k; });
      lis.forEach(function (l, i) { l.classList.toggle('sel', i === k); });
      show(k, true);
      pw.scrollIntoView({ behavior: reduce() ? 'auto' : 'smooth', block: 'start' });
    }
    function closeRegion() { if (pw) { pw.hidden = true; lis.forEach(function (l) { l.classList.remove('sel'); }); show(cur, false); stage.scrollIntoView({ behavior: 'smooth', block: 'center' }); } }
    function reduce() { return matchMedia('(prefers-reduced-motion: reduce)').matches; }
    lis.forEach(function (li, k) { li.querySelector('a').addEventListener('click', function (e) { if (pw) { e.preventDefault(); openRegion(k); } }); });
    rps.forEach(function (p) { var x = p.querySelector('.th-x'); if (x) x.addEventListener('click', closeRegion); });
    layout(); show(0, false);
    var rt = 0;
    window.addEventListener('resize', function () { cancelAnimationFrame(rt); rt = requestAnimationFrame(layout); });

    if (coarse && !reduce && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) { if (!timer) timer = setInterval(function () { show((cur + 1) % n, true); }, 4200); }
        else { clearInterval(timer); timer = 0; }
      }, { threshold: .35 }).observe(sec);
    }
  });
})();

// ---- Pick by mood: choose a chip, the matching recipes appear ----
(function () {
  var wrap = document.querySelector('.mp');
  if (!wrap) return;
  var chips = [].slice.call(wrap.querySelectorAll('.mp-chip'));
  var panels = [].slice.call(wrap.querySelectorAll('.mp-panel'));
  function pick(i) {
    chips.forEach(function (c, k) { c.classList.toggle('on', k === i); c.setAttribute('aria-selected', k === i ? 'true' : 'false'); c.tabIndex = k === i ? 0 : -1; });
    panels.forEach(function (p, k) { p.classList.toggle('on', k === i); p.hidden = k !== i; });
  }
  chips.forEach(function (c, i) {
    c.addEventListener('click', function () { pick(i); });
    c.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      var n = (i + (e.key === 'ArrowRight' ? 1 : -1) + chips.length) % chips.length;
      pick(n); chips[n].focus(); e.preventDefault(); e.stopPropagation();
    });
  });
  pick(0);
})();

(function () {
  var pj = document.getElementById('punjabi');
  if (pj) {
    var o = pj.querySelector('.pj-open'), p = pj.querySelector('.pj-panel'), x = pj.querySelector('.pj-x');
    if (o && p) {
      o.addEventListener('click', function () { p.hidden = false; o.setAttribute('aria-expanded', 'true'); o.hidden = true; p.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
      x.addEventListener('click', function () { p.hidden = true; o.hidden = false; o.setAttribute('aria-expanded', 'false'); pj.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
    }
  }
  var ch = document.getElementById('chutney');
  if (ch) {
    var bs = [].slice.call(ch.querySelectorAll('.ch-f button')), cs = [].slice.call(ch.querySelectorAll('.ch-c'));
    bs.forEach(function (b) { b.addEventListener('click', function () { bs.forEach(function (z) { z.classList.toggle('on', z === b); }); cs.forEach(function (c) { c.hidden = !!b.dataset.r && c.dataset.r !== b.dataset.r; }); }); });
  }
})();

// ---- Moods: point at a mood and its picture fades in with a glow. On touch screens it changes by itself while on screen. ----
(function () {
  var sec = document.querySelector('.hl-m'); if (!sec) return;
  var imgs = [].slice.call(sec.querySelectorAll('.hl-bg img')), items = [].slice.call(sec.querySelectorAll('.hl-list li')), list = sec.querySelector('.hl-list');
  var cur = 0, timer = 0, coarse = matchMedia('(pointer: coarse)').matches, reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function show(i, light) {
    cur = i;
    imgs.forEach(function (im, k) { im.classList.toggle('on', k === i); });
    items.forEach(function (li, k) { li.classList.toggle('act', light && k === i); });
    sec.classList.toggle('has-act', !!light);
    sec.style.setProperty('--g', items[i].dataset.g || '#D98A18');
  }
  items.forEach(function (li, k) {
    var a = li.querySelector('a');
    a.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse' || !e.pointerType) show(k, true); });
    a.addEventListener('focus', function () { show(k, true); });
  });
  list.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse' || !e.pointerType) show(cur, false); });
  list.addEventListener('focusout', function (e) { if (!list.contains(e.relatedTarget)) show(cur, false); });
  show(0, false);
  if (coarse && !reduce && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { if (!timer) timer = setInterval(function () { show((cur + 1) % items.length, true); }, 3600); }
      else { clearInterval(timer); timer = 0; }
    }, { threshold: .35 }).observe(sec);
  }
})();

// ---- Back-to-top arrow, bottom left ----
(function () {
  var b = document.getElementById('up'); if (!b) return;
  function f() { b.classList.toggle('on', (window.scrollY || document.documentElement.scrollTop) > 500); }
  window.addEventListener('scroll', f, { passive: true }); f();
  b.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); });
})();

// ---- Recipe steps: the gold line fills as you read down ----
(function () {
  var ol = document.querySelector('.met ol'); if (!ol) return;
  function f() { var r = ol.getBoundingClientRect(), h = window.innerHeight; var p = (h * .6 - r.top) / Math.max(1, r.height); ol.style.setProperty('--p', Math.max(0, Math.min(1, p)).toFixed(3)); }
  window.addEventListener('scroll', f, { passive: true }); window.addEventListener('resize', f); f();
})();

// ---- Mocktail bar: filter by drink type ----
(function () {
  var f = document.querySelector('.dr-f'); if (!f) return;
  var chips = [].slice.call(f.querySelectorAll('.chip')), cards = [].slice.call(document.querySelectorAll('.dr .rc')), secs = [].slice.call(document.querySelectorAll('.dr .rcs')), none = document.getElementById('drNone');
  chips.forEach(function (c) {
    c.addEventListener('click', function () {
      chips.forEach(function (z) { z.classList.toggle('on', z === c); });
      var k = c.dataset.dt, shown = 0;
      cards.forEach(function (d) { var ok = !k || (d.dataset.dt || '').split(' ').indexOf(k) >= 0; d.hidden = !ok; if (ok) shown++; });
      secs.forEach(function (sc) { sc.hidden = ![].some.call(sc.querySelectorAll('.rc'), function (d) { return !d.hidden; }); });
      if (none) none.hidden = shown > 0;
    });
  });
})();
