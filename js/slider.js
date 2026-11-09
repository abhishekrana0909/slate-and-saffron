// North America's full-screen slider.
(function () {
  var box = document.getElementById('slider');
  if (!box) return;
  var slides = [].slice.call(box.querySelectorAll('.slide')), i = 0, timer = 0;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function go(n) { slides[i].classList.remove('on'); i = (n + slides.length) % slides.length; slides[i].classList.add('on'); }
  function play() { clearInterval(timer); if (!reduce) timer = setInterval(function () { go(i + 1); }, 6000); }
  box.querySelector('.p').addEventListener('click', function () { go(i - 1); play(); });
  box.querySelector('.n').addEventListener('click', function () { go(i + 1); play(); });
  box.addEventListener('pointerenter', function () { clearInterval(timer); });
  box.addEventListener('pointerleave', play);
  play();
})();
