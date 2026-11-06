/* ==========================================================================
   AURAS · design layer 2 (progressive enhancement, runs after site.js)
   ghost numbers · card details · stats counters · header/pipeline theme
   section expand · footer wordmark fill · custom cursor
   ========================================================================== */
(function () {
  'use strict';
  var html = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var smooth = function (t) { return t * t * (3 - 2 * t); };
  var sy = function () { return window.pageYOffset || 0; };

  /* ---- 2. ghost numbers behind section titles ---- */
  $$('.sec').forEach(function (s) {
    var e = $('.eyebrow', s); if (!e) return;
    var m = e.textContent.match(/^\s*(\d{2})/); if (!m) return;
    var g = document.createElement('span'); g.className = 'ghost'; g.setAttribute('aria-hidden', 'true'); g.textContent = m[1];
    s.insertBefore(g, s.firstChild);
  });

  /* ---- 11. bento: big outlined numbers on the cards ---- */
  $$('.wcard').forEach(function (c) { var n = $('span', c); if (n) c.setAttribute('data-big', n.textContent); });

  /* ---- 12. service card detail + arrow ---- */
  var DESC = [
    'Design and detailed engineering for skids, piping and process systems.',
    'Reliable sourcing of valves, instruments and materials, backed by a robust supply chain.',
    'Fabrication and assembly built to stringent industry standards.',
    'PLCs, junction boxes and instrumentation, integrated to specification.',
    'Inspection and testing to meet international standards and client requirements.',
    'Surface preparation and protective coating for harsh environments.',
    'On-site installation and assembly by skilled teams.',
    'On-time, and often earlier, delivery to your project site.'
  ];
  $$('.scard').forEach(function (c, i) {
    var b = $('.scard__b', c); if (!b || !DESC[i]) return;
    var p = document.createElement('p'); p.className = 'scard__d'; p.textContent = DESC[i]; b.appendChild(p);
    var go = document.createElement('span'); go.className = 'scard__go'; go.setAttribute('aria-hidden', 'true');
    go.innerHTML = '<svg viewBox="0 0 18 18"><path d="M3 9h12m-5-5 5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
    c.appendChild(go); c.setAttribute('data-cur', 'View');
  });
  $$('.about__img').forEach(function (e) { e.setAttribute('data-cur', 'View'); });

  /* ---- 10. stats band counters ---- */
  var nio = new IntersectionObserver(function (ents) {
    ents.forEach(function (en) {
      if (!en.isIntersecting) return;
      nio.unobserve(en.target);
      var c = $('.count', en.target); if (!c) return;
      var to = +c.getAttribute('data-to'), t0 = performance.now(), dur = 1800;
      (function step(now) {
        var p = clamp((now - t0) / dur, 0, 1);
        c.textContent = Math.round(to * (1 - Math.pow(1 - p, 4)));
        if (p < 1) requestAnimationFrame(step);
      })(t0);
    });
  }, { threshold: 0.6 });
  $$('.num').forEach(function (n) { if (reduced) $('.count', n).textContent = $('.count', n).getAttribute('data-to'); else nio.observe(n); });

  /* ---- 8. section top line draws in ---- */
  var lio = new IntersectionObserver(function (ents) {
    ents.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('line-in'); lio.unobserve(en.target); } });
  }, { threshold: 0.05 });
  $$('.sec, .nums').forEach(function (s) { lio.observe(s); });

  /* ---- scroll-driven bits: header theme, pipeline nav, section expand, footer word ---- */
  var hdr = $('#hdr'), pipe = $('.pipe'), pfill = $('#pipe-fill');
  var lights = $$('[data-theme="light"]'), expands = $$('[data-expand]'), word = $('.ftr__word'), footer = $('#footer');
  var ids = ['top', 'about', 'mission', 'industries', 'services', 'why', 'contact'];
  var secs = ids.map(function (id) { return document.getElementById(id); });
  var links = $$('.pipe a');
  var lastActive = -1;

  function onScroll() {
    var vh = window.innerHeight, y = sy();
    // 14. header + pipeline pick light/dark theme from the section under them
    var headLight = false, pipeLight = false;
    lights.forEach(function (s) {
      var r = s.getBoundingClientRect();
      if (r.top < 38 && r.bottom > 38) headLight = true;
      if (r.top < vh * 0.5 && r.bottom > vh * 0.5) pipeLight = true;
    });
    if (hdr) hdr.classList.toggle('on-light', headLight);
    if (pipe) pipe.classList.toggle('on-light', pipeLight);

    // 7. pipeline nav
    if (pipe) {
      pipe.classList.toggle('is-on', y > vh * 0.55);
      var h = document.documentElement.scrollHeight - vh;
      if (pfill) pfill.style.transform = 'scaleY(' + (h > 0 ? clamp(y / h, 0, 1) : 0).toFixed(4) + ')';
      var act = 0;
      secs.forEach(function (s, i) { if (s && s.getBoundingClientRect().top < vh * 0.5) act = i; });
      if (act !== lastActive) {
        lastActive = act;
        links.forEach(function (a, i) { a.classList.toggle('is-active', i === act); a.classList.toggle('is-passed', i < act); });
      }
    }

    // 1/8. cream section expands from a rounded card to full width as it arrives
    expands.forEach(function (s) {
      var r = s.getBoundingClientRect();
      var p = clamp((vh - r.top) / (vh * 0.75), 0, 1);
      s.style.setProperty('--ex', (1 - smooth(p)).toFixed(3));
    });

    // 13. footer wordmark fills as the footer scrolls in
    if (word && footer) {
      var fr = footer.getBoundingClientRect();
      var f = clamp((vh - fr.top) / (fr.height * 0.85), 0, 1);
      word.style.setProperty('--fill', f.toFixed(3));
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();
  setTimeout(onScroll, 1200);

  /* ---- 6. custom cursor ---- */
  if (fine && !reduced) {
    var cur = $('.cur'), ring = $('.cur__ring'), dot = $('.cur__dot'), label = $('.cur__ring em');
    if (cur && ring) {
      html.classList.add('has-cur');
      var mx = -100, my = -100, rx = -100, ry = -100;
      window.addEventListener('pointermove', function (e) {
        mx = e.clientX; my = e.clientY;
        dot.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0)';
        var t = e.target.closest ? e.target.closest('[data-cur],a,button,[role="tab"]') : null;
        var view = t && t.hasAttribute('data-cur');
        cur.classList.toggle('is-view', !!view);
        cur.classList.toggle('is-link', !!t && !view);
        if (view) label.textContent = t.getAttribute('data-cur');
      }, { passive: true });
      document.addEventListener('mouseleave', function () { cur.style.opacity = '0'; });
      document.addEventListener('mouseenter', function () { cur.style.opacity = '1'; });
      (function loop() {
        rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
        ring.style.transform = 'translate3d(' + rx.toFixed(1) + 'px,' + ry.toFixed(1) + 'px,0)';
        requestAnimationFrame(loop);
      })();
    }
  }
})();
