# Auras Engineering & Manufacturing FZC: premium website

Live: https://mydeen144.github.io/auras-website/

Plain HTML + CSS + vanilla JS. No build step. Open `index.html` or serve the folder.

```
index.html      full page (all client content from aurasem.ae)
css/site.css    base design, sections, responsive
css/extra.css   design layer 2 (light section, bento, hotspots, cursor, pipeline nav, footer wordmark)
js/site.js      smooth scroll (Lenis), reveals, pinned services story, three.js 3D model
js/extra.js     cursor, ghost numbers, header theme, section expand, footer fill
v1/             previous version of the home page (kept for reference)
```

Theme: navy `#0d384f`, cream `#f7f5c2`, blue `#349cfc`, Quicksand.
3D: a flanged pipe + gate valve that goes from blueprint wireframe to solid steel as you scroll. Falls back to a normal page without WebGL or with reduced motion.
Libraries (CDN): Lenis 1.1.13, three.js r159.
