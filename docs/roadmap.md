# RecallRadar Roadmap

Status values: Planned / In Progress / Done / Deferred / Out of scope

## Redesign & Cleanup (started 2026-07-31)

| Item | Status | Note |
|---|---|---|
| Engineering hygiene (dead code, banned props, SVG IDs, 3D rule violations, gitignore, unused deps, typescript, eslint) | Done | typecheck + lint scripts now real and passing |
| Editorial Warm design tokens in `src/index.css` | Done | Central `--rr-*` custom properties, swept across all components |
| Landing page rebuild ("Signal" layout) | Done | Live feed, explorable chart, watchlist flow, real footer — build/typecheck/lint clean |
| App view cleanup (fake confidence callout, dead nav links, HistoryPanel revival, guidance consolidation) | Done | Executes CLAUDE.md's existing Phase 2 backlog |
| Visual browser verification (dev server + click-through) | Blocked | Headless Chromium won't spawn pages in this sandbox (tried Playwright direct launch, `--no-sandbox`, disabled sandbox entirely, raw binary invocation — all hang/fail silently). Verified via typecheck/lint/build (all clean) + Vite module-transform checks instead. Needs a human pass in a real browser. |
| Image optimization (91MB `public/images`) | Deferred | Independent of redesign, follow-up pass |
| Native app | Out of scope | Planned by Maria for later; no timeline/scope yet — see decision-log |

## Legacy phase plan (CLAUDE.md, pre-redesign)

- Phase 1 — Done: dark CSS foundation, new nav, 100vh photo hero, search bar with barcode button.
- Phase 2 — superseded by "App view cleanup" above (recall card redesign, metadata grid, timeline, checklist, recent scans).
- Phase 3 — TODO, not yet scheduled: scroll/parallax UX.
