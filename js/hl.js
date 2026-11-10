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
