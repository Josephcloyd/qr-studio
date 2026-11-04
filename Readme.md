# QR Studio

**Create QR codes. Design them your way.** A free, privacy-first QR code generator and design studio from **GetLaunch Ph**.

Generate QR codes for 10 kinds of content, style them, and design complete layouts around them, such as business cards, menus, Wi-Fi signs, invitations, flyers and posters. Then export PNG, SVG or PDF. Everything happens in your browser. There's no account, no uploads and no cloud storage.

## Features

- **GetLaunch Ph branding**: the same dark, green-accented look as ResumeFlow, with a light theme toggle, and a Support button that opens a GCash donation QR. Donations are optional and the tool stays free.
- **QR generator** (home page `/`, with the 20 templates directly below): website, text, Wi-Fi, contact (vCard 3.0), email, phone, SMS, WhatsApp, location and calendar event codes, each with inline validation. All codes are static: no redirects and no scan tracking.
- **QR styling**: 6 module shapes, corner frame and dot styles, solid and gradient colors, transparent backgrounds, error correction, quiet zone, and a center logo with a plate. There are 10 curated looks.
- **Scannability first**:
  - Hard limits cover the quiet zone and logo size, error correction rises automatically when you add a logo, and unreliable corner pairings are disabled.
  - Readability warnings flag contrast, inversion, logo coverage and printed size.
  - A live **scan check** decodes the real rendered code in your browser.
  - Every export is decoded again before download.
- **Design studio** (`/studio`):
  - An SVG canvas with move, resize, rotate, smart guides, a snap grid, zoom, pan and pinch.
  - Inline text editing, undo/redo, copy/paste, duplicate, layers, lock/hide, align/distribute, and keyboard shortcuts.
  - Text, images, shapes, lines, frames and icons, plus backgrounds (colors, gradients, patterns, images).
  - Canvas presets in mm, in or px with a DPI setting.
  - A dedicated touch layout for phones.
- **20 editable templates** in 5 categories (Business, Restaurant, Events, Marketing, Personal).
- **Exports**:
  - PNG at up to 600 DPI with DPI metadata and optional transparency.
  - Vector SVG with images and fonts embedded and no `blob:` links.
  - Print PDF in A4, A5, Letter or custom sizes.
  - An editable `.qrstudio.json` project file that you can import again.

## Getting started

Requirements: Node.js 20+ (developed on Node 24) and npm.

```bash
npm install
npm run dev          # http://localhost:3000
```

Build the static site:

```bash
npm run build        # outputs plain HTML/CSS/JS to ./out
npm run serve        # preview ./out at http://localhost:4173
```

Deploy `out/` to any static host. `public/_headers` carries the security headers for hosts that support that file (Netlify, Cloudflare Pages). On other hosts, configure the same headers. A CSP `<meta>` tag is also built into every page. The site expects to be served from the domain root.

## Quality checks

```bash
npm run typecheck
npm run lint
npm run test:coverage      # unit + QR decode tests, 80% coverage gate
npm run audit:privacy      # source audit (add -- --build to audit ./out)
npx playwright install     # once
npm run test:e2e           # Chromium, Edge, Firefox, WebKit, mobile Chrome & Safari (needs a build)
npm run verify             # all of the above in order
```

## How it works

| Concern    | Approach                                                                                                                                                                         |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| QR matrix  | [`qrcode`](https://www.npmjs.com/package/qrcode), with UTF-8 byte mode so any language works                                                                                     |
| QR styling | Our own pure SVG renderer (`src/lib/qr/layout.ts`), which turns the matrix and style into vector paths                                                                           |
| Editor     | A typed, immutable document model rendered by React as SVG. The same renderer draws the canvas, thumbnails and every export. State is held in Zustand with snapshot undo history |
| Images     | Read with the File API, downscaled locally if larger than 4096 px, kept in memory behind object URLs that are released when no longer used                                       |
| SVG export | `renderToStaticMarkup` in the browser, with images inlined as `data:` URIs and the fonts used embedded as `@font-face`                                                           |
| PNG export | SVG rasterized onto a canvas at the chosen DPI, with a `pHYs` chunk added so print software reads the DPI                                                                        |
| PDF export | [`jsPDF`](https://www.npmjs.com/package/jspdf), placing the rasterized design at exact physical size (150–600 DPI)                                                               |
| Scan check | [`jsQR`](https://www.npmjs.com/package/jsqr), loaded on demand, decodes the rendered pixels locally                                                                              |
| UI         | Next.js 16 (static export), React 19, Tailwind CSS 4, Radix primitives, Lucide icons, react-colorful                                                                             |
| Fonts      | 9 open-license (OFL) families self-hosted in `public/fonts`, with no font CDN                                                                                                    |

## Privacy model

- **On your device:** QR generation, styling, image reading, editing, and the PNG/SVG/PDF and project exports and imports.
- **What leaves the browser:** only ordinary requests for the site's own files (HTML, JS, CSS, fonts), which your browser makes to load the page. The host sees those requests and your IP address, as with any website. QR content, images and designs are never sent.
- **Never:** accounts, databases, cloud storage, analytics, trackers, third-party scripts, auto-saving to browser storage, or redirect/tracking QR codes.
- **Enforced by:**
  - A static export with no server code.
  - A Content-Security-Policy with `connect-src 'self'`, so other origins are blocked by the browser itself.
  - A no-referrer policy.
  - `scripts/privacy-audit.mjs` in CI.
  - E2E tests that record every network request and check that browser storage stays empty during a full create, upload and export session.

See `/privacy` in the app for the user-facing explanation.

## Known limitations

- PDFs embed a high-resolution raster of the design (300 DPI by default), not vector paths. SVG export is fully vector.
- Text uses the 9 bundled fonts or generic system fonts. Fonts installed on your computer can't be listed (the Local Font Access API isn't used), and system fonts can't be embedded in SVG exports.
- With several elements selected, you can move, align, distribute, layer, duplicate and delete them, but resizing and rotating work on one element at a time.
- Very large prints at high DPI are capped to browser canvas limits (about 64 MP on desktop, 16 MP on mobile). The export dialog tells you when it reduces resolution.
- Scan checks use jsQR, which is stricter than most phone cameras. Always test-scan your final print with real phones.
- Non-Latin text renders with system fallback fonts. The bundled fonts cover Latin script, including Filipino.

## License & credits

© GetLaunch Ph. Bundled fonts are licensed under the SIL Open Font License (see the `@fontsource` packages). Icons are from [Lucide](https://lucide.dev) (ISC).
