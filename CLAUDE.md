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

### Data Provider
| | |
|---|---|
| Provider | API-Sports Rugby API (api-sports.io) |
| Plan | Pro ($15/mo — 7,500 requests/day) |
| Key Storage | Cloud Run Secret Manager (never in code or frontend) |
| Rule | ALL API-Sports calls go through backend only. The frontend NEVER calls API-Sports directly. |

**API-Sports field support — honesty rule:**
API-Sports rugby coverage is uneven. Only render fields the API actually returns. Any stat/event/lineup the API doesn't expose must be hidden (not shown as "—" or "0").

**Confirmed working endpoints (verified April 2026):**
- `GET /games?date=YYYY-MM-DD` — all games on a date (scores null when NS)
- `GET /games?league=X&season=Y` — all games in a competition/season
- `GET /games/h2h?h2h=TEAM1-TEAM2` — H2H history (back to 2009+)
- `GET /standings?league=X&season=Y` — full league table
- `GET /teams?league=X&season=Y` — teams in a competition
- `GET /teams/statistics?team=X&league=Y&season=Z` — team season stats
- `GET /leagues` — all 142 competitions

**Endpoints that DO NOT EXIST in the rugby API (do not build around them):**
- `/games/events` — no try timeline, no scoring events
- `/games/statistics` — no possession, territory, or any match stats
- `/games/lineups` — no lineups
- `/games?live=all` — no live filter parameter
- `/games?from=X&to=Y` — no date range filter
- `/players` — no player data
- `/coaches`, `/injuries`, `/predictions` — none exist

**Game object fields available:**
```
id, date, time, timestamp, week
status: { short: "FT" | "NS" | "1H" | "HT" | "2H" }
league: { id, name, type, logo, season }
teams.home/away: { id, name, logo }
scores: { home, away }               ← null when NS
periods.first/second: { home, away } ← null during live; unreliable even after FT
periods.overtime: { home, away }     ← null in all observed cases
```
No venue. No clock/minute. No referee.

**Observed live game data (confirmed 2026-04-24):** scores update each poll, all period scores null during live play, no half-time scores available mid-match. The live experience is: score + status badge only.

**Standings fields available:**
```
position, points, form ("LWWLW"), description ("Playoffs" | null)
team: { id, name, logo }
games: { played, win.total, draw.total, lose.total }
goals: { for, against }   ← pointsDiff must be calculated as goals.for - goals.against
```

**Live polling strategy (no live=all endpoint):**
Poll `GET /games?date=today` every 15s. Any game where `status.short !== 'FT' && status.short !== 'NS'` is live. Live status values confirmed via real match observation (2026-04-24): `1H` (first half), `HT` (half time), `2H` (second half). No clock/minute value is returned.

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
Desktop layout:       220px sidebar + flex-1 content
Mobile layout:        Full width + fixed 64px bottom nav bar
Navbar height:        56px, sticky, blur backdrop
Match card grid:      3 columns (lg: ≥1024) → 2 (md: ≥768) → 1 (sm)
Sidebar:              Hidden below md breakpoint
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

### Desktop Sidebar (220px, `border-right: 1px solid var(--border)`)
```
LIVE NOW
├── Six Nations          ●
└── URC                  ●

INTERNATIONAL
├── Six Nations                 (active = accent rail + accent2 bg)
├── Rugby Championship
├── World Cup
└── World Sevens Series

CLUB
├── United Rugby Championship
├── Gallagher Premiership
├── Top 14
├── Super Rugby Pacific
└── Champions Cup
```
- Section label: rl-label style, 8px L padding
- Row: 8px padding, 20px comp logo + 13px name + optional live dot
- Active row: `var(--accent2)` bg, 2px accent rail pinned to outer edge

---

## Pages & Routes

### `/matches` — Home/Default
- Page H1 "MATCHES" Bebas 32, right-aligned date text in `var(--text3)`
- Date scrubber (7 days visible, horizontal pill row, prev/next arrows) — **active day pill is solid accent with `var(--bg)` text**
- Filter pills: All / Live Now / Finished / Upcoming — each shows a count in DM Mono
- Matches grouped by competition (CompGroupHeader + 3-col match card grid)
- React Query polls `/api/matches?date=YYYY-MM-DD` every 15s (only if any live match is present; otherwise 5min)

### `/leagues` — Competition Browser
- Grouped by: International / Northern Hemisphere / Southern Hemisphere / Sevens
- Each competition: logo (28px), name, follow button

### `/leagues/[id]` — League Detail
- Tab bar: Standings / Fixtures / Results (accent underline on active)
- Standings table, columns:
  `#  |  Team  |  P  W  D  L  PF  PA  PD  |  PTS`
  - Numeric columns DM Mono, centred
  - PD coloured: `> 0` green, `< 0` muted, `0` text2
  - PTS column: DM Mono 14/700, `color: var(--accent)`
  - Leader row: 2px accent rail on the left edge, position number also accent

### `/match/[id]` — Match Detail
- Breadcrumb trail: Matches · Comp · Teams
- Hero:
  - Comp strip at top (logo, name, round, live badge right)
  - Two-column team block (crest 54px + name + HOME/AWAY label)
  - Giant score row: Bebas 56, **red `var(--live)` while live, `var(--text)` when finished**
  - Half-time scores strip (periods.first / periods.second) — only render if API returns them (not null)
  - Kickoff time strip below (1px top border, text3) — no venue (API never returns it)
- Tab bar: **Score / H2H** only — accent underline on active
  - ~~Summary timeline~~ — REMOVED: `/games/events` does not exist in this API
  - ~~Stats bars~~ — REMOVED: `/games/statistics` does not exist in this API
  - ~~Lineups~~ — REMOVED: `/games/lineups` does not exist in this API
- **Score tab**: hero score + half-time period scores (if available)
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

/rugbylive-api                    ← Node.js backend
  /src
    /routes
      /matches.ts                 ← GET /matches, GET /matches/:id
      /leagues.ts                 ← GET /leagues, GET /leagues/:id/standings
      /teams.ts                   ← GET /teams/:id
      /players.ts                 ← GET /players/:id
      /poll.ts                    ← POST /poll (called by Cloud Scheduler)
    /jobs
      /pollScores.ts              ← Fetches live scores → writes Realtime DB
      /pollFixtures.ts            ← Fetches fixtures → writes Firestore
    /services
      /apiSports.ts               ← API-Sports wrapper (all calls here)
      /firebaseAdmin.ts           ← Firebase Admin SDK init
      /notifications.ts           ← FCM push sender
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
C:\Users\RoryWood\Documents\rugby-live\
  rugbylive-web/          ← Next.js 14 frontend (scaffolded, not built yet)
  rugbylive-api/          ← Node/Express backend (Phase 1 complete, tested)
  initial-design/         ← Read-only design reference — do not edit
    RugbyLive UI System.html  ← Visual design canvas
    HANDOFF.md                ← Engineering playbook
    components/               ← Prototype JSX (primitives, layout, match)
    styles/                   ← Design tokens CSS
    design-canvas.jsx
  CLAUDE.md               ← This file (single source of truth)
```

### Backend status (rugbylive-api)
- Phase 1 complete and tested against live API
- `dotenv` installed; `import 'dotenv/config'` is the first line of `src/index.ts`
- Local `.env` file exists at `rugbylive-api/.env` (gitignored) — contains `API_SPORTS_KEY` and `PORT=4000`
- Start with: `cd rugbylive-api && npx ts-node src/index.ts` (nodemon optional, not required)
- Firebase writes and FCM notifications are stubbed — deferred to Phase 2

### Frontend status (rugbylive-web)
- **Phase 1 complete and running** — all 5 pages built and tested against live API
- Design system fully applied: CSS vars, Tailwind tokens, Bebas Neue/DM Sans/DM Mono fonts
- All components built: Navbar, Sidebar, MobileNav, MatchCard, DateScrubber, FilterPills, CompGroupHeader, TeamCrest, CompLogo, LiveBadge, StatusBadge, FollowButton, LeagueTable, MatchHero
- React Query polling: 15s when live matches present, 5min otherwise, paused in background
- Zustand follow store wired with localStorage persistence
- Framer Motion stagger animations on competition groups (80ms per group)
- Mobile-first: top navbar shows logo only, bottom nav handles routing
- `useLeague(id)` hook reads from cached leagues list to get `currentSeason` — fixes standings showing empty when year defaults to current calendar year
- Start: `cd rugbylive-web && npx next dev` (port 3000), requires backend on port 4000

### Dev commands

| Task | Command |
|---|---|
| Frontend dev server | `cd rugbylive-web && npm run dev` (port 3000) |
| Backend dev server | `cd rugbylive-api && npx ts-node src/index.ts` (port 4000) |
| Frontend type-check | `cd rugbylive-web && npm run type-check` |
| Backend type-check | `cd rugbylive-api && npm run type-check` |
| Frontend tests | `cd rugbylive-web && npm test` |
| Backend tests | `cd rugbylive-api && npm test` |
| Build frontend | `cd rugbylive-web && npm run build` |
| Docker build (API) | `cd rugbylive-api && docker build -t rugbylive-api .` |

### Local env setup
- Frontend: needs `rugbylive-web/.env.local` with `NEXT_PUBLIC_API_URL=http://localhost:4000` (create when starting frontend work)
- Backend: `rugbylive-api/.env` exists with `API_SPORTS_KEY` — in prod use Cloud Run Secret Manager

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
