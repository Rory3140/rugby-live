import type { Match, Standing, League } from '@/types'
import { makeShortName } from './utils'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

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

export async function fetchH2H(id: string): Promise<Match[]> {
  const data = await apiFetch<any[]>(`/matches/${id}/h2h`)
  return data.map(normaliseMatch)
}

export async function fetchLeagues(): Promise<League[]> {
  const data = await apiFetch<any[]>('/leagues')
  return data.map(l => ({
    ...l,
    shortName: makeShortName(l.name),
  }))
}

export async function fetchStandings(leagueId: string, season?: number): Promise<Standing[]> {
  const qs = season ? `?season=${season}` : ''
  const data = await apiFetch<any[]>(`/leagues/${leagueId}/standings${qs}`)
  return data.map(s => ({ ...s, team: addTeamShortName(s.team) }))
}

export async function fetchLeagueMatches(leagueId: string, season?: number): Promise<Match[]> {
  const qs = season ? `?season=${season}` : ''
  const data = await apiFetch<any[]>(`/leagues/${leagueId}/games${qs}`)
  return data.map(normaliseMatch)
}
