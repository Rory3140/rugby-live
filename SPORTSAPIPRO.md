# SportsAPI Pro — Rugby V2 API (Live Test Results)

> Tested: 2026-04-29 | Base URL: `https://v2.rugby.sportsapipro.com`
> Auth: `x-api-key` header on every request

---

## Summary

43 of 69 endpoints tested returned 200. The schedule and today endpoints were 503 on first test but confirmed working on 2026-04-29 — this was a temporary outage. **SportsAPI Pro is now the sole data provider for RugbyLive.** API-Sports is being dropped. Full coverage confirmed: 170 matches on a typical Saturday across all major competitions (URC, Premiership, Top 14, Super Rugby, Women's Six Nations, MLR, NRL, Super League, and more). The schedule response is richer than API-Sports — period scores, winnerCode, teamColors, and season.id are all embedded inline.

---

## Endpoint Status Reference

> **How to call:** Every request requires `x-api-key: <key>` header. Base URL is `https://v2.rugby.sportsapipro.com`. Examples use curl — replace `$KEY` with the actual key.

### Live & Schedule

| Endpoint | Status | Notes |
|---|---|---|
| `GET /api/live` | ✅ 200 | Returns `events[]` — empty when no live matches |
| `GET /api/live-tournaments` | ✅ 200 | Returns `data.liveTournaments[]` |
| `GET /api/newly-added-events` | ✅ 200 | Returns `data.events[]` with basic IDs only |
| `GET /api/today` | ✅ 200 | Returns today's full schedule — was 503 on first test (temporary outage, confirmed fixed 2026-04-29) |
| `GET /api/schedule/:date` | ✅ 200 | Returns full day schedule — was 503 on first test (temporary outage, confirmed fixed 2026-04-29) |
| `GET /api/live/all` | ❌ 404 | Does not exist |
| `GET /api/scheduled-tournaments/:date` | ❌ 404 | Does not exist |

```bash
# All live matches right now
curl https://v2.rugby.sportsapipro.com/api/live -H "x-api-key: $KEY"

# Today's full schedule
curl https://v2.rugby.sportsapipro.com/api/today -H "x-api-key: $KEY"

# Schedule for a specific date
curl https://v2.rugby.sportsapipro.com/api/schedule/2026-04-26 -H "x-api-key: $KEY"
```

### Schedule Coverage (confirmed 2026-04-29)

April 26 (Saturday): **170 total events, 87 Rugby Union** including:
URC (5), Gallagher Premiership (4), Top 14 (7), Super Rugby (2), Super Rugby Americas (3), Women's Six Nations (3), MLR (2), All Ireland League (2), Italian Serie A (5), Welsh Super Rygbi Cymru (4), SA Cup (3), NRL (3), Super League (2), RFL Championship (10), plus lower leagues across Argentina, Georgia, France, England.

April 28 (Monday): 2 events — U20 Rugby Championship. Correct — genuinely a quiet day.

### Schedule Response Structure

Each event in `/api/schedule/:date` and `/api/today`:

```json
{
  "id": 14260483,
  "startTimestamp": 1777117500,
  "status": { "code": 100, "description": "Ended", "type": "finished" },
  "roundInfo": { "round": 16 },
  "customId": "NIbsoJb",
  "slug": "glasgow-warriors-stormers",
  "tournament": {
    "name": "United Rugby Championship",
    "slug": "united-rugby-championship",
    "category": { "name": "Rugby Union", "id": 82 },
    "uniqueTournament": { "name": "United Rugby Championship", "id": 419 },
    "id": 876
  },
  "season": { "name": "United Rugby Championship 25/26", "year": "25/26", "id": 79019 },
  "homeTeam": {
    "id": 4188,
    "name": "Stormers",
    "shortName": "Stormers",
    "nameCode": "STO",
    "teamColors": { "primary": "#374df5", "secondary": "#374df5", "text": "#ffffff" }
  },
  "awayTeam": {
    "id": 4214,
    "name": "Glasgow Warriors",
    "shortName": "Glasgow",
    "nameCode": "GLA",
    "teamColors": { "primary": "#374df5", "secondary": "#374df5", "text": "#ffffff" }
  },
  "homeScore": { "current": 48, "display": 48, "period1": 24, "period2": 24, "normaltime": 48 },
  "awayScore": { "current": 12, "display": 12, "period1": 12, "period2": 0, "normaltime": 12 },
  "winnerCode": 1,
  "time": { "played": 2435, "periodLength": 2400 },
  "hasGlobalHighlights": true,
  "hasEventPlayerStatistics": true
}
```

**Key advantages over API-Sports schedule response:**
- `homeScore.period1` / `period2` — reliable half-time scores, present in every finished match
- `winnerCode` — 1 = home, 2 = away, null = draw. No calculation needed.
- `season.id` — directly links each match to its standings season
- `teamColors` — hex fallback colours for team crests when logo not yet cached
- `nameCode` — 3-letter abbreviation for text fallback
- `tournament.uniqueTournament.id` — SportsAPI Pro tournament ID, use for standings + rounds
- `time.played` — seconds elapsed, useful for approximate live clock display
- `hasEventPlayerStatistics` / `hasGlobalHighlights` — flags indicating what enrichment is available
- `roundInfo.name` — named rounds (e.g. "Final", "Semi-final") alongside number

**Status mapping** (SportsAPI Pro → internal):

| `status.type` | `status.description` | Internal status |
|---|---|---|
| `"notstarted"` | "Not started" | `scheduled` |
| `"inprogress"` | "1st Half" | `live` (1H) |
| `"inprogress"` | "Half Time" | `halftime` |
| `"inprogress"` | "2nd Half" | `live` (2H) |
| `"finished"` | "Ended" | `finished` |
| `"finished"` | "AET" | `finished` |
| `"finished"` | "AP" | `finished` |
| `"cancelled"` | "Cancelled" | `cancelled` |
| `"postponed"` | "Postponed" | `postponed` |

### Search & Discovery

| Endpoint | Status | Notes |
|---|---|---|
| `GET /api/search?q=...` | ✅ 200 | Multi-sport — filter by `entity.sport.name === "Rugby"` |
| `GET /api/countries` | ✅ 200 | Returns rugby-specific categories (incl. Rugby Union id=82, Rugby League id=83) |
| `GET /api/countries/all` | ✅ 200 | Extended list including Rugby Union Tens etc. |
| `GET /api/categories/:id/tournaments` | ✅ 200 | id=83 (Rugby League) returns populated list; id=84 (Rugby Union) returns empty — use id=82 |
| `GET /api/trending-players` | ❌ 404 | Does not exist |
| `GET /api/news?lang=en` | ❌ 404 | Does not exist |

```bash
# Search for a team or competition (filter results by sport.id === 12 for Rugby)
curl "https://v2.rugby.sportsapipro.com/api/search?q=leinster" -H "x-api-key: $KEY"

# All rugby categories (get category IDs for tournament lookup)
curl https://v2.rugby.sportsapipro.com/api/countries -H "x-api-key: $KEY"

# All tournaments in Rugby Union category (id=82)
curl https://v2.rugby.sportsapipro.com/api/categories/82/tournaments -H "x-api-key: $KEY"
```

### Match Detail

| Endpoint | Status | Notes |
|---|---|---|
| `GET /api/match/:id` | ✅ 200 | Full event object — scores, teams, venue, referee, status |
| `GET /api/match/:id/lineups` | ✅ 200 | Starters + bench, confirmed flag, positions |
| `GET /api/match/:id/statistics` | ✅ 200 | Full stats by period (ALL / 1ST / 2ND) |
| `GET /api/match/:id/incidents` | ✅ 200 | Try timeline with scorer names and minutes |
| `GET /api/match/:id/player-statistics` | ✅ 200 | Per-player carries, metres, tackles, tries |
| `GET /api/match/:id/player/:pid/statistics` | ✅ 200 | Individual player stats for one player |
| `GET /api/match/:id/highlights` | ✅ 200 | YouTube highlight links |
| `GET /api/match/:id/media` | ✅ 200 | Same as highlights (different label, same data) |
| `GET /api/match/:id/managers` | ✅ 200 | Home + away head coaches with IDs |
| `GET /api/match/:id/votes` | ✅ 200 | Fan prediction vote counts |
| `GET /api/match/:id/odds` | ✅ 200 | 1X2 and H2H markets with fractional odds |
| `GET /api/match/:id/odds/all` | ✅ 200 | Same as /odds |
| `GET /api/match/:id/odds/pre-match` | ✅ 200 | Same as /odds |
| `GET /api/match/:id/scores` | ❌ 404 | Not needed — period scores are in `GET /api/match/:id` |
| `GET /api/match/:id/venue` | ❌ 404 | Not needed — venue is in `GET /api/match/:id` as `event.venue` |
| `GET /api/match/:id/referee` | ❌ 404 | Not needed — referee is in `GET /api/match/:id` as `event.referee` |

```bash
# Full match detail (scores, venue, referee, period scores, winnerCode)
curl https://v2.rugby.sportsapipro.com/api/match/14260483 -H "x-api-key: $KEY"

# Try timeline — scorer names, minutes, try/conversion/penalty/card/sub
curl https://v2.rugby.sportsapipro.com/api/match/14260483/incidents -H "x-api-key: $KEY"

# Match statistics by period (ALL / 1ST / 2ND)
curl https://v2.rugby.sportsapipro.com/api/match/14260483/statistics -H "x-api-key: $KEY"

# Starting XV + bench for both teams
curl https://v2.rugby.sportsapipro.com/api/match/14260483/lineups -H "x-api-key: $KEY"

# Per-player match stats for all players
curl https://v2.rugby.sportsapipro.com/api/match/14260483/player-statistics -H "x-api-key: $KEY"

# Per-player stats for one player (pid from player-statistics or lineups response)
curl https://v2.rugby.sportsapipro.com/api/match/14260483/player/1119380/statistics -H "x-api-key: $KEY"

# YouTube highlight links
curl https://v2.rugby.sportsapipro.com/api/match/14260483/highlights -H "x-api-key: $KEY"

# Head coaches (home + away)
curl https://v2.rugby.sportsapipro.com/api/match/14260483/managers -H "x-api-key: $KEY"

# Fan vote counts (pre-match predictions)
curl https://v2.rugby.sportsapipro.com/api/match/14260483/votes -H "x-api-key: $KEY"

# Pre-match odds (1X2 fractional)
curl https://v2.rugby.sportsapipro.com/api/match/14260483/odds -H "x-api-key: $KEY"
```
| `GET /api/match/:id/channels` | ❌ 404 | Does not exist |
| `GET /api/match/:id/missing-players` | ❌ 404 | Does not exist |
| `GET /api/match/:id/winning-odds` | ❌ 404 | Does not exist |
| `GET /api/match/:id/best-players` | ❌ 503 | Broken |
| `GET /api/match/:id/award` | ❌ 503 | Broken |
| `GET /api/match/:id/h2h` | ❌ 503 | Broken |
| `GET /api/match/:id/graph` | ❌ 503 | Broken |
| `GET /api/match/:id/pregame-form` | ❌ 503 | Broken |
| `GET /api/match/:id/streaks` | ❌ 503 | Broken |

### Tournament

| Endpoint | Status | Notes |
|---|---|---|
| `GET /api/tournament/:id/info` | ✅ 200 | Name, colours, title holder, season dates, `hasRounds` |
| `GET /api/tournament/:id/seasons` | ✅ 200 | Full season history with IDs (required for season-based sub-endpoints) |
| `GET /api/tournament/:id/featured-events` | ✅ 200 | Recent/upcoming key matches |
| `GET /api/tournament/:id/media` | ✅ 200 | YouTube highlight links for the competition |
| `GET /api/tournament/:id/season/:sid/standings` | ✅ 200 | Full table: position, team, matches, wins/losses/draws, scoresFor, scoresAgainst, points, scoreDiffFormatted, promotion.text |
| `GET /api/tournament/:id/season/:sid/rounds` | ✅ 200 | `rounds[]` (each `{ round: N }`) + `currentRound` |
| `GET /api/tournament/:id/season/:sid/knockout` | ❌ 404 | Does not exist for league-format competitions |
| `GET /api/tournament/:id/season/:sid/events/last/:page` | ✅ 200 | 30 events per page, full match objects with period scores, venue, winnerCode |
| `GET /api/tournament/:id/season/:sid/events/round/:round` | ✅ 200 | Same format as events/last, filtered by round number |
| `GET /api/tournament/:id/season/:sid/info` | ❌ 404 | Does not exist — use `/api/tournament/:id/info` instead |
| `GET /api/tournament/:id/season/:sid/venues` | ✅ 200 | All venues used in the season: name, slug, city, capacity, coordinates |

```bash
# Tournament info (name, colours, title holder) — URC example (id=419)
curl https://v2.rugby.sportsapipro.com/api/tournament/419/info -H "x-api-key: $KEY"

# All seasons — get season IDs from here before calling any /season/:sid endpoint
curl https://v2.rugby.sportsapipro.com/api/tournament/419/seasons -H "x-api-key: $KEY"

# Standings — URC 25/26 (sid=79019), URC 24/25 (sid=64655)
curl https://v2.rugby.sportsapipro.com/api/tournament/419/season/79019/standings -H "x-api-key: $KEY"

# All rounds + currentRound
curl https://v2.rugby.sportsapipro.com/api/tournament/419/season/79019/rounds -H "x-api-key: $KEY"

# Last 30 results, paginated — increment page number for older results
curl https://v2.rugby.sportsapipro.com/api/tournament/419/season/79019/events/last/1 -H "x-api-key: $KEY"

# All matches in a specific round
curl https://v2.rugby.sportsapipro.com/api/tournament/419/season/79019/events/round/16 -H "x-api-key: $KEY"

# All venues used in the season
curl https://v2.rugby.sportsapipro.com/api/tournament/419/season/79019/venues -H "x-api-key: $KEY"
```

### Team

| Endpoint | Status | Notes |
|---|---|---|
| `GET /api/teams/:id` | ✅ 200 | Name, sport, category — note: IDs differ from API-Sports |
| `GET /api/teams/:id/players` | ✅ 200 | Full squad with positions and heights |
| `GET /api/teams/:id/featured-event` | ✅ 200 | Next/last key match |
| `GET /api/teams/:id/standings/seasons` | ✅ 200 | Competitions + seasons team has standings in |
| `GET /api/teams/:id/events/last/:page` | ❌ 503 | Broken |
| `GET /api/teams/:id/events/next/:page` | ❌ 503 | Broken |
| `GET /api/teams/:id/near-events` | ❌ 503 | Broken |
| `GET /api/teams/:id/unique-tournaments` | ❌ 503 | Broken |
| `GET /api/teams/:id/performance` | ❌ 503 | Broken |
| `GET /api/teams/:id/media` | ❌ 503 | Broken |
| `GET /api/teams/:id/transfers` | ❌ 404 | Does not exist |
| `GET /api/teams/:id/player-statistics/seasons` | ❌ 404 | Does not exist |
| `GET /api/teams/:id/team-statistics/seasons` | ❌ 404 | Does not exist |
| `GET /api/teams/:id/tournament/:tid/season/:sid/statistics` | ❌ 503 | Broken |

```bash
# Team profile — use SportsAPI Pro team ID (extract from match response, NOT API-Sports ID)
# Stormers SportsAPI Pro id = 4188 (from schedule/match response)
curl https://v2.rugby.sportsapipro.com/api/teams/4188 -H "x-api-key: $KEY"

# Full squad with positions, heights, jersey numbers
curl https://v2.rugby.sportsapipro.com/api/teams/4188/players -H "x-api-key: $KEY"

# Next or last key match for the team
curl https://v2.rugby.sportsapipro.com/api/teams/4188/featured-event -H "x-api-key: $KEY"

# Competitions + seasons this team has standings data for
curl https://v2.rugby.sportsapipro.com/api/teams/4188/standings/seasons -H "x-api-key: $KEY"
```

### Player

| Endpoint | Status | Notes |
|---|---|---|
| `GET /api/players/:id` | ✅ 200 | Name, team, position, DOB, height, weight, country |
| `GET /api/players/:id/statistics/seasons` | ✅ 200 | Which tournaments + seasons player has stats for |
| `GET /api/players/:id/characteristics` | ✅ 200 | Positive/negative traits and positions (often empty) |
| `GET /api/players/:id/national-team-statistics` | ✅ 200 | International caps and stats (often empty) |
| `GET /api/players/:id/last-year-summary` | ✅ 200 | Season summary (often empty) |
| `GET /api/players/:id/unique-tournaments` | ✅ 200 | Competitions the player has appeared in |
| `GET /api/players/:id/events/last/:page` | ✅ 200 | Recent matches |
| `GET /api/players/:id/statistics` | ❌ 404 | Does not exist |
| `GET /api/players/:id/statistics/match-type` | ❌ 404 | Does not exist |
| `GET /api/players/:id/transfer-history` | ❌ 404 | Does not exist |
| `GET /api/players/:id/attribute-overviews` | ❌ 404 | Does not exist |
| `GET /api/players/:id/events/next/:page` | ❌ 404 | Does not exist |
| `GET /api/players/:id/media` | ❌ 404 | Does not exist |
| `GET /api/players/:id/tournament/:tid/season/:sid/statistics` | ❌ 503 | Broken |
| `GET /api/players/:id/tournament/:tid/season/:sid/ratings` | ❌ 503 | Broken |
| `GET /api/players/:id/tournament/:tid/season/:sid/summary` | ❌ 503 | Broken |

```bash
# Player profile — use SportsAPI Pro player ID (from lineups or player-statistics response)
# Ntuthuko Mchunu (Stormers prop) id = 1119380
curl https://v2.rugby.sportsapipro.com/api/players/1119380 -H "x-api-key: $KEY"

# Which seasons/tournaments the player has stats data for
curl https://v2.rugby.sportsapipro.com/api/players/1119380/statistics/seasons -H "x-api-key: $KEY"

# Competitions the player has appeared in
curl https://v2.rugby.sportsapipro.com/api/players/1119380/unique-tournaments -H "x-api-key: $KEY"

# Recent matches for the player (paginated)
curl https://v2.rugby.sportsapipro.com/api/players/1119380/events/last/1 -H "x-api-key: $KEY"

# International caps + stats
curl https://v2.rugby.sportsapipro.com/api/players/1119380/national-team-statistics -H "x-api-key: $KEY"
```

### Venue / Referee / Manager

All dedicated venue, referee, and manager endpoints returned 404 or were untested due to IDs not being present in the test match. However, **venue and referee data are embedded directly in `GET /api/match/:id`** so dedicated endpoints are not needed for RugbyLive's use case.

---

## Response Envelope

Every successful response:

```json
{
  "success": true,
  "data": { ... },
  "source": "live",
  "cacheHit": true,
  "timezone": {
    "name": "America/New_York",
    "utcOffset": "-04:00",
    "source": "auto"
  }
}
```

Match-specific endpoints also include `"matchId"` and `"endpoint"` fields. The `timezone` field is IP-detected and irrelevant for server-side usage.

---

## Match Detail (`GET /api/match/:id`)

The richest single endpoint. Returns a full `data.event` object:

```json
{
  "tournament": { "name": "United Rugby Championship", "slug": "...", "category": {...} },
  "season": { "name": "United Rugby Championship 24/25", "year": "24/25", "id": 64655 },
  "roundInfo": { "round": 16 },
  "status": { "code": 100, "description": "Ended", "type": "finished" },
  "winnerCode": 1,
  "homeTeam": { "id": 4285, "name": "Stormers", "shortName": "Stormers", "nameCode": "STO" },
  "awayTeam": { "id": 4284, "name": "Glasgow Warriors", "shortName": "Glasgow", "nameCode": "GLA" },
  "homeScore": { "current": 48, "display": 48, "period1": 24, "period2": 24, "normaltime": 48 },
  "awayScore": { "current": 12, "display": 12, "period1": 12, "period2": 0, "normaltime": 12 },
  "venue": {
    "slug": "dhl-newlands-stadium",
    "venueCoordinates": { "latitude": -33.970523, "longitude": 18.468563 },
    "hidden": true
  },
  "referee": { "name": "Eoghan Cross", "slug": "cross-eoghan", "yellowCards": 35, "redCards": 2, "games": 41, "id": "..." },
  "time": {
    "played": 2435,
    "periodLength": 2400,
    "overtimeLength": 600,
    "totalPeriodCount": 2,
    "currentPeriodStartTimestamp": 1777124319
  },
  "startTimestamp": 1777117500,
  "id": 14260483,
  "hasGlobalHighlights": true,
  "hasEventPlayerStatistics": true
}
```

**Key advantage over API-Sports**: `homeScore.period1` and `homeScore.period2` are reliably populated for finished matches. `winnerCode` (1 = home win, 2 = away win) is also available.

### Status types

| `status.type` | `status.description` examples | Meaning |
|---|---|---|
| `"notstarted"` | "Not started" | Upcoming |
| `"inprogress"` | "1st Half", "Half Time", "2nd Half" | Live |
| `"finished"` | "Ended", "AET", "AP" | Terminal |

---

## Incidents (`GET /api/match/:id/incidents`)

Returns `data.incidents[]` — 42 incidents for a typical match. All types observed:

### Period marker
```json
{
  "incidentType": "period",
  "text": "FT",
  "homeScore": 48,
  "awayScore": 12,
  "isLive": false,
  "time": 80,
  "timeSeconds": 4800
}
```
`text` values: `"HT"`, `"FT"`. The `time` field gives the minute.

### Scoring event (try / conversion / penalty)
```json
{
  "incidentType": "goal",
  "incidentClass": "try",
  "from": "try",
  "player": {
    "id": 1468037,
    "name": "Keke Morabe",
    "shortName": "K. Morabe",
    "position": "F",
    "jerseyNumber": "0"
  },
  "isHome": true,
  "homeScore": 46,
  "awayScore": 12,
  "time": 72,
  "timeSeconds": 4316,
  "id": 345974654
}
```

### `incidentClass` values for goals

| `incidentClass` | `from` | Meaning | Points |
|---|---|---|---|
| `"try"` | `"try"` | Try scored | 5 |
| `"twoPoints"` | `"twopoints"` | Conversion | 2 |
| `"threePoints"` | `"threepoints"` | Penalty goal | 3 |
| `"dropGoal"` | — | Drop goal | 3 |

### Substitution
```json
{
  "incidentType": "substitution",
  "incidentClass": "regular",
  "playerIn": { "id": 2563793, "name": "Markus Muller", "shortName": "M. Muller", "position": "B" },
  "playerOut": { "id": "...", "name": "...", "shortName": "..." },
  "isHome": true,
  "time": 55
}
```

### Card
```json
{
  "incidentType": "card",
  "incidentClass": "yellow",
  "player": { "id": 834760, "name": "Adam Hastings", "shortName": "A. Hastings" },
  "isHome": false,
  "time": 34
}
```
`incidentClass` for cards: `"yellow"`, `"red"`.

---

## Statistics (`GET /api/match/:id/statistics`)

Returns `data.statistics[]` — one object per period. Periods: `"ALL"`, `"1ST"`, `"2ND"`.

Full stat keys confirmed for a URC match:

| Key | Group | Type | Example (home/away) |
|---|---|---|---|
| `possession` | Possession | % | 48 / 52 |
| `passes` | Possession | count | 82 / 139 |
| `tries` | Scoring | count | 6 / 2 |
| `tryAssists` | Scoring | count | 4 / 1 |
| `conversions` | Scoring | count | 6 / 1 |
| `carries` | Scoring other | count | 74 / 85 |
| `cleanBreaks` | Scoring other | count | 8 / 6 |
| `penaltyGoals` | Scoring other | count | 2 / 0 |
| `dropGoals` | Scoring other | count | 0 / 0 |
| `scrumsAccuracy` | Other | string "W/L (X%)" | "5/6 (83%)" |
| `lineoutsAccuracy` | Other | string "W/L (X%)" | "15/17 (88%)" |
| `turnovers` | Other | count | 7 / 19 |
| `turnoversWon` | Other | count | 6 / 4 |
| `metersRun` | Other | count | 399 / 414 |
| `offloads` | Other | count | 2 / 3 |
| `tackles` | Other | count | 128 / 100 |
| `tacklesMissed` | Other | count | 30 / 19 |
| `penaltiesConceded` | Penalty | count | 13 / 15 |
| `yellowCards` | Penalty | count | 1 / 2 |
| `redCards` | Penalty | count | 0 / 0 |

Each item in the array:
```json
{
  "name": "Ball possession",
  "key": "possession",
  "home": "48%",
  "away": "52%",
  "homeValue": 48,
  "awayValue": 52,
  "statisticsType": "positive",
  "renderType": 1,
  "compareCode": 2
}
```
Use `homeValue` / `awayValue` (integers) for stat bars, not the `home` / `away` strings.

---

## Lineups (`GET /api/match/:id/lineups`)

```json
{
  "confirmed": false,
  "home": {
    "players": [
      {
        "player": {
          "id": 1119380,
          "name": "Ntuthuko Mchunu",
          "shortName": "N. Mchunu",
          "firstName": "Ntuthuko",
          "lastName": "Mchunu",
          "position": "F",
          "jerseyNumber": "",
          "height": 188,
          "gender": "M",
          "country": { "alpha2": "ZA", "alpha3": "ZAF", "name": "South Africa" }
        },
        "teamId": 4285,
        "shirtNumber": 1,
        "substitute": false
      }
    ]
  },
  "away": { "players": [...] }
}
```

- `confirmed: false` = lineup announced but not yet verified
- `substitute: true` = bench player
- `position` codes: `"F"` (Forward), `"B"` (Back), `"W"` (Wing)
- `jerseyNumber` may be an empty string — use `shirtNumber` as fallback

---

## Player Statistics per Match (`GET /api/match/:id/player-statistics`)

Returns `data.home[]` and `data.away[]`. Each entry:

```json
{
  "player": {
    "id": 1119380,
    "name": "Ntuthuko Mchunu",
    "shortName": "N. Mchunu",
    "position": "F",
    "jerseyNumber": "1"
  },
  "shirtNumber": 1,
  "substitute": false,
  "statistics": {
    "points": 10,
    "carries": 5,
    "metersRun": 15,
    "cleanBreaks": 0,
    "offloads": 0,
    "passes": 0,
    "tackles": 7,
    "tacklesMissed": 2,
    "tryAssists": 0,
    "tries": 2,
    "conversions": 0,
    "penaltyGoals": 0,
    "dropGoals": 0,
    "yellowCard": 0,
    "redCard": 0
  }
}
```

---

## Highlights (`GET /api/match/:id/highlights`)

```json
{
  "highlights": [
    {
      "title": "Stormers 48 - 12 Glasgow",
      "subtitle": "Full Highlights",
      "url": "https://www.youtube.com/watch?v=xgqLk9zGOYs",
      "thumbnailUrl": "https://i.ytimg.com/vi/xgqLk9zGOYs/hqdefault.jpg",
      "mediaType": 6,
      "keyHighlight": true,
      "livestream": false,
      "id": 7372170
    }
  ]
}
```

`/media` returns identical data. Use `highlights` as the canonical endpoint.

---

## Managers (`GET /api/match/:id/managers`)

```json
{
  "homeManager": { "id": 797976, "name": "John Dobson", "slug": "john-dobson", "shortName": "J. Dobson" },
  "awayManager": { "id": "...", "name": "...", "slug": "..." }
}
```

Away manager may be absent (`{}`) for some matches.

---

## Votes (`GET /api/match/:id/votes`)

```json
{
  "vote": { "vote1": 205, "vote2": 137, "voteX": 14 },
  "bothTeamsToScoreVote": { "voteYes": 0, "voteNo": 0 },
  "firstTeamToScoreVote": { "voteHome": 0, "voteNoGoal": 0, "voteAway": 0 },
  "whoShouldHaveWonVote": { "vote1": 0, "vote2": 0 }
}
```

`vote1` = home wins, `vote2` = away wins, `voteX` = draw. Secondary vote categories are populated pre-match only.

---

## Odds (`GET /api/match/:id/odds`)

Returns `data.markets[]`:

```json
{
  "marketName": "Full time",
  "marketGroup": "1X2",
  "marketPeriod": "Full-time",
  "isLive": false,
  "choices": [
    { "name": "1", "fractionalValue": "9/25", "initialFractionalValue": "9/25", "sourceId": "..." },
    { "name": "X", "fractionalValue": "...", ... },
    { "name": "2", "fractionalValue": "...", ... }
  ]
}
```

Markets observed: `"Full time"` (1X2) and `"Full time (including overtime)"` (H2H). `/odds`, `/odds/all`, and `/odds/pre-match` all return the same data for historical matches.

---

## Tournament (`GET /api/tournament/:id/info` + `/seasons`)

### Info
```json
{
  "uniqueTournament": {
    "id": 419,
    "name": "United Rugby Championship",
    "slug": "united-rugby-championship",
    "primaryColorHex": "#27cde6",
    "secondaryColorHex": "#1aabc1",
    "logo": { "id": 909692, "md5": "f8a8277ea57edb013913bd5692af5ac4" },
    "titleHolder": { "name": "Leinster Rugby", "id": "..." },
    "hasRounds": true,
    "hasGroups": false,
    "gender": "M",
    "startDateTimestamp": 1758844800,
    "endDateTimestamp": 1781395200
  }
}
```

Logo images are served at `/api/tournament/:id/image` (not in the info response).

### Seasons
```json
{
  "seasons": [
    { "id": 79019, "name": "United Rugby Championship 25/26", "year": "25/26" },
    { "id": 64655, "name": "United Rugby Championship 24/25", "year": "24/25" },
    { "id": 53246, "name": "United Rugby Championship 23/24", "year": "23/24" },
    { "id": 44886, "name": "United Rugby Championship 22/23", "year": "22/23" }
  ]
}
```

Season IDs are required for standings, rounds, and bracket endpoints. Always fetch `/seasons` first to resolve the correct ID.

---

## Confirmed Tournament IDs

From real schedule data (`tournament.uniqueTournament.id`):

### Rugby Union
| Competition | ID |
|---|---|
| United Rugby Championship | 419 |
| Gallagher Premiership | 424 |
| Top 14 (France) | 420 |
| Super Rugby Pacific | 422 |
| Women's Six Nations | 2055 |
| Super Rugby Americas | 20366 |
| Super Rygbi Cymru (Wales) | 1361 |
| All Ireland League Div. 1A | 1912 |
| Major League Rugby | 14662 |

### Rugby League
| Competition | ID |
|---|---|
| NRL Premiership | 294 |
| Super League | 302 |
| RFL Championship | 1582 |

> Men's Six Nations, Rugby Championship, World Cup IDs not confirmed — search endpoint returning multi-sport results makes discovery unreliable. Resolve via `/api/search?q=six+nations` filtering for `entity.sport.name === "Rugby"`.

---

## Player (`GET /api/players/:id`)

```json
{
  "player": {
    "id": 1119380,
    "name": "Ntuthuko Mchunu",
    "firstName": "Ntuthuko",
    "lastName": "Mchunu",
    "shortName": "N. Mchunu",
    "position": "F",
    "height": 188,
    "weight": 123,
    "dateOfBirth": "1999-04-05T00:00:00+00:00",
    "dateOfBirthTimestamp": 923270400,
    "gender": "M",
    "country": { "alpha2": "ZA", "name": "South Africa" },
    "team": { "name": "Stormers", "id": "..." }
  }
}
```

Player photos at `/api/players/:id/image` (URL format, not inline in response).

---

## Search (`GET /api/search?q=...`)

Returns `data.results[]` — multi-sport. Each result:

```json
{
  "type": "team",
  "entity": {
    "id": 4181,
    "name": "Crusaders",
    "nameCode": "CRU",
    "slug": "crusaders",
    "sport": { "id": 12, "name": "Rugby", "slug": "rugby" }
  }
}
```

`type` values observed: `"team"`, `"player"`, `"uniqueTournament"`. Filter by `entity.sport.id === 12` (Rugby) to exclude football results.

---

## ID Mapping Problem

**Team and tournament IDs in SportsAPI Pro are different from API-Sports IDs.**

The match ID `14260483` (Stormers vs Glasgow) appears to be consistent across both APIs, but team IDs (e.g. team `4285` in SportsAPI Pro returns "Tulane Green Wave", an American football team — not the Stormers). Match-level endpoints are safe to call by match ID once discovered via API-Sports. Do not pass API-Sports team or tournament IDs directly to SportsAPI Pro team/tournament endpoints.

**Recommended ID resolution**:
1. Discover matches via API-Sports (`GET /games?date=DATE`)
2. Use the API-Sports match ID to call SportsAPI Pro match detail endpoints — match IDs appear to be shared
3. Extract SportsAPI Pro team and tournament IDs from within the match response (`event.homeTeam.id`, `event.tournament.id`)
4. Use those extracted IDs for SportsAPI Pro team/tournament endpoints

---

## What This Unlocks for RugbyLive

### Now buildable (were blocked before)

| Feature | Endpoint |
|---|---|
| Try scorer timeline on match page | `GET /api/match/:id/incidents` |
| Stats tab (possession, tries, carries, tackles, lineouts, scrums) | `GET /api/match/:id/statistics` |
| Starting XV + bench on match page | `GET /api/match/:id/lineups` |
| Per-player match stats | `GET /api/match/:id/player-statistics` |
| Half-time period scores | `event.homeScore.period1` in `GET /api/match/:id` |
| Referee name on match page | `event.referee` in `GET /api/match/:id` |
| Venue name on match page | `event.venue.slug` in `GET /api/match/:id` |
| Head coaches | `GET /api/match/:id/managers` |
| YouTube highlights | `GET /api/match/:id/highlights` |
| Pre-match fan predictions | `GET /api/match/:id/votes` |
| Standings for any competition | `GET /api/tournament/:id/season/:sid/standings` |

### Still not available

| Feature | Reason |
|---|---|
| Date-based fixture discovery | `/api/schedule/:date` is 503 — use API-Sports |
| Live match clock/minute | Not in any endpoint |
| H2H history | `/api/match/:id/h2h` is 503 |
| Team recent results | `/api/teams/:id/events/last/:page` is 503 |
| Man of the Match | `/api/match/:id/award` is 503 |

---

## Standings (`GET /api/tournament/:id/season/:sid/standings`)

Returns `data.standings[]` — one object per table type (usually just `"total"`). Each `standings[n].rows[]`:

```json
{
  "team": {
    "id": 4210,
    "name": "Leinster Rugby",
    "shortName": "Leinster",
    "nameCode": "LEI",
    "teamColors": { "primary": "#374df5", "secondary": "#374df5", "text": "#ffffff" }
  },
  "position": 1,
  "matches": 18,
  "wins": 16,
  "losses": 2,
  "draws": 0,
  "scoresFor": 542,
  "scoresAgainst": 256,
  "points": 76,
  "scoreDiffFormatted": "+286",
  "promotion": { "text": "Playoffs", "id": 6 },
  "descriptions": []
}
```

**Note**: `scoreDiffFormatted` is a pre-formatted string (e.g. `"+286"`, `"-34"`). `scoresFor` / `scoresAgainst` are raw point totals. No `form` field (unlike API-Sports which returns a `"LWWLW"` form string).

**Advantage over API-Sports standings**: team logo data embedded (via `teamColors` for fallback); `promotion.text` label included; reliable `scoreDiffFormatted`. API-Sports also works fine for standings and includes `form` — use whichever is more convenient.

---

## Season Events (`GET /api/tournament/:id/season/:sid/events/last/:page`)

30 events per page. Each event object:

```json
{
  "id": 12618711,
  "status": { "code": 100, "description": "Ended", "type": "finished" },
  "startTimestamp": 1740845700,
  "roundInfo": { "round": 12 },
  "homeTeam": { "id": 245501, "name": "Bulls", "nameCode": "BUL" },
  "awayTeam": { "id": 4188, "name": "Stormers", "nameCode": "STO" },
  "homeScore": { "current": 16, "display": 16, "period1": 9, "period2": 7, "normaltime": 16 },
  "awayScore": { "current": 19, "display": 19, "period1": 12, "period2": 7, "normaltime": 19 },
  "winnerCode": 2,
  "venue": { "name": "Loftus Versfeld Stadium", "slug": "loftus-versfeld-stadium" },
  "season": { "name": "United Rugby Championship 24/25", "year": "24/25", "id": 64655 },
  "hasEventPlayerStatistics": true,
  "hasGlobalHighlights": false
}
```

`winnerCode`: `1` = home win, `2` = away win, `null` = draw. Period scores are reliably populated for finished matches. `/events/round/:round` returns the same shape filtered to a single round.

---

## Architecture Decision (confirmed 2026-04-29)

**SportsAPI Pro is the sole data provider. API-Sports is dropped.**

The schedule endpoint outage was temporary. With it working, SportsAPI Pro covers everything API-Sports does plus far more. API-Sports is cancelled.

```
SportsAPI Pro — all data flows
────────────────────────────────────────────────────────────
GET /api/schedule/:date       → fixture discovery (replaces API-Sports /games?date=)
GET /api/today                → today's matches
GET /api/live                 → live match detection (replaces date-poll-then-filter)

GET /api/match/:id            → scores, period scores, venue, referee, winnerCode
GET /api/match/:id/incidents  → try timeline with scorer + minute
GET /api/match/:id/statistics → possession, tries, tackles, lineouts, scrums, metres
GET /api/match/:id/lineups    → starting XV + bench
GET /api/match/:id/player-statistics → per-player match stats
GET /api/match/:id/highlights → YouTube links

GET /api/tournament/:id/season/:sid/standings → league table
GET /api/tournament/:id/season/:sid/events/last/:page → season results (paginated)
GET /api/tournament/:id/season/:sid/events/round/:round → round fixtures
GET /api/tournament/:id/seasons → resolve season IDs
```

**H2H tab:** `/api/match/:id/h2h` is still 503. H2H tab dropped for now — can be rebuilt from season events or re-added when the endpoint recovers.

**Logos:** Not sourced from SportsAPI Pro API. Team and league logos are managed manually and stored directly in Firebase. `teamColors` from the schedule response serves as crest fallback colour. `nameCode` serves as text fallback.

**Image endpoints (for reference):**
- `GET /api/teams/:id/image` → returns raw webp binary (requires API key header — backend only)
- `GET /api/tournament/:id/image` → returns JSON `{ imageUrl }` pointing to same endpoint
- Not used — logos handled separately
