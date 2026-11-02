# Auras Engineering — Home Page (all 15 sections)

Plain HTML5 + CSS custom properties + vanilla JS. No build step: open `index.html` (or serve the folder).

```
index.html
css/style.css     design tokens → base → components → global UI → sections
js/main.js        one init per section, started from boot() after the preloader
images/           PLACEHOLDER SVGs (replace with real photos)
```

Libraries (CDN, pinned): GSAP 3.12.5 + ScrollTrigger + Flip, SplitType 0.3.4, Lenis 1.1.13. Swiper 11.1.4 is added in Phase 2.

**Content source:** copy, mission/vision, accreditations, design codes and agency names come from the current aurasem.ae (typos corrected).

**Phase 1 scope:** design system, preloader, global UI (progress bar, cursor, magnetic CTA, back-to-top, WhatsApp), sections 1–5.
"Get a Quote" buttons currently point at `#contact`; the modal opens them in Phase 3. Nav links to sections built later (Expertise, Products…) do nothing until those sections exist.

## Image slots — drop your photos in with these names

Replace each placeholder SVG in `images/` with a JPG/WebP of the same name (then change the extension in `index.html`, or keep `.svg` names until final export). Same aspect ratio as listed.

| File | Section | Ratio |
|---|---|---|
| `hero-oil-gas` · `hero-petrochemical` · `hero-power` · `hero-water` | Hero slides + Industries background | 16:9 |
| `about-1` / `about-2` | About | 4:5 / 4:3 |
| `process-01` … `process-08` | Process (Engineering → Delivery at Site) | 3:2 |
| `expertise-engineering` · `-fabrication` · `-installation` · `-repair` | Expertise hover frame / mobile accordion | 4:5 |
| `product-metering` · `-chemical-injection` · `-pig-launcher` · `-nitrogen` · `-pressure-vessel` · `-treatment` · `-sampling` · `-dosing` · `-control-panel` · `-heat-tracing` | Products carousel | 4:5 |
| `project-01` … `project-08` | Projects grid + lightbox | 3:2 |
| `hse` | HSE & Quality | 4:5 |
| `cta` | CTA band background | wide (≈2:1) |

## Content still needed from the client

- **Projects:** 6–8 real projects (title, client/location, category, photo). Current tiles are placeholders marked `[Client / location TBC]`.
- **Products:** confirm the 10-item list (derived from the industries copy on aurasem.ae, the live Products page is empty).
- **Client logos** for the second marquee (currently "Client logo 01…08").
- **Stats** for the counters, **brochure PDF**, **social profile URLs**, **Google Maps embed** for the facility.
- **Inner pages:** links to `engineering.html`, `fabrication-testing.html`, `installation-commissioning.html`, `equipment-repair-testing-maintenance.html`, `hse-and-quality.html`, `products.html` are placeholders for the inner pages (WordPress templates later).
- Forms have client-side validation and success states only. Hook them to the backend (CF7 / WPForms / admin-ajax) at the `TODO (WordPress)` comments in `main.js`.

## Sections & motion

| # | Section | Motion |
|---|---|---|
| 6 | Industries | Full-bleed background wipe on hover/focus, name shifts, summary rises · mobile: cards with image |
| 7 | Process | Pinned horizontal scroll, 8-node progress line, active number scales, images clip-reveal (containerAnimation) · mobile: vertical timeline drawing down |
| 8 | Expertise | Cursor-following image frame with crossfade, accordion, codes ticker (velocity-reactive), capabilities tabs with chip stagger |
| 9 | Products | Swiper free-mode drag, "Drag" cursor, tilt + shine sweep, arrows + scrollbar |
| 10 | Why Auras | Batch entry, SVG icons draw once, cursor spotlight glow, CTA card |
| 11 | Projects | Flip filtering, wide feature tiles, hover title/location, accessible `<dialog>` lightbox |
| — | HSE & Quality | Choreographed reveal, image clip-reveal |
| 12 | Agencies & clients | Two opposite marquees, pause on hover, speed reacts to scroll velocity, grayscale → colour |
| 13 | CTA band | Background parallax, large magnetic button |
| 14 | Contact | Fields stagger in, floating labels, accent underline, validation, pulsing map pin |
| 15 | Footer | Huge AURAS wordmark (traced from logo) fills with brand cream on scroll |
| — | Quote modal | 2-step (industry & need → details), slide-in panel, focus trap, Esc/backdrop close |
| — | Mobile | Sticky Get a Quote / Call bar after the hero |

---

## 1. Placeholders to replace

| Where | Placeholder | Replace with |
|---|---|---|
| Logo | Client's original logo file `images/logo.png` in header (stacked, 64px) and footer; header swaps to the mark when compact. Vector trace still used for the animated preloader and footer wordmark (`images/logo-full.svg`, `logo-mark.svg`, inline `<symbol>` sprite in `index.html`) | Swap in the client's original vector logo when available (AI/EPS/SVG). Original PNG kept as `images/logo-original.png` |
| `images/hero-oil-gas.svg` | Hero slide 1 | Oil & gas skid / plant photo, 16:9, ≥1920×1080, WebP/JPG |
| `images/hero-petrochemical.svg` | Hero slide 2 | Petrochemical piping photo, 16:9 |
| `images/hero-power.svg` | Hero slide 3 | Power generation photo, 16:9 |
| `images/hero-water.svg` | Hero slide 4 | Water treatment skid photo, 16:9 |
| `images/about-1.svg` | About, large image | Hamriyah facility / workshop, 4:5 |
| `images/about-2.svg` | About, small image | Fabrication close-up, 4:3 |
| `<link rel="preload" as="image">` in `<head>` | Points at hero SVG | Real hero image path |
| Top bar "Download Brochure" | `href="#"` | Brochure PDF URL |
| Counters | 2017 · 15+ · 200+ · 50+ | **Client to confirm** (current site shows "0+"). Edit `data-to` and the text inside each `.js-count` |
| Products / Projects | Not on current site | Client to supply product list and 6–8 projects with photos (Phase 2/3) |
| Mission & Vision heading | "Safety at the Core, Excellence as the Standard" | Approve or replace (copy written for the section header) |
| About facts | "Hamriyah Free Zone, Sharjah" / "Middle East, Europe & Africa" | Confirm |
| About "Read More" | `href="#about"` | About page URL |

When swapping images keep the `width`/`height` attributes accurate and keep `loading="lazy"` on everything below the fold.

---

## 2. CSS variables (all in `:root`, top of `css/style.css`)

**Colour**
`--brand-cream` `--accent-rgb` `--bg-dark` `--bg-dark-2` `--bg-light` `--surface` `--text-primary` `--text-secondary` `--text-inverse` `--text-inverse-2` `--line` `--line-inverse` `--accent` `--accent-hover` `--accent-ink` (accent for small text on light, AA) `--on-accent` (text on accent buttons) `--overlay` `--overlay-side`

> Palette is derived from the logo colour **#F7F5C2** (`--brand-cream`). `--accent` #E5D36B is the same hue, more saturated, for CTAs. Contrast: accent on dark 12.3:1 · dark text on accent 12.3:1 · `--accent-ink` #6F6410 on light 5.4:1. If you change `--accent`, also update `--accent-rgb` (used by the cursor and glows).

**Typography**
`--font-display` `--font-body` · `--fs-display-xl` `--fs-h1` `--fs-h2` `--fs-h3` `--fs-body-lg` `--fs-body` `--fs-caption` `--fs-eyebrow` · `--lh-display` `--lh-heading` `--lh-body` `--measure` `--tracking-eyebrow`

**Spacing (8pt)**
`--space-1` 4 · `--space-2` 8 · `--space-3` 16 · `--space-4` 24 · `--space-5` 32 · `--space-6` 48 · `--space-7` 64 · `--space-8` 96 · `--space-9` 128 · `--space-10` 160

**Grid & layout**
`--container` 1320px · `--gutter` 24px (16px < 768px) · `--cols` 12 · `--section-pad` 80→160px fluid · `--topbar-h` `--nav-h` `--nav-h-compact`

**Shape** `--radius` 2px · `--border` `--border-inverse`

**Motion** `--dur-fast` .3s · `--dur-base` .8s · `--dur-slow` 1.2s · `--ease-out` `--ease-in-out` `--ease-expo` (mirrored in the `MOTION` object at the top of `main.js`)

**Layers** `--z-header` `--z-overlay` `--z-float` `--z-cursor` `--z-preloader`

---

## 3. Phase 1 self-review

| Check | Result / change made |
|---|---|
| Same choreography + tokens in every section | Shared `buildTextReveal()` runs eyebrow → heading lines → body → CTA; media get their own trigger with a delay so they always come after the text. All durations/eases come from `MOTION`. |
| One primary CTA per viewport | Top-bar "Get a Quote" is a text link, not a button. Hero has one primary (secondary "Explore Expertise" beside it). About and Mission use text links. |
| Text readable during/after animation | Headings finish rising by ~1s; SplitType is reverted after each reveal so text re-wraps on resize. Hero copy is hidden by CSS until JS sets states (no flash) with a 4s safety net. |
| Contrast (AA) | Accent on light text was 3.6:1 → added `--accent-ink` (#b5430a, 5.1:1). Buttons use dark text on orange (5.6:1) instead of white (3.6:1). |
| Spacing / type from scale | All spacing uses `--space-*`; type uses the fluid scale. |
| Mobile designed, not squeezed | Hero copy anchors to the bottom with full-width buttons, number-only pagination, swipe support; full-screen menu; counters 2×2; Mission/Vision stacked. |
| Fixed during testing | Floating WhatsApp button covered the hero pause/scroll controls → controls reserve space. Mobile top bar wrapped → Brochure link hidden < 992px, nowrap. Counter accent lines sat on the dividers → aligned under numbers. Grid lines too strong on light sections → softened. |
| Reduced motion | No Lenis, no splitting, no parallax, no autoplay; opacity fades only. |
| Logo & palette (update) | Logo traced to vector so the preloader can draw it. Palette rebuilt from #F7F5C2; all pairs re-checked for AA. Gold accent lines/marks switch to `--accent-ink` on light sections. |
| New motion (update) | Hero next-slide preview (thumbnail wipe + synced progress bar, click to advance) · odometer counters (rolling digits, screen readers get the final number). |
| Console | No errors or warnings at 1440px and 390px (headless Chromium test). |

## Responsive & viewport fit (update)

Tested with real fonts at 1920×1080, 1536×700 (1080p laptop at 125% scaling), 1440×900, 1366×768, 1280×720, 1024×768, 768×1024 and 390×844: no overlaps, no horizontal scroll, no console errors.

- **Hero:** content anchored to the bottom, heading size capped by viewport height (`min(fluid size, 13vh)`), next-slide card hidden below 1200px wide or 640px tall, side meta hidden below 820px tall.
- **Header:** 92px with the full stacked logo → 64px compact bar with the logo mark, solid dark background; scroll progress bar sits on the header's bottom edge.
- **Process:** pinned only when the screen is ≥ 992px wide and ≥ 600px tall; card image height follows viewport height so the whole card is always visible; shorter or narrower screens get the vertical timeline.
- **Scroll-spy:** created after the pinned section with `refreshPriority: -1`, so the active menu item is correct below the pin.
