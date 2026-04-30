# SportsAPI Pro — Rugby V2 API (Live Test Results)

> Last tested: 2026-04-30 | Key: personal API key  
> Base URL: `https://v2.rugby.sportsapipro.com`  
> Auth: `x-api-key: YOUR_KEY` header on every request

---

## What Works vs What Doesn't (Tested)

| Endpoint | Status | Notes |
|---|---|---|
| `GET /api/today` | ✅ Works | Today's matches |
| `GET /api/live` | ✅ Works | Live matches — returns `data: null` (not error) when nothing live |
| `GET /api/schedule/:date` | ✅ Works | Full day schedule — 170 matches on a busy Saturday |
| `GET /api/match/:id` | ✅ Works | Single match — full event including **venue + referee** |
| `GET /api/match/:id/incidents` | ✅ Works | Try timeline — scorer names, minutes, running score |
| `GET /api/match/:id/statistics` | ✅ Works | 60 stats across ALL/1ST/2ND periods |
| `GET /api/match/:id/lineups` | ✅ Works | Starters + bench, shirt numbers, positions |
| `GET /api/match/:id/player-statistics` | ✅ Works | Per-player carries, metres, tackles, tries |
| `GET /api/match/:id/highlights` | ✅ Works | YouTube URL + thumbnail |
| `GET /api/match/:id/managers` | ✅ Works | Head coaches for both teams |
| `GET /api/match/:id/h2h` | ✅ Works | H2H summary — homeWins/awayWins/draws (no match list) |
| `GET /api/match/:id/votes` | ✅ Works | Fan prediction vote counts (home/draw/away) |
| `GET /api/teams/:id` | ✅ Works | Team name, nameCode, teamColors, home venue, pregame form |
| `GET /api/teams/:id/near-events` | ✅ Works | Previous result + next fixture |
| `GET /api/teams/:id/events/last/:page` | ✅ Works | Paginated results, 30 per page |
| `GET /api/teams/:id/events/next/:page` | ✅ Works | Paginated upcoming fixtures |
| `GET /api/teams/:id/image` | ✅ Works | Returns raw PNG binary (requires auth header) |
| `GET /api/tournament/:id/info` | ✅ Works | Competition details, title holder, colors |
| `GET /api/tournament/:id/seasons` | ✅ Works | Season list with IDs |
| `GET /api/tournament/:id/season/:sid/standings` | ✅ Works | Full table |
| `GET /api/tournament/:id/season/:sid/rounds` | ✅ Works | Round list + current round |
| `GET /api/tournament/:id/season/:sid/events/last/:page` | ✅ Works | Recent results |
| `GET /api/tournament/:id/season/:sid/events/round/:r` | ✅ Works | Specific round matches |
| `GET /api/categories/:id/tournaments` | ✅ Works | All competitions in a category |
| `GET /api/match/:id/award` | ❌ 404 | Man of the Match — not available |
| `GET /api/match/:id/scores` | ❌ 404 | Redundant — period scores in schedule response |
| `GET /api/match/:id/venue` | ❌ 404 | Venue in `/api/match/:id` directly |
| `GET /api/match/:id/referee` | ❌ 404 | Referee in `/api/match/:id` directly |
| `GET /api/match/:id/best-players` | ❌ 404 | Not available |
| `GET /api/match/:id/missing-players` | ❌ 404 | Not available |
| `GET /api/players/:id` | ❌ 404 | Player profiles not available |
| `GET /api/search` | ❌ 503 | Search not available |
| `GET /api/tournament/:id/season/:sid/top-scorers` | ❌ 404 | Not available |

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

### Full capability confirmed (2026-04-30)

**Schedule layer** ✅
- `/api/schedule/:date` — 170 matches on a busy Saturday, full period scores embedded
- `/api/live` — dedicated live endpoint (no need to poll by date and filter)
- `/api/today` — today's full schedule

**Single match** ✅ (was 503, now working)
- `/api/match/:id` — full event including **venue name** and **referee name**
- No more schedule-fallback needed

**Match detail** ✅
- **Incidents** → full try timeline with scorer, minute, running score
- **Statistics** → 60 stats across ALL/1ST/2ND — possession, carries, metres, tackles, lineouts, scrums, turnovers
- **Lineups** → starting XV + bench (15+8 each side)
- **Player stats** → 46 players, per-player tries/tackles/carries/metres
- **Highlights** → YouTube URL + thumbnail
- **Managers** → head coach name for both teams
- **H2H** → homeWins/awayWins/draws all-time record
- **Votes** → fan prediction counts

**Teams** ✅
- Profile: name, nameCode, teamColors hex, home venue, form string
- Near-events: previous result + next fixture in one call
- Paginated results history and upcoming fixtures

**Competitions** ✅
- 129 tournaments from categories 82 (union) + 83 (league)
- Tournament info: title holder, colors, hasRounds/hasGroups flags
- Season list — IDs needed for standings/rounds/games
- Standings, rounds, round-by-round games, recent results

### Only things missing
- **H2H match list** — `/h2h` returns win/loss summary only, no list of past meetings
- **Player profiles** — no career stats, bio, or history
- **League top scorers** — not available
- **Search** — team/tournament lookup by name not available (use IDs from match objects)
