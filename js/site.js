/* ==========================================================================
   AURAS ENGINEERING · premium site
   Smooth scroll · word reveals · pinned services story · 3D "blueprint → built" spool
   Vanilla JS + three.js. Every enhancement fails soft (no WebGL / reduced motion = plain page).
   ========================================================================== */
(function () {
  'use strict';
  var html = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var smooth = function (t) { return t * t * (3 - 2 * t); };
  var vh = function () { return window.innerHeight; };
  var scrollY = function () { return window.pageYOffset || 0; };
  var lenis = null;

  /* ------------------------------------------------------------ smooth scroll */
  function initScroll() {
    if (reduced || typeof window.Lenis === 'undefined') return;
    lenis = new window.Lenis({ lerp: 0.085, smoothWheel: true });
    html.classList.add('lenis', 'lenis-smooth');
  }
  function scrollToEl(el) {
    var y = el.getBoundingClientRect().top + scrollY() - (el.id === 'top' ? 0 : 72);
    if (lenis) lenis.scrollTo(y, { duration: 1.6, easing: function (t) { return 1 - Math.pow(1 - t, 4); } });
    else window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
  }

  /* ------------------------------------------------------------ header + nav */
  function initHeader() {
    var hdr = $('#hdr'), burger = $('#burger'), nav = $('#nav');
    var last = 0;
    var onScroll = function () {
      var y = scrollY();
      hdr.classList.toggle('is-solid', y > 40);
      hdr.classList.toggle('is-hidden', y > 700 && y > last + 4 && !nav.classList.contains('is-open'));
      if (y < last - 4) hdr.classList.remove('is-hidden');
      last = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

    function setMenu(open) {
      nav.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      document.body.style.overflow = open ? 'hidden' : '';
      if (lenis) open ? lenis.stop() : lenis.start();
    }
    burger.addEventListener('click', function () { setMenu(!nav.classList.contains('is-open')); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
    $$('.sub-toggle').forEach(function (b) {
      b.addEventListener('click', function () {
        var li = b.parentElement, open = !li.classList.contains('is-open');
        li.classList.toggle('is-open', open); b.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    });

    // in-page anchors use the smooth scroller
    $$('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (id.length < 2) return;
        var t = $(id); if (!t) return;
        e.preventDefault(); setMenu(false); scrollToEl(t);
      });
    });

    // scroll-spy for the in-page menu items
    var spy = $$('[data-spy]'), map = {};
    spy.forEach(function (a) { map[a.getAttribute('data-spy')] = a; });
    var ids = ['top', 'about', 'contact'];
    var spyIO = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) {
        if (!en.isIntersecting) return;
        spy.forEach(function (a) { a.classList.remove('is-active'); });
        var key = en.target.id; if (key === 'mission' || key === 'industries' || key === 'services') key = 'about';
        if (map[key]) map[key].classList.add('is-active');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['top', 'about', 'mission', 'industries', 'services', 'contact'].forEach(function (id) { var e = document.getElementById(id); if (e) spyIO.observe(e); });
  }

  /* ------------------------------------------------------------ split headings into words */
  function splitWords(root) {
    var n = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (c) {
        if (c.nodeType === 3) {
          var frag = document.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            var w = document.createElement('span'); w.className = 'w';
            var i = document.createElement('i'); i.textContent = part; i.style.setProperty('--i', n++);
            w.appendChild(i); frag.appendChild(w);
          });
          node.replaceChild(frag, c);
        } else if (c.nodeType === 1) walk(c);
      });
    })(root);
    root.setAttribute('aria-label', root.textContent.replace(/\s+/g, ' ').trim());
  }

  /* ------------------------------------------------------------ reveals, counters, parallax */
  function initReveals() {
    var splits = $$('.split');
    splits.forEach(function (s) { var label = s.textContent; splitWords(s); s.setAttribute('aria-label', label.replace(/\s+/g, ' ').trim()); });
    var targets = $$('[data-r], .split:not(.hero-h1), [data-wipe]');
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
    targets.forEach(function (t) { io.observe(t); });

    // counters
    var cio = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) {
        if (!en.isIntersecting) return;
        cio.unobserve(en.target);
        $$('.count', en.target).forEach(function (c) {
          var to = +c.getAttribute('data-to'), t0 = performance.now(), dur = 1800;
          (function step(now) {
            var p = clamp((now - t0) / dur, 0, 1);
            c.textContent = Math.round(to * (1 - Math.pow(1 - p, 4)));
            if (p < 1) requestAnimationFrame(step);
          })(t0);
        });
      });
    }, { threshold: 0.5 });
    $$('.stats').forEach(function (s) { cio.observe(s); });
    if (reduced) $$('.count').forEach(function (c) { c.textContent = c.getAttribute('data-to'); });
  }

  function initParallax() {
    if (reduced) return;
    var imgs = $$('[data-par]');
    if (!imgs.length) return;
    var tick = function () {
      imgs.forEach(function (img) {
        var r = img.parentElement.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh() + 100) return;
        var p = (r.top + r.height / 2) / vh() - 0.5;
        img.style.transform = 'translate3d(0,' + (p * -8).toFixed(2) + '%,0)';
      });
    };
    window.addEventListener('scroll', tick, { passive: true }); tick();
  }

  /* ------------------------------------------------------------ cards: glow + tilt, magnetic buttons */
  function initCards() {
    if (!finePointer) return;
    $$('.glow').forEach(function (c) {
      c.classList.add('tilt');
      c.addEventListener('pointermove', function (e) {
        var r = c.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        c.style.setProperty('--mx', (px * 100).toFixed(1) + '%'); c.style.setProperty('--my', (py * 100).toFixed(1) + '%');
        if (c.classList.contains('is-in') || !c.hasAttribute('data-r')) {
          c.style.transform = 'perspective(900px) rotateX(' + ((0.5 - py) * 5).toFixed(2) + 'deg) rotateY(' + ((px - 0.5) * 6).toFixed(2) + 'deg)';
          c.classList.add('is-tilting');
        }
      });
      c.addEventListener('pointerleave', function () { c.classList.remove('is-tilting'); c.style.transform = ''; });
    });
    $$('[data-mag]').forEach(function (b) {
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        b.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * 0.18).toFixed(1) + 'px,' + ((e.clientY - r.top - r.height / 2) * 0.28).toFixed(1) + 'px)';
      });
      b.addEventListener('pointerleave', function () { b.style.transform = ''; });
    });
  }

  /* ------------------------------------------------------------ industries tabs */
  var tintTarget = { r: 0.2, g: 0.61, b: 0.99 };
  function initIndustries() {
    var tabs = $$('.ind__tabs [role="tab"]'), panels = $$('.ipanel');
    function select(i, focus) {
      tabs.forEach(function (t, k) {
        var on = k === i; t.setAttribute('aria-selected', on ? 'true' : 'false'); t.tabIndex = on ? 0 : -1;
      });
      panels.forEach(function (p, k) { p.hidden = k !== i; p.classList.toggle('is-on', k === i); });
      var c = new THREEColor(tabs[i].getAttribute('data-tint'));
      tintTarget = c;
      if (focus) tabs[i].focus();
    }
    function THREEColor(hex) { var n = parseInt(hex.slice(1), 16); return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 }; }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(i); });
      t.addEventListener('mouseenter', function () { if (finePointer) select(i); });
      t.addEventListener('keydown', function (e) {
        var k = e.key, n = tabs.length;
        if (k === 'ArrowDown' || k === 'ArrowRight') { e.preventDefault(); select((i + 1) % n, true); }
        if (k === 'ArrowUp' || k === 'ArrowLeft') { e.preventDefault(); select((i - 1 + n) % n, true); }
      });
    });
  }

  /* ------------------------------------------------------------ services: pinned horizontal story */
  var svc = { p: 0, active: false, top: 0, span: 1 };
  function initServices() {
    var sec = $('#services'), track = $('#svc-track'), fill = $('#svc-fill');
    var cards = $$('.scard', track), no = $('#svc-no'), nm = $('#svc-name');
    var mq = window.matchMedia('(max-width: 991px), (max-height: 600px)');
    var dist = 0, idx = -1;

    function layout() {
      if (mq.matches) { sec.style.height = ''; track.style.transform = ''; svc.active = false; cards.forEach(function (c) { c.classList.add('is-active'); }); return; }
      dist = Math.max(0, track.scrollWidth - window.innerWidth);
      sec.style.height = (dist + vh() * 1.15) + 'px';
      svc.active = true; update();
    }
    function update() {
      if (!svc.active) return;
      var r = sec.getBoundingClientRect(), top = r.top + scrollY();
      var span = Math.max(1, sec.offsetHeight - vh());
      var p = clamp((scrollY() - top) / span, 0, 1);
      svc.p = p; svc.top = top; svc.span = span;
      track.style.transform = 'translate3d(' + (-p * dist).toFixed(1) + 'px,0,0)';
      fill.style.transform = 'scaleX(' + p.toFixed(4) + ')';
      var i = clamp(Math.round(p * (cards.length - 1)), 0, cards.length - 1);
      if (i !== idx) {
        idx = i;
        cards.forEach(function (c, k) { c.classList.toggle('is-active', k === i); });
        no.textContent = (i < 9 ? '0' : '') + (i + 1);
        nm.textContent = $('h3', cards[i]).textContent;
      }
    }
    mq.addEventListener ? mq.addEventListener('change', layout) : mq.addListener(layout);
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', layout);
    window.addEventListener('load', layout);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
    layout();
    svc.relayout = layout;
  }

  /* ------------------------------------------------------------ 3D: blueprint → built spool */
  var THREE = window.THREE;
  var webglOK = function () { try { var c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); } catch (e) { return false; } };

  function initSpool() {
    var canvas = $('#gl');
    if (!canvas || !THREE || reduced || !webglOK()) { html.classList.add('nogl'); return null; }

    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.localClippingEnabled = true;

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    var CAM_Z = 20; camera.position.set(0, 0, CAM_Z);

    // studio environment for the metal
    var pm = new THREE.PMREMGenerator(renderer), envScene = new THREE.Scene();
    envScene.background = new THREE.Color(0x0b2a3c);
    var panel = function (w, h, r, g, b, x, y, z) {
      var m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
      m.material.color.setRGB(r, g, b); m.position.set(x, y, z); m.lookAt(0, 0, 0); envScene.add(m);
    };
    panel(14, 6, 7, 7, 6.4, 0, 9, 3); panel(4, 12, 2.2, 3.2, 5, -9, 1, 2); panel(3, 10, 5, 4.6, 3, 9, 0, -4); panel(18, 3, 1.1, 1.3, 1.6, 0, -8, 4);
    scene.environment = pm.fromScene(envScene, 0.03).texture; pm.dispose();
    scene.add(new THREE.AmbientLight(0x9fc4de, 0.25));
    var key = new THREE.DirectionalLight(0xfff6d8, 1.6); key.position.set(-5, 8, 8); scene.add(key);
    var rim = new THREE.DirectionalLight(0x349cfc, 2.2); rim.position.set(7, 2, -6); scene.add(rim);

    // clipping planes (recomputed from the model every frame) split blueprint / solid
    var solidBase = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0), wireBase = new THREE.Plane(new THREE.Vector3(1, 0, 0), 0);
    var solidPlane = new THREE.Plane(), wirePlane = new THREE.Plane();
    var CREAM = 0xf7f5c2, BLUE = 0x349cfc;
    var mat = function (color, metal, rough) { return new THREE.MeshStandardMaterial({ color: color, metalness: metal, roughness: rough, side: THREE.DoubleSide, clippingPlanes: [solidPlane], envMapIntensity: 1.15 }); };
    var M = { pipe: mat(0xa9b7c4, 0.92, 0.26), flange: mat(0x7f93a4, 0.9, 0.34), bolt: mat(0x34414c, 0.85, 0.4), body: mat(0x1f6aa5, 0.55, 0.32), wheel: mat(0xf7f5c2, 0.8, 0.3), steel: mat(0xc9d2da, 0.95, 0.22) };
    var wireMat = new THREE.LineBasicMaterial({ color: CREAM, transparent: true, opacity: 0.95, clippingPlanes: [wirePlane] });
    var edgeMat = new THREE.LineBasicMaterial({ color: CREAM, transparent: true, opacity: 0.16, clippingPlanes: [solidPlane] });
    var ghostMat = new THREE.MeshBasicMaterial({ color: BLUE, transparent: true, opacity: 0.07, depthWrite: false, side: THREE.DoubleSide, clippingPlanes: [wirePlane] });

    var core = new THREE.Group(), model = new THREE.Group(); model.add(core); scene.add(model);
    var parts = [];
    function part(geo, material, pos, explode, rot) {
      var g = new THREE.Group(), edges = new THREE.EdgesGeometry(geo, 28);
      g.add(new THREE.Mesh(geo, material), new THREE.Mesh(geo, ghostMat), new THREE.LineSegments(edges, wireMat), new THREE.LineSegments(edges, edgeMat));
      if (rot) g.rotation.set(rot[0], rot[1], rot[2]);
      g.position.set(pos[0], pos[1], pos[2]); core.add(g);
      parts.push({ g: g, base: g.position.clone(), ex: new THREE.Vector3(explode[0], explode[1], explode[2]) });
      return g;
    }
    var Z90 = [0, 0, Math.PI / 2];
    var cyl = function (r, h, seg) { return new THREE.CylinderGeometry(r, r, h, seg || 40, 1, false); };
    part(cyl(0.5, 2.3), M.pipe, [-2.45, 0, 0], [-1.3, 0, 0], Z90);
    var hotFlange = part(cyl(1.0, 0.26), M.flange, [-3.55, 0, 0], [-2.1, 0, 0], Z90);
    part(cyl(1.0, 0.26), M.flange, [-1.45, 0, 0], [-0.95, 0, 0], Z90);
    part(cyl(1.0, 0.26), M.body, [-1.15, 0, 0], [-0.25, 0, 0], Z90);
    part(cyl(1.0, 0.26), M.body, [1.15, 0, 0], [0.25, 0, 0], Z90);
    part(cyl(0.62, 2.0), M.body, [0, 0, 0], [0, 0, 0], Z90);
    var bulge = new THREE.SphereGeometry(0.92, 36, 24); bulge.scale(0.78, 1, 0.9);
    var hotValve = part(bulge, M.body, [0, 0.12, 0], [0, 0.35, 0]);
    part(cyl(0.48, 0.8), M.body, [0, 1.15, 0], [0, 0.9, 0]);
    part(cyl(0.72, 0.17), M.body, [0, 0.98, 0], [0, 0.7, 0]);
    part(cyl(0.56, 0.2), M.steel, [0, 1.7, 0], [0, 1.4, 0]);
    part(new THREE.BoxGeometry(0.11, 1.5, 0.11), M.steel, [0, 2.45, 0.36], [0, 1.9, 0.5]);
    part(new THREE.BoxGeometry(0.11, 1.5, 0.11), M.steel, [0, 2.45, -0.36], [0, 1.9, -0.5]);
    part(cyl(0.085, 2.0, 16), M.steel, [0, 2.65, 0], [0, 2.3, 0]);
    var rim3 = new THREE.TorusGeometry(0.82, 0.075, 16, 56); rim3.rotateX(Math.PI / 2);
    var hotWheel = part(rim3, M.wheel, [0, 3.35, 0], [0, 3.0, 0]);
    part(cyl(0.17, 0.26, 24), M.wheel, [0, 3.35, 0], [0, 3.0, 0]);
    for (var s = 0; s < 3; s++) part(new THREE.BoxGeometry(1.64, 0.06, 0.07), M.wheel, [0, 3.35, 0], [0, 3.0, 0], [0, (s * Math.PI) / 3, 0]);
    function bolts(cx, dir) {
      for (var i = 0; i < 8; i++) {
        var a = (i / 8) * Math.PI * 2, y = Math.cos(a) * 0.78, z = Math.sin(a) * 0.78;
        part(cyl(0.075, 0.74, 10), M.bolt, [cx, y, z], [dir * 0.55, y * 0.9, z * 0.9], Z90);
        part(cyl(0.13, 0.11, 6), M.bolt, [cx - 0.4, y, z], [dir * 0.55 - 0.25, y * 0.9, z * 0.9], Z90);
        part(cyl(0.13, 0.11, 6), M.bolt, [cx + 0.4, y, z], [dir * 0.55 + 0.25, y * 0.9, z * 0.9], Z90);
      }
    }
    bolts(-1.3, -1); bolts(1.3, 1);
    part(cyl(1.0, 0.26), M.flange, [1.45, 0, 0], [0.95, 0, 0], Z90);
    part(cyl(0.5, 1.5), M.pipe, [2.2, 0, 0], [1.5, 0, 0], Z90);
    var hotElbow = part(new THREE.TorusGeometry(1.0, 0.5, 28, 40, Math.PI / 2), M.pipe, [2.95, -1.0, 0], [2.1, -0.4, 0]);
    part(cyl(0.5, 1.2), M.pipe, [3.95, -1.6, 0], [2.6, -1.0, 0]);
    part(cyl(1.0, 0.26), M.flange, [3.95, -2.35, 0], [3.0, -1.7, 0], null);
    core.position.set(-0.55, -0.55, 0);

    var ring = new THREE.Mesh(new THREE.TorusGeometry(1.28, 0.022, 8, 96), new THREE.MeshBasicMaterial({ color: CREAM, transparent: true, opacity: 0.95, depthWrite: false })); ring.rotation.y = Math.PI / 2;
    var ring2Mat = new THREE.MeshBasicMaterial({ color: BLUE, transparent: true, opacity: 0.8, depthWrite: false });
    var ring2 = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.012, 8, 96), ring2Mat); ring2.rotation.y = Math.PI / 2;
    var halo = new THREE.Mesh(new THREE.CircleGeometry(1.45, 48), new THREE.MeshBasicMaterial({ color: BLUE, transparent: true, opacity: 0.1, depthWrite: false, side: THREE.DoubleSide })); halo.rotation.y = Math.PI / 2;
    core.add(ring, ring2, halo);
    var X_MIN = -3.9, X_MAX = 5.1;

    /* ---- drifting dust / flow particles (hero depth) ---- */
    var N = 650, pPos = new Float32Array(N * 3), pSeed = new Float32Array(N);
    for (var pi = 0; pi < N; pi++) { pPos[pi * 3] = Math.random() * 2 - 1; pPos[pi * 3 + 1] = Math.random() * 2 - 1; pPos[pi * 3 + 2] = Math.random(); pSeed[pi] = Math.random(); }
    var pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3)); pGeo.setAttribute('aS', new THREE.BufferAttribute(pSeed, 1));
    var pMat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uT: { value: 0 }, uW: { value: 20 }, uH: { value: 12 }, uPR: { value: 1 }, uTint: { value: new THREE.Color(0x349cfc) }, uCream: { value: new THREE.Color(CREAM) } },
      vertexShader: 'uniform float uT,uW,uH,uPR; attribute float aS; varying float vS; varying float vD;' +
        'void main(){ vS=aS; float sp=0.012+aS*0.03; float x=fract(position.x*0.5+0.5+uT*sp);' +
        'float wx=(x-0.5)*uW*1.25; float wy=position.y*uH*0.58+sin(uT*0.35+aS*6.2831)*0.45; float wz=-7.0+position.z*9.0;' +
        'vec4 mv=modelViewMatrix*vec4(wx,wy,wz,1.0); gl_Position=projectionMatrix*mv; vD=smoothstep(0.0,0.12,x)*smoothstep(1.0,0.88,x);' +
        'gl_PointSize=(1.6+aS*3.2)*uPR*(16.0/-mv.z); }',
      fragmentShader: 'uniform vec3 uTint,uCream; varying float vS; varying float vD;' +
        'void main(){ float d=length(gl_PointCoord-0.5); float a=smoothstep(0.5,0.05,d); vec3 c=mix(uCream,uTint,step(0.55,vS));' +
        'gl_FragColor=vec4(c,a*vD*0.7); }'
    });
    var dust = new THREE.Points(pGeo, pMat); dust.frustumCulled = false; scene.add(dust);

    /* ---- hotspot labels pinned to model parts ---- */
    var hotEls = $$('.hot'), hotMap = [hotFlange, hotValve, hotWheel, hotElbow], hv = new THREE.Vector3();

    /* ---- poses: x / y = viewport fractions · w = model width / viewport width ---- */
    var narrow = function () { return window.innerWidth < 992; };
    var P = function (x, y, w, ry, rx, ex, build, op) { return { x: x, y: y, w: w, ry: ry, rx: rx, ex: ex, build: build, op: op }; };
    var POSES = {
      hero:  function () { return narrow() ? P(0.5, 0.2, 0.84, -0.5, 0.1, 0.6, 0.2, 1) : P(0.78, 0.52, 0.4, -0.5, 0.14, 0.8, 0.2, 1); },
      about: function () { return narrow() ? P(0.5, 0.5, 1.1, 0.2, 0.2, 0, 0.55, 0.1) : P(0.5, 0.5, 0.9, 0.2, 0.16, 0, 0.55, 0.1); },
      mv:    function () { return narrow() ? P(0.5, 0.5, 1.1, 1.0, 0.2, 0, 0.65, 0.1) : P(0.5, 0.5, 0.95, 0.9, 0.18, 0, 0.65, 0.12); },
      ind:   function () { return narrow() ? P(0.5, 0.5, 1.1, 1.7, 0.2, 0, 0.8, 0.12) : P(0.5, 0.5, 0.95, 1.6, 0.16, 0, 0.8, 0.14); },
      svcA:  function () { return narrow() ? P(0.5, 0.5, 1.1, 2.2, 0.2, 0.1, 0.8, 0.1) : P(0.86, 0.26, 0.24, 2.2, 0.2, 0.35, 0.04, 0.98); },
      svcB:  function () { return narrow() ? P(0.5, 0.5, 1.1, 3.0, 0.2, 0, 0.9, 0.1) : P(0.86, 0.26, 0.24, 3.1, 0.2, 0, 1, 0.98); },
      why:   function () { return narrow() ? P(0.5, 0.5, 1.1, 3.4, 0.2, 0, 1, 0.1) : P(0.5, 0.5, 0.95, 3.5, 0.16, 0, 1, 0.12); },
      cta:   function () { return narrow() ? P(0.5, 0.17, 0.84, 4.3, 0.12, 0, 1, 1) : P(0.76, 0.5, 0.44, 4.4, 0.14, 0, 1, 1); },
      foot:  function () { return narrow() ? P(0.5, 0.5, 0.9, 4.8, 0.14, 0, 1, 0) : P(0.76, 0.5, 0.44, 4.8, 0.14, 0, 1, 0); }
    };
    var anchors = [];
    function at(sel, frac, pose, opts) {
      var el = $(sel); if (!el) return;
      var r = el.getBoundingClientRect();
      var y = r.top + scrollY() + r.height * frac - vh() * 0.5;
      anchors.push({ y: y, name: pose, lin: !!(opts && opts.lin) });
    }
    function measure() {
      anchors = [];
      at('#top', 0, 'hero'); anchors[0].y = 0;
      at('#about', 0.3, 'about'); at('#mission', 0.5, 'mv'); at('#industries', 0.5, 'ind');
      var sv = $('#services');
      if (sv) {
        var top = sv.getBoundingClientRect().top + scrollY();
        if (svc.active) {
          anchors.push({ y: top - vh() * 0.45, name: 'svcA', lin: false });
          anchors.push({ y: top + svc.span, name: 'svcB', lin: false, linPrev: true });
        } else at('#services', 0.5, 'svcB');
      }
      at('#why', 0.4, 'why'); at('#contact', 0.5, 'cta');
      var f = $('#footer'); if (f) anchors.push({ y: f.getBoundingClientRect().top + scrollY() - vh() * 0.2, name: 'foot', lin: false });
      anchors.sort(function (a, b) { return a.y - b.y; });
    }
    function targetFor(sy) {
      var a = anchors, n = a.length;
      if (!n) return POSES.hero();
      if (sy <= a[0].y) return POSES[a[0].name]();
      if (sy >= a[n - 1].y) return POSES[a[n - 1].name]();
      for (var i = 0; i < n - 1; i++) {
        if (sy >= a[i].y && sy <= a[i + 1].y) {
          var raw = (sy - a[i].y) / Math.max(1, a[i + 1].y - a[i].y);
          var t = a[i + 1].linPrev ? raw : smooth(raw);
          var p = POSES[a[i].name](), q = POSES[a[i + 1].name](), out = {};
          for (var k in p) out[k] = lerp(p[k], q[k], t);
          return out;
        }
      }
    }

    var S = null, mouse = { x: 0, y: 0, tx: 0, ty: 0 }, tint = { r: 0.2, g: 0.61, b: 0.99 };
    if (finePointer) window.addEventListener('pointermove', function (e) { mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2; mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2; }, { passive: true });
    var worldH = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * CAM_Z;
    function resize() {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, narrow() ? 1.5 : 1.75));
      renderer.setSize(window.innerWidth, window.innerHeight, false);
      camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix();
      measure();
    }
    var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { if (svc.relayout) svc.relayout(); resize(); }, 140); });
    window.addEventListener('load', function () { setTimeout(function () { if (svc.relayout) svc.relayout(); measure(); }, 300); });
    setInterval(measure, 2500);
    resize();

    var pct = $('#pct'), lastPct = -1, t0 = performance.now(), visible = true;
    document.addEventListener('visibilitychange', function () { visible = !document.hidden; });

    return function frame(now) {
      if (!visible) return;
      var t = (now - t0) / 1000, sy = scrollY();
      var tg = targetFor(sy);
      if (!S) S = Object.assign({}, tg);
      for (var key in tg) S[key] = lerp(S[key], tg[key], 0.08);
      mouse.x = lerp(mouse.x, mouse.tx, 0.06); mouse.y = lerp(mouse.y, mouse.ty, 0.06);
      tint.r = lerp(tint.r, tintTarget.r, 0.06); tint.g = lerp(tint.g, tintTarget.g, 0.06); tint.b = lerp(tint.b, tintTarget.b, 0.06);
      rim.color.setRGB(tint.r, tint.g, tint.b); ghostMat.color.setRGB(tint.r, tint.g, tint.b); ring2Mat.color.setRGB(tint.r, tint.g, tint.b);

      canvas.style.opacity = clamp(S.op, 0, 1).toFixed(3);
      if (S.op < 0.01) return;
      var worldW = worldH * camera.aspect;
      var sc = Math.min((S.w * worldW) / (8.6 + 3.6 * S.ex), (worldH * 0.64) / (6.2 + 2.4 * S.ex));
      model.scale.setScalar(sc);
      model.position.set((S.x - 0.5) * worldW, (0.5 - S.y) * worldH + Math.sin(t * 0.8) * 0.1, 0);
      model.rotation.set(S.rx + mouse.y * 0.1, S.ry + sy * 0.0006 + Math.sin(t * 0.35) * 0.07 + mouse.x * 0.22, 0);
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i]; p.g.position.set(p.base.x + p.ex.x * S.ex, p.base.y + p.ex.y * S.ex, p.base.z + p.ex.z * S.ex);
      }
      var b = clamp(S.build, 0, 1);
      var sweep = lerp(X_MIN - 0.4, X_MAX + 0.4, b) + (S.ex * (b - 0.5) * 3.2);
      solidBase.constant = sweep; wireBase.constant = -sweep;
      model.updateMatrixWorld(true);
      solidPlane.copy(solidBase).applyMatrix4(core.matrixWorld); wirePlane.copy(wireBase).applyMatrix4(core.matrixWorld);
      ring.visible = ring2.visible = halo.visible = b > 0.01 && b < 0.99;
      ring.position.x = ring2.position.x = halo.position.x = sweep; ring2.rotation.x = t * 0.6;
      if (pct) { var v = Math.round(b * 100); if (v !== lastPct) { pct.textContent = (v < 10 ? '0' : '') + v + '%'; lastPct = v; } }
      pMat.uniforms.uT.value = t; pMat.uniforms.uW.value = worldW; pMat.uniforms.uH.value = worldH; pMat.uniforms.uPR.value = renderer.getPixelRatio();
      pMat.uniforms.uTint.value.setRGB(tint.r, tint.g, tint.b); dust.position.x = -mouse.x * 0.35; dust.position.y = mouse.y * 0.2;
      renderer.render(scene, camera);
      // hotspots: only while the model is big and fully visible (hero + contact)
      var showHot = !narrow() && S.op > 0.9 && S.w > 0.3 ? clamp((S.op - 0.9) * 10, 0, 1) : 0;
      for (var h = 0; h < hotEls.length; h++) {
        var el = hotEls[h];
        if (showHot <= 0.01) { if (el.style.opacity !== '0') el.style.opacity = '0'; continue; }
        hotMap[h].getWorldPosition(hv); hv.project(camera);
        el.style.opacity = (showHot * (b > 0.12 ? 1 : 0.0 + b / 0.12)).toFixed(2);
        el.style.transform = 'translate3d(' + ((hv.x * 0.5 + 0.5) * window.innerWidth).toFixed(1) + 'px,' + ((-hv.y * 0.5 + 0.5) * window.innerHeight).toFixed(1) + 'px,0)';
      }
    };
  }

  /* ------------------------------------------------------------ boot */
  function boot() {
    html.classList.add('ready');
    $('#yr').textContent = new Date().getFullYear();
    initScroll();
    initHeader();
    initReveals();
    initCards();
    initIndustries();
    initServices();
    initParallax();
    var draw = initSpool();

    var bar = $('.progress');
    var loop = function (now) {
      if (lenis) lenis.raf(now);
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = 'scaleX(' + (h > 0 ? clamp(scrollY() / h, 0, 1) : 0).toFixed(4) + ')';
      if (draw) { try { draw(now); } catch (err) { if (!window.__dbgErr) { window.__dbgErr = err; console.log("DRAWERR " + err.stack); } } }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);

    // preloader → intro
    var pre = $('.pre'), started = performance.now(), gone = false;
    function go() {
      if (gone) return; gone = true;
      if (pre) pre.classList.add('is-done');
      html.classList.add('go');
      var h1 = $('.hero-h1'); if (h1) h1.classList.add('is-in');
    }
    function tryGo() { setTimeout(go, Math.max(0, 1200 - (performance.now() - started))); }
    if (document.readyState === 'complete') tryGo(); else window.addEventListener('load', tryGo);
    setTimeout(go, 2800);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
