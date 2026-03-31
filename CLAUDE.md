# CLAUDE.md — swell-web

This is the persistent context file for Claude Code. Read this before touching any file in this repo.

---

## What this repo is

`swell-web` is the frontend dashboard for Swell.AI — a precision surf forecasting tool built on physics-based scoring, not editorial ratings. It is a Next.js 14 App Router project.

The backend is `swell-engine` (FastAPI, Python). This frontend calls that API for all live surf data. See the swell-engine repo and its `CLAUDE.md` for backend context.

The product has two distinct modes:

1. **Live conditions** — right now, which spots are firing? Powered by live NOAA buoy data scored through the physics engine.
2. **Trip planning** — which months are historically best at a given spot? Powered by climatological data and the `monthRatings[12]` array per spot.

---

## Tech stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | Next.js 14 (App Router) | Already scaffolded |
| Language | JavaScript | No TypeScript yet — keep it JS unless refactoring |
| Styling | Tailwind CSS | Already in package.json |
| Map | Mapbox GL JS | Use `react-map-gl` wrapper. Requires `NEXT_PUBLIC_MAPBOX_TOKEN` env var. |
| Charts | Recharts | Month heatmap, score gauges |
| Icons | Lucide React | Consistent with the rest of the stack |
| State | React `useState` / `useContext` | No Redux — keep it simple |
| Data fetching | Native `fetch` with SWR for live polling | `swr` package for auto-refresh |
| Backend | `swell-engine` FastAPI at `NEXT_PUBLIC_API_URL` | See API contract below |

---

## Project structure

```
swell-web/
├── src/
│   └── app/
│       ├── layout.js          # Root layout — nav, fonts, global styles
│       ├── page.js            # Home: the map view
│       ├── globals.css        # Tailwind base + custom vars
│       └── components/        # Create this directory
│           ├── Map.jsx            # Mapbox globe with spot pins
│           ├── SpotDrawer.jsx     # Slide-in panel when spot is clicked
│           ├── ScoreGauge.jsx     # 0-100 dial/ring for live score
│           ├── MonthHeatmap.jsx   # 12-column best months display
│           ├── ConditionsGrid.jsx # Swell + wind + tide info grid
│           ├── FilterBar.jsx      # Global filter: skill, region, month
│           └── SpotPin.jsx        # Custom Mapbox marker component
├── public/
│   └── wind-rose.svg          # Optional static asset
├── .env.local                 # NEXT_PUBLIC_MAPBOX_TOKEN, NEXT_PUBLIC_API_URL
└── CLAUDE.md                  # This file
```

---

## Environment variables

```bash
# .env.local
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoiLS0tLS0t...   # Mapbox public token
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000           # swell-engine FastAPI (local)
# Production: set to your deployed API URL
```

Never commit `.env.local`. It is already in `.gitignore`.

---

## API contract — swell-engine endpoints

All requests go to `NEXT_PUBLIC_API_URL`.

### `GET /search?q={query}`

Fuzzy search for surf spots by name.

```json
// Response: array of matching spots
[
  {
    "name": "Fort Pierce North Jetty",
    "lat": 27.4695,
    "lon": -80.2923,
    "beach_facing_deg": 75,
    "primary_buoy_id": "41114",
    "wind_station_id": "FPYF1"
  }
]
```

### `GET /live/{spot_name}`

Runs the physics engine for a specific spot against live NOAA data.

```json
// Response
{
  "name": "Fort Pierce North Jetty",
  "score": 61.9,
  "conditions": {
    "swell": "4.3ft @ 13s",
    "swell_dir": 55,        // degrees — added in Priority 1 of swell-engine
    "wind": "11.7kts",
    "wind_dir": 225,
    "water_temp": 76.2,
    "air_temp": 79.1
  },
  "timestamp": "2025-03-15T14:32:00Z"
}
```

> **Note:** `swell_dir` will be null until the MWD fix is shipped in `swell-engine`. Build the UI to handle null gracefully — show a dash or "no direction data" rather than crashing.

### `GET /spots`

Returns all spots from `master_surf_spots.json` for map rendering. If this endpoint doesn't exist yet, create it in `swell-engine/api.py` — it just reads and returns the JSON file.

```json
// Response: array of all spots (no live data, just metadata for pins)
[
  {
    "name": "Fort Pierce North Jetty",
    "lat": 27.4695,
    "lon": -80.2923
  }
]
```

---

## Core UI: the map view (`page.js`)

The main page is a **full-screen map** with overlaid UI elements. Not a dashboard layout — the map is the product.

```
┌─────────────────────────────────────────────────┐
│  [FilterBar — fixed top]                        │
│                                                  │
│                                                  │
│         Mapbox globe                             │
│         with SpotPins                            │
│                                                  │
│                                                  │
└─────────────────────────────────────────────────┘
                              ┌───────────────────┐
                              │   SpotDrawer      │
                              │   (slides in      │
                              │   from right on   │
                              │   pin click)      │
                              └───────────────────┘
```

The map takes `100vw × 100vh`. The SpotDrawer overlays on the right — it does not push the map. The FilterBar is a fixed bar at the top.

---

## Component specs

### `Map.jsx`

- Uses `react-map-gl` with Mapbox style `mapbox://styles/mapbox/dark-v11` (dark ocean looks great)
- On mount: fetches `GET /spots` and renders a `SpotPin` for each
- On pin click: sets `selectedSpot` state, opens `SpotDrawer`
- Pins should be color-coded by live score when available: green (>70), amber (40–70), red (<40), gray (no data)
- Cluster pins at low zoom levels using Mapbox's built-in clustering
- Initial view: `longitude: 0, latitude: 20, zoom: 2` (nice world view)

```jsx
// Key state
const [selectedSpot, setSelectedSpot] = useState(null);
const [spots, setSpots] = useState([]);

// On mount
useEffect(() => {
  fetch(`${process.env.NEXT_PUBLIC_API_URL}/spots`)
    .then(r => r.json())
    .then(setSpots);
}, []);
```

### `SpotDrawer.jsx`

Slides in from the right when a spot pin is clicked. Fixed width `380px`. Has four tabs:

1. **Now** — live score + conditions (calls `GET /live/{spot_name}`)
2. **Best months** — the `MonthHeatmap` component
3. **Wave profile** — type, skill level, ideal swell window (static from spot data)
4. **Trip info** — crowd rating, cost, nearest airport, insider tip

Auto-refreshes the "Now" tab every 30 minutes using SWR:

```jsx
import useSWR from 'swr';
const { data, isLoading } = useSWR(
  `${process.env.NEXT_PUBLIC_API_URL}/live/${encodeURIComponent(spot.name)}`,
  fetcher,
  { refreshInterval: 1800000 } // 30 min
);
```

### `ScoreGauge.jsx`

Circular gauge showing 0–100 score. Color transitions: red → amber → green.
- Score >= 70: green (`#22c55e`)
- Score 40–69: amber (`#f59e0b`)
- Score < 40: red (`#ef4444`)

Use SVG arc — don't import a heavy chart library just for this.

```jsx
// Props
{ score: number, size?: number, label?: string }
```

### `MonthHeatmap.jsx`

12 columns, one per month (Jan–Dec). Each column height or color intensity represents the monthly quality score (0–10). This is the trip planning heart of the product.

```jsx
// Props
{ monthRatings: number[] }  // array of 12 values, 0-10

// Until monthRatings are in the API, render placeholder:
// "Historical ratings coming soon" with a muted style
```

Use Recharts `BarChart` or a simple custom SVG — keep it lightweight.

### `FilterBar.jsx`

Fixed top bar with three filters:
- **Month** — dropdown Jan–Dec. Dims spots that aren't ideal in that month.
- **Skill** — `beginner | intermediate | advanced`
- **Region** — dropdown of world regions from the spots data

Filters are client-side only — no API call. Filter state lives in a `FilterContext` passed down to `Map.jsx` so it can control pin visibility.

### `ConditionsGrid.jsx`

A compact 2×3 grid showing:

| Swell | Period | Direction |
|-------|--------|-----------|
| Wind | Gusts | Water temp |

Each cell has a label, value, and unit. Used inside the "Now" tab of `SpotDrawer`.

---

## State management

Keep it flat. No Redux. Use a single `AppContext`:

```jsx
// src/app/context/AppContext.jsx
const AppContext = createContext({
  selectedSpot: null,
  setSelectedSpot: () => {},
  filters: { month: null, skill: null, region: null },
  setFilters: () => {},
});
```

Wrap the root layout in `AppContext.Provider`.

---

## Styling conventions

- Tailwind utility classes only — no custom CSS except in `globals.css`
- Dark theme by default — the map is dark, the UI should match
- Drawer background: `bg-zinc-900` with `border-l border-zinc-700`
- Score colors: use inline style for dynamic values (Tailwind can't interpolate dynamic classes safely)
- Typography: `font-sans` throughout, no serif
- Spacing: use Tailwind spacing scale consistently (`p-4`, `gap-3`, etc.)
- No hardcoded pixel values except for the drawer width (`w-[380px]`)

---

## Error and loading states

Every component that calls the API must handle three states explicitly:

```jsx
if (isLoading) return <SkeletonLoader />;
if (error)     return <ErrorMessage message="Could not reach forecast engine" />;
return <ActualContent data={data} />;
```

Build a reusable `SkeletonLoader` component (animated gray pulse bars). Don't leave raw "Loading..." strings in the UI.

If `swell_dir` is null (MWD not yet in engine), show `—` not `undefined` or a crash.

If the API is unreachable (engine not running locally), show a banner: "Forecast engine offline — showing spot data only."

---

## Prioritized task list

Work in this order.

### Priority 1 — Get the map rendering spots
- [ ] Install dependencies: `npm install react-map-gl mapbox-gl swr recharts lucide-react`
- [ ] Create `.env.local` with Mapbox token and API URL
- [ ] Build `Map.jsx` — full screen Mapbox dark map, fetches `/spots`, renders pins
- [ ] Build `SpotPin.jsx` — simple circle marker, gray by default
- [ ] Connect `page.js` — render `Map.jsx`, confirm spots appear on globe

### Priority 2 — Spot drawer skeleton
- [ ] Build `SpotDrawer.jsx` shell — slide-in panel, four tab headers, close button
- [ ] Wire pin click → `selectedSpot` state → drawer opens
- [ ] Build `ConditionsGrid.jsx` — static placeholder data first
- [ ] Build `ScoreGauge.jsx` — SVG arc, accepts score prop
- [ ] Wire "Now" tab → `GET /live/{spot_name}` → display real data

### Priority 3 — Month heatmap
- [ ] Build `MonthHeatmap.jsx` with placeholder data (hardcode a test array)
- [ ] Add `monthRatings` field to swell-engine API response (coordinate with swell-engine work)
- [ ] Wire heatmap to real data once available

### Priority 4 — Filter bar
- [ ] Build `FilterBar.jsx` — month, skill, region dropdowns
- [ ] Create `AppContext` and wrap layout
- [ ] Connect filter state to `Map.jsx` pin visibility (dim non-matching pins)

### Priority 5 — Score-based pin colors
- [ ] On map load, fire `GET /live/{spot_name}` for spots in current viewport only (not all 200+ at once)
- [ ] Update pin color based on returned score
- [ ] Add loading state for pins awaiting score data

### Priority 6 — Polish
- [ ] `SkeletonLoader` component for all loading states
- [ ] "Engine offline" banner when API is unreachable
- [ ] Mobile responsive: drawer becomes bottom sheet on small screens
- [ ] Animate drawer entrance (`transition-transform`)
- [ ] Add Mapbox clustering for zoom levels < 4

---

## Key invariants — don't break these

- The map must be `100vw × 100vh` — never put it in a constrained container
- Never call `GET /live/{spot_name}` for all spots on page load — this would hammer the NOAA API with hundreds of requests. Only fetch live data for the **selected spot** (on click) and spots in the **current viewport** (on map idle)
- All API calls must go through `NEXT_PUBLIC_API_URL` — never hardcode `localhost:8000`
- Score colors must use inline styles, not Tailwind dynamic classes — Tailwind purges dynamic class names at build time
- The SpotDrawer must handle `null` / missing fields without crashing — the API response will evolve as swell-engine adds fields

---

## Running locally

```bash
npm install
npm run dev
# → http://localhost:3000

# Backend must also be running:
# cd ../swell-engine && uvicorn api:app --reload
```

Make sure `NEXT_PUBLIC_API_URL=http://127.0.0.1:8000` is set in `.env.local` before running.

---

## Companion repo

`swell-engine` — Python FastAPI backend. Physics engine, NOAA ingest, spot database. See that repo's `CLAUDE.md` for backend context. The two repos are developed in parallel — coordinate API shape changes between them.
