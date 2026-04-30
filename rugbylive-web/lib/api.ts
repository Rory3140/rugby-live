import type { Match, Standing, League, Season, H2HSummary } from '@/types'
import { makeShortName } from './utils'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4001'

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`)
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`)
  const json = await res.json()
  return json.data as T
}

function addTeamShortName(t: { id: string; name: string; logoUrl: string | null }) {
  return { ...t, shortName: makeShortName(t.name) }
}

function normaliseMatch(m: any): Match {
  return {
    ...m,
    homeTeam: addTeamShortName(m.homeTeam),
    awayTeam: addTeamShortName(m.awayTeam),
    competition: {
      ...m.competition,
      shortName: makeShortName(m.competition.name),
    },
    // v2 uses 'round'; ensure overtime period exists for backward compat
    round: m.round ?? m.week ?? null,
    periods: {
      first:    m.periods?.first    ?? { home: null, away: null },
      second:   m.periods?.second   ?? { home: null, away: null },
      overtime: m.periods?.overtime ?? { home: null, away: null },
    },
  }
}

export async function fetchMatches(date: string): Promise<Match[]> {
  const data = await apiFetch<any[]>(`/matches?date=${date}`)
  return data.map(normaliseMatch)
}

export async function fetchMatch(id: string): Promise<Match> {
  const data = await apiFetch<any>(`/matches/${id}`)
  return normaliseMatch(data)
}

export async function fetchH2HSummary(id: string): Promise<H2HSummary> {
  return apiFetch<H2HSummary>(`/matches/${id}/h2h`)
}

export async function fetchLeagues(): Promise<League[]> {
  const data = await apiFetch<any[]>('/leagues')
  return data.map(l => ({
    ...l,
    shortName: l.shortName ?? makeShortName(l.name),
  }))
}

export async function fetchLeagueSeasons(leagueId: string): Promise<Season[]> {
  const data = await apiFetch<Season[]>(`/leagues/${leagueId}/seasons`)
  return data
}

export async function fetchStandings(leagueId: string, seasonId?: string): Promise<Standing[]> {
  if (!seasonId) return []
  // v2 returns Standings[] (array of tables). We flatten to first table's rows.
  const data = await apiFetch<any[]>(`/leagues/${leagueId}/standings?season=${seasonId}`)
  if (!data || data.length === 0) return []

  // data is Standings[] — each has { type, rows: StandingRow[] }
  const firstTable = data[0]
  const rows = firstTable?.rows ?? firstTable ?? []
  return rows.map((s: any) => ({
    position:      s.position,
    team:          addTeamShortName(s.team),
    played:        s.played,
    won:           s.won,
    drawn:         s.drawn,
    lost:          s.lost,
    pointsFor:     s.pointsFor,
    pointsAgainst: s.pointsAgainst,
    pointsDiff:    s.pointsDiff,
    points:        s.points,
    form:          s.form ?? null,
    description:   s.promotion ?? s.description ?? null,
  }))
}

export async function fetchLeagueMatches(leagueId: string, seasonId?: string): Promise<Match[]> {
  if (!seasonId) return []
  const data = await apiFetch<any[]>(`/leagues/${leagueId}/games?season=${seasonId}`)
  return data.map(normaliseMatch)
}
