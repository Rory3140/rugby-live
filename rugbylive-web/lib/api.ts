import type { Match, Standing, League, Season, MatchDetail } from '@/types'
import { makeShortName } from './utils'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4002'

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
    round: m.round ?? null,
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

export async function fetchMatchDetail(id: string): Promise<MatchDetail> {
  const data = await apiFetch<any>(`/matches/${id}/detail`)
  return {
    ...data,
    match: normaliseMatch(data.match),
    h2h: data.h2h ? {
      ...data.h2h,
      recentMatches: (data.h2h.recentMatches ?? []).map(normaliseMatch),
    } : null,
  }
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
  // v3 returns a flat Standing[] directly
  const data = await apiFetch<any[]>(`/leagues/${leagueId}/standings?season=${seasonId}`)
  if (!Array.isArray(data) || data.length === 0) return []
  return data.map((s: any) => ({
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
    description:   s.description ?? null,
  }))
}

export async function fetchLeagueMatches(leagueId: string, seasonId?: string): Promise<Match[]> {
  if (!seasonId) return []
  const data = await apiFetch<any[]>(`/leagues/${leagueId}/games?season=${seasonId}`)
  return data.map(normaliseMatch)
}
