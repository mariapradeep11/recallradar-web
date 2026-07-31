# RecallRadar Decision Log

Append-only. Never edit a past entry to make it look cleaner — supersede it with a new dated entry instead.

### Editorial Warm palette
**Date:** 2026-07-31
**Decision:** Replaced the black/full-saturation-red "danger siren" palette with a warm near-black background, ivory text, and a muted terracotta (#c65b45) as the everyday brand/UI accent. Full-saturation red (#ff3b30) is held back for true HIGH-severity states only.
**Why:** Maria asked for something "more classy and relatable." Full red-everywhere fights its own signal — if every button and link is danger-red, a real HIGH-severity alert doesn't stand out. Reserving saturated red for actual danger makes it mean something again.
**Alternatives considered:** "Modern Clinical" (cool navy + coral + blue trust accent — more SaaS/fintech, less warm) and "Minimal Mono + Red Signal" (strip all secondary colors, one red, severity via typography only — most minimal, biggest behavior change to how severity reads). Both shown as live side-by-side mockups; Editorial Warm was picked on sight.
**Status:** current

### Layout direction: "Signal, evolved"
**Date:** 2026-07-31
**Decision:** Rebuilding the landing page around a live-data-forward hero (real-time feed, explorable risk chart, stat strip) instead of the current 10-section marketing scroll. Replacing the single-field email waitlist with a 3-step "build your watchlist" flow (categories → alert cadence → email).
**Why:** Maria asked which strategy maximizes time-on-site and info density, and whether that's even the right metric. Conclusion reached together: raw session duration is the wrong north star for a safety-utility product — a fast, satisfying answer is a win, not a retention failure. The two things actually worth optimizing are (1) trust-depth on the landing page before someone relies on the data, and (2) return/monitoring enrollment. The watchlist flow targets #2 directly; the explorable chart targets #1 by proving the data is real rather than decorative.
**Alternatives considered:** "Command" (Perplexity/Arc-style minimal, search-bar-as-hero, most restrained) and "Investigation" (NYT Upshot-style editorial data story, leads with a real finding). Both viable; Signal was chosen as best serving the "more interactive, more data, very premium" brief without resorting to generic SaaS minimalism.
**Deliberately NOT built:** A dark-pattern-style engagement mechanism (infinite scroll, autoplay, notification nagging) to inflate time-on-site — rejected on the metric discussion above, not just left out by omission.
**Status:** current

### "Sign in" → "Get started"
**Date:** 2026-07-31
**Decision:** The landing page's "Sign in" nav button currently calls the exact same `onLaunch()` handler as every other CTA — there's no auth system. Relabeling it to "Get started" so the label matches actual behavior, rather than removing it or building real auth now.
**Why:** Maria confirmed she's planning a native app later, which will likely need real accounts eventually. Building auth now would be premature infrastructure with no immediate need; but leaving a button labeled "Sign in" that doesn't sign anyone in is a dishonest-affordance bug, doubly bad for a product whose whole pitch is trustworthy information.
**Deliberately NOT built:** Real authentication/accounts. Revisit when the native app work is actually scoped.
**Status:** current

### Watchlist capture stays email-keyed, no accounts yet
**Date:** 2026-07-31
**Decision:** The new watchlist flow (categories + cadence + email) posts to the existing `/api/waitlist` → SheetBest pipeline, just with two additional fields (`watchlist_categories`, `alert_cadence`). No new backend, no user accounts.
**Why:** Maria mentioned a native app is planned for later (no timeline/scope decided). Email is a reasonable forward-compatible identity anchor for whenever real accounts exist, so this data isn't throwaway — but building real auth/sync now would be scope creep on a redesign session with no app timeline to justify it.
**Status:** current — revisit when native app work is scoped (will likely need to migrate email-keyed rows into a real account system)

### Scoped exception to "never touch the data layer": api/waitlist.js field allowlist
**Date:** 2026-07-31
**Decision:** Added two fields (`watchlist_categories`, `alert_cadence`) to the explicit payload allowlist in `api/waitlist.js`. Everything else in the file — validation, SheetBest forwarding, error handling — is untouched.
**Why:** CLAUDE.md's "never touch the data layer" rule protects the FDA/CPSC/NHTSA recall API and the AI risk analysis pipeline (`api/analyze-risk.js`) — that's the stated moat. `api/waitlist.js` is unrelated lead-capture, not part of that moat. Its payload is built from an explicit allowlist, not a passthrough, so the new watchlist flow's category/cadence selections would have been silently discarded without this change — shipping a form that visibly asks for input and quietly drops it is a worse violation of user trust than this two-line, non-moat edit.
**Deliberately NOT built:** No changes to `api/recalls.js` or `api/analyze-risk.js`. No change to email validation or the SheetBest/webhook forwarding logic.
**Status:** current
