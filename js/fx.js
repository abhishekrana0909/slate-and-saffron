// Scroll motion: words fly in and gather, numbers count up from 0, blocks glide in, photos drift (parallax), cards tilt.
(function () {
  var root = document.documentElement;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse = matchMedia('(pointer: coarse)').matches;
  if (reduce) { root.classList.add('fx-off'); return; }
  root.classList.add('fx-on');
  var $$ = function (s, c) { return [].slice.call((c || document).querySelectorAll(s)); };
  var main = document.getElementById('main') || document.body;

  // ----- 1. words scatter in and gather -----
  function split(el) {
    if (el.classList.contains('fx-split') || el.closest('.mb-src,.bk,.mb-pg')) return;
    var i = 0;
    (function walk(node) {
      [].slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.nodeValue.split(/(\s+)/).forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
            var w = document.createElement('span'), wi = document.createElement('span'), a = (++i) * 2.399;
            w.className = 'w'; wi.className = 'wi'; wi.textContent = p;
            wi.style.setProperty('--i', i);
            wi.style.setProperty('--x', Math.round(Math.cos(a) * 110) + 'px');
            wi.style.setProperty('--y', Math.round(Math.sin(a) * 80 + 30) + 'px');
            wi.style.setProperty('--r', Math.round(Math.sin(a * 1.7) * 22) + 'deg');
            w.appendChild(wi); frag.appendChild(w);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1 && !/^(BR|SVG|SCRIPT|STYLE)$/i.test(n.tagName)) walk(n);
      });
    })(el);
    el.classList.add('fx-split');
  }
  $$('h1, h2, .hero-s', main).forEach(split);

  // ----- 2. numbers count up from 0 -----
  var counters = [];
  function wrapNumber(el) {
    var done = false;
    (function walk(node) {
      [].slice.call(node.childNodes).forEach(function (n) {
        if (done) return;
        if (n.nodeType === 3) {
          var m = /\d+/.exec(n.nodeValue);
          if (!m) return;
          done = true;
          var span = document.createElement('span'), txt = m[0];
          span.className = 'cnt'; span.dataset.to = txt;
          span.textContent = txt.length > 1 && txt[0] === '0' ? '0'.repeat(txt.length) : '0';
          var before = document.createTextNode(n.nodeValue.slice(0, m.index)), after = document.createTextNode(n.nodeValue.slice(m.index + txt.length));
          n.parentNode.insertBefore(before, n); n.parentNode.insertBefore(span, n); n.parentNode.insertBefore(after, n); n.parentNode.removeChild(n);
          counters.push(span);
        } else if (n.nodeType === 1 && !n.classList.contains('cnt')) walk(n);
      });
    })(el);
  }
  $$('.kick, .pc-t b, .pc-t small, .row-m, .regc-t b, .feat-m > span:first-child, .rcs-h p, .hero-by', main).forEach(function (el) { if (!el.closest('.mb-pg,.mb-src')) wrapNumber(el); });
  $$('h2 .wi', main).forEach(function (w) { if (/^\d+$/.test(w.textContent)) wrapNumber(w); });
  function count(span) {
    var to = parseInt(span.dataset.to, 10), pad = span.dataset.to.length > 1 && span.dataset.to[0] === '0' ? span.dataset.to.length : 0, t0 = performance.now(), dur = 1500 + Math.min(1200, to * 12);
    (function f(t) {
      var p = Math.min(1, (t - t0) / dur), e = p === 1 ? 1 : 1 - Math.pow(2, -10 * p), v = Math.round(to * e);
      span.textContent = pad ? String(v).padStart(pad, '0') : String(v);
      if (p < 1) requestAnimationFrame(f);
    })(t0);
  }

  // ----- 3. blocks glide in -----
  var FX = ['.kick', '.lead', '.hero-b', '.hero-by', '.tlink', '.rule', '.feat-c', '.mb', '.mb-ctl', '.row', '.pc', '.regc', '.rc', '.xc', '.plate', '.story > div > p', '.news-w > div, .news-f', '.mock-t > p, .mock-t .btn', '.fridge-t > div > *, .fridge-t form', '.ticks .tick', '.foot-w > *', '.hl-list li', '.jump a', '.tagnote', '.pg-h .lead', '.cz-w > *', '.rcs-h', '.doc > *', '.r-g > *', '.fbar'];
  var LITE = '.rc, .xc, .plate, .row, .jump a, .tick';
  var groups = new Map();
  $$(FX.join(','), main).forEach(function (el) {
    if (el.closest('.mb-pg,.mb-src,.bk,.cm') || el.classList.contains('fx')) return;
    el.classList.add('fx');
    if (el.matches(LITE)) el.classList.add('fx-lite');
    if (el.matches('.story img, .story > div')) el.dataset.fx = el.tagName === 'IMG' ? 'left' : 'right';
    if (el.matches('.feat-c, .mb, .mock-t .btn')) el.dataset.fx = 'zoom';
    var p = el.parentElement, n = groups.get(p) || 0; groups.set(p, n + 1);
    el.style.setProperty('--d', Math.min(n, 8) * 90 + 'ms');
  });
  $$('.story img', main).forEach(function (el) { el.classList.add('fx'); el.dataset.fx = 'left'; });

  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target;
      el.classList.add('in'); io.unobserve(el);
      if (el.classList.contains('cnt') && !el.dataset.done) { el.dataset.done = 1; count(el); }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  $$('.fx, .fx-split', main).forEach(function (el) { io.observe(el); });
  counters.forEach(function (c) { io.observe(c); });

  // ----- 4. photos drift with the scroll -----
  var par = [];
  function reg(sel, scale, k) {
    $$(sel, main).forEach(function (img) {
      if (img.closest('.mb-pg,.mb-src,.bk')) return;
      par.push({ el: img, p: img.parentElement, s: scale, k: k || .1 });
      img.dataset.par = '1';
      img.style.setProperty('--ps', scale);
    });
  }
  reg('.hero > img', 1.22, .22); reg('.feat-c img', 1.14, .08); reg('.pc img', 1.16, .06); reg('.regc img', 1.16, .06);
  reg('.mock > img', 1.18, .12); reg('.cs-hi img', 1.12, .06); reg('.band-p img', 1.12, .1); reg('.cz-b img', 1.1, .05);
  var free = $$('.story img', main).map(function (img) { img.classList.add('bob'); return img; });
  var ticking = false;
  var lastY = scrollY;
  function tick() {
    ticking = false;
    var vh = innerHeight;
    if (Math.abs(scrollY - lastY) > vh * .8) {
      // a big jump (End key, anchor link): reveal everything that is now above the fold so nothing stays hidden
      $$('.fx:not(.in), .fx-split:not(.in), .cnt', main).forEach(function (el) {
        if (el.classList.contains('cnt') ? el.dataset.done : el.classList.contains('in')) return;
        if (el.getBoundingClientRect().bottom < vh * .1) { el.classList.add('in'); io.unobserve(el); if (el.classList.contains('cnt')) { el.dataset.done = 1; count(el); } }
      });
    }
    lastY = scrollY;
    par.forEach(function (o) {
      var r = o.p.getBoundingClientRect();
      if (r.bottom < -300 || r.top > vh + 300) return;
      var c = r.top + r.height / 2 - vh / 2, m = (o.s - 1) / 2 * r.height * .9, y = Math.max(-m, Math.min(m, -c * o.k));
      o.el.style.translate = '0 ' + y.toFixed(1) + 'px';
    });
    free.forEach(function (img) {
      var r = img.getBoundingClientRect();
      if (r.bottom < -300 || r.top > vh + 300) return;
      var c = r.top + r.height / 2 - vh / 2;
      img.style.setProperty('--py', Math.max(-26, Math.min(26, -c * .05)).toFixed(1) + 'px');
    });
    var h = document.documentElement.scrollHeight - vh;
    if (bar) bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, scrollY / h) : 0) + ')';
    var hero = document.querySelector('.hero-t');
    if (hero && scrollY < vh) { hero.style.translate = '0 ' + (scrollY * -.12).toFixed(1) + 'px'; hero.style.opacity = Math.max(0, 1 - scrollY / (vh * .9)).toFixed(2); }
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(tick); } }

  // ----- floating photos: only the ones on screen animate (the hero photo is left out) -----
  var fio = new IntersectionObserver(function (es) { es.forEach(function (e) { e.target.classList.toggle('flo-vis', e.isIntersecting); }); }, { rootMargin: '120px' });
  $$('.pc, .regc, .feat-c, .rc, .xc, .plate, .cz-b, .story img', main).forEach(function (el) {
    if (el.closest('.mb-pg,.mb-src,.bk,.hero')) return;
    el.classList.add('flo');
    el.style.setProperty('--fd', (-Math.random() * 8).toFixed(2) + 's');
    el.style.setProperty('--fdur', (6 + Math.random() * 3.5).toFixed(2) + 's');
    fio.observe(el);
  });
  var sun = document.createElement('div'); sun.className = 'fx-sun'; sun.setAttribute('aria-hidden', 'true'); document.body.appendChild(sun);

  // ----- 5. progress line, cursor glow, card tilt -----
  var bar = document.createElement('div'); bar.className = 'fx-bar'; document.body.appendChild(bar);
  if (!coarse) {
    var glow = document.createElement('div'); glow.className = 'fx-glow'; document.body.appendChild(glow);
    var gx = 0, gy = 0, gr = 0;
    window.addEventListener('pointermove', function (e) {
      gx = e.clientX; gy = e.clientY;
      if (!gr) gr = requestAnimationFrame(function () { gr = 0; glow.style.transform = 'translate3d(' + (gx - 220) + 'px,' + (gy - 220) + 'px,0)'; glow.style.opacity = 1; });
      var card = e.target.closest ? e.target.closest('.pc, .regc, .cs-tall') : null;
      if (card) {
        var b = card.getBoundingClientRect(), x = (e.clientX - b.left) / b.width - .5, y = (e.clientY - b.top) / b.height - .5;
        card.style.transform = 'perspective(900px) rotateX(' + (-y * 3.5).toFixed(2) + 'deg) rotateY(' + (x * 4.5).toFixed(2) + 'deg) translateZ(0)';
      }
    }, { passive: true });
    document.addEventListener('pointerout', function (e) {
      var card = e.target.closest ? e.target.closest('.pc, .regc, .cs-tall') : null;
      if (card && !card.contains(e.relatedTarget)) card.style.transform = '';
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  tick();
})();
