// All API-Sports calls go through here — no other file should call api-sports.io directly.
import fetch from 'node-fetch'
import {
  ApiSportsResponse,
  ApiSportsGame,
  ApiSportsStanding,
  ApiSportsLeague,
} from '../types/apiSports'
import { Match, Standing, League } from '../types/internal'

const BASE_URL = 'https://v1.rugby.api-sports.io'

function getKey(): string {
  const key = process.env.API_SPORTS_KEY
  if (!key) throw new Error('API_SPORTS_KEY env var is not set')
  return key
}

async function apiFetch<T>(path: string): Promise<ApiSportsResponse<T>> {
  const res = await fetch(`${BASE_URL}/${path}`, {
    headers: { 'x-apisports-key': getKey() },
  })
  if (!res.ok) throw new Error(`API-Sports error: ${res.status} ${res.statusText}`)
  return res.json() as Promise<ApiSportsResponse<T>>
}

// ─── Normalisation helpers ───────────────────────────────────────────────────

function normaliseGame(g: ApiSportsGame): Match {
  return {
    id: String(g.id),
    competition: {
      id: String(g.league.id),
      name: g.league.name,
      logoUrl: g.league.logo || null,
      type: g.league.type.toLowerCase() === 'league' ? 'league' : 'cup',
      season: g.league.season,
    },
    homeTeam: {
      id: String(g.teams.home.id),
      name: g.teams.home.name,
      logoUrl: g.teams.home.logo || null,
    },
    awayTeam: {
      id: String(g.teams.away.id),
      name: g.teams.away.name,
      logoUrl: g.teams.away.logo || null,
    },
    homeScore: g.scores.home,
    awayScore: g.scores.away,
    status: g.status.short,
    kickoff: g.date,
    week: g.week,
    periods: {
      first: { home: g.periods.first.home, away: g.periods.first.away },
      second: { home: g.periods.second.home, away: g.periods.second.away },
      overtime: { home: g.periods.overtime.home, away: g.periods.overtime.away },
    },
  }
}

function normaliseStanding(s: ApiSportsStanding): Standing {
  return {
    position: s.position,
    team: {
      id: String(s.team.id),
      name: s.team.name,
      logoUrl: s.team.logo || null,
    },
    played: s.games.played,
    won: s.games.win.total,
    drawn: s.games.draw.total,
    lost: s.games.lose.total,
    pointsFor: s.goals.for,
    pointsAgainst: s.goals.against,
    pointsDiff: s.goals.for - s.goals.against,
    points: s.points,
    form: s.form,
    description: s.description,
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function getGamesByDate(date: string): Promise<Match[]> {
  const data = await apiFetch<ApiSportsGame>(`games?date=${date}`)
  return data.response.map(normaliseGame)
}

export async function getGamesByLeague(leagueId: string, season: number): Promise<Match[]> {
  const data = await apiFetch<ApiSportsGame>(`games?league=${leagueId}&season=${season}`)
  return data.response.map(normaliseGame)
}

export async function getGameById(id: string): Promise<Match | null> {
  const data = await apiFetch<ApiSportsGame>(`games?id=${id}`)
  const game = data.response[0]
  return game ? normaliseGame(game) : null
}

export async function getH2H(homeId: string, awayId: string): Promise<Match[]> {
  const data = await apiFetch<ApiSportsGame>(`games/h2h?h2h=${homeId}-${awayId}`)
  return data.response.map(normaliseGame)
}

export async function getStandings(leagueId: string, season: number): Promise<Standing[]> {
  const data = await apiFetch<ApiSportsStanding[]>(`standings?league=${leagueId}&season=${season}`)
  // API returns array of arrays (grouped stages); flatten and normalise
  const rows = (data.response[0] as unknown as ApiSportsStanding[]) || []
  return rows.map(normaliseStanding)
}

export async function getLeagues(): Promise<League[]> {
  const data = await apiFetch<ApiSportsLeague>('leagues')
  const currentYear = new Date().getFullYear()
  return data.response.map((l) => {
    const seasonNums = l.seasons.map((s) => s.season)
    const currentSeason =
      seasonNums.filter((s) => s <= currentYear).sort((a, b) => b - a)[0] ??
      seasonNums.sort((a, b) => b - a)[0] ??
      null
    return {
      id: String(l.id),
      name: l.name,
      logoUrl: l.logo || null,
      type: l.type as 'League' | 'Cup',
      country: l.country?.name || null,
      seasons: seasonNums,
      currentSeason,
    }
  })
}
