// The opening: a closed book, the cover opens, pages turn, Namaskar, then the Earth rises.
(function () {
  var html = document.documentElement, book = document.getElementById('book');
  if (!book || !html.classList.contains('intro')) return;
  var word = document.getElementById('bkW'), skip = book.querySelector('.bk-skip');
  var colours = ['#E0322B', '#EE7F0E', '#E12C8B', '#1F6FE5', '#2F9E5B', '#0C9A9A', '#C9601A', '#8ECB2B', '#E0322B'];
  var seen = false, timers = [], ended = false;
  try { seen = !!localStorage.getItem('ga:seen'); localStorage.setItem('ga:seen', '1'); sessionStorage.setItem('ga:intro', '1'); } catch (e) {}
  var at = function (ms, fn) { timers.push(setTimeout(fn, ms)); };
  function finish() {
    if (ended) return; ended = true;
    timers.forEach(clearTimeout);
    book.classList.add('end');
    window.dispatchEvent(new Event('ga:bookdone'));
    setTimeout(function () { html.classList.remove('intro'); book.remove(); }, 560);
  }
  skip.addEventListener('click', finish);
  var HELLO = window.GA_HELLO || ['Namaskar'];
  at(280, function () { book.classList.add('open'); });
  if (seen) {
    // Returning visitors get the short version.
    at(1500, function () { book.classList.add('rise'); });
    at(1950, finish);
    return;
  }
  var start = 2050, step = 300;
  HELLO.forEach(function (w, i) {
    at(start + i * step, function () { word.textContent = w; word.style.color = colours[i % colours.length]; });
  });
  var last = start + (HELLO.length - 1) * step + 620;
  at(last, function () { book.classList.add('rise'); });
  at(last + 480, finish);
})();
