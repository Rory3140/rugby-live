import fetch from 'node-fetch'
import type { Match, Standing, Season, PeriodScores } from '../types/internal'

const BASE = 'https://v1.rugby.api-sports.io'
const KEY = process.env.API_SPORTS_KEY ?? ''

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'x-rapidapi-key': KEY, 'x-rapidapi-host': 'v1.rugby.api-sports.io' },
  })
  if (!res.ok) throw new Error(`API-Sports ${res.status}: ${path}`)
  const json = await res.json() as any
  if (json.errors && Object.keys(json.errors).length > 0) {
    throw new Error(`API-Sports error: ${JSON.stringify(json.errors)}`)
  }
  return json.response as T
}

function normStatus(s: string): string {
  // API-Sports returns short codes directly: "FT", "1H", "HT", "2H", "NS", etc.
  // Also handles long-form names for safety
  const map: Record<string, string> = {
    'First Half': '1H', 'Half Time': 'HT', 'Second Half': '2H',
    'Full Time': 'FT', 'After Extra Time': 'AET', 'After Penalties': 'AP',
    'Penalty Shootout': 'PEN', 'Not Started': 'NS',
    'Cancelled': 'CANC', 'Postponed': 'PST', 'Abandoned': 'ABD',
    'Walk Over': 'WO', 'Awarded': 'AW',
  }
  return map[s] ?? s
}

function normPeriods(g: any): PeriodScores {
  return {
    first:    { home: g.periods?.first?.home ?? null,    away: g.periods?.first?.away ?? null },
    second:   { home: g.periods?.second?.home ?? null,   away: g.periods?.second?.away ?? null },
    overtime: { home: g.periods?.overtime?.home ?? null, away: g.periods?.overtime?.away ?? null },
  }
}

function normMatch(g: any, leagueDocId: string): Match {
  return {
    id: `as_${g.id}`,
    competition: {
      id: leagueDocId,
      name: g.league?.name ?? '',
      shortName: g.league?.name ?? '',
      logoUrl: g.league?.logo ?? null,
    },
    homeTeam: {
      id: `as_team_${g.teams?.home?.id}`,
      name: g.teams?.home?.name ?? '',
      shortName: g.teams?.home?.name?.slice(0, 3).toUpperCase() ?? '',
      logoUrl: g.teams?.home?.logo ?? null,
    },
    awayTeam: {
      id: `as_team_${g.teams?.away?.id}`,
      name: g.teams?.away?.name ?? '',
      shortName: g.teams?.away?.name?.slice(0, 3).toUpperCase() ?? '',
      logoUrl: g.teams?.away?.logo ?? null,
    },
    homeScore: g.scores?.home ?? null,
    awayScore: g.scores?.away ?? null,
    status: normStatus(g.status?.short ?? g.status?.long ?? 'NS'),
    kickoff: g.date ?? '',
    round: g.week ? (/^\d+$/.test(String(g.week)) ? `Round ${g.week}` : String(g.week)) : null,
    periods: normPeriods(g),
  }
}

/**
 * Fetch ALL rugby matches on a given date (single API call).
 * Returns a map from API-Sports league ID → normalised matches.
 * The caller filters by active leagues.
 */
export async function fetchAllMatchesByDate(date: string, activeApiSportsIds: Set<number>): Promise<Match[]> {
  try {
    const data = await apiFetch<any[]>(`/games?date=${date}`)
    if (!Array.isArray(data)) return []
    return data
      .filter(g => activeApiSportsIds.has(g.league?.id))
      .map(g => normMatch(g, String(g.league?.id)))
  } catch {
    return []
  }
}

export async function fetchMatchById(apiSportsGameId: string): Promise<Match | null> {
  try {
    const data = await apiFetch<any[]>(`/games?id=${apiSportsGameId}`)
    if (!Array.isArray(data) || data.length === 0) return null
    const g = data[0]
    return normMatch(g, String(g.league?.id))
  } catch {
    return null
  }
}

export async function fetchStandings(apiSportsId: number, season: number, leagueDocId: string): Promise<Standing[]> {
  try {
    const data = await apiFetch<any[]>(`/standings?league=${apiSportsId}&season=${season}`)
    if (!Array.isArray(data) || data.length === 0) return []
    const rows = data[0]?.standings ?? data[0] ?? []
    if (!Array.isArray(rows)) return []
    return rows.map((s: any) => ({
      position: s.position ?? 0,
      team: {
        id: `as_team_${s.team?.id}`,
        name: s.team?.name ?? '',
        shortName: s.team?.name?.slice(0, 3).toUpperCase() ?? '',
        logoUrl: s.team?.logo ?? null,
      },
      played:        s.games?.played ?? 0,
      won:           s.games?.win?.total ?? 0,
      drawn:         s.games?.draw?.total ?? 0,
      lost:          s.games?.lose?.total ?? 0,
      pointsFor:     s.goals?.for ?? 0,
      pointsAgainst: s.goals?.against ?? 0,
      pointsDiff:    (s.goals?.for ?? 0) - (s.goals?.against ?? 0),
      points:        s.points ?? 0,
      form:          s.form ?? null,
      description:   s.description ?? null,
    }))
  } catch {
    return []
  }
}

// API-Sports returns global seasons (years) — not per-league. Pass 0 to skip league filter.
export async function fetchSeasons(_apiSportsId: number): Promise<Season[]> {
  try {
    const data = await apiFetch<any[]>(`/seasons`)
    if (!Array.isArray(data)) return []
    return data.map((s: any) => ({
      id: String(s),
      name: String(s),
      year: String(s),
    })).reverse() // most recent first
  } catch {
    return []
  }
}

export async function fetchLeagueMatches(apiSportsId: number, season: number, leagueDocId: string): Promise<Match[]> {
  try {
    const data = await apiFetch<any[]>(`/games?league=${apiSportsId}&season=${season}`)
    if (!Array.isArray(data)) return []
    return data.map(g => normMatch(g, leagueDocId))
  } catch {
    return []
  }
}

export async function fetchH2H(homeTeamId: string, awayTeamId: string, leagueDocId: string): Promise<Match[]> {
  try {
    const as1 = homeTeamId.replace('as_team_', '')
    const as2 = awayTeamId.replace('as_team_', '')
    const data = await apiFetch<any[]>(`/games/h2h?h2h=${as1}-${as2}`)
    if (!Array.isArray(data)) return []
    return data.map(g => normMatch(g, String(g.league?.id)))
  } catch {
    return []
  }
}
