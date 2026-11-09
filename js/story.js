// Scroll story on the home page: ingredients fall, the bowl fills, then the search appears.
// Scrolling drives everything, so it also runs backwards.
(function () {
  var story = document.getElementById('story');
  if (!story) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { document.documentElement.classList.add('static-story'); finishStatic(); return; }
  function finishStatic() {
    var b = document.getElementById('bowlImg'), w = document.getElementById('bowlW');
    if (b) b.style.opacity = 1;
    if (w) w.style.cssText = 'position:absolute;left:auto;right:-6vw;top:50%;transform:translateY(-50%)';
    var h = document.getElementById('stHint'); if (h) h.remove();
  }
  var $ = function (s) { return document.querySelector(s); };
  var bowlW = $('#bowlW'), img = $('#bowlImg'), end = $('#stEnd'), hint = $('#stHint'), canvas = $('#falling'), ctx = canvas.getContext('2d');
  var words = [$('.w1'), $('.w2'), $('.w3')], steam = [].slice.call(document.querySelectorAll('.steam'));
  var dpr = 1, W = 0, H = 0, wide = true, cur = 0, shown = -1;
  var clamp = function (x) { return Math.max(0, Math.min(1, x)); }, seg = function (p, a, b) { return clamp((p - a) / (b - a)); }, ease = function (t) { return t * t * (3 - 2 * t); };
  // A fixed list, so the same scroll position always draws the same picture.
  var seed = 7, rnd = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  var TYPES = ['tomato', 'chana', 'chana', 'leaf', 'spice', 'spice', 'chana', 'leaf'], items = [];
  for (var i = 0; i < 74; i++) items.push({ type: TYPES[i % 8], p0: .03 + rnd() * .47, x: (rnd() - .5) * 1.5, ex: (rnd() - .5) * .62, ey: (rnd() - .5) * .5, r: rnd() * 6.28, spin: 2 + rnd() * 5, s: .6 + rnd() * .75 });

  function size() {
    dpr = Math.min(devicePixelRatio || 1, 1.75);
    var b = canvas.getBoundingClientRect(); W = b.width; H = b.height;
    canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    wide = innerWidth > 900; shown = -1;
  }
  function tomato(s) { var g = ctx.createRadialGradient(-s * .3, -s * .35, s * .1, 0, 0, s); g.addColorStop(0, '#ff8a63'); g.addColorStop(.6, '#d9352a'); g.addColorStop(1, '#7c130f'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, s, 0, 6.3); ctx.fill(); ctx.fillStyle = '#3F8F5F'; ctx.beginPath(); ctx.ellipse(0, -s * .85, s * .34, s * .14, 0, 0, 6.3); ctx.fill(); }
  function chana(s) { var g = ctx.createRadialGradient(-s * .25, -s * .3, s * .1, 0, 0, s); g.addColorStop(0, '#f6dfa8'); g.addColorStop(1, '#a9782f'); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, s, s * .86, 0, 0, 6.3); ctx.fill(); ctx.fillStyle = 'rgba(90,55,15,.5)'; ctx.beginPath(); ctx.arc(s * .32, -s * .16, s * .13, 0, 6.3); ctx.fill(); }
  function leaf(s) { ctx.fillStyle = '#4f9a5c'; ctx.beginPath(); ctx.moveTo(0, -s * 1.5); ctx.quadraticCurveTo(s, 0, 0, s * 1.5); ctx.quadraticCurveTo(-s, 0, 0, -s * 1.5); ctx.fill(); ctx.strokeStyle = 'rgba(210,240,190,.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, -s * 1.3); ctx.lineTo(0, s * 1.3); ctx.stroke(); }
  function drawItems(p) {
    ctx.clearRect(0, 0, W, H);
    var R = Math.min(H * .33, W * .37), cx = W / 2, cy = H / 2, u = R / 170;
    items.forEach(function (it) {
      var t = (p - it.p0) / .11;
      if (t <= 0 || t >= 1) return;
      var tt = t * t, x = cx + (it.x * R * (1 - tt)) + it.ex * R * tt, y = -40 + (cy + it.ey * R + 40) * tt;
      ctx.save(); ctx.translate(x, y); ctx.rotate(it.r + t * it.spin); ctx.globalAlpha = t > .86 ? (1 - t) / .14 : 1;
      if (it.type === 'tomato') tomato(16 * it.s * u); else if (it.type === 'chana') chana(9 * it.s * u); else if (it.type === 'leaf') leaf(9 * it.s * u);
      else { ctx.fillStyle = '#E8B23A'; ctx.beginPath(); ctx.arc(0, 0, 2.6 * it.s * u + .8, 0, 6.3); ctx.fill(); }
      ctx.restore();
    });
  }
  function apply(p) {
    // words behind the bowl
    var o1 = 1 - seg(p, .25, .33), o2 = seg(p, .27, .35) * (1 - seg(p, .52, .6)), o3 = seg(p, .54, .62) * (1 - seg(p, .7, .77));
    words[0].style.opacity = o1 * .92; words[1].style.opacity = o2 * .92; words[2].style.opacity = o3 * .92;
    words[0].style.transform = 'translate(-50%,-50%) scale(' + (1 + p * .12).toFixed(3) + ')';
    words[1].style.transform = 'translate(-50%,-50%) scale(' + (.94 + (p - .27) * .3).toFixed(3) + ')';
    words[2].style.transform = 'translate(-50%,-50%) scale(' + (.94 + (p - .54) * .3).toFixed(3) + ')';
    // bowl fills up and turns, then slides aside for the search
    img.style.opacity = ease(seg(p, .1, .55)).toFixed(3);
    var move = ease(seg(p, .72, .9));
    var rot = p * 90, grow = .7 + .3 * ease(seg(p, .08, .5)), sc, tx, ty;
    if (wide) { sc = grow + move * .34; tx = move * 27; ty = 0; bowlW.style.transform = 'translate(' + tx.toFixed(2) + 'vw,' + ty + 'vh) rotate(' + rot.toFixed(1) + 'deg) scale(' + sc.toFixed(3) + ')'; }
    else { sc = grow - move * .28; bowlW.style.transform = 'translate(' + (move * 12).toFixed(2) + 'vw,' + (-move * 25).toFixed(2) + 'vh) rotate(' + rot.toFixed(1) + 'deg) scale(' + sc.toFixed(3) + ')'; }
    // steam
    var st = seg(p, .46, .58) * (1 - seg(p, .72, .8));
    steam.forEach(function (s, i) { s.style.opacity = (st * (.75 + .25 * Math.sin(p * 40 + i * 2))).toFixed(3); s.style.transform = 'translateY(' + (-30 - p * 180 - i * 8).toFixed(0) + 'px) scale(' + (1 + p).toFixed(2) + ')'; });
    // search panel
    var e = ease(seg(p, .78, .93));
    end.style.opacity = e.toFixed(3); end.style.visibility = e > .02 ? 'visible' : 'hidden';
    end.style.transform = (wide ? 'translateY(calc(-50% + ' : 'translateY(calc(') + ((1 - e) * 34).toFixed(1) + 'px))';
    hint.style.opacity = p > .03 ? 0 : 1;
    canvas.style.opacity = p > .66 ? 0 : 1;
    if (p <= .66) drawItems(p);
  }
  function target() {
    var b = story.getBoundingClientRect(), span = b.height - innerHeight;
    return clamp(-b.top / span);
  }
  function loop() {
    requestAnimationFrame(loop);
    var t = target();
    cur += (t - cur) * .14;
    if (Math.abs(t - cur) < .0004) cur = t;
    if (cur !== shown) { apply(cur); shown = cur; }
  }
  addEventListener('resize', size);
  size(); cur = target(); apply(cur);
  requestAnimationFrame(loop);
})();
