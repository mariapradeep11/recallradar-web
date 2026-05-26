# RecallRadar — Claude Code Project Guide

## What This Is
Consumer product recall intelligence app. Users scan barcodes or search product names to find FDA recall data, understand risk severity, and get actionable guidance. The moat is the FDA API + AI risk analysis pipeline — never touch the data layer. Only improve the visual/UX layer.

## Stack
- React 18 + TypeScript + Vite (`src/App.tsx` is the root; `main.jsx` imports it)
- Three.js / React Three Fiber (`@react-three/fiber`, `@react-three/drei`)
- Framer Motion (`motion`, `AnimatePresence`) for all transitions
- openFDA API for recall data (no API key needed for low volume)
- SheetBest API (`api.sheetbest.com`) for waitlist email capture
- Node at `/opt/homebrew/bin/node` (not in default PATH — use full path)

## Run / Build
```bash
/opt/homebrew/bin/npm run dev     # → http://localhost:5173
/opt/homebrew/bin/npm run build   # zero-error target
```

## Design System

### Colors
| Token | Value | Use |
|-------|-------|-----|
| Background | `#000` (landing) / `#050505` (app) | Page background |
| Surface | `rgba(255,255,255,0.04–0.06)` | Cards, panels |
| Border | `rgba(255,255,255,0.06–0.10)` | Dividers, card edges |
| Accent red | `#ff3b30` | CTAs, badges, glow rings, danger |
| Red glow | `#ff5540` (core), `#ff6050` (sharp edge) | 3D equatorial ring |
| Text primary | `#fff` | Headlines, labels |
| Text secondary | `rgba(255,255,255,0.4–0.55)` | Body copy, nav links |
| Text muted | `rgba(255,255,255,0.22–0.32)` | Eyebrow labels |
| Success green | `#34c759` | System online dot, confirmation |

### Typography
- **Headings (h1, h2):** `Georgia, 'Times New Roman', serif` — weight 400, tight tracking (`-0.03em` to `-0.04em`)
- **Brand / logo:** `'Josefin Sans', 'Futura', system-ui` — weight 300, tracking `0.32em`
- **Body / UI:** `Inter, system-ui, -apple-system` — weight 400–700
- **Eyebrow labels:** all-caps, `0.18–0.22em` letter-spacing, `rgba(255,255,255,0.28)` color, `0.7–0.75rem`

### Spacing
- Page max-width: `1200px`, centered
- Page padding: `clamp(20px, 4vw, 48px)` horizontal
- Hero min-height: `100vh`
- Section padding: `80–96px` top/bottom

## App Architecture

### View Routing (App.tsx)
`view` state: `'landing' | 'app'`
- `view === 'landing'` → renders `<LandingPage onLaunch onCategory />`
- `view === 'app'` → renders the search/results interface

### Key Components

| File | Role |
|------|------|
| `src/LandingPage.tsx` | Marketing landing page. 3D globe hero, category bar, features, footer CTA. Has its own email capture for waitlist. |
| `src/App.tsx` | Search + results interface. FDA API calls, recall cards, premium modal, barcode scanner trigger. |
| `src/PhotoHero.jsx` | Background for the app hero: food photo parallax + `TargetOrbit` 3D rings. Props: `query`, `category`. |
| `src/LandingPage.tsx → GlobalOrb` | 3D metallic sphere with wireframe grid, equatorial red glow ring, two orbit rings, stars. |
| `src/PhotoHero.jsx → TargetOrbit` | Face-on concentric rings (ringGeometry) + orbiting red dot. |
| `src/BarcodeScanner.jsx` | Camera barcode scan modal using `@zxing/browser`. |
| `src/RiskIntelligence.jsx` | Inline risk analysis card on each recall result. |
| `src/FloatingPhotos.jsx` | Floating product images shown when results exist. |
| `src/photoMap.js` | Maps search keywords → local image paths. Exports `resolveAllPhotos`, `preloadPhoto`, `categoryGlow`. |

### FDA API Endpoints
```
food:   https://api.fda.gov/food/enforcement.json
drug:   https://api.fda.gov/drug/enforcement.json
device: https://api.fda.gov/device/enforcement.json
```
Pattern: `?search=${encodeURIComponent(term)}&limit=10`

### Category Map
| UI Label | `Category` type | FDA endpoint |
|---|---|---|
| Food | `"food"` | food enforcement |
| Medicine | `"drug"` | drug enforcement |
| Medical Devices | `"device"` | device enforcement |
| Consumer Products | `"consumer"` | (no FDA endpoint — shows CPSC links) |
| Vehicles | `"consumer"` | (same as consumer) |

## 3D Rules
- All Three.js geometry uses `side={2}` (DoubleSide) on `meshBasicMaterial`
- Face-on rings use `ringGeometry` (not tilted `torusGeometry`) — avoids flat-ellipse artifact
- Equatorial glow = 3 stacked torus meshes: wide bloom (low opacity) + core band + sharp edge line
- `meshStandardMaterial` for metallic sphere: `metalness={0.96}`, `roughness={0.07}`
- SVG filter IDs must be unique per page — use `lp` prefix in LandingPage, `nav` prefix in App nav

## SVG / JSX Rules
- All SVG camelCase: `stopColor`, `stopOpacity`, `strokeLinecap`, `strokeLinejoin`, `strokeWidth`
- Filters and gradients: always `filter="url(#id)"` — unique IDs if multiple SVG contexts on same page
- Inline styles only — no CSS modules, no Tailwind

## Phase Plan

### Phase 1 — DONE
Dark CSS foundation, new nav (Horizon logo + RECALLRADAR text + red rule), 100vh photo hero, left-aligned serif heading, search bar with barcode button, fixed triple-render bug.

### Phase 2 — TODO
Recall result card redesign: product image, HIGH/MEDIUM/LOW badge, metadata grid (recall date / number / company / affected lots), confidence bar, 5-stage horizontal timeline (Reported → FDA Verified → Company Alert → Retail Pullback → Consumer Alert), "What to do" checklist with × icons, Recent Scans strip.

### Phase 3 — TODO
Scroll/parallax UX: scroll-snap sections, search triggers smooth scroll into results, parallax on hero image, landing transitions smoothly into search interface.

## Waitlist / Email
SheetBest endpoint: `https://api.sheetbest.com/sheets/a5c4ecd4-7684-48f7-9cd0-8ccf090c0b7a`
POST JSON: `{ email, product, source, category?, search_query?, timestamp }`

## Conventions
- Inline styles throughout — no CSS modules
- `clamp()` for all responsive font/spacing values
- Framer Motion `whileInView` + `viewport={{ once: true }}` for scroll-triggered reveals
- `AnimatePresence` wraps any conditionally rendered element that should animate out
- No comments unless the WHY is non-obvious
- Never add `hasResults` or `isSearching` back to PhotoHero — those props were removed
