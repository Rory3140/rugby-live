# Highlightly Rugby API — Live Test Results

> Last tested: 2026-05-05 | Base URL: `https://rugby.highlightly.net`
> Auth: `x-rapidapi-key: YOUR_KEY` header on every request
> Plan: PRO (7,500 requests/day) — upgraded 2026-05-06
> OpenAPI spec: `/Users/rorywood/Downloads/openapi.json`

---

## Endpoint Status

| Endpoint | Status | Notes |
|---|---|---|
| `GET /countries` | ✅ Works | 258 countries |
| `GET /countries/{countryCode}` | ✅ Works | Returns array |
| `GET /leagues` | ✅ Works | 105 total leagues, filter by name/country |
| `GET /leagues/{id}` | ✅ Works | Returns array (single item) |
| `GET /matches` | ✅ Works | By date, leagueId, season, teamId, name — paginated |
| `GET /matches/{id}` | ✅ Works | Venue + referee + forecast + predictions + lineups (major leagues only) |
| `GET /teams` | ✅ Works | Search by name, limit/offset |
| `GET /teams/{id}` | ✅ Works | Returns array — just id, name, logo |
| `GET /teams/statistics/{id}` | ✅ Works | Per-league season stats, requires `fromDate` |
| `GET /highlights` | ✅ Works | By date, leagueId, matchId, teamId — paginated |
| `GET /highlights/{id}` | ✅ Works | Single highlight by ID |
| `GET /standings` | ✅ Works | Requires `leagueId` + `season`, returns grouped table |
| `GET /last-five-games` | ✅ Works | Last 5 finished games for a team (`teamId` required) |
| `GET /head-2-head` | ✅ Works | Full match list for two teams (`teamIdOne` + `teamIdTwo` required) |
| `GET /bookmakers` | ✅ Works | 65 bookmakers, paginated |
| `GET /bookmakers/{id}` | ✅ Works | Single bookmaker |
| `GET /odds` | ❌ 401 | Not available on BASIC plan — paid upgrade required |
| `GET /highlights/geo-restrictions/{id}` | ❌ 401 | Not available on BASIC plan — paid upgrade required |

---

## Response Envelope

### Paginated endpoints (`/matches`, `/leagues`, `/highlights`, `/teams`, `/bookmakers`, `/odds`)
```json
{
  "data": [...],
  "pagination": {
    "totalCount": 36,
    "offset": 0,
    "limit": 100
  },
  "plan": {
    "tier": "BASIC",
    "message": "..."
  }
}
```

### Non-paginated endpoints return a plain array or plain object:
- `/countries`, `/countries/{code}` → array
- `/leagues/{id}`, `/matches/{id}`, `/teams/{id}`, `/highlights/{id}` → array (single element)
- `/standings` → object with `groups` array
- `/last-five-games`, `/head-2-head` → plain array

---

## Rate Limits

| Header | Value |
|---|---|
| `x-ratelimit-requests-limit` | 7,500 (PRO plan) |
| `x-ratelimit-requests-remaining` | decrements per request |

**7,500 requests/day** on PRO — matches the API-Sports quota. Can now be used for match detail enrichment on every match page load without worrying about the budget.

---

## Matches (`/matches`)

### Query parameters
| Param | Notes |
|---|---|
| `date` | YYYY-MM-DD — primary filter |
| `leagueId` | number |
| `season` | number e.g. `2026` |
| `homeTeamId` / `awayTeamId` | team numeric IDs |
| `homeTeamName` / `awayTeamName` | name string |
| `countryCode` | ISO 3166 e.g. "EU", "GB", "US" |
| `countryName` | e.g. "Europe", "England" |
| `timezone` | IANA e.g. "Europe/London" — affects date boundary |
| `limit` | max 100, default 100 |
| `offset` | pagination |

### Match object
```json
{
  "id": 42119327,
  "week": "5",
  "date": "2026-03-22T15:45:00.000Z",
  "country": {
    "code": "EU",
    "name": "Europe",
    "logo": "http://highlightly.net/rugby/images/countries/EU.svg"
  },
  "homeTeam": {
    "id": 330121,
    "name": "France",
    "logo": "https://highlightly.net/rugby/images/teams/330121.png"
  },
  "awayTeam": {
    "id": 329270,
    "name": "England",
    "logo": null
  },
  "league": {
    "id": 44185,
    "name": "Six Nations",
    "logo": "https://highlightly.net/rugby/images/leagues/44185.png",
    "season": 2026
  },
  "state": {
    "description": "Finished",
    "score": "48 - 46"
  }
}
```

### Key observations
- **`state.score` is a string `"X - Y"`, not separate integers.** Parse it to get home/away.
- `state.score` is `null` for not-started matches.
- `week` is present on most matches but can be `null` (seen on MLR matches).
- `date` is always UTC ISO 8601.
- No period/half-time scores anywhere in the match list response.
- Logo fields (`homeTeam.logo`, `awayTeam.logo`, `league.logo`) can be `null` — ~36% of teams have no logo on a typical match day.
- Logo URLs follow: `https://highlightly.net/rugby/images/teams/{id}.png` and `https://highlightly.net/rugby/images/leagues/{id}.png`
- `country` uses `"World"` for international/cross-border competitions (URC, Super Rugby, etc.)

### Status descriptions (confirmed)
| `state.description` | Meaning |
|---|---|
| `"Not started"` | Upcoming |
| `"First half"` | Live, first half |
| `"Half time"` | Half time break |
| `"Second half"` | Live, second half |
| `"Extra time"` | Extra time |
| `"Break time"` | Pause (injuries, etc.) |
| `"Penalties"` | Penalty shootout |
| `"Finished"` | Full time |
| `"Finished after extra time"` | AET |
| `"Postponed"` | PPD |
| `"Cancelled"` | CANC |
| `"Suspended"` | Suspended mid-game |
| `"Interrupted"` | Interrupted mid-game |
| `"Abandoned"` | Abandoned |
| `"Awarded"` | Walkover |
| `"Unknown"` | Unknown |
| `"To be announced"` | TBA |

---

## Detailed Match (`/matches/{id}`)

Adds these fields on top of the basic match object:

```json
{
  "venue": {
    "city": "Saint-Denis",
    "name": "Stade de France",
    "country": "France",
    "capacity": "80000"
  },
  "referee": {
    "name": "Amashukeli, Nika",
    "nationality": "Georgia"
  },
  "forecast": {
    "status": "clear night",
    "temperature": "5.3°C"
  },
  "predictions": {
    "prematch": [
      {
        "type": "prematch",
        "modelType": "three-way",
        "generatedAt": "2026-03-22T10:00:00.000Z",
        "description": "France is most likely to win...",
        "probabilities": { "home": "55.3%", "draw": "0.00%", "away": "44.7%" }
      }
    ],
    "live": [ ... ]
  },
  "lineups": {
    "home": {
      "initialLineup": [
        {
          "name": "Jean Baptiste Gros",
          "shortName": "J. B. Gros",
          "shirtNumber": 1,
          "position": "Forward",
          "height": "186 cm",
          "birth": "1999-05-29T00:00:00.000Z",
          "countryName": "France"
        }
      ],
      "substitutions": [...]
    },
    "away": { ... }
  }
}
```

### Important caveats
- `venue`, `referee`, `forecast` all present but **all fields inside are `null`** for lower-tier matches (MLR, domestic leagues). Only populated for major international/European competitions.
- `lineups` present for Six Nations with 15 starters + substitutions per side. `null` or empty for most club matches.
- `predictions` — AI-generated win probabilities. **Prematch** generated in days before kickoff; **live** generated every ~10 minutes during the match. Array of multiple snapshots — take the last one for current.
- No period/half-time scores even in detailed response.
- Response is wrapped in an array (`[{...}]`) — always take `[0]`.

---

## Standings (`/standings`)

Requires both `leagueId` and `season`.

```json
{
  "groups": [
    {
      "name": null,
      "standings": [
        {
          "team": {
            "id": 330121,
            "name": "France",
            "logo": "https://highlightly.net/rugby/images/teams/330121.png"
          },
          "position": 1,
          "gamesPlayed": 5,
          "wins": 4,
          "draws": 0,
          "loses": 1,
          "points": 21,
          "scoredPoints": 211,
          "receivedPoints": 130
        }
      ]
    }
  ]
}
```

### Key observations
- `groups[].name` is `null` for single-table leagues (Six Nations, URC). Only populated for group-stage competitions.
- No `pointsDiff` field — must calculate as `scoredPoints - receivedPoints`.
- No `form` string (unlike API-Sports).
- No `description`/promotion zone field.
- `points` = league table points (not score points).

---

## Highlights (`/highlights`)

### Query parameters
| Param | Notes |
|---|---|
| `date` | YYYY-MM-DD |
| `leagueId` / `leagueName` | filter by competition |
| `matchId` | filter by specific match |
| `homeTeamId` / `awayTeamId` | filter by team |
| `homeTeamName` / `awayTeamName` | filter by team name |
| `countryCode` / `countryName` | filter by country |
| `season` | year e.g. 2026 |
| `timezone` | IANA timezone |
| `limit` | max 40, default 40 |
| `offset` | pagination |

### Highlight object
```json
{
  "id": 11379,
  "type": "VERIFIED",
  "title": "France v England highlights | 2026 Guinness Men's Six Nations",
  "description": null,
  "url": "https://www.youtube.com/watch?v=XXXX",
  "embedUrl": "https://www.youtube.com/embed/XXXX",
  "imgUrl": "https://i.ytimg.com/vi/XXXX/hqdefault.jpg",
  "source": "youtube",
  "channel": "Six Nations Rugby",
  "match": { ... }
}
```

### Key observations
- `type`: `"VERIFIED"` (official sources, may have geo-restrictions) or `"UNVERIFIED"` (user-uploaded, more real-time).
- `embedUrl` present for YouTube videos — can directly embed. `null` for non-embeddable sources.
- `imgUrl` = YouTube thumbnail URL.
- `description` is often `null`.
- `channel` = YouTube channel name.
- Geo-restriction check (`/highlights/geo-restrictions/{id}`) requires paid plan.
- Full match object embedded inside each highlight — includes all match fields.
- BASIC plan received only VERIFIED highlights in all tests.

---

## Leagues (`/leagues`)

```json
{
  "id": 44185,
  "name": "Six Nations",
  "logo": "https://highlightly.net/rugby/images/leagues/44185.png",
  "country": {
    "code": "EU",
    "name": "Europe",
    "logo": "http://highlightly.net/rugby/images/countries/EU.svg"
  },
  "seasons": [
    { "season": 2026 },
    { "season": 2025 },
    { "season": 2024 }
  ]
}
```

- `logo` can be `null` for some leagues.
- `seasons` array is unordered — sort descending to find current.
- 105 total leagues (vs 129 on SportsAPI Pro, but rugby-specific rather than mixed union+league).
- `/leagues/{id}` returns an array, take `[0]`.

---

## Teams (`/teams`)

- List/search: returns `{ id, name, logo }` — very minimal.
- `/teams/{id}` also just `{ id, name, logo }` — wrapped in an array.
- No team colors, no form, no venue, no category from this endpoint.
- Logo: `https://highlightly.net/rugby/images/teams/{id}.png` (if present).

### Team statistics (`/teams/statistics/{id}`)
Requires `fromDate` (YYYY-MM-DD). Returns array of entries per league-season:

```json
[
  {
    "leagueId": 44185,
    "leagueName": "Six Nations",
    "season": 2026,
    "total": {
      "games": { "played": 5, "wins": 4, "draws": 0, "loses": 1 },
      "points": { "scored": 146, "received": 108 }
    },
    "home": {
      "games": { "played": 3, "wins": 3, "draws": 0, "loses": 0 },
      "points": { "scored": 90, "received": 51 }
    },
    "away": {
      "games": { "played": 2, "wins": 1, "draws": 0, "loses": 1 },
      "points": { "scored": 56, "received": 57 }
    }
  }
]
```

---

## Head-to-Head (`/head-2-head`)

```
GET /head-2-head?teamIdOne=330972&teamIdTwo=329270
```

Returns plain array of past matches (same shape as `/matches` items). 8 matches returned for Ireland vs England going back to 2023. No limit on history depth confirmed.

**This is a major advantage over SportsAPI Pro**, which only returns win/loss/draw counts — here you get actual match-by-match H2H list.

---

## Last Five Games (`/last-five-games`)

```
GET /last-five-games?teamId=330972
```

Returns plain array of exactly 5 finished matches (same shape as `/matches` items). Only includes `"Finished"` state games.

---

## Key League IDs (Confirmed from Live Data)

| Competition | ID | Seasons available |
|---|---|---|
| Six Nations | 44185 | 2021–2026 |
| Six Nations Women | 47589 | 2021–2026 |
| Six Nations U20 | 48440 | 2021–2026 |
| Rugby Championship | 73119 | 2023–2025 |
| World Cup (Men) | 59503 | 2023, 2027 |
| World Cup Women | 60354 | 2022, 2025 |
| Rugby Europe Championship | 50142 | 2024–2026 |
| United Rugby Championship | 65460 | 2023–2025 |
| Premiership Rugby (England) | 11847 | 2023–2025 |
| Greene King IPA Championship | 10996 | 2023–2025 |
| Top 14 (France) | 14400 | 2023–2025 |
| European Champions Cup | 46738 | 2023–2025 |
| Super Rugby | 61205 | 2024–2026 |
| Super Rugby Aupiki (Women) | 116520 | 2024–2025 |
| Major League Rugby | 38228 | 2024–2026 |
| Currie Cup | 32271 | 2023–2025 |

> **Missing from Highlightly** (present in SportsAPI Pro):
> - France Pro D2, European Challenge Cup, Super Rugby Americas, NPC (New Zealand), NRL, Super League, Sevens Series

---

## What Highlightly Adds vs SportsAPI Pro

| Feature | Highlightly | SportsAPI Pro |
|---|---|---|
| Video highlights (YouTube) | ✅ Native — embed URLs, thumbnails | ✅ YouTube URL only |
| Full H2H match list | ✅ Actual games | ❌ Win/loss counts only |
| Last 5 games per team | ✅ Dedicated endpoint | Requires paginated `/events/last` |
| Win probability predictions | ✅ Prematch + live snapshots | ❌ Fan votes only |
| Venue + referee | ✅ (major leagues) | ✅ |
| Match lineups | ✅ (major leagues) | ✅ |
| Try timeline / incidents | ❌ Not available | ✅ |
| Match statistics (possession, etc.) | ❌ Not available | ✅ |
| Per-player match stats | ❌ Not available | ✅ |
| Period scores (H1/H2) | ❌ Not available | ✅ (in schedule response) |
| Team colors | ❌ Not available | ✅ hex colors |
| Odds | ✅ Paid plan only | ❌ Not available |
| Dedicated live endpoint | ❌ No | ✅ `/api/live` |
| League count | 105 | ~129 |
| Requests/day (base plan) | 100 | Appears higher |

---

## What This Means for RugbyLive

### Highlights are the key differentiator
Highlightly's core value is the **highlights aggregation** — YouTube embed URLs, thumbnails, channel names, VERIFIED/UNVERIFIED classification. This is unavailable in any other provider tested.

### H2H is fully solved
`/head-2-head` returns actual past meetings. This replaces the SportsAPI Pro limitation where only win/draw/loss totals were available.

### Not a full replacement for SportsAPI Pro
Missing: try timeline, match stats, period scores, team colors. Cannot be used as a standalone provider — best used **alongside** SportsAPI Pro.

### Rate limit (PRO plan — 7,500/day)
Comfortable for match detail pages. With 7,500 req/day, the `/detail` endpoint can enrich every match page load without budget pressure. Still avoid using for live polling (API-Sports handles that). Typical daily budget breakdown for a busy match day:
- Cross-ref lookups (matches by date per league): ~22 calls for full day
- Match detail enrichments: ~50–100 calls for popular matches
- Highlights fetches: ~50–100 calls
- Total: well within 7,500/day limit

### Caching strategy required
```
highlights by matchId:   cache forever (TTL: ∞ once match finished)
highlights by date:      cache 1 hour
h2h data:                cache 24 hours
last-five-games:         cache 1 hour
standings:               cache 30 minutes
league list:             cache 24 hours
```
