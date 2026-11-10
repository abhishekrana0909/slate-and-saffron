// Custom cursor: a saffron dot that sticks to the pointer and a ring that follows it. The ring grows and shows a label over things you can click.
// Only for a real mouse. Touch screens and "reduce motion" keep the normal cursor.
(function () {
  if (!matchMedia('(pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var root = document.documentElement;
  var ring = document.createElement('div'), cr = document.createElement('i'), label = document.createElement('span'), dot = document.createElement('div');
  ring.className = 'cur-ring'; cr.className = 'cr'; dot.className = 'cur-dot';
  cr.appendChild(label); ring.appendChild(cr);
  ring.setAttribute('aria-hidden', 'true'); dot.setAttribute('aria-hidden', 'true');
  document.body.appendChild(ring); document.body.appendChild(dot);
  root.classList.add('cur-on');

  var LABELS = [
    ['.bk-card', 'Open'], ['.mb-toc a', 'Go'], ['.mb-btn, .mb-go', 'Go'], ['.mb-r:not(.end)', 'Next'], ['.mb-l', 'Back'],
    ['.rc-sv', 'Save'], ['.pc, .regc, .rc-i, .rc-in h3 a, .xc, .plate, .cs-tall, .cs-sm, .feat-c, .row', 'View'], ['.btn', 'Go']
  ];
  var GENERIC = 'a, button, [role="button"], label, select, summary, .chip, .tick, .mb-ctl button, .bk-nav, input[type="checkbox"]';
  var TEXT = 'input:not([type="checkbox"]), textarea';
  var x = -100, y = -100, rx = -100, ry = -100, seen = false, raf = 0;

  function loop() {
    rx += (x - rx) * .17; ry += (y - ry) * .17;
    ring.style.transform = 'translate3d(' + rx.toFixed(1) + 'px,' + ry.toFixed(1) + 'px,0)';
    if (Math.abs(x - rx) > .1 || Math.abs(y - ry) > .1) raf = requestAnimationFrame(loop); else raf = 0;
  }
  function kick() { if (!raf) raf = requestAnimationFrame(loop); }
  function state(t) {
    var lab = '', hover = false;
    if (t && t.closest) {
      if (t.closest(TEXT)) { ring.classList.add('off'); dot.classList.add('off'); return; }
      ring.classList.remove('off'); dot.classList.remove('off');
      for (var i = 0; i < LABELS.length; i++) { if (t.closest(LABELS[i][0])) { lab = LABELS[i][1]; hover = true; break; } }
      if (!hover && t.closest(GENERIC)) hover = true;
    }
    label.textContent = lab;
    ring.classList.toggle('hov', hover);
    ring.classList.toggle('lab', !!lab);
    dot.classList.toggle('hide', !!lab);
  }
  window.addEventListener('pointermove', function (e) {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    x = e.clientX; y = e.clientY;
    dot.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
    if (!seen) { seen = true; rx = x; ry = y; ring.classList.add('on'); dot.classList.add('on'); }
    kick();
  }, { passive: true });
  document.addEventListener('pointerover', function (e) { if (!e.pointerType || e.pointerType === 'mouse') state(e.target); });
  document.addEventListener('pointerdown', function () { ring.classList.add('down'); });
  window.addEventListener('pointerup', function () { ring.classList.remove('down'); });
  document.addEventListener('mouseleave', function () { ring.classList.remove('on'); dot.classList.remove('on'); seen = false; });
  document.addEventListener('mouseenter', function () { ring.classList.add('on'); dot.classList.add('on'); });
})();
