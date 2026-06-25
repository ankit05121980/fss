# Lumenore — FSS Pharmaceutical Supply Chain Visibility & DSCSA Readiness (POC)

A production-quality proof-of-concept that demonstrates how **Lumenore** gives Frontier
Scientific Solutions (FSS) end-to-end pharmaceutical supply-chain visibility and **DSCSA
readiness**. It delivers six analytics dashboards plus three intelligence experiences
(AskMe, Do You Know, Predictive), all driven by a single deterministic, internally-reconciled
mock dataset served through a swappable data-access layer.

> **POC powered by realistic demo data.** There is no live connection to FSS systems. The code,
> however, is written to a production standard — typed end-to-end, clean architecture, polished
> enterprise UX, and a one-file swap point for real connectors.

The entire experience is anchored to one **golden-thread scenario**: serialized COVID-19 mRNA
vaccine batch **`VX-2026-001`** travelling Germany → US hospital network, with an ~18h Newark
customs delay that causes a 10 °C cold-chain excursion, and recall **`RCL-2026-001`**
(24,500 impacted / 24,120 located / 380 outstanding).

---

## Quick start

```bash
npm install
npm run dev
```

Open <http://localhost:3000> — you'll be redirected to `/executive`.

### Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | ESLint (zero warnings target) |
| `npm run typecheck` | `tsc --noEmit` (strict) |
| `npm run format` | Prettier write |
| `npm run seed:check` | Verify dataset determinism + golden-thread reconciliation |
| `npm run askme:check` | Verify all 9 AskMe reference questions classify & answer correctly |

---

## Tech stack

- **Next.js 16 (App Router) + TypeScript** (strict; no `any`, no `@ts-ignore`)
- **Tailwind CSS v4** + **shadcn/ui** (Radix primitives) + **lucide-react**
- **Recharts** (gauge, line, area, bar, scatter, composed) and a custom heatmap
- **react-leaflet + OpenStreetMap** tiles (no API token) for the maps
- **@tanstack/react-table** (tables) and **@tanstack/react-query** (data fetching/state)
- **date-fns**, **next-themes**, a seeded **mulberry32** PRNG for deterministic data

---

## Architecture

### The data contract (single source of truth)

```
React component
  → React Query hook            (lib/hooks/useAnalytics.ts)
    → fetch('/api/...')         (Next.js Route Handlers in app/api/**)
      → lib/data/access.ts      (the ONLY data-access layer)
        → lib/data/seed.ts      (deterministic in-memory dataset, generated once)
```

- **The UI never imports the seed directly.** It always goes through React Query → the API →
  the access layer. This makes the network/loading/error behaviour feel real while staying
  mock-driven.
- **Engines** (`lib/engines/askme.ts`, `insights.ts`, `predictive.ts`) run server-side inside
  route handlers and read through the access layer, so the full dataset never ships to the client
  and every answer is deterministic.

### Determinism

- One `mulberry32` PRNG seed generates the entire dataset **once** (memoized singleton).
- A fixed **`DEMO_NOW`** (`lib/utils/date.ts`, `2026-06-25`) is the app's notion of "now". Every
  relative-time calculation ("active", "delayed", "last week", ETAs) uses it instead of
  `Date.now()`, so AskMe / Do You Know / Predictive return identical answers on every run.
- All KPIs, insights and predictions are **computed** from the data — never hard-coded.

### Project structure

```
app/
  (dashboard)/            # app shell + the 9 pages (executive, control-tower, traceability,
                          #   cold-chain, recall, partners, askme, insights, predictive)
  api/                    # mock route handlers (entities, trace, search, analytics, engines)
lib/
  data/types.ts           # all TypeScript interfaces (the data model)
  data/seed.ts            # deterministic dataset generator (generated once)
  data/access.ts          # data-access layer — THE swap point for real connectors
  engines/askme.ts        # deterministic NL intent engine (9 intents)
  engines/insights.ts     # "Do You Know" analytic insight generator
  engines/predictive.ts   # transparent heuristic risk models + explainability
  engines/llm.ts          # optional LLM hook (off by default)
  hooks/                  # React Query hooks
  utils/                  # prng, date (DEMO_NOW), format, constants, cn
components/
  ui/                     # shadcn primitives
  charts/                 # KpiCard, GaugeChart, TrendChart, AreaTrend, BarCompare, Heatmap, …
  shared/                 # PageHeader, DataTable, MapView, Timeline, AlertsDrawer, AppShell, …
  <feature>/              # per-dashboard view components
scripts/                  # determinism + AskMe verification (and screenshot harnesses)
```

---

## Swapping in real connectors

All data access is isolated to **`lib/data/access.ts`**. To connect real systems
(NetSuite, Datex Footprint WMS, EUPRY, transportation/visibility feeds, a GLN/trading-partner
registry), reimplement the functions in that file to fetch from those sources. Because the
TypeScript types, the API surface (`app/api/**`) and the entire UI all depend only on the access
layer's signatures, **no UI or route changes are required** — it is a one-file swap.

For example, `getShipments()` / `getShipmentDetail()` would call the transportation/visibility
APIs, `getTemperatureReadings()` would call EUPRY, and `getPartners()` would call the trading-
partner registry. The engines and dashboards continue to work unchanged.

---

## Demo flow (7-phase narrative, ~17 min)

1. **Executive DSCSA Readiness** (`/executive`) — overall posture: compliance gauge, coverage,
   authorized partners, recall readiness, open risks, active excursions, and surfaced predictions.
2. **Control Tower** (`/control-tower`) — global shipment map (ocean lanes emphasized), filters,
   carrier performance, port congestion. Click a shipment row → traceability.
3. **Traceability** (`/traceability`) — search `SN0008743` (or `VX-2026-001` / `SHP-001`): full
   provenance, custody, ownership, verification, temperature history, journey map.
4. **Cold Chain** (`/cold-chain`) — the 10 °C excursion is detected and **root-caused to the 18h
   Newark customs delay**; route overlay + excursion trend.
5. **AskMe** (`/askme`) — ask any of the 9 reference questions (chips provided); structured
   answers reconcile with the dashboards.
6. **Do You Know** (`/insights`) — 8 automatically-generated, data-derived insight cards.
7. **Predictive** (`/predictive`) — five heuristic risk types per active shipment with explainable
   top drivers and example alerts (e.g. SHP-001 delay, SHP-007 excursion, ABC Logistics rising).

Recall (`/recall`) and Trading Partners (`/partners`) complete the compliance picture; the topbar
holds global search and an **alerts drawer** of open exceptions.

---

## Optional LLM hook for AskMe

AskMe ships a **deterministic intent engine** by default. An optional LLM hook lives behind an
environment flag and is **off by default**:

```bash
# .env.local
NEXT_PUBLIC_USE_LLM=false   # default; deterministic engine
```

When set to `true` and an implementation/key is provided in `lib/engines/llm.ts`, free-text
questions can be routed to an LLM seeded with the dataset as context. If the hook is enabled but
not configured, the API gracefully falls back to the deterministic engine — so the demo is always
reliable.

---

## Accessibility & UX

- Semantic HTML, ARIA labels, a "skip to main content" link, keyboard-navigable tables and menus,
  visible focus rings, and WCAG-AA-minded contrast in both light and dark themes.
- Every data view has **loading (skeleton)**, **empty**, and **error** states.
- Working **dark-mode** toggle; responsive from 1280px down to tablet.

---

## Notes / deviations

- Built on Next.js 16 / React 19 / Tailwind v4 (the current `create-next-app` default). The prompt
  specified "Next.js 14+", which this satisfies.
- The POC uses a curated representative dataset only; the production integration pattern is proven
  by the swappable `access.ts` boundary (see above) rather than a live connector.
