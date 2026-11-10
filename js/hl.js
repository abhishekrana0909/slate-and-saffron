// Hover lists: pointing at a name swaps the big background picture and lights that name up.
// On touch screens the picture changes by itself every few seconds while the section is on screen.
(function () {
  var secs = [].slice.call(document.querySelectorAll('.hl'));
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
