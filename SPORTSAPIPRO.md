# SportsAPI Pro — Rugby V2 API (Live Test Results)

> Tested: 2026-04-29 | Key: personal API key  
> Base URL: `https://v2.rugby.sportsapipro.com`  
> Auth: `x-api-key: YOUR_KEY` header on every request

---

## What Works vs What Doesn't (Tested)

Many endpoints return `503 Upstream error`. The four match sub-endpoints that consistently return real data are the most important ones.

| Endpoint | Status | Notes |
|---|---|---|
| `GET /api/today` | ✅ Works | Returns today's matches |
| `GET /api/schedule/:date` | ✅ Works | Full day schedule — 170 matches on Sat 26 Apr |
| `GET /api/match/:id/incidents` | ✅ Works | Try scorers, conversions, cards — real player names + minutes |
| `GET /api/match/:id/statistics` | ✅ Works | Possession, scoring, penalties, turnovers — by period |
| `GET /api/match/:id/lineups` | ✅ Works | Starters + bench, shirt numbers, positions |
| `GET /api/match/:id/player-statistics` | ✅ Works | Per-player carries, metres, tackles, tries |
| `GET /api/teams/:id` | ✅ Works | Team name, category, tournament info |
| `GET /api/live` | ❌ 502 | Dedicated live endpoint broken |
| `GET /api/live/all` | ❌ No data | Returns empty events array |
| `GET /api/search` | ❌ 503 | — |
| `GET /api/countries` | ❌ Empty | Returns 0 categories |
| `GET /api/tournament/:id/info` | ❌ 503 | Tested IDs: 294, 419, 420, 422, 424 |
| `GET /api/tournament/:id/seasons` | ❌ 503 / empty | — |
| `GET /api/match/:id/award` | ❌ 503 | Man of the Match |
| `GET /api/match/:id/h2h` | ❌ 503 | Head-to-head history |
| `GET /api/match/:id/scores` | ❌ 404 | Half-by-half scores |
| `GET /api/match/:id/venue` | ❌ 503 | — |
| `GET /api/match/:id/referee` | ❌ 503 | — |
| `GET /api/match/:id/best-players` | ❌ 503 | — |
| `GET /api/match/:id/missing-players` | ❌ 503 | — |
| `GET /api/players/:id` | ❌ 503 | Player profiles |

---

## Response Envelope

Every successful response wraps data like this:

```json
{
  "success": true,
  "matchId": 14260483,
  "endpoint": "incidents",
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

Note: `timezone` is auto-detected from IP — irrelevant for server-side usage.

---

## Schedule (`/api/schedule/:date`)

```
GET /api/schedule/2026-04-26
```

Returns `data.events[]`. Each event:

```json
{
  "id": 14260483,
  "tournament": {
    "name": "United Rugby Championship",
    "category": {
      "name": "Rugby Union",
      "id": 84
    },
    "uniqueTournament": {
      "name": "United Rugby Championship",
      "id": 419
    }
  },
  "season": {
    "name": "URC 2024/2025",
    "year": "2024/2025",
    "id": 82834
  },
  "roundInfo": {
    "round": 18,
    "name": "Round 18"
  },
  "status": {
    "code": 100,
    "description": "Ended",
    "type": "finished"
  },
  "homeTeam": {
    "id": 4285,
    "name": "Stormers",
    "shortName": "Stormers",
    "nameCode": "STO",
    "gender": "M"
  },
  "awayTeam": {
    "id": 4284,
    "name": "Glasgow Warriors",
    "shortName": "Glasgow",
    "nameCode": "GLA"
  },
  "homeScore": {
    "current": 48,
    "display": 48,
    "period1": 19,
    "period2": 29
  },
  "awayScore": {
    "current": 12,
    "display": 12,
    "period1": 12,
    "period2": 0
  },
  "startTimestamp": 1745685000
}
```

### Status types observed
| `status.type` | Meaning |
|---|---|
| `"notstarted"` | Not started yet |
| `"inprogress"` | Live |
| `"finished"` | Full time |

### Score fields
- `homeScore.current` — total score
- `homeScore.period1` — first half
- `homeScore.period2` — second half
- `homeScore.display` — same as current (for display use)

> **Note:** For not-started matches, `homeScore` is `{ "series": 0 }` — `current`/`period1`/`period2` are absent.

---

## Tournament IDs (Confirmed from Schedule Data)

These IDs come from `tournament.uniqueTournament.id` in real schedule responses.

### Rugby Union
| Competition | ID |
|---|---|
| United Rugby Championship | 419 |
| English Premiership | 424 |
| France — Top 14 | 420 |
| Super Rugby | 422 |
| Major League Rugby | 14662 |
| Serie A Elite (Italy) | 566 |
| Six Nations, Women | 2055 |
| Super Rugby Americas | 20366 |
| Super Rygbi Cymru | 1361 |
| All Ireland League Div. 1A | 1912 |

### Rugby League
| Competition | ID |
|---|---|
| NRL Premiership | 294 |
| Super League | 302 |
| RFL Championship | 1582 |
| New South Wales Cup | 2134 |
| Queensland Cup | 2135 |
| Super XIII (France) | 2131 |

> **Six Nations, Men's Rugby Championship, World Cup IDs not confirmed** — search endpoint returning 503.

---

## Incidents (`/api/match/:id/incidents`)

Returns `data.incidents[]`. Two types observed:

### Period marker
```json
{
  "text": "FT",
  "homeScore": 48,
  "awayScore": 12,
  "isLive": false,
  "time": 80,
  "incidentType": "period"
}
```

### Scoring event
```json
{
  "incidentType": "goal",
  "incidentClass": "try",
  "from": "try",
  "player": {
    "id": 1381748,
    "name": "Sacha Feinberg-Mngomezulu",
    "shortName": "S. Feinberg-Mngomezulu",
    "position": "B",
    "jerseyNumber": "10"
  },
  "isHome": true,
  "homeScore": 39,
  "awayScore": 12,
  "time": 72,
  "timeSeconds": 4316,
  "id": 345974654
}
```

### `incidentClass` values observed
| Value | Meaning |
|---|---|
| `"try"` | Try scored (5pts) |
| `"twoPoints"` | Conversion (2pts) |
| `"penaltyGoal"` | Penalty goal (3pts) |
| `"dropGoal"` | Drop goal (3pts) |

Cards would also appear here as separate `incidentType` values — not observed in this test.

---

## Statistics (`/api/match/:id/statistics`)

Returns `data.statistics[]` — one entry per period.

```json
{
  "period": "ALL",
  "groups": [
    {
      "groupName": "Possession",
      "statisticsItems": [
        {
          "name": "Ball possession",
          "key": "possession",
          "home": "41%",
          "away": "59%",
          "homeValue": 41,
          "awayValue": 59,
          "statisticsType": "positive",
          "renderType": 1
        }
      ]
    }
  ]
}
```

### Periods
`"ALL"`, `"1ST"`, `"2ND"` — full match + each half separately.

### Stat keys observed (NRL match)
| Key | Group | Notes |
|---|---|---|
| `possession` | Possession | % value |
| `tries` | Scoring | count |
| `conversions` | Scoring | count |
| `penaltyTries` | Scoring | count |
| `penaltyGoals` | Scoring other | count |
| `dropGoals` | Scoring other | count |
| `scrumsAccuracy` | Other | string "W/L (X%)" |
| `turnovers` | Other | count |
| `penaltiesConceded` | Penalty | count |
| `redCards` | Penalty | count |
| `yellowCards` | Penalty | count |

> Union matches would likely also have lineout, territory, ruck stats — not verified.

---

## Lineups (`/api/match/:id/lineups`)

```json
{
  "confirmed": false,
  "home": {
    "players": [
      {
        "player": {
          "id": 1528642,
          "name": "Sualauvi Faalogo",
          "shortName": "S. Faalogo",
          "country": { "alpha2": "AU", "name": "Australia" }
        },
        "teamId": 4255,
        "shirtNumber": 1,
        "jerseyNumber": "1",
        "position": "F",
        "substitute": false,
        "minutesPlayed": null,
        "played": false
      }
    ]
  },
  "away": { "players": [...] }
}
```

- `confirmed: false` means lineup not yet officially announced
- `substitute: true` = bench player
- `position` uses codes: `"F"` (Forward), `"B"` (Back), `"W"` (Wing) etc.
- NRL match returned 13 starters + 6 bench per side

---

## Player Statistics per Match (`/api/match/:id/player-statistics`)

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

## Teams (`/api/teams/:id`)

```
GET /api/teams/4255   → Melbourne Storm
```

Returns `data.team`:

```json
{
  "id": 4255,
  "name": "Melbourne Storm",
  "shortName": "Melbourne",
  "nameCode": "MEL",
  "gender": "M",
  "category": {
    "name": "Rugby League",
    "id": 83
  }
}
```

No logo URL returned directly — images served separately at `/api/teams/:id/image`.

---

## What This Means for RugbyLive

### The unlock
The four working match endpoints are the key ones for match detail pages:
- **Incidents** → try timeline with scorer names and minutes ✅
- **Statistics** → possession, tries, penalties — by half ✅
- **Lineups** → starting XV + bench ✅
- **Player stats** → individual match stats ✅

### The problem
The live/discovery layer is broken:
- `/api/live` returns 502 — can't use dedicated live endpoint
- `/api/search` returns 503 — can't look up team/tournament IDs
- `/api/tournament/:id/seasons` returns 503 — can't get season IDs for standings
- Half-by-half scores (`/scores`) returns 404 — but period scores ARE in the schedule event object (`homeScore.period1`, `homeScore.period2`) so this is redundant

### Practical upshot
The match-level data is genuinely better than API-Sports (which has no incidents, stats, or lineups). But the discovery/live layer isn't reliable enough to replace API-Sports as the primary data source right now.

**Best path**: use SportsAPI Pro for match detail enrichment (incidents, lineups, stats tabs) while keeping API-Sports for the schedule + live polling layer. IDs will differ between the two APIs — need a mapping step.
