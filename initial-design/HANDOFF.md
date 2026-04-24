# RugbyLive — Engineering Handoff

> **Audience**: Claude Code (or any engineer) picking up this project from zero.
> **Prereqs**: read `CLAUDE.md` first — it is the design/product contract.
> **Visual reference**: `RugbyLive UI System.html` — pan/zoom canvas showing every component and assembled pages. Open it alongside your editor.

---

## TL;DR — what you are building

A mobile-first dark web app that shows rugby fixtures, live scores, league tables and match detail. Next.js 14 frontend on Firebase Hosting. Node/Express backend on Cloud Run that proxies API-Sports Rugby and caches into Firebase. No auth. No streaming. Just scores.

Phase 1 scope is strictly:
1. `/matches` — date scrubber + filter pills + competition-grouped match cards with 15s live polling
2. `/leagues` and `/leagues/[id]` — competition browser + standings table + fixtures + results
3. `/match/[id]` — hero + summary timeline + stat bars (lineups/H2H only if API delivers)
4. `/explore` — search over teams + competitions
5. Backend: `/matches`, `/matches/:id`, `/leagues`, `/leagues/:id/standings`, `/teams/:id`, `/poll`
6. FCM push for try + FT events (broad, no per-user targeting yet)

Everything else (auth, player profiles, lineups if unreliable, widgets) is out of scope.

---

## Build order (do it in this order — don't jump ahead)

### Week 1 — Backend + data plumbing
1. Scaffold `rugbylive-api` (Node/Express/TS + Docker). Deploy a hello-world to Cloud Run in europe-west2 with min-instances=1. Prove warm-start works.
2. Move the API-Sports key into Cloud Run Secret Manager. Write `services/apiSports.ts` as the only caller of api-sports.io — every other file must import from it.
3. Implement `GET /matches?date=YYYY-MM-DD`. Return normalised `Match[]` (see `CLAUDE.md` → TypeScript Types). Empty array is valid.
4. Implement `POST /poll` → fetches `/games?live=all` from API-Sports, writes live scores to Realtime DB at `/live/{matchId}`, writes events to Firestore at `matches/{id}/events/{eventId}`.
5. Wire Cloud Scheduler to hit `/poll` every 15s during a live window (08:00–23:00 UTC Sat/Sun year-round; extend as needed). Fall back to 5 min when no fixtures are live.
6. Implement `GET /leagues`, `GET /leagues/:id/standings`, `GET /matches/:id`, `GET /teams/:id`.
7. FCM: in the poll job, diff new events. On new `try` or new `full_time` event, call `services/notifications.ts` to broadcast an FCM topic message to the topic `team-{teamId}`.

### Week 2 — Frontend shell + matches page
1. Scaffold `rugbylive-web` (Next 14 App Router, TS, Tailwind). Configure fonts via `next/font/google` (Bebas Neue, DM Sans, DM Mono).
2. Put the CSS vars from `CLAUDE.md` → *Design System* into `app/globals.css`. Mirror in `tailwind.config.ts`.
3. Build the primitives from the prototype: `TeamCrest`, `CompLogo`, `StatusBadge` (wraps `LiveBadge`), `FollowButton`. Unit-match them to the prototype — don't freestyle.
4. Build `Navbar`, `Sidebar`, `MobileNav`. Hide sidebar below `md`, hide bottom nav above `md`.
5. Build `DateScrubber`, `FilterPills`, `CompGroupHeader`, `MatchCard`, `ScorerPills`, `MatchCardGrid`.
6. Wire `/matches` page. Use React Query with `refetchInterval: hasLive ? 15000 : 300000`. Stagger group entry with Framer Motion (80ms per group, 280ms duration, easeOut).
7. Wire Zustand `useFollowStore` and hook it into `FollowButton` + `CompGroupHeader`.

### Week 3 — Match detail + league detail + explore
1. Build `MatchHero`, `MatchTimeline`, `StatBars`, `MatchLineups`. Apply the honesty rule everywhere (see below).
2. `/match/[id]` page. Same 15s polling if match is live.
3. `LeagueHeader`, `LeagueTable`, standings/fixtures/results tabs. `/leagues/[id]` page.
4. `/leagues` browser — grouped sections. `/explore` — debounced search against a backend search endpoint (or, as an MVP shortcut, client-side filter over `/leagues` + teams hydrated from followed comps).
5. Firebase hosting deploy. Set up `rugbylive.app` DNS.

### Week 4 — Polish + ship
1. Skeleton loaders for every async surface (respect dark palette — use `--surf2` shimmering to `--surf3`).
2. 404/500 pages.
3. Lighthouse pass: target ≥95 performance on mobile, ≥98 accessibility. Pre-connect Google Fonts, lazy-load images, no CLS on card grid.
4. FCM web push: service worker + browser permission prompt on `/alerts`.
5. Analytics (Plausible or Firebase Analytics — pick one). Track: page views, follow toggles, date-scrubber use, live-card impressions.

---

## API-Sports field availability matrix

This is the single most important section. API-Sports rugby coverage is uneven across competitions. **Render what you get. Omit what you don't.** Never fabricate dashes or zeros.

| Field | Endpoint | Confidence | Notes |
|---|---|---|---|
| Fixture list | `/games` | **Always** | Core — date-indexed |
| Live score | `/games?live=all` | **Always** | Home/away score, status, clock |
| Venue | `/games` → `venue.name` | **Usually** | Top-tier comps yes; lower tiers can be null |
| Referee | `/games` → `referee` | Conditional | Don't rely on it — hide if null |
| Events (try/pen/card) | `/games/events` | **Variable** | Reliable for Six Nations, URC, Premiership, Top 14. Unreliable for Sevens and lower-tier leagues. |
| Stats (possession, territory, etc.) | `/games/statistics` | **Variable** | Only top-tier. When returned, field set differs per match — iterate the keys the API sends, don't hardcode a fixed list. |
| Lineups | `/games/lineups` | Conditional | Often missing for MVP competitions. Build the component, but hide the tab when `lineups == null`. |
| Standings | `/standings` | **Always** for league comps | Not applicable for knockouts — hide standings tab for cup draws. |
| H2H | `/games/h2h` | Conditional | Only if both teams have ≥3 prior meetings in the API window. Phase 2 otherwise. |
| Team logos | `/teams` → `logo` | **Always** | But URL can 404 — always render behind the `TeamCrest` fallback. |
| Competition logos | `/leagues` → `logo` | **Always** | Same fallback rule. |
| Player photos | — | **Never** | Not in our plan. Don't use. |

**Rules of engagement with the API**
- Every call goes through `services/apiSports.ts`. No exceptions. Frontend never touches api-sports.io.
- Always set `x-apisports-key` from Secret Manager. Never from env file in prod.
- Respect the 7,500/day ceiling. Budget: ~5,200/day for polling (15s × 60 × 60 live seconds × ~3 live windows/week spread daily) + fixtures hourly + standings hourly + competitions daily. Keep headroom.
- Cache aggressively. Standings → Firestore, 1h TTL. Fixtures → Firestore, 1h TTL. Live scores → RTDB, no TTL (overwritten each poll).
- Normalise at the edge. Do not leak API-Sports shapes past `services/apiSports.ts`. Map to `internal.ts` types immediately.

---

## The honesty rule (applies everywhere in the UI)

If the backend returns `null` or an empty collection for a field, **remove the element** from the DOM. Do not render placeholder glyphs, zeros, or em-dashes for missing data.

Examples:
- No `venue` → don't render the venue text in the match card footer. Let the status badge centre itself.
- No `stats` → match detail *Stats* tab shows an empty state card: "Detailed stats aren't available for this match yet." Don't show all-zero bars.
- No `events` mid-live → match card shows just the score row + live badge, no scorer pills strip.
- No `lineups` → hide the *Lineups* tab entirely. Don't grey it out.
- No `h2h` → hide the *H2H* tab entirely.

The only acceptable placeholder is `TeamCrest` / `CompLogo` falling back to 3-letter initials when a logo URL fails — because a crest slot at a fixed size would collapse the layout if left empty.

---

## Component → prototype source map

Every component in the prototype is self-contained JSX. Port them 1:1 to React/Tailwind, then replace inline-style dicts with Tailwind classes where sensible.

| Final component | Source in prototype |
|---|---|
| `TeamCrest.tsx` | `components/primitives.jsx` → `TeamCrest` |
| `CompLogo.tsx` | `components/primitives.jsx` → `CompLogo` |
| `LiveBadge.tsx` | `components/primitives.jsx` → `LiveBadge` |
| `StatusBadge.tsx` | `components/primitives.jsx` → `StatusBadge` |
| `FollowButton.tsx` | `components/primitives.jsx` → `FollowButton` |
| `ScorerPills.tsx` | `components/primitives.jsx` → `ScorerPills` |
| `Navbar.tsx` | `components/layout.jsx` → `Navbar` |
| `Sidebar.tsx` | `components/layout.jsx` → `Sidebar` |
| `MobileNav.tsx` | `components/layout.jsx` → `MobileNav` |
| `DateScrubber.tsx` | `components/layout.jsx` → `DateScrubber` |
| `FilterPills.tsx` | `components/layout.jsx` → `FilterPills` |
| `CompGroupHeader.tsx` | `components/layout.jsx` → `CompGroupHeader` |
| `MatchCard.tsx` | `components/layout.jsx` → `MatchCard` + `TeamRow` |
| `LeagueTable.tsx` | `components/match.jsx` → `LeagueTable` |
| `MatchHero.tsx` | `components/match.jsx` → `MatchHero` |
| `StatBars.tsx` | `components/match.jsx` → `StatBars` |
| `MatchTimeline.tsx` | `components/match.jsx` → `MatchTimeline` |

The `TeamCrest` fallback palette + `hashStr` helper in the prototype is deliberate — **keep the palette hashing stable** so the same team always gets the same colour across sessions. Do not randomise.

---

## Implementation notes that will bite you

1. **Bebas Neue + `letter-spacing`**: Bebas has no true italics and visually clips on tight letter-spacing below 0.04em. Keep the specified spacings — `0.06em` headings, `0.08em` scores.
2. **DM Mono tabular-nums is a must** on all scores, minutes, and PTS. Add `font-variant-numeric: tabular-nums` to a global `.rl-mono` class and use it everywhere.
3. **Pulsing live dot** uses `transform: scale()` — don't animate `width`/`height` (forces layout). The prototype's keyframes are correct; copy them verbatim.
4. **Live hero score** is `var(--live)` only while `status === 'live' || status === 'halftime'`. As soon as status flips to `finished`, recolour to `var(--text)`. Animate via Framer Motion `animate` on `color` over 400ms.
5. **Match card hover-lift transform** conflicts with Framer Motion's own transform if you wrap cards in `motion.div` with `animate`. Use CSS `transition: transform` on the static card and let Framer only animate `opacity` + `y` on the initial mount.
6. **Sidebar active rail**: the 2px accent rail is positioned `left: -16px` relative to the row — ensure the sidebar container has `padding-left: 16px`, not `0`, or the rail will clip.
7. **Date scrubber**: the "Today" label stays in place; only the date number under it changes as the user scrolls. Use `Intl.DateTimeFormat` with weekday: 'short' and day: 'numeric'. Always surface 7 days centred on selected date.
8. **Poll gating**: don't run the 15s poll if the `/matches` page is backgrounded. Use `document.visibilityState` to pause React Query when hidden. Saves API quota.
9. **FCM on web**: requires a service worker at `firebase-messaging-sw.js` at site root. Firebase Hosting serves this automatically when you place it at `/public/firebase-messaging-sw.js`.
10. **Cloud Run min-instances=1 costs money** (~$8/mo for the smallest instance in europe-west2). Worth it — the brief demands no cold starts.

---

## Environment variables

### Frontend (`rugbylive-web/.env.local`)
```
NEXT_PUBLIC_API_BASE_URL=https://api.rugbylive.app
NEXT_PUBLIC_FIREBASE_API_KEY=…
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=rugbylive.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=rugbylive
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=…
NEXT_PUBLIC_FIREBASE_APP_ID=…
NEXT_PUBLIC_FCM_VAPID_KEY=…
```

### Backend (Cloud Run — set via Secret Manager, not env file)
```
API_SPORTS_KEY=…
FIREBASE_SERVICE_ACCOUNT_JSON=…  (mounted as a secret volume)
FCM_SERVER_KEY=…
ALLOWED_ORIGINS=https://rugbylive.app,http://localhost:3000
```

---

## Testing strategy (MVP — keep it lean)

- **Unit**: score ordering, `pointsDiff` formatting (+/-), status → badge mapping, `hashStr` stability. Vitest.
- **Integration**: backend route handlers with nock-mocked API-Sports responses. One happy path + one empty-data path per endpoint.
- **E2E (smoke only)**: Playwright test that loads `/matches`, asserts at least one `MatchCard` renders or the empty-state card renders.
- Skip visual regression for MVP — the prototype is the spec, reviewed manually.

---

## Definition of done (Phase 1 ship gate)

- [ ] `/matches` loads in < 1.5s on 4G (Lighthouse Mobile, median of 3 runs)
- [ ] Live score updates visibly within 20s of the real-world event (poll + render)
- [ ] Zero API-Sports calls from the frontend (network tab check)
- [ ] Zero authentication UI anywhere
- [ ] Zero console errors on all 5 pages
- [ ] All interactive targets ≥44px on mobile
- [ ] Follows persist across page reload (localStorage key `rugbylive-follows`)
- [ ] Dark mode is the only mode — no light-theme artefacts (white flash on nav, unstyled scrollbars, etc.)
- [ ] `TeamCrest` fallback renders correctly when a logo URL 404s (test by feeding a bad URL)
- [ ] Empty states are honest: no placeholder dashes, no zero-value stat bars

---

## What not to build (common traps)

- Don't add a sign-in button "just in case". Auth is Phase 2.
- Don't build a player-photos feature. Not in the data plan, not in MVP scope.
- Don't add streaming links, video embeds, or news feeds. RugbyPass does that badly; we're deliberately smaller.
- Don't hardcode a list of stat keys in `StatBars`. Iterate `MatchStat[]` from the API.
- Don't use em-dashes or "—" as empty-state fillers. Remove the element.
- Don't self-host team logos. Proxy through API-Sports CDN URLs only (legal constraint).
- Don't add a light-mode toggle — not even a hidden one.
- Don't ship without min-instances=1 on Cloud Run. Cold-start latency will kill the "fastest rugby app" pitch on your first Saturday.

---

## Files in this project

| File | Purpose |
|---|---|
| `CLAUDE.md` | Product + design contract. Source of truth. |
| `HANDOFF.md` | This file. Engineering playbook. |
| `RugbyLive UI System.html` | Visual design system on a pan/zoom canvas. Open in the preview. |
| `styles/tokens.css` | Design tokens (can be copied into `app/globals.css`). |
| `components/primitives.jsx` | Reference React for atoms. |
| `components/layout.jsx` | Reference React for chrome + cards. |
| `components/match.jsx` | Reference React for league table + match detail. |
| `components/data.jsx` | Fictional fixture/standing fixtures for the prototype. Replace with API data in prod. |

---

## Questions to confirm before Week 1 starts

1. Is the `rugbylive.app` domain registered and sitting in Cloudflare/Route53 ready to point at Firebase + Cloud Run?
2. Is the Firebase project created and linked to a billing account (required for RTDB + FCM + Hosting with custom domain)?
3. Is the API-Sports Pro subscription active and the key issued?
4. Preferred analytics: Plausible ($9/mo, privacy-first) or Firebase Analytics (free, Google)?
5. Is push-notification permission prompt allowed on first visit, or should it be gated behind a Follow action? (Recommend: gate it — ask on first follow.)
