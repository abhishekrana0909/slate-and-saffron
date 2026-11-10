// Custom cursor: a saffron crocus flower that follows the pointer, sways as you move, blooms over clickable things and drops golden pollen.
// Only for a real mouse. Touch screens and "reduce motion" keep the normal cursor.
(function () {
  if (!matchMedia('(pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var root = document.documentElement;
  var petals = '';
  for (var a = 0; a < 360; a += 60) petals += '<g transform="rotate(' + a + ')"><ellipse cx="0" cy="-13" rx="6.6" ry="14" fill="url(#cfp)"/><path d="M0 -4 L0 -24" stroke="#4B2F86" stroke-opacity=".45" stroke-width=".8"/><path d="M-2.4 -5 Q-3 -15 -2 -23 M2.4 -5 Q3 -15 2 -23" stroke="#4B2F86" stroke-opacity=".28" stroke-width=".6" fill="none"/></g>';
  var svg = '<svg viewBox="-30 -30 60 60" width="56" height="56" aria-hidden="true"><defs><radialGradient id="cfp" cx="50%" cy="85%" r="95%"><stop offset="0" stop-color="#C9B3F0"/><stop offset=".55" stop-color="#9577D3"/><stop offset="1" stop-color="#5E3FA3"/></radialGradient></defs>' +
    '<g class="cf-p">' + petals + '</g>' +
    '<g class="cf-s" fill="none" stroke-linecap="round"><path d="M0 0 C 3 -6 9 -10 12 -19" stroke="#E0361F" stroke-width="2.4"/><path d="M0 0 C -1 -7 -1 -12 -2 -22" stroke="#EA4A27" stroke-width="2.4"/><path d="M0 0 C -4 -6 -10 -9 -13 -17" stroke="#D12B1A" stroke-width="2.4"/></g>' +
    '<circle r="3.6" fill="#F4B520"/><circle r="1.4" fill="#fff3c4"/></svg>';
  var fl = document.createElement('div'), cf = document.createElement('div'), lb = document.createElement('span');
  fl.className = 'cur-fl'; cf.className = 'cf'; cf.innerHTML = svg; lb.className = 'cur-lb';
  fl.appendChild(cf); fl.appendChild(lb); fl.setAttribute('aria-hidden', 'true');
  document.body.appendChild(fl);
  root.classList.add('cur-on');

  var LABELS = [
    ['.bk-card', 'Open'], ['.mb-it', 'View'], ['.mb-toc a', 'Go'], ['.mb-btn, .mb-go', 'Go'], ['.mb-r:not(.end)', 'Next'], ['.mb-l', 'Back'],
    ['.rc-sv', 'Save'], ['.pc, .regc, .rc-i, .rc-in h3 a, .xc, .plate, .cs-tall, .cs-sm, .feat-c, .row', 'View'], ['.btn', 'Go']
  ];
  var GENERIC = 'a, button, [role="button"], label, select, summary, .chip, .tick, .mb-ctl button, .bk-nav, input[type="checkbox"]';
  var TEXT = 'input:not([type="checkbox"]), textarea';
  var x = -100, y = -100, fx = -100, fy = -100, rot = 0, seen = false, raf = 0, lastP = { x: -999, y: -999 };

  function loop() {
    var dx = x - fx, dy = y - fy;
    fx += dx * .34; fy += dy * .34;
    rot += (Math.max(-38, Math.min(38, dx * 1.8)) - rot) * .16;
    fl.style.transform = 'translate3d(' + fx.toFixed(1) + 'px,' + fy.toFixed(1) + 'px,0)';
    cf.style.rotate = rot.toFixed(1) + 'deg';
    if (Math.abs(dx) > .15 || Math.abs(dy) > .15 || Math.abs(rot) > .3) raf = requestAnimationFrame(loop); else { raf = 0; cf.style.rotate = '0deg'; rot = 0; }
  }
  function kick() { if (!raf) raf = requestAnimationFrame(loop); }
  function pollen(px, py) {
    var p = document.createElement('i'), s = 3 + Math.random() * 3, ox = (Math.random() - .5) * 18, oy = (Math.random() - .5) * 10;
    p.className = 'cur-pl'; p.style.cssText = 'width:' + s + 'px;height:' + s + 'px;left:' + (px + ox) + 'px;top:' + (py + oy) + 'px';
    document.body.appendChild(p);
    var run = p.animate ? p.animate([{ transform: 'translate(0,0) scale(1)', opacity: .95 }, { transform: 'translate(' + ((Math.random() - .5) * 34).toFixed(0) + 'px,' + (18 + Math.random() * 26).toFixed(0) + 'px) scale(.15)', opacity: 0 }], { duration: 700 + Math.random() * 500, easing: 'cubic-bezier(.2,.6,.3,1)' }) : null;
    if (run) run.onfinish = function () { p.remove(); }; else p.remove();
  }
  function state(t) {
    var lab = '', hover = false;
    if (t && t.closest) {
      if (t.closest(TEXT)) { fl.classList.add('off'); return; }
      fl.classList.remove('off');
      for (var i = 0; i < LABELS.length; i++) { if (t.closest(LABELS[i][0])) { lab = LABELS[i][1]; hover = true; break; } }
      if (!hover && t.closest(GENERIC)) hover = true;
    }
    lb.textContent = lab;
    fl.classList.toggle('hov', hover);
    fl.classList.toggle('lab', !!lab);
  }
  window.addEventListener('pointermove', function (e) {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    x = e.clientX; y = e.clientY;
    if (!seen) { seen = true; fx = x; fy = y; fl.classList.add('on'); }
    if (Math.hypot(x - lastP.x, y - lastP.y) > 26) { lastP = { x: x, y: y }; pollen(x, y + 6); }
    kick();
  }, { passive: true });
  document.addEventListener('pointerover', function (e) { if (!e.pointerType || e.pointerType === 'mouse') state(e.target); });
  document.addEventListener('pointerdown', function () { fl.classList.add('down'); });
  window.addEventListener('pointerup', function () { fl.classList.remove('down'); });
  document.addEventListener('mouseleave', function () { fl.classList.remove('on'); seen = false; });
  document.addEventListener('mouseenter', function () { fl.classList.add('on'); });
})();
