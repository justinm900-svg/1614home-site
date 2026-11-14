/* Mobile nav toggle. No dependencies. Desktop links stay in the header. */
(function () {
  var btn = document.querySelector('.nav-toggle');
  var header = document.querySelector('header.bar');
  var nav = document.getElementById('site-nav');
  if (!btn || !header || !nav) return;
  var label = btn.querySelector('.sr-only');

  function setOpen(open) {
    header.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (label) label.textContent = open ? 'Close menu' : 'Menu';
  }

  btn.addEventListener('click', function () {
    var open = btn.getAttribute('aria-expanded') !== 'true';
    setOpen(open);
    if (open) {
      var first = nav.querySelector('a');
      if (first) first.focus();
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      btn.focus();
    }
  });

  document.addEventListener('click', function (e) {
    if (btn.getAttribute('aria-expanded') !== 'true') return;
    if (header.contains(e.target)) return;
    setOpen(false);
  });

  nav.addEventListener('click', function (e) {
    if (e.target.closest('a')) setOpen(false);
  });

  window.addEventListener('resize', function () {
    if (window.matchMedia('(min-width: 1060px)').matches) setOpen(false);
  });
})();
