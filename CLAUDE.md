# QR Studio — project instructions

Free, privacy-first QR code generator and design studio by **GetLaunch Ph**. Next.js 16 static export; everything runs in the browser. No pricing, accounts, upsells or backend — ever.

@AGENTS.md

## Non-negotiable privacy rules

These are product requirements, enforced by `scripts/privacy-audit.mjs`, the CSP and `e2e/privacy.spec.ts`. Never weaken them to make something work.

1. **No server-side anything.** `output: "export"` only. No API routes, route handlers, server actions, middleware/proxy, databases, auth, or cloud storage.
2. **User content never leaves the browser.** QR payloads, uploaded images, designs and project files are created, edited and exported locally. No `fetch`/XHR/WebSocket/`sendBeacon` with user data. The only allowed `fetch` is `src/features/export/fonts.ts` (reads our own `/fonts/*.woff2`).
3. **No automatic persistence.** Never write designs to localStorage, sessionStorage, IndexedDB or cookies. Saving = the user downloads a `.qrstudio.json` file. Refresh must not restore a design.
4. **No third parties.** No analytics, trackers, CDNs, remote fonts (`next/font/google` is banned), remote images, or external QR/image services. Fonts live in `public/fonts` (copied by `npm run fonts:copy`).
5. **Imported files are untrusted.** Validate with `src/lib/model/schema.ts`; images may only be embedded `data:` URIs; never allow external URLs into a document.
6. **Object URLs** for uploads go through `src/lib/assets/objectUrls.ts` and must be revoked when assets are removed / a design is replaced (`features/assets/release.ts`).
7. **CSP** lives in `src/lib/security/csp.ts`, `public/_headers` _and_ `vercel.json` (Vercel ignores `_headers`) — keep all three in sync; the privacy audit checks it. `connect-src 'self'` must stay.
8. **Scannability beats decoration.** Hard limits live in `sanitizeQrStyle` (`src/lib/qr/style.ts`): min quiet zone, logo size caps per EC level, EC raised to ≥ Q with a logo, safe finder pairings only, solid functional patterns for dot/diamond styles. Any new QR style must be added to the decode tests and pass.

## Architecture

```
src/lib/          Pure, framework-free logic (unit-tested, ≥80% coverage)
  qr/             content types, payload encoders, matrix (qrcode), layout → SVG paths, readability rules, style limits
  model/          typed DesignDocument, immutable ops, history, factories, zod import schema, units/presets
  geometry/       rotation-aware transforms, snapping, path builders
  text/           wrapping shared by editor + export (measure is injected)
  assets/         File API intake, object URL registry
  project/        .qrstudio.json serialize/parse/validate
  export/         PNG pHYs (DPI) writer
src/render/       React SVG renderers — ONE renderer for canvas, thumbnails and all exports
src/features/
  generator/      home page (/) generator
  qr-editor/      shared QR forms, style/logo controls, live scan check (jsQR)
  studio/         editor: store (zustand), canvas viewport + gestures, panels, dialogs, mobile layout
  export/         SVG/PNG/PDF pipeline (browser-only), scan verification before download
  templates/      20 templates authored with templates/kit.ts (fractions of the artboard)
  landing/        template shelf shown on the home page and /templates
src/app/          routes: / (generator + templates), /templates, /privacy, /studio (client-only via next/dynamic ssr:false)
```

Key conventions:

- **Document units** = CSS px at 96 DPI (1 in = 96). Display units (mm/in/px) are presentation only.
- **Immutability**: document ops return new objects; history stores snapshots. Drags use `beginGesture/updateGesture/endGesture` so one gesture = one undo step; slider edits pass a coalescing `key`.
- **Element order = layer order** (last is front).
- Zustand selectors returning new arrays/objects must use `useShallow`.
- Browser-only code (canvas, File API, `document`) must not run during prerender — guard in effects or load via `ssr: false`.
- React Compiler lint is on: don't `setState` synchronously inside effects; derive state instead.
- Files < 400 lines where practical; functions small; no `console.log`.

## Commands

| Task                                    | Command                                                      |
| --------------------------------------- | ------------------------------------------------------------ |
| Dev server                              | `npm run dev`                                                |
| Type check                              | `npm run typecheck`                                          |
| Lint                                    | `npm run lint`                                               |
| Unit + decode tests (coverage gate 80%) | `npm run test:coverage`                                      |
| Privacy audit (source / built output)   | `npm run audit:privacy` · `npm run audit:privacy -- --build` |
| Production build → `out/`               | `npm run build`                                              |
| Serve `out/` locally                    | `npm run serve` (port 4173)                                  |
| E2E (6 browser profiles, needs a build) | `npm run test:e2e`                                           |
| Everything                              | `npm run verify`                                             |

E2E runs against the built static export. Run `npx playwright install` once. The `edge` project needs Microsoft Edge installed.

## Testing notes

- `tests/decode/` renders SVG with resvg and decodes with jsQR (independent of the generator). Add new styles/templates there.
- E2E helpers in `e2e/helpers.ts`; use `gotoReady()` before typing (waits for `html[data-hydrated]`).
- `e2e/privacy.spec.ts` asserts every request is a same-origin GET/HEAD without a body and that browser storage stays empty — keep it green.

## Branding & UI

- GetLaunch Ph family look (matches ResumeFlow): dark graphite UI by default, green brand accent, gold "Support" button. Tokens live in `src/app/globals.css` (`:root` = dark, `[data-theme="light"]` = light). Use tokens (`bg-primary`, `text-accent-ink`, `bg-gold-soft`…), never raw colors, in UI chrome.
- The theme toggle is in-memory only (no storage writes, by design) and resets on reload.
- Header layout: logo + "by GetLaunchPh", segmented product nav (Generator · Templates · Studio), theme toggle, Support, primary action.
- Home (`/`) is the generator with the template shelf below — there is no marketing landing page.
- Support opens a GCash donation dialog (`src/components/site/Support.tsx`) showing `public/support/gcash-qr.png`, a static same-origin file. If you replace that image, verify it still decodes to the intended InstaPay payload.
