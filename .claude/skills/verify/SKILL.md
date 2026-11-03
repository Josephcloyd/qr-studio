---
name: verify
description: Full QR Studio verification — typecheck, lint, unit+decode tests with coverage, privacy audit, static build, built-output audit and cross-browser E2E. Use before committing, after any change to QR rendering, exports, storage/network code, or when asked to verify the app.
---

# Verify QR Studio

Run the gates in order and stop at the first failure. Fix the cause — never skip, suppress, or loosen a check (especially privacy or decode checks).

1. `npm run typecheck`
2. `npm run lint`
3. `npm run test:coverage` — unit tests, decode tests (resvg + jsQR), 80% coverage gate
4. `npm run audit:privacy` — unreviewed fetch/storage/tracking/server code fails
5. `npm run build` — must stay a fully static export (every route `○ Static`)
6. `npm run audit:privacy -- --build` — no external origins in built HTML; CSP present
7. `npm run test:e2e` — Chromium, Edge, Firefox, WebKit, mobile Chrome, mobile Safari

When a QR style, preset or template changes, also confirm `tests/decode/*` covers it.

Report results as a short table (gate → pass/fail + key numbers). If a privacy test fails, treat it as a release blocker and explain exactly which request or storage write caused it.
