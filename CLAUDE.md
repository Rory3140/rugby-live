# RugbyLive — Project Brief for Claude

## What Is This?

RugbyLive is a rugby live scores web app. Think OneFootball but for rugby. The goal is to be the fastest, cleanest, most focused rugby scores app in the world — beating Ultimate Rugby and RugbyPass on UX, speed and design.

This document is the single source of truth for everything. Read it fully before doing anything.

> **Maintenance rule**: Claude must keep this file up to date throughout every session. Any time a fact is confirmed, a decision is made, a status changes, or something new is discovered (API behaviour, confirmed field values, build issues, what's been built), update the relevant section before ending the session. Do not leave this file stale.

> **Design companion**: the component system is prototyped in `initial-design/RugbyLive UI System.html` (design-canvas). Use that as the visual source of truth. Exact markup/React equivalents live in `initial-design/HANDOFF.md`.

---

## Current Phase

**Phase 1 — Web app only.**
Mobile-first responsive web app. No native apps yet.
A Swift iOS app will come later — the backend must be built as a clean stateless REST API so the Swift app can call the same endpoints with zero changes to the backend.

---

## Tech Stack

### Frontend
| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS (utility-first, no CSS modules) |
| State Management | Zustand + persist middleware (localStorage) |
| Data Fetching | TanStack React Query |
| Animations | Framer Motion |
| Icons | Lucide React |
| Fonts | Bebas Neue, DM Sans, DM Mono (Google Fonts) |
| Hosting | Firebase Hosting |

### Backend
| Layer | Technology |
|---|---|
| Runtime | Node.js + Express |
| Language | TypeScript |
| Container | Docker |
| Hosting | Google Cloud Run |
| Region | europe-west2 (London) |
| Min Instances | 1 (always warm — no cold starts) |
| Secrets | Google Cloud Secret Manager |

### Firebase (all services)
| Service | Purpose |
|---|---|
| Firestore | Fixtures, standings, teams, leagues |
| Realtime Database | Live score cache (read speed critical) |
| Cloud Messaging (FCM) | Push notifications |
| Firebase Hosting | Frontend deployment |
| Firebase Auth | NOT USED in MVP — Phase 2 only |

### Data Providers

v3 uses three APIs in combination. No single provider covers everything — the backend routes each data need to its best source and falls back down the chain if that source fails or returns empty.

**Rule: ALL provider calls go through the backend only. The frontend never calls any data provider directly.**

| Provider | Base URL | Auth header | Plan | Request limit |
|---|---|---|---|---|
| API-Sports | api-sports.io | `x-apisports-key` | Pro $15/mo | 7,500/day |
| Highlightly | rugby.highlightly.net | `x-rapidapi-key` | **Pro 7,500/day** | 7,500/day |
| SportsAPI Pro | v2.rugby.sportsapipro.com | `x-api-key` | — | Unreliable |

Keys stored in Cloud Run Secret Manager. Full endpoint references: `SPORTSAPIPRO.md`, `HIGHLIGHTLY.md`.

---

### v3 Data Sourcing

**Capability matrix** — what each provider actually returns:

| Data | API-Sports | Highlightly | SportsAPI Pro |
|---|---|---|---|
| Match list by date | ✅ | ✅ | ✅ unreliable |
| Live score polling | ✅ poll+filter | ✅ poll+filter | ✅ `/api/live` unreliable |
| Match status | ✅ `1H/HT/2H/FT/NS` | ✅ description strings | ✅ type strings |
| Period/half-time scores | ⚠️ present, unreliable, null during live | ❌ | ✅ embedded in schedule |
| Venue + referee | ❌ | ✅ major leagues only | ✅ |
| Weather forecast | ❌ | ✅ major leagues only | ❌ |
| Try timeline / incidents | ❌ | ✅ in match detail response | ✅ unreliable |
| Match statistics | ❌ | ❌ | ✅ unreliable |
| Lineups | ❌ | ✅ club + international | ✅ unreliable |
| Per-player match stats | ❌ | ❌ | ✅ unreliable |
| Video highlights (embed URL) | ❌ | ✅ YouTube + thumbnail | ✅ URL only |
| H2H full match list | ✅ back to 2009 | ✅ | ❌ counts only |
| Win probability predictions | ❌ | ✅ prematch + live | ❌ |
| Last N results per team | ⚠️ workaround | ✅ dedicated endpoint | ✅ paginated |
| Standings | ✅ + form + promotion | ✅ no form/promotion | ✅ unreliable |
| League list | ✅ 142 comps | ✅ 105 comps | ✅ 129 comps |
| Team season stats | ✅ | ✅ | ✅ unreliable |
| Team / league logos | ✅ | ✅ patchy | ❌ |

**Logos are managed manually in Firebase** — not sourced from any API. `nameCode` (3-letter code) is the text fallback for missing logos.

---

**Sourcing decisions** — where v3 gets each thing, with fallback chain:

| Data Need | Primary | Fallback 1 | Fallback 2 | Notes |
|---|---|---|---|---|
| Match list by date | API-Sports | Highlightly | SAP Pro | API-Sports has highest request budget |
| Live score updates | API-Sports | Highlightly (poll) | SAP Pro `/api/live` | API-Sports polling uses bulk daily budget efficiently |
| Match status badge | API-Sports | Highlightly | SAP Pro | Normalise all three to same internal status enum |
| Period scores (H1/H2) | API-Sports ⚠️ | SAP Pro | — | Only render if non-null; Highlightly has nothing here |
| Venue + referee | Highlightly | SAP Pro | — | API-Sports has neither |
| Weather forecast | Highlightly | — | — | Unique to Highlightly |
| Try timeline / incidents | Highlightly | SAP Pro | — | Highlightly via match detail; incidents embedded in `/matches/{id}` response |
| Match statistics | SAP Pro | — | — | No alternative; hide section if SAP fails |
| Lineups | Highlightly | SAP Pro | — | Highlightly embedded in `/matches/{id}` detail response — works for club + international |
| Video highlights | Highlightly | SAP Pro | — | Highlightly has embed URLs + thumbnails; SAP is URL-only |
| Win predictions | Highlightly | — | — | Unique to Highlightly |
| H2H match list | API-Sports | Highlightly | — | Both return full match lists; SAP only gives counts |
| Last 5 results | Highlightly | SAP Pro | — | Saves API-Sports quota |
| Standings | API-Sports | Highlightly | SAP Pro | API-Sports has form string + promotion labels |
| League list | API-Sports | Highlightly | SAP Pro | API-Sports has broadest coverage |
| Team season stats | API-Sports | Highlightly | SAP Pro | |

---

### The ID Problem

Each provider uses different numeric IDs for the same match, team, and league. Cross-provider fallback requires a mapping layer.

**`allowedLeagues` config stores IDs for all three per competition:**
```ts
{
  name: 'Six Nations',
  apiSportsId: 180,
  highlightlyId: 44185,
  sapId: '423',
  category: 'International'
}
```

**For match-level fallback** (e.g. fetch detail from Highlightly when API-Sports match ID is known): query by `date + homeTeamName + awayTeamName` and fuzzy-match — direct ID translation is not possible.

**Date-based endpoints** (match list, highlights) fall back naturally — all three accept `date=YYYY-MM-DD` with no ID dependency.

---

### API-Sports — confirmed working endpoints

- `GET /games?date=YYYY-MM-DD` — all games on a date (scores null when NS)
- `GET /games?league=X&season=Y` — all games in a competition/season
- `GET /games/h2h?h2h=TEAM1-TEAM2` — H2H history back to 2009
- `GET /standings?league=X&season=Y` — full table with form + description
- `GET /teams?league=X&season=Y` — teams in a competition
- `GET /teams/statistics?team=X&league=Y&season=Z` — team season stats
- `GET /leagues` — all 142 competitions

**Does NOT exist:** `/games/events`, `/games/statistics`, `/games/lineups`, `/games?live=all`, `/games?from=X&to=Y`, `/players`, `/coaches`

**Game object fields:**
```
id, date, time, timestamp, week
status: { short: "FT" | "NS" | "1H" | "HT" | "2H" }
league: { id, name, type, logo, season }
teams.home/away: { id, name, logo }
scores: { home, away }               ← null when NS
periods.first/second: { home, away } ← null during live; unreliable even after FT
```
No venue. No referee. No clock/minute.

**Live polling:** poll `GET /games?date=today` every 15s. Filter: `status.short !== 'FT' && status.short !== 'NS'` = live.

**Standings fields:** `position, points, form ("LWWLW"), description ("Playoffs" | null), team: { id, name, logo }, games: { played, win, draw, lose }, goals: { for, against }` — pointsDiff = `goals.for - goals.against`.

---

### Highlightly — confirmed working endpoints

Full reference: `HIGHLIGHTLY.md`

- `GET /matches?date=YYYY-MM-DD` — match list; `state.score` is string `"X - Y"` or null
- `GET /matches/{id}` — adds venue, referee, forecast, predictions, lineups (major leagues)
- `GET /highlights?date=...&leagueId=...&matchId=...` — YouTube highlights, embed URLs, thumbnails
- `GET /highlights/{id}` — single highlight
- `GET /standings?leagueId=X&season=Y` — standings; no form, no promotion zone
- `GET /leagues` — 105 leagues with logo + seasons list
- `GET /leagues/{id}` — single league
- `GET /teams?name=X` — search; returns id/name/logo only
- `GET /teams/statistics/{id}?fromDate=Y` — per-league season stats
- `GET /head-2-head?teamIdOne=X&teamIdTwo=Y` — full H2H match list
- `GET /last-five-games?teamId=X` — last 5 finished matches
- `GET /countries` — 258 countries

**Not available on BASIC plan:** `/odds`, `/highlights/geo-restrictions/{id}`

**Rate limit: 100 requests/day** — use only for on-demand detail pages and daily-cached data. Never use for live polling.

---

### SportsAPI Pro — confirmed working endpoints

Full reference: `SPORTSAPIPRO.md`

- `GET /api/schedule/:date` — schedule with period1/period2 scores embedded
- `GET /api/live` — live matches only; returns `data: null` when nothing live
- `GET /api/match/:id` — venue + referee
- `GET /api/match/:id/incidents` — try timeline (scorer, minute, running score, cards)
- `GET /api/match/:id/statistics` — 60 stats across ALL/1ST/2ND
- `GET /api/match/:id/lineups` — starting XV + bench
- `GET /api/match/:id/player-statistics` — per-player stats
- `GET /api/match/:id/highlights` — YouTube URL + thumbnail
- `GET /api/match/:id/votes` — fan vote counts
- `GET /api/teams/:id` — name, nameCode, teamColors hex, form
- `GET /api/tournament/:id/season/:sid/standings` — standings
- `GET /api/categories/:id/tournaments` — all comps in a category

**Not available:** player profiles, top scorers, search by name, H2H match list (counts only)

**incidentClass values:** `try`, `twoPoints` (union conversion = 2pts), `onePoint` (league conversion = 1pt), `threePoints` (penalty), `dropGoal`, `yellow`, `red`

**Important:** `twoPoints` is a conversion (2pts), NOT a try (5pts). The internal `SAP_INCIDENT_TYPE_MAP` must map `twoPoints → 'conversion'`.

**Reliability note:** SAP Pro times out and 503s frequently. Standard calls use an 8s timeout; match detail calls (`/api/match/:id/lineups`, `/api/match/:id/incidents`) use a strict **4s timeout** (`DETAIL_TIMEOUT`) so they never slow the `/detail` endpoint. All SAP calls treat timeout/503 as empty (not error). SAP enrichment runs in parallel with Highlightly — never blocks on SAP alone.

**Highlight thumbnail field:** Highlightly returns `imgUrl` (YouTube `hqdefault.jpg` URL). The `thumbnailUrl` field in `extractHighlights()` must use `h.imgUrl` as primary. Source channel is `h.channel` (e.g. "Highlightly").

### Scheduling
| Job | Frequency |
|---|---|
| Live score polling | Every 15 seconds during live matches |
| No live matches | Every 5 minutes |
| Fixtures + standings | Every 1 hour |
| Competition list | Once per day |

Polling is triggered by Cloud Scheduler hitting the Cloud Run `/poll` endpoint.

---

## Authentication

**There is no authentication in this app.**

- No sign in / sign up / accounts / Firebase Auth / sessions / auth cookies
- Remove any Sign In / Join buttons from the UI
- No avatar, no profile menu in navbar

User preferences (followed teams/leagues) are stored in localStorage only.

---

## Favourites / Following

Use **Zustand with persist middleware**. No backend needed.

```typescript
// /store/useFollowStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface FollowStore {
  followedLeagues: string[]
  followedTeams: string[]
  followLeague: (id: string) => void
  unfollowLeague: (id: string) => void
  followTeam: (id: string) => void
  unfollowTeam: (id: string) => void
  isFollowingLeague: (id: string) => boolean
  isFollowingTeam: (id: string) => boolean
}

export const useFollowStore = create<FollowStore>()(
  persist(
    (set, get) => ({
      followedLeagues: [],
      followedTeams: [],
      followLeague: (id) => set(s => ({ followedLeagues: [...s.followedLeagues, id] })),
      unfollowLeague: (id) => set(s => ({ followedLeagues: s.followedLeagues.filter(l => l !== id) })),
      followTeam: (id) => set(s => ({ followedTeams: [...s.followedTeams, id] })),
      unfollowTeam: (id) => set(s => ({ followedTeams: s.followedTeams.filter(t => t !== id) })),
      isFollowingLeague: (id) => get().followedLeagues.includes(id),
      isFollowingTeam: (id) => get().followedTeams.includes(id),
    }),
    { name: 'rugbylive-follows' }
  )
)
```

localStorage key: `rugbylive-follows`

When the Swift app comes later, the store will be swapped to sync with Firestore user documents. Keep the store interface identical so components need zero changes.

---

## Design System

### Colours (CSS variables — put in `app/globals.css`)

```css
:root {
  --bg:       #0a0a0f;    /* primary background */
  --surf:     #151520;    /* card backgrounds, navbar */
  --surf2:    #1c1c2a;    /* hover states, elevated surfaces */
  --surf3:    #242434;    /* pills, chips, secondary elements */
  --surf4:    #2e2e42;    /* tertiary elements, away stat bar fill */
  --accent:   #e8ff47;    /* yellow-green — active states, CTAs, PTS */
  --accent2:  rgba(232,255,71,0.10); /* accent tint for backgrounds */
  --live:     #ff4545;    /* live indicators, red cards, clocks, live hero score */
  --live2:    rgba(255,69,69,0.12);  /* live tint for backgrounds */
  --green:    #4ade80;    /* positive diff, wins */
  --text:     #ededf5;    /* primary text */
  --text2:    rgba(237,237,245,0.55); /* secondary text */
  --text3:    rgba(237,237,245,0.28); /* muted text, labels */
  --border:   rgba(255,255,255,0.07); /* card borders */
  --border2:  rgba(255,255,255,0.04); /* subtle dividers */
}
```

Mirror these in `tailwind.config.ts` as extended colours (`bg`, `surf`, `surf2`, `accent`, `live`, `green`, `text`, `text2`, `text3`, `border-1`, `border-2`).

### Typography

| Usage | Font | Size | Weight | Notes |
|---|---|---|---|---|
| Logo wordmark | Bebas Neue | 22 | — | letter-spacing 0.08em |
| Page H1 (e.g. "MATCHES") | Bebas Neue | 32 | — | letter-spacing 0.06em, UPPERCASE |
| Live score (match hero) | Bebas Neue | 56 | — | letter-spacing 0.08em, `color: var(--live)` |
| Finished score (hero) | Bebas Neue | 56 | — | `color: var(--text)` |
| Section labels | DM Sans | 10 | 700 | UPPERCASE, letter-spacing 0.15em, `var(--text3)` |
| Match card team name | DM Sans | 14 | 500 / 600 | winner 600, loser 500 |
| Match card score | DM Mono | 14 | 500 / 700 | winner 700, tabular-nums |
| Competition name | DM Sans | 13 | 700 | in group header |
| Body UI | DM Sans | 12–13 | 500/600 | |
| Clock / minute / all numbers | DM Mono | — | — | tabular-nums always |

Load via `next/font/google`:

```ts
import { Bebas_Neue, DM_Sans, DM_Mono } from 'next/font/google'
export const bebas = Bebas_Neue({ weight: '400', subsets: ['latin'], variable: '--font-bebas' })
export const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-sans' })
export const dmMono = DM_Mono({ subsets: ['latin'], variable: '--font-mono' })
```

### Layout

```
Max content width:    1120px centred with auto margins
Desktop layout:       Full-width content centred at 1120px (no sidebar)
Mobile layout:        Full width + fixed 64px bottom nav bar
Navbar height:        56px, sticky, blur backdrop
Match card grid:      3 columns (lg: ≥1024) → 2 (md: ≥768) → 1 (sm)
Bottom nav:           Visible only below md breakpoint, fixed bottom
Card padding:         14px
Card border-radius:   10px
```

### Design Rules

1. **Dark mode only** — always, no light mode toggle
2. **Flat design** — no gradients anywhere, ever
3. **No box shadows** — elevation via surface-colour steps only
4. **1px borders** — all cards `border: 1px solid var(--border)`
5. **No auth UI** — no Sign In, no Join, no avatar, no profile menu
6. **Accent sparingly** — active nav items, CTAs, PTS column, leader rail in standings. Live score hero is red, **not** accent.
7. **Live red sparingly** — live indicators, red cards, hero score during a live match
8. **Real logos** — load team crests and competition logos from API-Sports CDN URLs
9. **Fallback initials** — if logo URL missing or fails, show 3-letter team abbreviation on a coloured shield (see `TeamCrest` in prototype — hashes `shortName` → stable palette)
10. **44px touch targets** — all interactive elements minimum 44px on mobile
11. **Hover lift** — cards lift on hover: `transform: translateY(-1px)`, border brightens to `rgba(255,255,255,0.14)`, background → `var(--surf2)`, 160ms ease
12. **Stagger animations** — competition groups fade up on page load with staggered delay (Framer Motion: 80ms stagger per group)
13. **Pulsing live dot** — 6px red dot, CSS keyframes scale 1→0.85 / opacity 1→0.35, 1.2s infinite
14. **Score colour rules** (finished match):
    - Winner score: `font-weight: 700`, `color: var(--text)`
    - Loser score: `font-weight: 500`, `color: var(--text2)`
    - Live / upcoming: both scores `color: var(--text)`, weight 500
15. **Empty state honesty** — if the API doesn't return a stat/field, omit the row entirely. Never show "—" or "0" as a placeholder for missing data.

### Component Patterns (reference prototype for exact render)

**Match Card**
```
[crest] [team name ............] [score]
[crest] [team name ............] [score]
─────────────────────────────────────────
[● 58'] or [FT] or [19:45]    [venue]
[🏉 Lowe 12'] [🏉 Ringrose 34']     ← only when live + events exist
```

**Competition Group Header**
```
[logo] [Competition Name]    [● 2 Live] [+ Follow]
       [Round 4]
─────────────────────────────────────────────────
```
- Bottom border: `1px solid var(--border)`
- 12px padding Y, 4px padding X

**Live Badge** — `background: var(--live2)`, `color: var(--live)`, DM Mono 11/600, pill, pulsing dot prefix.

**Scorer Pills** — `background: var(--surf3)`, 11px DM Sans, rugby-ball icon prefix (accent for try, yellow for yellow card, red for red card).

**Stat Bar** — two-tone split with 2px gap between halves, 6px tall, 999px radius. Home side `var(--accent)`, away `var(--surf4)`. Label centred in rl-label style above bar.

**Follow Button States**
```
Default:    "+ Follow"   — border: var(--border), color: var(--text2)
Hover:      brighten border + text
Following:  "Following"  — border: rgba(232,255,71,0.35), color: var(--accent), bg: var(--accent2)
```

### Animation timings

| Interaction | Duration | Easing |
|---|---|---|
| Card hover lift | 160ms | ease |
| Live-dot pulse | 1.2s | ease-in-out, infinite |
| Group stagger on load | 80ms between, 280ms per item | Framer `easeOut` |
| Tab underline slide | 200ms | ease |

---

## App Structure

### Navbar (desktop)
```
[🏉 RUGBYLIVE]  [Matches] [Leagues] [Teams] [Explore]      [🔍] [🔔]
```
- 56px tall, sticky top, `backdrop-blur(14px)`, background `rgba(21,21,32,0.72)`
- Active item: 2px accent underline, text `var(--text)` bold
- Inactive: `var(--text2)` 500
- Bell has 6px red dot when unread alerts exist
- **No Sign In. No Join. No auth anything.**

### Mobile Bottom Nav (5 tabs, below md)
```
[📅 Matches] [🏆 Leagues] [👥 Teams] [🔍 Explore] [🔔 Alerts]
```
- 64px tall, `background: var(--surf)`, top border
- Active tab: icon + label `color: var(--accent)`, label weight 600
- Alerts tab: red count badge (top-right of icon) when > 0

### Desktop Sidebar
**Removed** — sidebar was removed in the 2026-05-07 session. Content is now full-width centred at 1120px with no sidebar on any breakpoint. Navigation between leagues happens via the `/leagues` page and the bottom nav / top navbar.

---

## Pages & Routes

### `/matches` — Home/Default
- Page H1 "MATCHES" Bebas 32
- **Desktop**: calendar icon button top-right of header opens date picker (`position: relative` wrapper, hidden input `top:0 left:0 w:100% h:100%`, `showPicker()` on click). Calendar button hidden on mobile.
- **Mobile**: calendar button hidden in header — date picker opens from the mobile date bar instead
- Date scrubber — **two responsive layouts**:
  - **Mobile (`< md`)**: `[‹] [date bar] [›]` — full-width button showing "Today" (accent) or e.g. "Saturday 26 April"; tapping opens native date picker; arrows step **one day** at a time
  - **Desktop (`≥ md`)**: month label above + 7-day pill grid (Mon→Sun) + prev/next window arrows that shift a **full week** (±7). Active pill solid accent. TODAY label uses tight letter-spacing (0.02em) to prevent overflow. `getMondayOffset()` ensures the week always starts on Monday.
- Week alignment: desktop window offset calculated so Mon is always the first pill. `getMondayOffset()` returns `2 - daysSinceMonday` where `daysSinceMonday = (today.getDay() + 6) % 7`.
- When picking a date via calendar: window aligns to Monday of the picked week.
- Filter pills: All / **Live** / Finished / Upcoming — each shows a count in DM Mono; horizontal scroll (no wrap) on mobile. **Live pill is hidden when selected date ≠ today** (no live games possible on past/future dates).
- Matches grouped by competition (CompGroupHeader + 3-col match card grid)
- **Followed leagues always sorted to top** of the competition groups list; remaining groups sorted alphabetically by competition name.
- React Query polls `/api/matches?date=YYYY-MM-DD` every 15s (only if any live match is present; otherwise 5min)
- Match kickoff times rendered in **user's local timezone** (no `timeZone: 'UTC'` override in `formatKickoff`)

### `/leagues` — Competition Browser
- Grouped by: International / Club / Sevens
- Each competition: logo (28px), name, follow button
- Header contains a "Manage" link → `/leagues/manage`
- Only leagues where `active: true` in Firestore are shown (filtering happens at the API level)

### `/leagues/manage` — Admin League Management
- Lists all leagues including inactive (fetches `GET /admin/leagues`)
- Grouped and sorted alphabetically within categories: International / Club / Sevens
- Toggle switch per league — calls `PATCH /admin/leagues/:id` with `{ active: boolean }` → writes to Firestore
- Inactive leagues shown at 40% opacity
- Counter shows "X of Y active"
- Optimistic UI: pending state disables toggle + shows wait cursor
- **Currently unprotected** — `/admin/*` routes have no auth. Must add protection before production.
- This is a sysadmin function. The `active` field is global — deactivated leagues are hidden from everyone, not just the current user.

### `/leagues/[id]` — League Detail
- Tab bar: Standings / Fixtures / Results (accent underline on active)
- Standings table, columns:
  `#  |  Team  |  P  W  D  L  PF  PA  PD  |  PTS`
  - Numeric columns DM Mono, centred
  - PD coloured: `> 0` green, `< 0` muted, `0` text2
  - PTS column: DM Mono 14/700, `color: var(--accent)`
  - Leader row: 2px accent rail on the left edge, position number also accent
  - **Season auto-fallback**: if all rows have `played === 0` (current season not yet started), the page silently fetches the previous season and displays that instead. The season selector label updates accordingly.
- **Fixtures/Results cards** show date alongside round — same card style as H2H, `showDate` prop on `MatchCard`

### `/match/[id]` — Match Detail
- Breadcrumb trail: Matches · Comp · Teams
- Hero:
  - Comp strip at top (logo, name, round, live badge right)
  - Two-column team block (crest 54px + name + HOME/AWAY label)
  - Giant score row: Bebas 56, **red `var(--live)` while live, `var(--text)` when finished**
  - Half-time scores strip (periods.first / periods.second) — only render if API returns them (not null)
  - Info strip below score (1px top border, text3): kickoff time · venue (if Highlightly provides it) · referee · weather temperature + status (e.g. "12°C · Partly Cloudy")
  - Weather: Highlightly `forecast`/`weatherForecast` field; temperature decimal stripped (e.g. `"12.5°C"` → `"12°C"`)
- Tab bar: **Score / Timeline / Lineups / H2H** — accent underline on active (tabs only render if data available)
  - **Score tab**: hero score + half-time period scores (if available) + win prediction (if Highlightly provides it)
  - **Timeline tab**: match incidents (tries, conversions, penalties, drop goals, cards) — most recent at top. Source: Highlightly primary, SAP Pro fallback
  - **Lineups tab**: starting XV + bench for both teams. Source: Highlightly primary, SAP Pro fallback
  - **H2H tab**: last N meetings between the two teams — same game card format, chronological descending

### `/explore` — Search
- Search bar (teams, competitions)
- Results update as user types (debounce 200ms)

---

## Folder Structure

```
/rugbylive-web                    ← Next.js frontend
  /app
    /layout.tsx                   ← Root layout (navbar, fonts, providers)
    /page.tsx                     ← Redirect to /matches
    /matches/page.tsx
    /leagues/page.tsx
    /leagues/[id]/page.tsx
    /leagues/manage/page.tsx      ← Admin league on/off toggles (writes to Firestore)
    /match/[id]/page.tsx
    /explore/page.tsx
    /globals.css                  ← CSS vars from Design System section
  /components
    /layout
      /Navbar.tsx
      /Sidebar.tsx
      /MobileNav.tsx
    /matches
      /MatchCard.tsx
      /MatchCardGrid.tsx
      /DateScrubber.tsx
      /FilterPills.tsx
      /CompGroupHeader.tsx
      /ScorerPills.tsx
      /LiveBadge.tsx
    /match
      /MatchHero.tsx
      /MatchTimeline.tsx
      /StatBars.tsx
      /MatchLineups.tsx
    /leagues
      /LeagueTable.tsx
      /LeagueHeader.tsx
    /ui
      /FollowButton.tsx
      /SearchBar.tsx
      /TeamCrest.tsx              ← Handles logo load + fallback initials
      /CompLogo.tsx
      /StatusBadge.tsx            ← wraps LiveBadge / FT / kickoff time
  /hooks
    /useLiveScores.ts             ← React Query, polls every 15s (or 5m)
    /useFixtures.ts
    /useStandings.ts
    /useMatch.ts
    /useSearch.ts
  /lib
    /api.ts                       ← All fetch calls to backend
    /queryClient.ts               ← React Query client config
    /firebase.ts                  ← Firebase client (FCM only in MVP)
    /dates.ts                     ← Date formatting helpers
  /store
    /useFollowStore.ts            ← Zustand + localStorage persist
  /types
    /index.ts                     ← Match, Team, League, Event, Standing types

/rugbylive-api                    ← Node.js backend v1 — API-Sports + Firebase (port 4000)
  /src
    /routes
      /matches.ts                 ← GET /matches, GET /matches/:id
      /leagues.ts                 ← GET /leagues, GET /leagues/:id/standings
      /teams.ts                   ← GET /teams/:id
      /players.ts                 ← GET /players/:id
      /poll.ts                    ← POST /poll (called by Cloud Scheduler)
      /admin.ts                   ← GET /admin/leagues (all incl. inactive), PATCH /admin/leagues/:id
    /jobs
      /pollScores.ts              ← Fetches live scores → writes Realtime DB
      /pollFixtures.ts            ← Fetches fixtures → writes Firestore
    /services
      /apiSports.ts               ← API-Sports wrapper (all calls here)
      /firebaseAdmin.ts           ← Firebase Admin SDK init (Firestore + RTDB)
      /store.ts                   ← All Firestore + RTDB read/write helpers
      /notifications.ts           ← FCM push sender (stubbed — Phase 2)
    /middleware
      /cors.ts                    ← Allow rugbylive.app + localhost
      /errorHandler.ts
      /rateLimiter.ts
    /types
      /apiSports.ts               ← API-Sports response types
      /internal.ts                ← Internal normalised types
    /index.ts                     ← Express app + server
  /Dockerfile
  /.dockerignore

/rugbylive-api-v2                 ← Node.js backend v2 — SportsAPI Pro only, no Firebase (port 4001)
  /src
    /routes
      /matches.ts   ← GET /matches, /matches/live, /matches/today, /matches/:id,
                       /matches/:id/incidents, /statistics, /lineups, /player-statistics,
                       /highlights, /managers, /h2h, /votes
      /leagues.ts   ← GET /leagues, /leagues/:id, /leagues/:id/seasons, /standings,
                       /rounds, /games (with optional ?round=)
      /teams.ts     ← GET /teams/:id, /teams/:id/near-events, /results, /fixtures
      /poll.ts      ← POST /poll — live diff detector, no Firebase writes
    /services
      /sportsApiPro.ts  ← All SportsAPI Pro calls + normalisation
    /middleware
      /cors.ts, errorHandler.ts, rateLimiter.ts
    /types
      /sportsApiPro.ts  ← Raw SportsAPI Pro response types
      /internal.ts      ← Normalised internal types (extended vs v1: period scores, winnerCode,
                           venue, referee, teamColors, incidents, stats, lineups, player stats,
                           highlights, coaches, H2H summary, votes, team profile)
    /index.ts           ← Express app, port 4001
  /.env                 ← SPORTS_API_PRO_KEY + PORT=4001 (gitignored)
  /package.json
  /tsconfig.json
  /.dockerignore

/rugbylive-api-v3/scripts/
  discoverSapTeamIds.mjs         ← One-off script: fetches SAP standings for all active leagues
                                    with a sapId, name-matches against Firestore teams, writes
                                    sapTeamId back. Result: 119 auto-matched + 9 manually patched
                                    = 128 teams total in Firestore with sapTeamId populated.
```

---

## API Response Format

All backend endpoints return this envelope:

```typescript
{
  data: T,
  meta: {
    timestamp: string   // ISO 8601
    cached: boolean
    source: 'realtime' | 'firestore' | 'api-sports'
  }
}
```

Keep all endpoints stateless. No session, no cookie auth. CORS open to rugbylive.app and localhost:3000.

**CORS allowed methods**: `GET, POST, PATCH, OPTIONS` — PATCH required for admin league toggle.

---

## TypeScript Types

```typescript
// /types/index.ts

export interface Match {
  id: string
  competition: Competition
  homeTeam: Team
  awayTeam: Team
  homeScore: number | null
  awayScore: number | null
  status: 'scheduled' | 'live' | 'halftime' | 'finished'
  clock: string | null        // e.g. "58'" during live; "HT" when halftime
  kickoff: string             // ISO 8601
  venue: string | null
  round: string | null
  events: MatchEvent[]        // may be [] — empty is valid, render accordingly
  stats: MatchStat[] | null   // null if API has no stats for this fixture
  lineups: Lineup | null      // null if unavailable
}

export interface Team {
  id: string
  name: string
  shortName: string           // 3 letters e.g. "IRE"
  logoUrl: string | null
  country: string | null
}

export interface Competition {
  id: string
  name: string
  shortName: string
  logoUrl: string | null
  country: string | null
  type: 'international' | 'club' | 'sevens'
  hemisphere: 'north' | 'south' | 'global'
}

export interface Standing {
  position: number
  team: Team
  played: number
  won: number
  drawn: number
  lost: number
  pointsFor: number
  pointsAgainst: number
  pointsDiff: number
  points: number
}

export interface MatchEvent {
  id: string
  type: 'try' | 'conversion' | 'penalty' | 'drop_goal' | 'yellow_card' | 'red_card' | 'half_time' | 'full_time'
  minute: number
  team: 'home' | 'away'
  player: string | null
  homeScore: number
  awayScore: number
}

export interface MatchStat {
  key: string           // e.g. 'possession', 'territory', 'tries'
  label: string         // e.g. 'Possession'
  home: number
  away: number
  unit: '%' | '' | 'm'
}

export interface Lineup {
  starters: LineupPlayer[]
  bench: LineupPlayer[]
}
export interface LineupPlayer {
  id: string
  name: string
  number: number
  position: string
}
```

---

## Key Competitions to Support (from API-Sports)

### International
- Six Nations (+ U20 + Women's)
- Rugby Championship
- World Cup
- British & Irish Lions
- Autumn Nations Series
- Pacific Nations Cup
- World Sevens Series (all legs)

### Club — Northern Hemisphere
- United Rugby Championship (URC)
- Gallagher Premiership
- French Top 14
- French Pro D2
- European Champions Cup
- European Challenge Cup

### Club — Southern Hemisphere
- Super Rugby Pacific
- Super Rugby Americas
- Currie Cup
- Mitre 10 Cup (NZ)
- NRC (Australia)

### Other
- Major League Rugby (USA)
- Japan Rugby League One

---

## Polling Architecture

> Note: `/games?live=all` does not exist in the rugby API. Live detection is done by polling today's games by date and filtering by status.

```
Cloud Scheduler (every 15s during live windows)
    ↓ POST /poll
Cloud Run (Node.js)
    ↓ GET /games?date=TODAY
API-Sports
    ↓ response (full day's games)
Filter: status.short !== 'FT' && status.short !== 'NS' → these are live
    ↓
Write all today's games to Firebase Realtime Database at /games/{date}/{gameId}
    ↓
FCM notification trigger: if a game just flipped to 'FT' (compare previous state)
    ↓
React Query on frontend polls /api/matches?date=YYYY-MM-DD every 15s
    ↓
UI updates match cards in real time
```

**Known status values (all confirmed):**
- `NS` = Not Started
- `1H` = First half (live)
- `HT` = Half time (live)
- `2H` = Second half (live)
- `FT` = Full Time / Finished
- `AET` = After Extra Time (terminal — treat as FT)
- `AP` = After Penalties (terminal — treat as FT)
- `PEN` = Penalty Shootout (terminal — treat as FT)
- `AW` = Awarded Win / Walkover (terminal — show "W/O" badge, not a time)
- `AWD` = Awarded Draw (terminal — show "W/O" badge)
- `WO` = Walkover (terminal — show "W/O" badge)
- `ABD` = Abandoned (terminal)
- `CANC` = Cancelled (show "CANC" badge)
- `PST` = Postponed (show "PPD" badge)

**isLive / isTerminal rules:**
- `isLive(status)`: returns `true` only for `1H`, `HT`, `2H` (anything not in the NON_LIVE set)
- `isTerminal(status)`: returns `true` for `FT`, `AET`, `AP`, `PEN`, `AW`, `AWD`, `WO`, `ABD`
- NON_LIVE set: `NS, FT, AW, AWD, WO, CANC, PST, INT, ABD, TBD, AET, AP, PEN`

---

## Push Notifications

> Note: No `/games/events` endpoint exists, so try-scored notifications are not possible. We can only detect score changes or status changes between polls.

Sent via FCM when:
- Score changes during a live game: `"[Home] [Score] – [Score] [Away]"` (score update)
- Full time: `"FT: [Team] [Score] – [Score] [Team]"`

Only sent for followed teams. In MVP, notifications are broad; Phase 2 with auth will personalise server-side.

---

## Legal Notes

- API-Sports data: covered by paid API licence
- Team/league logos: loaded via API-Sports CDN URLs only — never downloaded and self-hosted
- Score data: not copyrightable — facts are free
- Competition names used descriptively only
- No implied official partnership with any rugby body
- No World Rugby, RWC or Webb Ellis Cup logos anywhere
- No player photos in MVP
- No news content reproduction

---

## Future Phases (Do Not Build Yet — Just Be Aware)

### Phase 2
- Firebase Auth (Google + Apple sign in)
- User accounts with server-side follows synced to Firestore
- Player profiles with career stats
- H2H history
- Match lineups (if still unreliable in API)

### Phase 3
- Swift iOS app (calls same Cloud Run REST API — no backend changes)
- Kotlin Android app
- iOS home screen widget
- Premium subscription (£2.99/mo) — advanced stats, no ads

---

## Competitors (For Context)

| App | Problem |
|---|---|
| Ultimate Rugby | Buggy, scores don't update, outdated UI |
| RugbyPass | Good data but bloated with streaming, slow UX |
| Union Live | Southern Hemisphere bias, poor Northern coverage |
| Flashscore | Generic, no rugby personality |
| BBC Sport | UK only, not rugby-specific |

RugbyLive wins on: speed, UX, dark mode, clean flat design, all hemispheres equal.

---

## Git & Authorship

**Never reference AI tools anywhere in this project.**

- No `Co-Authored-By: Claude` or any AI tool in git commit trailers
- No `Generated by Claude` / `AI-assisted` comments in source files
- No mention of Claude, Anthropic, or any AI assistant in commit messages, PR descriptions, or code comments
- Commit messages must read as if written by a human developer — concise, imperative, no metadata

When creating commits: write a short imperative subject line (`feat: add MatchCard component`), optional body for *why*, nothing else.

---

## Dev & Testing

> This section is the living dev runbook. Update it whenever commands, ports, or setup steps change.

### Project layout on disk
```
/Users/rorywood/Projects/Web/rugby-live/
  rugbylive-web/          ← Next.js 14 frontend (Phase 1 complete)
  rugbylive-api/          ← Node/Express backend v1 (API-Sports + Firebase, port 4000) — superseded
  rugbylive-api-v2/       ← Node/Express backend v2 (SportsAPI Pro only, port 4001) — superseded
  rugbylive-api-v3/       ← Node/Express backend v3 (multi-API: AS+HL+SAP, port 4002) — ACTIVE
  initial-design/         ← Read-only design reference — do not edit
    RugbyLive UI System.html  ← Visual design canvas
    HANDOFF.md                ← Engineering playbook
    components/               ← Prototype JSX (primitives, layout, match)
    styles/                   ← Design tokens CSS
    design-canvas.jsx
  CLAUDE.md               ← This file (single source of truth)
  HIGHLIGHTLY.md          ← Full Highlightly Rugby API endpoint reference + test results
  SPORTSAPIPRO.md         ← Full SportsAPI Pro endpoint reference + test results
```

### Backend v3 status (rugbylive-api-v3) — CURRENT ACTIVE BACKEND
- **Built and tested 2026-05-06** — all endpoints verified against live APIs
- Port **4002**. Multi-provider: API-Sports (primary) → Highlightly (detail/highlights) → SportsAPI Pro (standings fallback)
- Firebase Admin wired — reads Firestore `/leagues` collection for active league config
- `.env` exists at `rugbylive-api-v3/.env` (gitignored) — all three API keys + Firebase config
- Service account loaded from `../rugbylive-api/service-account.json`
- Start with: `cd rugbylive-api-v3 && npx ts-node src/index.ts`
- **Frontend not yet migrated to v3** — still points at port 4001

**Endpoints confirmed working in v3:**
- `GET /health` — liveness check
- `GET /leagues` — 22 active leagues from Firestore (with apiSportsId, highlightlyId, sapId)
- `GET /leagues/:id/seasons` — global season years, newest first (API-Sports)
- `GET /leagues/:id/standings?season=YYYY` — AS → HL → SAP fallback chain
- `GET /leagues/:id/games?season=YYYY` — AS → SAP fallback chain
- `GET /matches?date=YYYY-MM-DD` — ONE API-Sports call for all active leagues, filtered by active AS IDs
- `GET /matches/live` — today's matches filtered to active statuses (1H, HT, 2H)
- `GET /matches/:id` — match detail (as_ prefix → API-Sports, hl_ → Highlightly)
- `GET /matches/:id/h2h` — AS H2H for as_ matches, HL H2H for hl_ matches
- `GET /matches/:id/highlights` — Highlightly only (hl_ matches); as_ returns []
- `GET /matches/:id/incidents` — Highlightly only (hl_ matches); as_ returns []
- `GET /matches/:id/detail` — **all data in one call**: score + period scores + venue + referee + weather + lineups + predictions + incidents + highlights + H2H. All fields null/empty when provider has no data — never throws. Sources map indicates which provider delivered each section.
- `GET /admin/leagues` — all 142 leagues including inactive
- `PATCH /admin/leagues/:id` — toggle active, category, provider IDs

**Key design decisions:**
- Date-based match polling: ONE API-Sports call (`/games?date=`) covering all leagues → filtered by active AS IDs. Does NOT call Highlightly for polling (7,500/day limit should be preserved for detail pages).
- Highlightly reserved for: highlights, incidents, lineups, predictions, venue, referee (on-demand via `/detail` endpoint only)
- SAP Pro used only for standings fallback (when AS returns empty for knockout comps)
- Firestore doc ID IS the API-Sports league ID — `apiSportsId` falls back to `Number(doc.id)` if not explicitly stored
- Active league detection: `active !== false` (treats missing `active` field as active)
- Match IDs are provider-prefixed: `as_XXXX`, `hl_XXXX`, `sap_XXXX`
- Competition ID on match objects = Firestore doc ID (canonical across providers)

**v3 Firestore league config (20 active leagues, 2026-05-07):**
```
Doc ID = API-Sports ID   Name                         HL ID   SAP ID    Active
10                        Premiership Rugby Cup         9294    11543     ✅
12                        Greene King IPA Championship 10996   1323      ✅
13                        Premiership Rugby            11847   424       ✅
16                        Top 14                       14400   420       ✅
17                        Pro D2                       15251   1147      ✅
27                        Top League                   23761   null      ✅
44                        Major League Rugby           38228   14662     ✅
51                        Six Nations                  44185   423       ✅
52                        Challenge Cup                45036   752       ✅
54                        European Rugby Champions Cup 46738   401       ✅
56                        Six Nations U20              48440   1628      ✅
58                        Rugby Europe Championship    50142   2321      ✅
69                        World Cup                    59503   421       ✅
71                        Super Rugby                  61205   422       ✅
76                        United Rugby Championship    65460   419       ✅
80                        Bunnings NPC                 68864   797       ✅
84                        Friendly International       72268   876       ✅
85                        Rugby Championship           73119   789       ✅
88                        Lions Tour                   75672   27512     ✅
90                        Pacific Nations Cup          77374   13667     ❌ (disabled 2026-05-07)
92                        Americas Pacific Challenge   79076   null      ❌ (disabled 2026-05-07)
96                        Club Friendly                82480   null      ✅
```

**Firestore teams collection (2026-05-07):** 128 teams have `sapTeamId` populated. SAP team IDs discovered via `discoverSapTeamIds.mjs` script (119 auto-matched from SAP standings, 9 manually patched for name-variant teams e.g. "Harlequin FC" → "Harlequins", "Connacht Rugby" → "Connacht Eagles").

### Backend v2 status (rugbylive-api-v2) — superseded by v3
- **Built and tested 2026-04-30** — all endpoints verified against live SportsAPI Pro
- Port 4001 (v1 stays on 4000 — both can run simultaneously)
- No Firebase dependency — fully stateless
- `.env` exists at `rugbylive-api-v2/.env` (gitignored) — contains `SPORTS_API_PRO_KEY`, `PORT=4001`
- Start with: `cd rugbylive-api-v2 && npx ts-node src/index.ts`
- Frontend not yet migrated to v2 — still points at port 4000

**Endpoints confirmed working in v2:**
- `GET /health` — liveness check
- `GET /matches?date=YYYY-MM-DD` — schedule by date (170 matches on busy Saturdays)
- `GET /matches/live` — live matches (empty array when nothing live, not an error)
- `GET /matches/today` — today's full schedule
- `GET /matches/:id` — single match with venue + referee (uses `/api/match/:id` directly)
- `GET /matches/:id/incidents` — try timeline, 41 events for a Premiership match
- `GET /matches/:id/statistics` — 60 stats across ALL/1ST/2ND periods
- `GET /matches/:id/lineups` — starting XV + bench both teams
- `GET /matches/:id/player-statistics` — per-player stats (46 players)
- `GET /matches/:id/highlights` — YouTube URL + thumbnail
- `GET /matches/:id/managers` — head coaches both teams
- `GET /matches/:id/h2h` — homeWins/awayWins/draws all-time record
- `GET /matches/:id/votes` — fan prediction vote counts
- `GET /leagues` — 129 tournaments (categories 82 + 83)
- `GET /leagues/:id` — tournament info with title holder
- `GET /leagues/:id/seasons` — season list with IDs
- `GET /leagues/:id/standings?season=:sid` — full table
- `GET /leagues/:id/rounds?season=:sid` — round navigator + current round
- `GET /leagues/:id/games?season=:sid[&round=:r]` — results/fixtures by season or round
- `GET /teams/:id` — profile (nameCode, colors, venue, form)
- `GET /teams/:id/near-events` — previous result + next fixture
- `GET /teams/:id/results?page=N` — paginated results, 30/page
- `GET /teams/:id/fixtures?page=N` — paginated fixtures, 30/page
- `POST /poll` — live diff detector (returns polled/live/changes counts, no Firebase writes)

### Backend status (rugbylive-api)
- Phase 1 complete and tested against live API
- `dotenv` installed; `import 'dotenv/config'` is the first line of `src/index.ts`
- Local `.env` file exists at `rugbylive-api/.env` (gitignored) — contains `API_SPORTS_KEY`, `PORT=4000`, `FIREBASE_SERVICE_ACCOUNT`, `FIREBASE_DATABASE_URL`
- `service-account.json` exists at `rugbylive-api/service-account.json` (gitignored) — Firebase Admin credentials
- Start with: `cd rugbylive-api && npx ts-node src/index.ts` (nodemon optional, not required)
- Firebase fully wired — Firestore + Realtime Database live and tested (2026-04-25)

### Firebase integration status (confirmed working 2026-04-25)
- **Realtime Database**: today's games written to `/games/{date}/{gameId}` on every poll
- **Firestore `/matches/{id}`**: FT games written permanently when poll detects FT transition
- **Firestore `/leagues`**: cached from API-Sports on first `/leagues` request, refreshed if > 24h old. Each doc has `active: boolean` (default `true`) and `category: string | null` (default `null` = auto-detect). Both fields are preserved on API-Sports refresh. Setting `active: false` hides the league globally. Setting `category` overrides the auto-detect grouping (International/Club/Sevens).
- **Firestore `/teams/{id}`**: upserted on poll when team first seen; `customLogoUrl: null` field reserved for future custom logos
- `GET /matches?date=today` → RTDB first (`source: "realtime"`), falls back to API-Sports
- `GET /matches?date=past` → Firestore first, falls back to API-Sports
- `GET /matches/:id` → Firestore first (if historical FT game), falls back to API-Sports
- `GET /leagues` → Firestore first if < 24h old, falls back to API-Sports and seeds Firestore
- FCM push notifications still stubbed — deferred to Phase 2
- **Logo strategy**: `logoUrl` = API-Sports CDN (stored in DB), `customLogoUrl: null` = reserved for future custom logos. Effective logo = `customLogoUrl ?? logoUrl`. Frontend receives a single `logoUrl` field.

### Frontend status (rugbylive-web)
- **Phase 1 complete and running** — all 5 pages built and tested against live API
- Design system fully applied: CSS vars, Tailwind tokens, Bebas Neue/DM Sans/DM Mono fonts
- All components built: Navbar, Sidebar, MobileNav, MatchCard, DateScrubber, FilterPills, CompGroupHeader, TeamCrest, CompLogo, LiveBadge, StatusBadge, FollowButton, LeagueTable, MatchHero
- React Query polling: 15s when live matches present, 5min otherwise, paused in background
- Zustand follow store wired with localStorage persistence
- Framer Motion stagger animations on competition groups (80ms per group)
- Mobile-first: top navbar shows logo only, bottom nav handles routing
- `useLeagueSeasons(id)` hook fetches seasons dynamically from `/leagues/:id/seasons`; `seasons[0]` is the most recent season (SAP returns newest first). Used in league detail page for standings + fixtures/results.
- `.env.local` exists at `rugbylive-web/.env.local` with `NEXT_PUBLIC_API_URL=http://localhost:4002` ✓ updated to v3
- `lib/firebase.ts` exists as a stub — Firebase client SDK not yet installed (Phase 2)
- Start: `cd rugbylive-web && npm run dev` (port 3000), requires backend v3 on port 4002

**Confirmed fixes (2026-04-24 session):**
- `formatDate()` uses local date parts (`getFullYear/Month/Date`) not `toISOString()` — fixes TODAY marker showing wrong day in non-UTC timezones (e.g. BST, EDT)
- `formatKickoff()` no longer passes `timeZone: 'UTC'` — match times now render in user's local timezone
- `isLive()` / `isTerminal()` updated: AW, AWD, WO, CANC, PST, INT, ABD, TBD all treated as non-live; `isTerminal()` used for Finished filter and Results tab
- Filter pill label "Live Now" renamed to "Live"
- Filter pills use horizontal scroll (`overflowX: auto`) instead of wrapping — single row on mobile
- DateScrubber responsive: mobile gets single date-bar layout, desktop keeps 7-pill grid; calendar picker uses `showPicker()` via button+hidden-input pattern (input `top:0 left:0 w:100% h:100% pointerEvents:none` inside `position:relative` wrapper)
- Desktop calendar button moved to page header (icon only, hidden on mobile)
- TODAY pill letter-spacing tightened to `0.02em` (vs `0.08em` for other days) to prevent overflow

**Confirmed fixes (2026-04-28 session):**
- `isLive()` / `isTerminal()` further updated: `AET`, `AP`, `PEN` added to NON_LIVE and isTerminal — these games are finished, not live
- `StatusBadge`: `AET/AP/PEN` → shows "FT" (no AET label needed); `AW/AWD/WO/ABD` → shows "W/O" (not kickoff time); `CANC` → "CANC"; `PST` → "PPD"
- `MatchCard`: uses `isTerminal(status)` (was hardcoded `status === 'FT'`) for winner bold styling
- **Live filter pill hidden** when selected date ≠ today (no live games possible on past/future dates) — `isToday` prop on `FilterPills`
- **Desktop date scrubber** always starts on Monday (`getMondayOffset()`); left/right arrows shift a full week (±7); month label shown above pills
- **Mobile date scrubber** left/right arrows shift one day at a time (`stepDate` in page)
- **Followed leagues sort to top** of matches feed; remaining sorted alphabetically
- **League active field in Firestore**: `active: boolean` on each league doc. `GET /leagues` filters to active only. `GET /admin/leagues` returns all. `PATCH /admin/leagues/:id` toggles `active`. Preserved on API-Sports refresh.
- **`/leagues/manage` page** built: toggle switches per league, grouped + alphabetical, optimistic UI
- **CORS**: `PATCH` added to allowed methods (needed for admin toggle)
- **`/admin/leagues` routes** added: unprotected for now, must add auth before production

**Confirmed fixes (2026-04-29 session):**
- **Inactive league filtering**: backend filters inactive leagues everywhere — `GET /matches` (all three sources: RTDB, Firestore, API-Sports), poll job (inactive leagues never written to RTDB), and `GET /leagues`. `getActiveLeagueIds()` in store.ts with 5-min in-memory cache; `invalidateActiveLeagueCache()` called immediately on admin PATCH so change takes effect within one poll cycle.
- **League `category` field**: `category: string | null` added to `League` type (backend + frontend). Admin-set override stored in Firestore, preserved on API-Sports refresh. `categorise()` on frontend checks `league.category` first, then auto-detects. Auto-detect: Sevens (name), International (no country or `"World"`), Club (everything else). API-Sports returns `country: "World"` for international competitions — this is the correct check.
- **League grouping**: International / Club / Sevens (removed Northern/Southern Hemisphere split)
- **"World" → "International"**: `displayCountry()` helper replaces "World" with "International" in all country labels on leagues page and manage page
- **`/leagues/manage` category picker**: inline `<select>` per league row — "Auto (detected)" or explicit International/Club/Sevens. Optimistic UI (re-groups instantly, reverts on failure). PATCH sends `{ category }` to backend.
- **URL-based navigation state**: `selectedDate` synced to URL as `?date=YYYY-MM-DD` via `router.replace` (no history pollution). On mount, `useEffect` restores date + window offset from URL. Enables browser back button to return to exact date after visiting match/league detail.
- **`← Back` buttons**: `router.back()` on `/match/[id]` (inline with breadcrumb) and `/leagues/[id]` (above league header). Works for all entry points — back from match returns to matches at the correct date, back from league returns to wherever the user came from.
- **`windowOffsetForDate(date)`** helper extracted in matches page — computes Monday-aligned window offset for any given date. Used for both URL restore and calendar pick.
- **`prevDateRef` bug fix**: was `useRef(todayStr)` (stored the function), fixed to `useRef(todayStr())` (stores the string).
- **`CompGroupHeader` round label**: only prepends "Round " when the value is a plain number. Named rounds (Semi-finals, Final, Quarter-finals, etc.) render as-is.

**Confirmed changes (2026-05-07 session — SAP integration, UI polish):**
- **Desktop sidebar removed** — `app/layout.tsx` now renders a single `<main>` centred at 1120px. No sidebar on any breakpoint. `Sidebar.tsx` component exists but is no longer rendered.
- **Live status labels** — `LiveBadge.tsx` maps raw API status to display labels: `1H → "1ST"`, `HT → "HT"`, `2H → "2ND"`. Raw status values are preserved internally; only the badge display changes.
- **Weather in match hero** — `MatchHero.tsx` accepts a `weather` prop (`{ status, temperature } | null`) and renders in the info strip. Temperature decimal stripped in `matchDetailService.ts` (`"12.5°C" → "12°C"`). Source: Highlightly `forecast`/`weatherForecast` field.
- **League standings season auto-fallback** — `leagues/[id]/page.tsx`: if all standings rows have `played === 0`, fetches `seasons[1]` instead and uses that. Silently upgrades to the most recent season with actual data.
- **Date on Fixtures/Results cards** — `showDate` prop added to `MatchCard`. League detail Fixtures and Results tabs pass `showDate` so the card shows date alongside round, matching H2H card style.
- **SAP Pro fully integrated as fallback for lineups + incidents**:
  - `sportsApiPro.ts`: added `fetchSapLineups()` and `fetchSapIncidents()` with strict 4s `DETAIL_TIMEOUT`
  - `crossRefService.ts`: added `resolveSapMatchId()` — loads SAP schedule for the date, caches 30 min, resolves via Firestore `sapTeamId` (Pass 1) then fuzzy name match (Pass 2)
  - `matchDetailService.ts`: resolves `hlMatchId` and `sapMatchId` in parallel; all 5 enrichment fetches run in one `Promise.all`; SAP fills gaps only when HL returns null/empty
  - `teams.ts`: added `getSapTeamId()` function
- **128 teams have `sapTeamId` in Firestore** — discovered via `scripts/discoverSapTeamIds.mjs` (119 auto-matched + 9 manually patched)
- **SAP ID updates in Firestore leagues**: Premiership Rugby Cup=11543, Six Nations U20=1628, Rugby Europe Championship=2321, World Cup=421, Lions Tour=27512
- **Pacific Nations Cup (id=90) and Americas Pacific Challenge (id=92) disabled** in Firestore (`active: false`)
- **Timeline reversed** — `MatchTimeline.tsx` sorts incidents descending by minute (most recent at top)
- **Highlight thumbnail fixed** — `extractHighlights()` uses `h.imgUrl` as primary thumbnail source (Highlightly field). `h.channel` used as source label.
- **SAP `twoPoints` incident fixed** — `SAP_INCIDENT_TYPE_MAP` correctly maps `twoPoints → 'conversion'` (2pt union conversion, not a try). Also added `yellow`, `red` variants to map alongside `yellowCard`, `redCard`.
- **Frontend migrated to v3** — `.env.local` updated to `http://localhost:4002`

**Confirmed changes (2026-05-06 session — v3 multi-provider backend):**
- **`rugbylive-api-v3` built** — port 4002, multi-provider: API-Sports + Highlightly + SportsAPI Pro
- **Highlightly upgraded to Pro plan** — 7,500 req/day (was 100/day on Basic)
- **All 13 endpoints verified** against live APIs (see Backend v3 status section above)
- **Single API-Sports call per date poll** — `GET /games?date=` fetches all leagues at once, filtered to active AS IDs. Cost: 1 request per poll cycle regardless of how many leagues are active.
- **Firestore doc ID = API-Sports ID** — `apiSportsId` derived from `Number(doc.id)` if not stored explicitly
- **Active league detection fixed** — `active !== false` handles Firestore docs that never had the field explicitly set to `true`
- **22 active leagues** confirmed in Firestore with all three provider IDs stored
- **HIGHLIGHTLY.md** and **SPORTSAPIPRO.md** created — full endpoint references + test results

**Confirmed changes (2026-04-30 session — SportsAPI Pro v2 migration):**
- **Backend migrated**: frontend now points at `rugbylive-api-v2` (port 4001, SportsAPI Pro). Old `rugbylive-api` (API-Sports) no longer used.
- **`Match.week` → `Match.round`**: renamed throughout — `MatchCard`, `MatchHero`, `matches/page.tsx`, `types/index.ts`. SAP v2 returns `round` as a string from `roundInfo.name` (e.g. "Round 18" or "Semi-final"). MatchCard/MatchHero detect plain numbers and prepend "Rd"/"Round".
- **`MatchHero` uses `isTerminal`** (was hardcoded `status === 'FT'`) for `finished` flag.
- **`H2HSummary` type**: `{ homeWins, awayWins, draws }` — H2H tab on match detail shows wins/draws counts in three stat boxes, not a list of past matches (SAP doesn't return match list for H2H).
- **`useLeagueSeasons` hook**: fetches `/leagues/:id/seasons`, returns `Season[]` sorted newest first. League detail page uses `seasons[0]` for standings + fixtures/results queries.
- **Sidebar IDs updated** to SAP IDs: Six Nations=423, URC=419, Premiership=424, Top 14=420, Champions Cup=401, Super Rugby=422, Pro D2=1147, Rugby Championship=789, Int. Friendlies=876.
- **SAP 503 on empty dates/seasons**: SAP returns 503 (not empty array) when no events exist for a schedule date or season. `getMatchesByDate`, `getTodayMatches`, `getSeasonEvents`, `getRoundEvents`, `getSeasons` all treat 503 as empty array now.
- **`/leagues` endpoint**: returns from static `ALLOWED_LEAGUES` config (no SAP API call). Instantaneous response.
- **League management without Firebase**: in-memory `leagueStore` initialized from allowlist. Admin toggles work for session lifetime.
- **Confirmed SAP season IDs (2026-04-30)**: URC 25/26 = 79019, Six Nations 2026 = 86339. URC `events/last/0` 503s — SAP issue, empty state shown.
- **Both type-checks pass clean**: `rugbylive-web` and `rugbylive-api-v2` TSC --noEmit 0 errors.

### Frontend Firebase upgrade (next step — not yet built)
To get true real-time score updates (pushed from RTDB instead of polled from API):
1. Firebase console → Project settings → General → Add web app → copy `firebaseConfig`
2. Add `NEXT_PUBLIC_FIREBASE_CONFIG='{...}'` to `rugbylive-web/.env.local`
3. `npm install firebase` in rugbylive-web
4. Update RTDB security rules to `{ "rules": { ".read": true, ".write": false } }`
5. Uncomment `lib/firebase.ts` and update `hooks/useLiveScores.ts` to use `onValue` listener on `/games/{date}` instead of React Query polling

### Dev commands

| Task | Command |
|---|---|
| Frontend dev server | `cd rugbylive-web && npm run dev` (port 3000) |
| **Backend dev server** | `cd rugbylive-api-v3 && npx ts-node src/index.ts` **(port 4002 — this is the active backend)** |
| Frontend type-check | `cd rugbylive-web && ./node_modules/.bin/tsc --noEmit` |
| Backend type-check | `cd rugbylive-api-v3 && ./node_modules/.bin/tsc --noEmit` |
| Frontend tests | `cd rugbylive-web && npm test` |
| Build frontend | `cd rugbylive-web && npm run build` |
| Docker build (API) | `cd rugbylive-api-v3 && docker build -t rugbylive-api .` |

### Local env setup
- Frontend: `rugbylive-web/.env.local` with `NEXT_PUBLIC_API_URL=http://localhost:4002` ✓ updated to v3
- Backend v3: `rugbylive-api-v3/.env` with `API_SPORTS_KEY`, `HIGHLIGHTLY_KEY`, `SAP_KEY` + Firebase config ✓ exists (gitignored)
- Backend v2 (old): `rugbylive-api-v2/.env` with `SPORTS_API_PRO_KEY` ✓ exists (gitignored)

### Test strategy (from HANDOFF.md)
- **Unit (Vitest)**: score ordering, `pointsDiff` formatting, status→badge mapping, `hashStr` stability
- **Integration**: route handlers with nock-mocked API-Sports responses — happy path + empty-data path per endpoint
- **E2E (Playwright, smoke only)**: `/matches` loads → at least one `MatchCard` or empty-state renders

### Definition of done checklist (Phase 1)
- [ ] `/matches` < 1.5s on 4G (Lighthouse Mobile, 3-run median)
- [ ] Live scores update within 20s of real-world event
- [ ] Zero API-Sports calls from the frontend (Network tab)
- [ ] Zero auth UI anywhere
- [ ] Zero console errors across all 5 pages
- [ ] All interactive targets ≥44px on mobile
- [ ] Follows persist across reload (`rugbylive-follows` key)
- [ ] Dark mode only — no white flash, no unstyled scrollbars
- [ ] `TeamCrest` fallback renders correctly with a bad logo URL
- [ ] Empty states honest — no dashes, no zero stat bars

---

## The One Thing To Remember

> RugbyLive is OneFootball but for rugby. Fast. Clean. Dark. No clutter. No streaming. Just scores.
