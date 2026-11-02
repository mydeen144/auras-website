/* ==========================================================================
   AURAS ENGINEERING — main.js  ·  Full home page (sections 1–15)
   --------------------------------------------------------------------------
   Vanilla JS + GSAP 3.12.5 (ScrollTrigger, Flip) · SplitType 0.3.4 · Lenis 1.1.13
   Every section has its own init function. Everything starts from boot()
   → preloader → initPage(). Responsive motion lives inside gsap.matchMedia()
   so ScrollTriggers are cleaned up and rebuilt when breakpoints change.

   Contents
   0.  Config (motion tokens) & helpers
   1.  Smooth scroll (Lenis ↔ GSAP ticker) + anchor links
   2.  Preloader
   3.  Reveal choreography (shared by every section)
   4.  Header, dropdown, scroll-spy, mobile menu      (section 1)
   5.  Hero slider                                     (section 2)
   6.  About                                           (section 3)
   7.  Counters                                        (section 4)
   8.  Mission & Vision tilt                           (section 5)
   9.  Global UI: progress bar, back-to-top, cursor, magnetic
   10. Refresh handling
   11. Boot
   ========================================================================== */
(function () {
  'use strict';

  /* ========================================================================
     0. CONFIG & HELPERS
     ======================================================================== */
  const MOTION = {
    fast: 0.3,              // hover, UI feedback
    base: 0.8,              // reveals
    slow: 1.2,              // signature moments
    out: 'power3.out',      // entrances
    inOut: 'power2.inOut',  // state changes
    expo: 'expo.out',       // signature moments only
    distance: 40,           // max reveal travel (px)
    stagger: 0.08,          // sibling stagger (0.06–0.1)
    start: 'top 80%',       // reveal trigger
    autoplay: 6             // hero autoplay (s)
  };

  const html = document.documentElement;
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  const state = { lenis: null, mm: null, menuOpen: false };

  /** Split a heading into lines, each wrapped in an overflow mask. Returns SplitType instance or null. */
  function splitLines(el) {
    if (!el || prefersReduced || typeof window.SplitType === 'undefined') return null;
    const split = new window.SplitType(el, { types: 'lines', lineClass: 'line' });
    (split.lines || []).forEach((line) => {
      const mask = document.createElement('span');
      mask.className = 'line-mask';
      line.parentNode.insertBefore(mask, line);
      mask.appendChild(line);
    });
    return split;
  }

  /** Header height currently on screen (used for anchor offsets). */
  function headerOffset() {
    const bar = $('.nav-bar');
    return bar ? bar.getBoundingClientRect().height : 0;
  }

  /* ========================================================================
     1. SMOOTH SCROLL + ANCHORS
     ======================================================================== */
  function initSmoothScroll() {
    if (prefersReduced || typeof window.Lenis === 'undefined') return;
    const lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);           // keep ScrollTrigger in sync
    gsap.ticker.add((time) => lenis.raf(time * 1000));  // drive Lenis from GSAP's ticker
    gsap.ticker.lagSmoothing(0);
    state.lenis = lenis;
  }

  function scrollToTarget(target) {
    const y = target === 0 ? 0 : target;
    if (state.lenis) {
      state.lenis.scrollTo(y, { offset: y === 0 ? 0 : -headerOffset() + 1, duration: 1.2 });
    } else if (y === 0) {
      window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
    } else {
      const top = y.getBoundingClientRect().top + window.scrollY - headerOffset();
      window.scrollTo({ top, behavior: prefersReduced ? 'auto' : 'smooth' });
    }
  }

  function initAnchors() {
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;
      const id = link.getAttribute('href');
      if (id === '#' || id.length < 2) return;
      // every "Get a Quote" opens the modal
      if (link.hasAttribute('data-quote') && Quote.el) { e.preventDefault(); Quote.open(); return; }
      const target = id === '#top' ? 0 : document.querySelector(id);
      if (target === null) return;               // section not built yet: keep default
      e.preventDefault();
      if (state.menuOpen) closeMobileMenu(false);
      scrollToTarget(target);
      if (target !== 0) {
        // move focus for keyboard / screen-reader users without a jump
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      }
    });
  }

  /* ========================================================================
     2. PRELOADER (signature moment 1) — max 1.8s, skipped on repeat visit
     ======================================================================== */
  const Preloader = {
    el: null,
    skip: false,

    init() {
      this.el = $('.preloader');
      this.skip = !this.el || html.classList.contains('no-preloader') || prefersReduced;
      if (this.skip) { if (this.el) this.el.classList.add('is-done'); return null; }

      document.body.classList.add('is-locked');
      const paths = $$('.preloader__mark path', this.el);
      const word = $('.preloader__word svg', this.el);
      const count = $('.preloader__count', this.el);
      const bar = $('.preloader__bar span', this.el);
      const counter = { v: 0 };

      // logo mark: outline draws (stroke-dashoffset), then the fill comes in
      paths.forEach((p) => {
        const len = p.getTotalLength();
        gsap.set(p, { strokeDasharray: len, strokeDashoffset: len, fillOpacity: 0 });
      });

      return gsap.timeline()
        .to(paths, { strokeDashoffset: 0, duration: 0.8, ease: MOTION.inOut, stagger: 0.06 }, 0)
        .to(paths, { fillOpacity: 1, duration: 0.35, ease: MOTION.out, stagger: 0.04 }, 0.6)
        .from(word, { yPercent: 110, duration: 0.6, ease: MOTION.expo }, 0.45)
        .from($('.preloader__sub', this.el), { autoAlpha: 0, y: 8, duration: 0.5, ease: MOTION.out }, 0.6)
        .to(counter, {
          v: 100, duration: 1.0, ease: MOTION.inOut,
          onUpdate: () => {
            count.textContent = Math.round(counter.v);
            gsap.set(bar, { scaleX: counter.v / 100 });
          }
        }, 0.1);
    },

    /** Split-panel wipe revealing the hero. */
    out() {
      const tl = gsap.timeline({
        onComplete: () => {
          this.el.classList.add('is-done');
          document.body.classList.remove('is-locked');
        }
      });
      tl.to($$('.preloader__inner', this.el), { autoAlpha: 0, y: -20, duration: 0.3, ease: MOTION.inOut }, 0)
        .to($('.preloader__panel--top', this.el), { yPercent: -100, duration: MOTION.slow, ease: MOTION.expo }, 0.15)
        .to($('.preloader__panel--bottom', this.el), { yPercent: 100, duration: MOTION.slow, ease: MOTION.expo }, 0.15);
      try { sessionStorage.setItem('auras-visited', '1'); } catch (e) { /* storage blocked: ignore */ }
      return tl;
    }
  };

  /* ========================================================================
     3. REVEAL CHOREOGRAPHY
     Order in every section: eyebrow line draws → heading lines rise →
     body fades in → CTA appears → media reveals with clip-path.
     ======================================================================== */
  function buildTextReveal(scope, splits) {
    const eyebrow = $('[data-reveal="eyebrow"]', scope);
    const eyebrowLine = eyebrow ? $('.eyebrow__line', eyebrow) : null;
    const eyebrowText = eyebrow ? $$('span:not(.eyebrow__line)', eyebrow) : [];
    const headings = $$('[data-split]', scope).filter((h) => !h.closest('.hero'));
    const fades = $$('[data-reveal="fade"]', scope);
    const ctas = $$('[data-reveal="cta"]', scope);

    const tl = gsap.timeline({ paused: true });

    if (prefersReduced) {
      tl.from([eyebrow, ...headings, ...fades, ...ctas].filter(Boolean), { autoAlpha: 0, duration: 0.6, ease: 'none' });
      return tl;
    }

    if (eyebrowLine) tl.from(eyebrowLine, { scaleX: 0, transformOrigin: 'left center', duration: 0.6, ease: MOTION.out }, 0);
    if (eyebrowText.length) tl.from(eyebrowText, { autoAlpha: 0, x: -12, duration: 0.6, ease: MOTION.out, stagger: 0.06 }, 0.1);

    headings.forEach((h) => {
      const split = splitLines(h);
      if (split) {
        splits.push(split);
        tl.from(split.lines, {
          yPercent: 110, duration: MOTION.base, ease: MOTION.out, stagger: MOTION.stagger,
          onComplete: () => split.revert()   // restore natural text so resize re-wraps cleanly
        }, 0.15);
      } else {
        tl.from(h, { autoAlpha: 0, y: 24, duration: MOTION.base, ease: MOTION.out }, 0.15);
      }
    });

    if (fades.length) tl.from(fades, { autoAlpha: 0, y: 24, duration: MOTION.base, ease: MOTION.out, stagger: MOTION.stagger }, 0.4);
    if (ctas.length) tl.from(ctas, { autoAlpha: 0, y: 16, duration: MOTION.base, ease: MOTION.out, stagger: MOTION.stagger }, 0.55);
    return tl;
  }

  function buildMediaReveal(el) {
    if (prefersReduced) return gsap.from(el, { autoAlpha: 0, duration: 0.6, paused: true });
    const img = $('img', el);
    const tl = gsap.timeline({ paused: true });
    tl.fromTo(el, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: MOTION.slow, ease: MOTION.out, clearProps: 'clipPath' }, 0);
    if (img) tl.fromTo(img, { scale: 1.15 }, { scale: 1, duration: MOTION.slow, ease: MOTION.out }, 0);
    return tl;
  }

  /** Called inside matchMedia: builds every section reveal. Returns cleanup. */
  function initReveals() {
    const splits = [];
    $$('[data-section]').forEach((section) => {
      const tl = buildTextReveal(section, splits);
      ScrollTrigger.create({ trigger: section, start: MOTION.start, once: true, onEnter: () => tl.play() });

      // media reveals trigger on their own position (they often sit lower than the heading),
      // with a short delay so they always follow the text in the choreography.
      $$('[data-reveal="media"]', section).forEach((el, i) => {
        const m = buildMediaReveal(el);
        ScrollTrigger.create({ trigger: el, start: 'top 85%', once: true, onEnter: () => gsap.delayedCall(0.35 + i * MOTION.stagger, () => m.play()) });
      });
    });
    return () => splits.forEach((s) => { try { s.revert(); } catch (e) {} });
  }

  /* ========================================================================
     4. HEADER  (section 1)
     ======================================================================== */
  function initHeader() {
    const header = $('#siteHeader');
    if (!header) return;
    let lastY = 0;

    const onScroll = (y) => {
      header.classList.toggle('is-compact', y > 80);
      if (state.menuOpen) return;
      const delta = y - lastY;
      if (y > 400 && delta > 4) header.classList.add('is-hidden');      // scrolling down
      else if (delta < -4 || y <= 400) header.classList.remove('is-hidden'); // scrolling up
      lastY = y;
    };
    if (state.lenis) state.lenis.on('scroll', (l) => onScroll(l.scroll));
    else window.addEventListener('scroll', () => onScroll(window.scrollY), { passive: true });
    onScroll(window.scrollY);

    // keyboard users: always show header when focus enters it
    header.addEventListener('focusin', () => header.classList.remove('is-hidden'));

    initDropdown();
    initMobileMenu();
  }

  function initDropdown() {
    $$('.nav__item--has-dd').forEach((item) => {
      const btn = $('button', item);
      let closeTimer;
      const open = () => { clearTimeout(closeTimer); item.classList.add('is-open'); btn.setAttribute('aria-expanded', 'true'); };
      const close = () => { item.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); };

      btn.addEventListener('click', () => (item.classList.contains('is-open') ? close() : open()));
      if (finePointer) {
        item.addEventListener('mouseenter', open);
        item.addEventListener('mouseleave', () => { closeTimer = setTimeout(close, 150); });
      }
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') { close(); btn.focus(); }
        if (e.key === 'ArrowDown' && document.activeElement === btn) { e.preventDefault(); open(); const first = $('.dropdown a', item); if (first) first.focus(); }
      });
      item.addEventListener('focusout', (e) => { if (!item.contains(e.relatedTarget)) close(); });
    });
  }

  function initScrollSpy() {
    const links = $$('.nav__link[href^="#"]');
    const setActive = (id) => links.forEach((l) => {
      const on = l.getAttribute('href') === id;
      l.classList.toggle('is-active', on);
      if (on) l.setAttribute('aria-current', 'page'); else l.removeAttribute('aria-current');
    });
    links.forEach((link) => {
      const id = link.getAttribute('href');
      const section = id === '#top' ? $('#top') : document.querySelector(id);
      if (!section) return;
      ScrollTrigger.create({
        trigger: section, start: 'top 50%', end: 'bottom 50%', refreshPriority: -1,
        onToggle: (self) => { if (self.isActive) setActive(id); }
      });
    });
  }

  /* ---- Mobile menu ---- */
  let mobileTl = null;
  function initMobileMenu() {
    const burger = $('.burger');
    const menu = $('#mobileMenu');
    if (!burger || !menu) return;

    const items = $$('.mobile-menu__list > li > *', menu);
    const foot = $('.mobile-menu__foot', menu);

    mobileTl = gsap.timeline({ paused: true, defaults: { ease: MOTION.out } })
      .fromTo(menu, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: prefersReduced ? 0.01 : 0.6, ease: MOTION.inOut })
      .from(items, { yPercent: prefersReduced ? 0 : 100, autoAlpha: 0, duration: prefersReduced ? 0.2 : 0.6, stagger: 0.06 }, prefersReduced ? 0 : 0.25)
      .from(foot, { autoAlpha: 0, y: prefersReduced ? 0 : 16, duration: 0.5 }, '-=0.4');

    burger.addEventListener('click', () => (state.menuOpen ? closeMobileMenu(true) : openMobileMenu()));

    // Expertise sub-list
    $$('.mobile-menu__link[aria-controls]', menu).forEach((btn) => {
      btn.addEventListener('click', () => {
        const sub = document.getElementById(btn.getAttribute('aria-controls'));
        const open = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!open));
        sub.hidden = open;
        if (!open && !prefersReduced) gsap.from($$('a', sub), { autoAlpha: 0, x: -12, duration: MOTION.fast, stagger: 0.05, ease: MOTION.out });
      });
    });

    // Esc + focus trap
    document.addEventListener('keydown', (e) => {
      if (!state.menuOpen) return;
      if (e.key === 'Escape') { closeMobileMenu(true); return; }
      if (e.key !== 'Tab') return;
      const focusables = [burger, ...$$('a[href], button:not([disabled])', menu)].filter((el) => el.offsetParent !== null);
      const first = focusables[0], last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    window.addEventListener('resize', debounce(() => { if (state.menuOpen && window.innerWidth >= 992) closeMobileMenu(false); }, 150));
  }

  function openMobileMenu() {
    const burger = $('.burger'), menu = $('#mobileMenu'), header = $('#siteHeader');
    state.menuOpen = true;
    menu.classList.add('is-open');
    menu.inert = false;
    header.classList.add('menu-open');
    header.classList.remove('is-hidden');
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Close menu');
    document.body.classList.add('is-locked');
    if (state.lenis) state.lenis.stop();
    mobileTl.timeScale(1).play();
    const first = $('.mobile-menu__link', menu);
    if (first) setTimeout(() => first.focus({ preventScroll: true }), 300);
  }

  function closeMobileMenu(returnFocus) {
    const burger = $('.burger'), menu = $('#mobileMenu'), header = $('#siteHeader');
    state.menuOpen = false;
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Open menu');
    header.classList.remove('menu-open');
    document.body.classList.remove('is-locked');
    if (state.lenis) state.lenis.start();
    mobileTl.eventCallback('onReverseComplete', () => { menu.classList.remove('is-open'); menu.inert = true; });
    mobileTl.timeScale(1.6).reverse();
    if (returnFocus) burger.focus();
  }

  /* ========================================================================
     5. HERO SLIDER  (section 2 · signature moment)
     ======================================================================== */
  const Hero = {
    index: 0,
    busy: false,
    paused: prefersReduced,   // no autoplay when reduced motion is requested
    userPaused: false,
    progress: null,
    kenBurns: null,

    init() {
      this.el = $('.hero');
      if (!this.el) return;
      this.slides = $$('.hero__slide', this.el);
      this.copies = $$('.hero__copy', this.el);
      this.dots = $$('.hero__dot', this.el);
      this.bars = this.dots.map((d) => $('.hero__dot-bar span', d));
      this.pauseBtn = $('.hero__pause', this.el);
      this.currentLabel = $('.js-hero-current', this.el);
      this.labels = this.dots.map((d) => $('.hero__dot-label', d).textContent.trim());
      this.next = $('.hero__next', this.el);
      if (this.next) {
        this.nextThumb = $('.hero__next-thumb', this.next);
        this.nextTitle = $('.hero__next-title', this.next);
        this.nextBar = $('.hero__next-bar span', this.next);
        this.next.addEventListener('click', () => this.goTo(this.index + 1, 1));
      }

      // initial states (hidden until intro plays)
      gsap.set(this.copies, { autoAlpha: 0 });
      gsap.set($$('.hero__controls, .hero__meta, .hero__next', this.el), { autoAlpha: 0 });

      this.dots.forEach((dot, i) => dot.addEventListener('click', () => this.goTo(i)));
      this.initKeyboard();
      this.initSwipe();

      this.pauseBtn.addEventListener('click', () => {
        this.userPaused = !this.userPaused;
        this.setPaused(this.userPaused);
        this.pauseBtn.setAttribute('aria-pressed', String(this.userPaused));
        this.pauseBtn.setAttribute('aria-label', this.userPaused ? 'Play slideshow' : 'Pause slideshow');
      });
      if (prefersReduced) {
        this.userPaused = true;
        this.pauseBtn.setAttribute('aria-pressed', 'true');
        this.pauseBtn.setAttribute('aria-label', 'Play slideshow');
      }

      // pause while keyboard focus is inside the slide content, or tab hidden, or hero off-screen
      const content = $('.hero__content', this.el);
      content.addEventListener('focusin', () => this.setPaused(true));
      content.addEventListener('focusout', () => this.setPaused(this.userPaused));
      document.addEventListener('visibilitychange', () => this.setPaused(document.hidden || this.userPaused));
      ScrollTrigger.create({ trigger: this.el, start: 'top top', end: 'bottom top', onToggle: (self) => this.setPaused(!self.isActive || this.userPaused) });
    },

    /** Intro after preloader: image settles, copy runs the choreography, controls fade up. */
    intro() {
      const img = $('img', this.slides[0]);
      const tl = gsap.timeline({
        onComplete: () => {
          // load the remaining slide images now so wipes never show a blank frame
          this.slides.forEach((s) => { const i = $('img', s); if (i) i.loading = 'eager'; });
          this.startKenBurns(img);
          this.startProgress();
        }
      });
      if (!prefersReduced) tl.fromTo(img, { scale: 1.15 }, { scale: 1, duration: MOTION.slow * 1.5, ease: MOTION.expo }, 0);
      tl.add(this.showCopy(0), 0.2)
        .to($$('.hero__controls, .hero__meta, .hero__next', this.el), { autoAlpha: 1, duration: MOTION.base, ease: MOTION.out }, 0.8)
        .from(this.next ? [this.next] : [], { x: prefersReduced ? 0 : 24, duration: MOTION.base, ease: MOTION.out }, 0.9)
        .from($('.hero__controls', this.el), { y: prefersReduced ? 0 : 20, duration: MOTION.base, ease: MOTION.out }, 0.8);
      return tl;
    },

    showCopy(i) {
      const copy = this.copies[i];
      copy.inert = false;
      copy.classList.add('is-active');
      const title = $('[data-split]', copy);
      const line = $('.eyebrow__line', copy);
      const label = $('.eyebrow > span:last-child', copy);
      const text = $('.hero__text', copy);
      const actions = $$('.hero__actions > *', copy);
      const tl = gsap.timeline();

      if (prefersReduced) return tl.fromTo(copy, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 });

      const split = splitLines(title);
      tl.set(copy, { autoAlpha: 1, y: 0 })
        .fromTo(line, { scaleX: 0 }, { scaleX: 1, transformOrigin: 'left center', duration: 0.6, ease: MOTION.out }, 0)
        .fromTo(label, { autoAlpha: 0, x: -12 }, { autoAlpha: 1, x: 0, duration: 0.6, ease: MOTION.out }, 0.1)
        .fromTo(split ? split.lines : title, { yPercent: split ? 110 : 0, autoAlpha: split ? 1 : 0 },
          { yPercent: 0, autoAlpha: 1, duration: MOTION.slow, ease: MOTION.expo, stagger: MOTION.stagger,
            onComplete: () => { if (split) split.revert(); } }, 0.15)
        .fromTo(text, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: MOTION.base, ease: MOTION.out }, 0.45)
        .fromTo(actions, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: MOTION.base, ease: MOTION.out, stagger: MOTION.stagger }, 0.6);
      return tl;
    },

    hideCopy(i) {
      const copy = this.copies[i];
      copy.inert = true;
      return gsap.to(copy, {
        autoAlpha: 0, y: prefersReduced ? 0 : -20, duration: 0.5, ease: MOTION.inOut,
        onComplete: () => copy.classList.remove('is-active')
      });
    },

    goTo(next, dirHint) {
      const total = this.slides.length;
      next = (next + total) % total;
      if (next === this.index || this.busy) return;
      this.busy = true;
      const dir = dirHint || (next > this.index ? 1 : -1);
      const cur = this.slides[this.index];
      const nxt = this.slides[next];
      const curImg = $('img', cur);
      const nxtImg = $('img', nxt);
      const media = $('.hero__media', nxt);
      const prev = this.index;

      if (this.kenBurns) this.kenBurns.kill();
      if (this.progress) this.progress.kill();

      cur.classList.remove('is-active');
      cur.classList.add('is-leaving');
      nxt.classList.add('is-active');

      const tl = gsap.timeline({
        onComplete: () => {
          cur.classList.remove('is-leaving');
          gsap.set(curImg, { xPercent: 0, scale: 1 });
          this.busy = false;
          this.startKenBurns(nxtImg);
          this.startProgress();
        }
      });
      tl.add(this.hideCopy(prev), 0);

      if (prefersReduced) {
        tl.fromTo(media, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6, ease: 'none' }, 0);
      } else {
        const from = dir > 0 ? 'inset(0% 0% 0% 100%)' : 'inset(0% 100% 0% 0%)';
        tl.fromTo(media, { clipPath: from }, { clipPath: 'inset(0% 0% 0% 0%)', duration: MOTION.slow, ease: MOTION.expo, clearProps: 'clipPath' }, 0.1)
          .fromTo(nxtImg, { scale: 1.15, xPercent: dir * 4 }, { scale: 1, xPercent: 0, duration: MOTION.slow * 1.4, ease: MOTION.expo }, 0.1)
          .to(curImg, { xPercent: -dir * 6, duration: MOTION.slow, ease: MOTION.expo }, 0.1);
      }
      tl.add(this.showCopy(next), 0.35);

      this.index = next;
      this.updateUI();
    },

    updateUI() {
      this.dots.forEach((d, i) => {
        const on = i === this.index;
        d.classList.toggle('is-active', on);
        d.setAttribute('aria-selected', String(on));
        d.tabIndex = on ? 0 : -1;
        gsap.set(this.bars[i], { scaleX: 0 });
      });
      if (this.currentLabel) this.currentLabel.textContent = String(this.index + 1).padStart(2, '0');
      this.updateNext();
    },

    /** Next-slide preview: new thumbnail wipes in from the right, title rises. */
    updateNext() {
      if (!this.next) return;
      const n = (this.index + 1) % this.slides.length;
      const src = $('img', this.slides[n]).getAttribute('src');
      const label = this.labels[n];
      this.next.setAttribute('aria-label', 'Next slide: ' + label);
      gsap.set(this.nextBar, { scaleX: 0 });

      const img = document.createElement('img');
      img.src = src; img.alt = ''; img.width = 320; img.height = 180;
      img.style.position = 'absolute'; img.style.inset = '0';
      this.nextThumb.appendChild(img);
      const title = document.createElement('span');
      title.textContent = label;
      this.nextTitle.textContent = '';
      this.nextTitle.appendChild(title);

      if (prefersReduced) { this.trimThumb(); return; }
      gsap.timeline({ onComplete: () => this.trimThumb() })
        .fromTo(img, { clipPath: 'inset(0% 0% 0% 100%)', scale: 1.15 }, { clipPath: 'inset(0% 0% 0% 0%)', scale: 1, duration: MOTION.slow, ease: MOTION.expo }, 0.25)
        .from(title, { yPercent: 110, duration: MOTION.base, ease: MOTION.out }, 0.35);
    },
    trimThumb() {
      const imgs = $$('img', this.nextThumb);
      imgs.slice(0, -1).forEach((i) => i.remove());
    },

    startKenBurns(img) {
      if (prefersReduced || !img) return;
      this.kenBurns = gsap.to(img, { scale: 1.08, duration: MOTION.autoplay + 2, ease: 'none' });
    },

    startProgress() {
      const bar = this.bars[this.index];
      if (this.progress) this.progress.kill();
      if (prefersReduced) { gsap.set(bar, { scaleX: 1 }); return; }
      this.progress = gsap.fromTo(bar, { scaleX: 0 }, {
        scaleX: 1, duration: MOTION.autoplay, ease: 'none',
        onUpdate: () => { if (this.nextBar) gsap.set(this.nextBar, { scaleX: this.progress.progress() }); },
        onComplete: () => this.goTo(this.index + 1, 1)
      });
      if (this.paused) this.progress.pause();
    },

    setPaused(p) {
      this.paused = p;
      if (this.progress) this.progress.paused(p);
      if (this.kenBurns) this.kenBurns.paused(p);
    },

    initKeyboard() {
      const list = $('.hero__pagination', this.el);
      list.addEventListener('keydown', (e) => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
        e.preventDefault();
        let n = this.index;
        if (e.key === 'ArrowRight') n = this.index + 1;
        if (e.key === 'ArrowLeft') n = this.index - 1;
        if (e.key === 'Home') n = 0;
        if (e.key === 'End') n = this.slides.length - 1;
        n = (n + this.slides.length) % this.slides.length;
        this.goTo(n, e.key === 'ArrowLeft' ? -1 : 1);
        this.dots[n].focus();
      });
    },

    initSwipe() {
      let x0 = null, y0 = null;
      this.el.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
      this.el.addEventListener('touchend', (e) => {
        if (x0 === null) return;
        const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) this.goTo(this.index + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
        x0 = y0 = null;
      }, { passive: true });
    }
  };

  /** Scroll-linked hero exit (inside matchMedia). */
  function initHeroScroll(isDesktop) {
    const hero = $('.hero');
    if (!hero || prefersReduced) return;
    const st = { trigger: hero, start: 'top top', end: 'bottom top', scrub: true };
    gsap.to($('.hero__content-wrap', hero), { y: isDesktop ? -120 : -60, autoAlpha: 0, ease: 'none', scrollTrigger: st });
    if (isDesktop) {
      gsap.to($('.hero__slides', hero), { yPercent: 18, ease: 'none', scrollTrigger: { ...st } });
      gsap.to($$('.hero__controls, .hero__meta, .hero__next', hero), { autoAlpha: 0, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: '30% top', scrub: true } });
    }
  }

  /** Mouse-move parallax on hero layers (desktop only). Returns cleanup. */
  function initHeroParallax() {
    const hero = $('.hero');
    if (!hero) return () => {};
    const layers = $$('.hero__media-inner', hero).concat($$('.hero__content', hero));
    const setters = layers.map((el) => ({
      depth: parseFloat(el.dataset.depth || 1),
      x: gsap.quickTo(el, 'x', { duration: 0.9, ease: MOTION.out }),
      y: gsap.quickTo(el, 'y', { duration: 0.9, ease: MOTION.out })
    }));
    const move = (e) => {
      const nx = e.clientX / window.innerWidth - 0.5;
      const ny = e.clientY / window.innerHeight - 0.5;
      setters.forEach((s) => { s.x(-nx * 24 * s.depth); s.y(-ny * 16 * s.depth); });
    };
    const leave = () => setters.forEach((s) => { s.x(0); s.y(0); });
    hero.addEventListener('mousemove', move);
    hero.addEventListener('mouseleave', leave);
    return () => { hero.removeEventListener('mousemove', move); hero.removeEventListener('mouseleave', leave); gsap.set(layers, { x: 0, y: 0 }); };
  }

  /* ========================================================================
     6. ABOUT  (section 3) — image parallax + blueprint draw
     ======================================================================== */
  function initAbout(isDesktop) {
    const section = $('.about');
    if (!section || prefersReduced) return;
    const media = $('.about__media', section);

    // blueprint: stroke-dashoffset drawing, scrub-linked
    const shapes = $$('.about__blueprint path, .about__blueprint circle, .about__blueprint line, .about__blueprint rect', section);
    shapes.forEach((s) => {
      const len = typeof s.getTotalLength === 'function' ? s.getTotalLength() : 1000;
      gsap.set(s, { strokeDasharray: len, strokeDashoffset: len });
    });
    gsap.to(shapes, {
      strokeDashoffset: 0, ease: 'none', stagger: 0.05,
      scrollTrigger: { trigger: media, start: 'top 85%', end: 'bottom 45%', scrub: true }
    });

    // images move at slightly different speeds (desktop only)
    if (isDesktop) {
      $$('[data-speed]', media).forEach((el) => {
        gsap.to(el, {
          yPercent: parseFloat(el.dataset.speed), ease: 'none',
          scrollTrigger: { trigger: media, start: 'top bottom', end: 'bottom top', scrub: true }
        });
      });
    }
  }

  /* ========================================================================
     7. COUNTERS  (section 4)
     ======================================================================== */
  function initCounters() {
    const items = $$('.counters__item');
    if (!items.length) return () => {};

    if (prefersReduced) {
      gsap.from(items, { autoAlpha: 0, duration: 0.6, scrollTrigger: { trigger: '.counters', start: MOTION.start, once: true } });
      return () => {};
    }

    const restore = [];
    items.forEach((item) => {
      const num = $('.js-count', item);
      const value = String(num.dataset.to);
      const original = num.innerHTML;

      // screen readers get the final number; the rolling digits are decorative
      const sr = document.createElement('span');
      sr.className = 'sr-only';
      sr.textContent = value;
      const odo = document.createElement('span');
      odo.className = 'odo';
      odo.setAttribute('aria-hidden', 'true');

      // each digit = a strip of 0–9 twice; later digits roll further (odometer feel)
      const strips = value.split('').map((d, i, arr) => {
        const digit = document.createElement('span');
        digit.className = 'odo__digit';
        const strip = document.createElement('span');
        strip.className = 'odo__strip';
        for (let k = 0; k < 20; k++) { const n = document.createElement('span'); n.textContent = k % 10; strip.appendChild(n); }
        digit.appendChild(strip);
        odo.appendChild(digit);
        const target = (i === 0 && arr.length > 1 ? 0 : 10) + parseInt(d, 10);
        return { strip, target };
      });
      num.innerHTML = '';
      num.append(sr, odo);
      restore.push(() => { num.innerHTML = original; });

      const line = $('.stat__line', item);
      gsap.set(line, { scaleX: 0 });
      ScrollTrigger.create({
        trigger: item, start: 'top 85%', once: true,
        onEnter: () => {
          strips.slice().reverse().forEach(({ strip, target }, i) => {
            gsap.to(strip, { yPercent: -(target / 20) * 100, duration: MOTION.slow * 1.4, ease: 'power3.inOut', delay: i * MOTION.stagger });
          });
          gsap.to(line, { scaleX: 1, duration: MOTION.slow, ease: MOTION.out, delay: 0.3 });
        }
      });
    });

    ScrollTrigger.batch($$('.stat__label'), {
      start: 'top 90%', once: true,
      onEnter: (batch) => gsap.from(batch, { autoAlpha: 0, y: 16, duration: MOTION.base, ease: MOTION.out, stagger: MOTION.stagger })
    });
    return () => restore.forEach((fn) => fn());
  }

  /* ========================================================================
     8. MISSION & VISION  (section 5) — subtle 3D tilt (desktop). Returns cleanup.
     ======================================================================== */
  function initTilt() {
    const cards = $$('[data-tilt], .product__media');
    const offs = cards.map((card) => {
      gsap.set(card, { transformPerspective: 1000 });
      const rx = gsap.quickTo(card, 'rotationX', { duration: 0.6, ease: MOTION.out });
      const ry = gsap.quickTo(card, 'rotationY', { duration: 0.6, ease: MOTION.out });
      const move = (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        ry(clamp(px * 12, -6, 6));     // max 6°
        rx(clamp(-py * 12, -6, 6));
      };
      const leave = () => { rx(0); ry(0); };
      card.addEventListener('mousemove', move);
      card.addEventListener('mouseleave', leave);
      return () => { card.removeEventListener('mousemove', move); card.removeEventListener('mouseleave', leave); gsap.set(card, { rotationX: 0, rotationY: 0 }); };
    });
    return () => offs.forEach((off) => off());
  }

  /* ========================================================================
     9. GLOBAL UI
     ======================================================================== */
  function initProgressAndToTop() {
    const bar = $('.scroll-progress');
    const toTop = $('.to-top');
    const ring = $('.to-top__fill');
    const CIRC = 2 * Math.PI * 24;
    if (ring) gsap.set(ring, { strokeDasharray: CIRC, strokeDashoffset: CIRC });
    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: (self) => {
        const p = self.progress;
        if (bar) gsap.set(bar, { scaleX: p });
        if (ring) gsap.set(ring, { strokeDashoffset: CIRC * (1 - p) });
        if (toTop) toTop.classList.toggle('is-visible', p > 0.08);
      }
    });
  }

  /** Custom cursor: dot + ring, contextual labels ("View", "Drag"). Desktop + fine pointer only. */
  function initCursor() {
    if (!finePointer || prefersReduced) return;
    const cursor = $('.cursor');
    if (!cursor) return;
    html.classList.add('has-cursor');
    const dot = $('.cursor__dot', cursor), ring = $('.cursor__ring', cursor), label = $('.cursor__label', cursor);
    const dx = gsap.quickTo(dot, 'x', { duration: 0.1, ease: 'power2.out' });
    const dy = gsap.quickTo(dot, 'y', { duration: 0.1, ease: 'power2.out' });
    const rx = gsap.quickTo(ring, 'x', { duration: 0.4, ease: MOTION.out });
    const ry = gsap.quickTo(ring, 'y', { duration: 0.4, ease: MOTION.out });
    gsap.set([dot, ring], { autoAlpha: 0 });

    let shown = false;
    window.addEventListener('mousemove', (e) => {
      if (!shown) { gsap.to([dot, ring], { autoAlpha: 1, duration: MOTION.fast }); shown = true; }
      dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY);
    });
    document.addEventListener('mouseleave', () => { gsap.to([dot, ring], { autoAlpha: 0, duration: MOTION.fast }); shown = false; });

    const rgb = getComputedStyle(html).getPropertyValue('--accent-rgb').trim() || '229, 211, 107';
    const setMode = (mode, text) => {
      const isLabel = mode === 'label';
      gsap.to(ring, { scale: isLabel ? 2.2 : mode === 'link' ? 1.4 : 1, backgroundColor: isLabel ? `rgba(${rgb},1)` : `rgba(${rgb},0)`, borderColor: isLabel ? `rgba(${rgb},1)` : `rgba(${rgb},.6)`, duration: MOTION.fast, ease: MOTION.out, overwrite: 'auto' });
      gsap.to(dot, { scale: mode === 'default' ? 1 : 0, duration: MOTION.fast, overwrite: 'auto' });
      label.textContent = text || '';
      gsap.to(label, { autoAlpha: isLabel ? 1 : 0, scale: isLabel ? 0.45 : 0.6, duration: MOTION.fast, overwrite: 'auto' });
    };

    document.addEventListener('mouseover', (e) => {
      const t = e.target;
      if (t.closest('input, textarea, select, [contenteditable]')) { cursor.classList.add('is-hidden'); return; }
      cursor.classList.remove('is-hidden');
      const ctx = t.closest('[data-cursor]');
      if (ctx) setMode('label', ctx.dataset.cursor);
      else if (t.closest('a, button, [role="tab"]')) setMode('link');
      else setMode('default');
    });
  }

  /** Magnetic pull on primary CTAs only (max 12px). Returns cleanup. */
  function initMagnetic() {
    const MAX = 12;
    const offs = $$('[data-magnetic]').map((el) => {
      const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: MOTION.out });
      const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: MOTION.out });
      const move = (e) => {
        const r = el.getBoundingClientRect();
        xTo(clamp((e.clientX - (r.left + r.width / 2)) / (r.width / 2), -1, 1) * MAX);
        yTo(clamp((e.clientY - (r.top + r.height / 2)) / (r.height / 2), -1, 1) * MAX);
      };
      const leave = () => { xTo(0); yTo(0); };
      el.addEventListener('mousemove', move);
      el.addEventListener('mouseleave', leave);
      return () => { el.removeEventListener('mousemove', move); el.removeEventListener('mouseleave', leave); };
    });
    return () => offs.forEach((off) => off());
  }

  /* ========================================================================
     9b. SECTIONS 6–15
     ======================================================================== */

  /** Repeated items enter with ScrollTrigger.batch (inside matchMedia). */
  function initBatches() {
    ['.exp-item', '.why-card', '.project', '.product', '.marquee--logos', '[data-reveal="field"]'].forEach((sel) => {
      const els = $$(sel);
      if (!els.length) return;
      gsap.set(els, { autoAlpha: 0, y: prefersReduced ? 0 : MOTION.distance });
      ScrollTrigger.batch(els, {
        start: 'top 90%', once: true,
        onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, y: 0, duration: MOTION.base, ease: MOTION.out, stagger: MOTION.stagger, clearProps: 'transform' })
      });
    });
  }

  /* ---- 6. Industries: full-bleed background swaps on hover / focus ---- */
  function initIndustries() {
    const sec = $('.industries');
    if (!sec) return;
    const items = $$('.industry', sec);
    const bgs = $$('.industries__bg', sec);
    let cur = 0, token = 0;

    const activate = (i) => {
      if (i === cur) return;
      items[cur].classList.remove('is-active');
      items[i].classList.add('is-active');
      const desktop = window.innerWidth >= 992;
      cur = i;
      if (!desktop || prefersReduced) { bgs.forEach((b, k) => b.classList.toggle('is-active', k === i)); return; }

      const t = ++token;
      const nb = bgs[i];
      gsap.killTweensOf([nb, $('img', nb)]);
      nb.classList.add('is-entering');
      gsap.fromTo(nb, { clipPath: 'inset(100% 0% 0% 0%)' }, {
        clipPath: 'inset(0% 0% 0% 0%)', duration: MOTION.slow, ease: MOTION.expo,
        onComplete: () => {
          if (t !== token) return;
          bgs.forEach((b, k) => { b.classList.toggle('is-active', k === i); b.classList.remove('is-entering'); });
          gsap.set(nb, { clearProps: 'clipPath' });
        }
      });
      gsap.fromTo($('img', nb), { scale: 1.15 }, { scale: 1, duration: MOTION.slow * 1.4, ease: MOTION.expo });
      gsap.fromTo($('.industry__body p', items[i]), { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: MOTION.base, ease: MOTION.out });
    };

    items.forEach((it, i) => {
      const link = $('.industry__link', it);
      link.addEventListener('mouseenter', () => activate(i));
      link.addEventListener('focus', () => activate(i));
    });
  }

  /* ---- 7. Process: pinned horizontal scroll (desktop) / drawn timeline (mobile) ---- */
  function initProcess(isDesktop) {
    const sec = $('.process');
    if (!sec) return;
    const track = $('.process__track', sec);
    const panels = $$('.process__panel', sec);
    const nodes = $$('.process__node', sec);
    const fill = $('.process__progress-fill', sec);

    if (prefersReduced) { panels.forEach((p) => p.classList.add('is-active')); return; }

    if (isDesktop) {
      const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
      const tween = gsap.to(track, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: {
          trigger: sec, start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 1,
          invalidateOnRefresh: true, anticipatePin: 1,
          onUpdate: (self) => gsap.set(fill, { scaleX: self.progress })
        }
      });
      panels.forEach((p, i) => {
        // active panel: number scales up (containerAnimation = horizontal tween)
        ScrollTrigger.create({
          trigger: p, containerAnimation: tween, start: 'left 65%', end: 'right 35%',
          onToggle: (self) => p.classList.toggle('is-active', self.isActive)
        });
        ScrollTrigger.create({
          trigger: p, containerAnimation: tween, start: 'left 65%',
          onEnter: () => nodes[i] && nodes[i].classList.add('is-active'),
          onLeaveBack: () => nodes[i] && nodes[i].classList.remove('is-active')
        });
        // image reveal: cards already on screen when the section pins reveal as the section
        // scrolls in; the rest reveal as they slide in (containerAnimation)
        const media = $('.process__media', p);
        const onScreenAtStart = p.offsetLeft < window.innerWidth * 0.9;
        const st = onScreenAtStart
          ? { trigger: sec, start: 'top 65%' }
          : { trigger: p, containerAnimation: tween, start: 'left 90%' };
        gsap.timeline({ scrollTrigger: st, delay: onScreenAtStart ? i * MOTION.stagger : 0 })
          .fromTo(media, { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: MOTION.slow, ease: MOTION.out }, 0)
          .fromTo($('img', media), { scale: 1.15 }, { scale: 1, duration: MOTION.slow, ease: MOTION.out }, 0);
      });
    } else {
      // vertical timeline: line draws down the left side
      gsap.fromTo(track, { '--line-p': 0 }, { '--line-p': 1, ease: 'none', scrollTrigger: { trigger: track, start: 'top 70%', end: 'bottom 70%', scrub: true } });
      ScrollTrigger.batch(panels, {
        start: 'top 85%', once: true,
        onEnter: (b) => gsap.from(b, { autoAlpha: 0, y: MOTION.distance, duration: MOTION.base, ease: MOTION.out, stagger: MOTION.stagger })
      });
    }
  }

  /* ---- 8a. Expertise accordion (all sizes) ---- */
  function initAccordion() {
    const items = $$('.exp-item');
    const setOpen = (item, open, animate) => {
      const head = $('.exp-item__head', item);
      const panel = $('.exp-item__panel', item);
      head.setAttribute('aria-expanded', String(open));
      panel.hidden = !open;
      if (open && animate && !prefersReduced) {
        gsap.from(panel.children, { autoAlpha: 0, y: 16, duration: MOTION.base * 0.75, ease: MOTION.out, stagger: 0.06 });
      }
    };
    items.forEach((item, i) => {
      setOpen(item, i === 0, false);
      $('.exp-item__head', item).addEventListener('click', () => {
        const willOpen = $('.exp-item__head', item).getAttribute('aria-expanded') !== 'true';
        items.forEach((other) => { if (other !== item) setOpen(other, false, false); });
        setOpen(item, willOpen, true);
        ScrollTrigger.refresh();
      });
    });
  }

  /* ---- 8b. Expertise floating image frame (desktop). Returns cleanup. ---- */
  function initExpertiseHover() {
    const list = $('.exp-list');
    const frame = $('.exp-frame');
    if (!list || !frame || prefersReduced) return () => {};
    const inner = $('.exp-frame__inner', frame);
    const xTo = gsap.quickTo(frame, 'x', { duration: 0.6, ease: MOTION.out });
    const yTo = gsap.quickTo(frame, 'y', { duration: 0.6, ease: MOTION.out });
    let curSrc = null;

    const show = (src) => {
      if (src === curSrc) return;
      curSrc = src;
      const img = document.createElement('img');
      img.src = src; img.alt = '';
      inner.appendChild(img);
      gsap.fromTo(img, { autoAlpha: 0, scale: 1.1 }, {
        autoAlpha: 1, scale: 1, duration: MOTION.base * 0.75, ease: MOTION.out,
        onComplete: () => $$('img', inner).slice(0, -1).forEach((n) => n.remove())
      });
    };
    const onEnter = (e) => { gsap.set(frame, { x: e.clientX, y: e.clientY }); gsap.to(frame, { autoAlpha: 1, scale: 1, duration: MOTION.fast, ease: MOTION.out, overwrite: 'auto' }); };
    const onLeave = () => { gsap.to(frame, { autoAlpha: 0, scale: 0.92, duration: MOTION.fast, ease: MOTION.out, overwrite: 'auto' }); $$('.exp-item').forEach((i) => i.classList.remove('is-hover')); };
    const onMove = (e) => { xTo(e.clientX); yTo(e.clientY); };
    gsap.set(frame, { scale: 0.92 });
    list.addEventListener('mouseenter', onEnter);
    list.addEventListener('mouseleave', onLeave);
    list.addEventListener('mousemove', onMove);

    const itemOffs = $$('.exp-item', list).map((item) => {
      const head = $('.exp-item__head', item);
      const enter = () => { item.classList.add('is-hover'); show(item.dataset.image); };
      const leave = () => item.classList.remove('is-hover');
      // keyboard: frame appears beside the focused row
      const focus = () => {
        const r = head.getBoundingClientRect();
        gsap.set(frame, { x: r.right - 380, y: r.top + r.height / 2 });
        show(item.dataset.image);
        gsap.to(frame, { autoAlpha: 1, scale: 1, duration: MOTION.fast });
      };
      item.addEventListener('mouseenter', enter);
      item.addEventListener('mouseleave', leave);
      head.addEventListener('focus', focus);
      head.addEventListener('blur', onLeave);
      return () => { item.removeEventListener('mouseenter', enter); item.removeEventListener('mouseleave', leave); head.removeEventListener('focus', focus); head.removeEventListener('blur', onLeave); };
    });
    return () => {
      list.removeEventListener('mouseenter', onEnter); list.removeEventListener('mouseleave', onLeave); list.removeEventListener('mousemove', onMove);
      itemOffs.forEach((off) => off());
    };
  }

  /* ---- 8c. Capabilities tabs (ARIA tabs, chips stagger in) ---- */
  function initTabs() {
    const tabs = $$('.caps__tab');
    const panels = $$('.caps__panel');
    if (!tabs.length) return;
    const select = (i, focus) => {
      tabs.forEach((t, k) => { const on = k === i; t.classList.toggle('is-active', on); t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; });
      panels.forEach((p, k) => { p.hidden = k !== i; p.classList.toggle('is-active', k === i); });
      if (focus) tabs[i].focus();
      if (!prefersReduced) gsap.from($$('li', panels[i]), { autoAlpha: 0, y: 12, duration: 0.5, ease: MOTION.out, stagger: 0.035 });
    };
    tabs.forEach((t, i) => t.addEventListener('click', () => select(i)));
    $('.caps__tabs').addEventListener('keydown', (e) => {
      const i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); select((i + 1) % tabs.length, true); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); select((i - 1 + tabs.length) % tabs.length, true); }
      if (e.key === 'Home') { e.preventDefault(); select(0, true); }
      if (e.key === 'End') { e.preventDefault(); select(tabs.length - 1, true); }
    });
  }

  /* ---- Marquees: ticker + logo rows. Speed reacts to scroll velocity, pause on hover ---- */
  function initMarquees() {
    const tweens = [];
    $$('.marquee').forEach((m) => {
      const track = $('.marquee__track', m);
      // make sure one track is wider than the viewport, then clone it for a seamless loop
      const base = track.innerHTML;
      let guard = 0;
      while (track.scrollWidth < window.innerWidth && guard++ < 4) track.insertAdjacentHTML('beforeend', base);
      const clone = track.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      m.appendChild(clone);
      if (prefersReduced) return;

      const reverse = m.classList.contains('marquee--reverse');
      const speed = parseFloat(m.dataset.speed) || 40;           // px per second
      const tw = gsap.fromTo([track, clone], { xPercent: reverse ? -100 : 0 }, {
        xPercent: reverse ? 0 : -100, duration: track.scrollWidth / speed, ease: 'none', repeat: -1
      });
      tw.paused = false;
      tweens.push(tw);
      m.addEventListener('mouseenter', () => { tw.hover = true; gsap.to(tw, { timeScale: 0, duration: 0.4, overwrite: true }); });
      m.addEventListener('mouseleave', () => { tw.hover = false; gsap.to(tw, { timeScale: 1, duration: 0.6, overwrite: true }); });
    });
    if (!tweens.length) return;
    ScrollTrigger.create({
      onUpdate: (self) => {
        const boost = 1 + Math.min(Math.abs(self.getVelocity()) / 800, 3);
        tweens.forEach((t) => {
          if (t.hover) return;
          t.timeScale(boost);
          gsap.to(t, { timeScale: 1, duration: 0.8, ease: 'power2.out', overwrite: true });
        });
      }
    });
  }

  /* ---- 9. Products: Swiper free-mode drag carousel ---- */
  function initProducts() {
    if (typeof window.Swiper === 'undefined' || !$('.products__swiper')) return;
    // eslint-disable-next-line no-new
    new window.Swiper('.products__swiper', {
      slidesPerView: 'auto',
      spaceBetween: 24,
      freeMode: { enabled: true, momentumRatio: 0.6 },
      grabCursor: !finePointer,
      keyboard: { enabled: true },
      mousewheel: { forceToAxis: true },
      navigation: { prevEl: '.products__prev', nextEl: '.products__next' },
      scrollbar: { el: '.products__scrollbar', draggable: true },
      a11y: { enabled: true },
      breakpoints: { 0: { spaceBetween: 16 }, 768: { spaceBetween: 24 } }
    });
  }

  /* ---- 10. Why Auras: cursor-following glow (desktop). Returns cleanup. ---- */
  function initWhyGlow() {
    const offs = $$('.why-card').map((card) => {
      const glow = $('.why-card__glow', card);
      if (!glow) return () => {};
      const xTo = gsap.quickTo(glow, 'x', { duration: 0.4, ease: MOTION.out });
      const yTo = gsap.quickTo(glow, 'y', { duration: 0.4, ease: MOTION.out });
      const move = (e) => { const r = card.getBoundingClientRect(); xTo(e.clientX - r.left); yTo(e.clientY - r.top); };
      const enter = (e) => { const r = card.getBoundingClientRect(); gsap.set(glow, { x: e.clientX - r.left, y: e.clientY - r.top }); gsap.to(glow, { opacity: 1, duration: MOTION.fast, overwrite: 'auto' }); };
      const leave = () => gsap.to(glow, { opacity: 0, duration: MOTION.fast, overwrite: 'auto' });
      card.addEventListener('mousemove', move);
      card.addEventListener('mouseenter', enter);
      card.addEventListener('mouseleave', leave);
      return () => { card.removeEventListener('mousemove', move); card.removeEventListener('mouseenter', enter); card.removeEventListener('mouseleave', leave); };
    });
    return () => offs.forEach((off) => off());
  }

  /** SVG line icons draw in once (stroke-dashoffset). */
  function initIconDraw() {
    if (prefersReduced) return;
    $$('.why-card__icon').forEach((svg) => {
      const shapes = $$('path, circle, rect, line', svg);
      shapes.forEach((s) => { const l = s.getTotalLength(); gsap.set(s, { strokeDasharray: l, strokeDashoffset: l }); });
      ScrollTrigger.create({
        trigger: svg, start: 'top 88%', once: true,
        onEnter: () => gsap.to(shapes, { strokeDashoffset: 0, duration: MOTION.slow, ease: MOTION.inOut, stagger: 0.1, delay: 0.2 })
      });
    });
  }

  /* ---- 11. Projects: GSAP Flip filtering + accessible lightbox ---- */
  function initProjects() {
    const filters = $$('.filter');
    const items = $$('.project');
    if (!items.length) return;
    const layout = () => {
      // every 4th visible project is a wide feature tile
      items.filter((it) => !it.classList.contains('is-hidden')).forEach((it, i) => it.classList.toggle('is-wide', i % 4 === 0));
    };
    layout();
    filters.forEach((f) => f.addEventListener('click', () => {
      const cat = f.dataset.filter;
      filters.forEach((b) => { const on = b === f; b.classList.toggle('is-active', on); b.setAttribute('aria-pressed', String(on)); });
      const st = Flip.getState(items);
      items.forEach((it) => it.classList.toggle('is-hidden', !(cat === 'all' || it.dataset.cat === cat)));
      layout();
      if (prefersReduced) return;
      Flip.from(st, {
        duration: 0.7, ease: MOTION.inOut, scale: true, absolute: true,
        onEnter: (els) => gsap.fromTo(els, { autoAlpha: 0, scale: 0.9 }, { autoAlpha: 1, scale: 1, duration: 0.5, ease: MOTION.out }),
        onLeave: (els) => gsap.to(els, { autoAlpha: 0, scale: 0.9, duration: 0.4, ease: MOTION.inOut })
      });
    }));

    const dialog = $('.lightbox');
    if (!dialog || typeof dialog.showModal !== 'function') return;
    const img = $('img', dialog), title = $('.lightbox__title', dialog), meta = $('.lightbox__meta', dialog);
    let opener = null;
    $$('.project__btn').forEach((btn) => btn.addEventListener('click', () => {
      opener = btn;
      const src = $('img', btn);
      img.src = src.getAttribute('src'); img.alt = src.alt;
      title.textContent = btn.dataset.title; meta.textContent = btn.dataset.meta;
      dialog.showModal();
      if (state.lenis) state.lenis.stop();
      if (!prefersReduced) gsap.fromTo($('.lightbox__fig', dialog), { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: MOTION.base * 0.75, ease: MOTION.out });
    }));
    const close = () => dialog.close();
    $('.lightbox__close', dialog).addEventListener('click', close);
    dialog.addEventListener('click', (e) => { if (e.target === dialog) close(); });   // backdrop
    dialog.addEventListener('close', () => { if (state.lenis) state.lenis.start(); if (opener) opener.focus(); });
  }

  /* ---- 13. CTA band background parallax ---- */
  function initCta() {
    const bg = $('.cta__bg');
    if (!bg || prefersReduced) return;
    gsap.fromTo(bg, { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: '.cta', start: 'top bottom', end: 'bottom top', scrub: true } });
  }

  /* ---- 14. Forms: validation + success state (no backend) ---- */
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  function validateFields(fields) {
    let firstBad = null;
    fields.forEach((field) => {
      const input = $('.field__input', field);
      const err = $('.field__error', field);
      if (!input || !input.required) return;
      const v = input.value.trim();
      const ok = v.length > 0 && (input.type !== 'email' || EMAIL_RE.test(v));
      field.classList.toggle('is-invalid', !ok);
      input.setAttribute('aria-invalid', String(!ok));
      if (err) {
        if (!err.id) err.id = input.id + '-err';
        input.setAttribute('aria-describedby', err.id);
        err.hidden = ok;
      }
      if (!ok && !firstBad) firstBad = input;
    });
    if (firstBad) firstBad.focus();
    return !firstBad;
  }
  function showSuccess(form, hideEls) {
    const success = $('.form__success', form);
    hideEls.forEach((el) => { el.hidden = true; });
    success.hidden = false;
    if (!prefersReduced) gsap.from(success, { autoAlpha: 0, y: 16, duration: MOTION.base, ease: MOTION.out });
    success.setAttribute('tabindex', '-1');
    success.focus();
  }
  function initContactForm() {
    const form = $('.contact__form');
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!validateFields($$('.field', form))) return;
      // TODO (WordPress): post to admin-ajax / Contact Form 7 / WPForms endpoint here
      showSuccess(form, $$('.form__row, .field, .form__submit', form).filter((el) => el.parentElement === form));
    });
  }

  /* ---- Get a Quote modal: 2 steps, focus trap, Esc / backdrop close ---- */
  const Quote = {
    init() {
      this.el = $('#quoteModal');
      if (!this.el) return;
      this.panel = $('.quote__panel', this.el);
      this.backdrop = $('.quote__backdrop', this.el);
      this.form = $('.quote__form', this.el);
      this.steps = $$('.quote__step', this.el);
      this.label = $('.quote__step-label', this.el);
      this.bar = $('.quote__progress span', this.el);

      $$('[data-close]', this.el).forEach((b) => b.addEventListener('click', () => this.close()));
      this.el.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') { this.close(); return; }
        if (e.key !== 'Tab') return;
        const f = $$('button, input, textarea, a[href]', this.panel).filter((n) => !n.disabled && n.offsetParent !== null);
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      });
      $('.quote__next', this.el).addEventListener('click', () => {
        const picked = $('input[name="industry"]:checked', this.el);
        const err = $('.quote__err', this.el);
        err.hidden = !!picked;
        if (!picked) { $('input[name="industry"]', this.el).focus(); return; }
        this.goStep(2);
      });
      $('.quote__back', this.el).addEventListener('click', () => this.goStep(1));
      this.form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!validateFields($$('.quote__step[data-step="2"] .field', this.el))) return;
        // TODO (WordPress): send FormData(this.form) to the backend here
        this.label.textContent = 'Done';
        gsap.to(this.bar, { scaleX: 1, duration: MOTION.fast });
        showSuccess(this.form, this.steps);
      });
    },
    goStep(n) {
      const from = this.steps[n === 2 ? 0 : 1], to = this.steps[n - 1];
      const dir = n === 2 ? 1 : -1;
      const swap = () => {
        from.hidden = true; to.hidden = false;
        this.label.textContent = 'Step ' + n + ' of 2';
        this.bar.style.transform = 'scaleX(' + (n / 2) + ')';
        const focusEl = $('input, button', to);
        if (focusEl) focusEl.focus();
        if (!prefersReduced) gsap.fromTo(to, { autoAlpha: 0, x: 24 * dir }, { autoAlpha: 1, x: 0, duration: 0.5, ease: MOTION.out });
      };
      if (prefersReduced) { swap(); return; }
      gsap.to(from, { autoAlpha: 0, x: -24 * dir, duration: 0.3, ease: MOTION.inOut, onComplete: () => { gsap.set(from, { clearProps: 'all' }); swap(); } });
    },
    open() {
      if (!this.el || this.isOpen) return;
      this.isOpen = true;
      this.opener = document.activeElement;
      this.el.hidden = false;
      document.body.classList.add('is-locked');
      if (state.lenis) state.lenis.stop();
      if (state.menuOpen) closeMobileMenu(false);
      const t = prefersReduced ? 0.01 : 1;
      gsap.fromTo(this.backdrop, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 * t });
      gsap.fromTo(this.panel, { xPercent: 100 }, { xPercent: 0, duration: MOTION.base * t, ease: MOTION.expo });
      gsap.from($$('.eyebrow, .quote__title, .quote__progress, .quote__step:not([hidden]) > *', this.panel), { autoAlpha: 0, y: 16, duration: 0.5 * t, ease: MOTION.out, stagger: 0.04, delay: 0.25 * t });
      setTimeout(() => { const f = $('input:not([type="hidden"]), button.quote__next', this.panel); if (f) f.focus(); }, 300);
    },
    close() {
      if (!this.isOpen) return;
      this.isOpen = false;
      const t = prefersReduced ? 0.01 : 1;
      gsap.to(this.backdrop, { autoAlpha: 0, duration: 0.35 * t });
      gsap.to(this.panel, {
        xPercent: 100, duration: 0.5 * t, ease: MOTION.inOut,
        onComplete: () => {
          this.el.hidden = true;
          document.body.classList.remove('is-locked');
          if (state.lenis) state.lenis.start();
          if (this.opener && this.opener.focus) this.opener.focus();
        }
      });
    }
  };

  /* ---- Mobile sticky Get a Quote bar ---- */
  function initStickyCta() {
    const bar = $('.sticky-cta');
    if (!bar) return;
    const set = (on) => {
      bar.classList.toggle('is-visible', on);
      html.classList.toggle('has-sticky', on);
      bar.setAttribute('aria-hidden', String(!on));
      $$('a', bar).forEach((a) => { a.tabIndex = on ? 0 : -1; });
    };
    ScrollTrigger.create({ trigger: '.hero', start: 'bottom 80%', endTrigger: '.footer', end: 'top bottom', onToggle: (self) => set(self.isActive) });
  }

  /* ---- 15. Footer wordmark fills with brand colour as you scroll in (scrub) ---- */
  function initFooter() {
    const fill = $('.footer__word-fill');
    if (!fill) return;
    if (prefersReduced) { gsap.set(fill, { clipPath: 'inset(0% 0% 0% 0%)' }); return; }
    gsap.fromTo(fill, { clipPath: 'inset(100% 0% 0% 0%)' }, {
      clipPath: 'inset(0% 0% 0% 0%)', ease: 'none',
      scrollTrigger: { trigger: '.footer__word', start: 'top bottom', end: 'bottom bottom', scrub: true }
    });
  }

  /* ========================================================================
     10. REFRESH HANDLING
     ======================================================================== */
  function initRefresh() {
    const refresh = debounce(() => ScrollTrigger.refresh(), 200);
    window.addEventListener('load', refresh);
    $$('img').forEach((img) => { if (!img.complete) img.addEventListener('load', refresh, { once: true }); });
    window.addEventListener('resize', debounce(() => ScrollTrigger.refresh(), 250));
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
  }

  /* ========================================================================
     11. BOOT
     ======================================================================== */
  /** Build everything once fonts are ready (so SplitType measures real lines). */
  function initPage() {
    initAnchors();
    initHeader();
    Hero.init();
    initProgressAndToTop();
    initCursor();
    initIndustries();
    initAccordion();
    initTabs();
    initMarquees();
    initProducts();
    initProjects();
    initContactForm();
    Quote.init();

    // Responsive motion: rebuilt automatically when a breakpoint changes
    state.mm = gsap.matchMedia();
    state.mm.add(
      { isDesktop: '(min-width: 992px)', isMobile: '(max-width: 991.98px)', canPin: '(min-width: 992px) and (min-height: 600px)' },
      (ctx) => {
        const { isDesktop, canPin } = ctx.conditions;
        // pinned section first, so every trigger below it accounts for the pin spacing
        initProcess(canPin);
        const cleanups = [initReveals()];
        initHeroScroll(isDesktop);
        initAbout(isDesktop);
        cleanups.push(initCounters());
        initBatches();
        initIconDraw();
        initCta();
        initStickyCta();
        initFooter();
        if (isDesktop && !prefersReduced) {
          cleanups.push(initHeroParallax(), initTilt(), initMagnetic(), initExpertiseHover(), initWhyGlow());
        }
        return () => cleanups.forEach((fn) => fn && fn());
      }
    );

    initScrollSpy();          // after the pin exists, refreshed last (refreshPriority -1)
    ScrollTrigger.sort();
    initRefresh();
    html.classList.add('is-ready');
  }

  async function boot() {
    if (typeof window.gsap === 'undefined' || typeof window.ScrollTrigger === 'undefined') {
      // libraries failed to load: show the static page
      html.classList.add('no-preloader', 'is-ready');
      return;
    }
    gsap.registerPlugin(ScrollTrigger, Flip);   // 1) register plugins first
    initSmoothScroll();                          // 2) Lenis synced to GSAP ticker
    if (state.lenis) state.lenis.stop();

    const fontsReady = Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), wait(1200)]);
    const pre = Preloader.init();
    await Promise.all([fontsReady, pre ? pre.then(() => {}) : Promise.resolve()]);

    initPage();
    const intro = Hero.intro();
    if (pre) {
      intro.pause();
      Preloader.out().add(() => intro.play(), 0.35);
    }
    if (state.lenis) state.lenis.start();
  }

  boot();
})();
