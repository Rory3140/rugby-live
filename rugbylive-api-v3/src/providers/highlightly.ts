import fetch from 'node-fetch'
import type { Match, Standing, Highlight, Incident, PeriodScores } from '../types/internal'

const BASE = 'https://rugby.highlightly.net'
const KEY = process.env.HIGHLIGHTLY_KEY ?? ''

async function hlFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'x-rapidapi-key': KEY },
  })
  if (!res.ok) throw new Error(`Highlightly ${res.status}: ${path}`)
  const json = await res.json() as any
  return (json.data ?? json) as T
}

// Highlightly state descriptions → internal status codes
function normStatus(state: string): string {
  if (!state) return 'NS'
  const s = state.toLowerCase()
  if (s === 'not started' || s === 'ns') return 'NS'
  if (s === '1st half' || s === 'first half' || s === '1h') return '1H'
  if (s === 'half time' || s === 'ht') return 'HT'
  if (s === '2nd half' || s === 'second half' || s === '2h') return '2H'
  if (s === 'full time' || s === 'ft' || s === 'finished' || s === 'ended') return 'FT'
  if (s === 'after extra time' || s === 'aet') return 'AET'
  if (s === 'after penalties' || s === 'ap') return 'AP'
  if (s === 'postponed' || s === 'pst') return 'PST'
  if (s === 'cancelled' || s === 'canc') return 'CANC'
  if (s === 'abandoned' || s === 'abd') return 'ABD'
  return 'NS'
}

function parseScore(scoreStr: string | null | undefined): { home: number | null; away: number | null } {
  if (!scoreStr) return { home: null, away: null }
  const parts = scoreStr.split('-').map(s => s.trim())
  if (parts.length !== 2) return { home: null, away: null }
  const home = parseInt(parts[0], 10)
  const away = parseInt(parts[1], 10)
  return {
    home: isNaN(home) ? null : home,
    away: isNaN(away) ? null : away,
  }
}

function normMatch(m: any, leagueId: string, leagueName: string, leagueLogo: string | null): Match {
  const score = parseScore(m.state?.score)
  const htScore = parseScore(m.state?.scoreHT)
  const periods: PeriodScores = {
    first:    htScore,
    second:   { home: null, away: null },
    overtime: { home: null, away: null },
  }

  return {
    id: `hl_${m.id}`,
    competition: {
      id: leagueId,
      name: m.leagueName ?? leagueName,
      shortName: m.leagueName ?? leagueName,
      logoUrl: m.leagueLogo ?? leagueLogo,
    },
    homeTeam: {
      id: `hl_team_${m.homeTeam?.id}`,
      name: m.homeTeam?.name ?? '',
      shortName: m.homeTeam?.shortName ?? m.homeTeam?.name?.slice(0, 3).toUpperCase() ?? '',
      logoUrl: m.homeTeam?.logo ?? null,
    },
    awayTeam: {
      id: `hl_team_${m.awayTeam?.id}`,
      name: m.awayTeam?.name ?? '',
      shortName: m.awayTeam?.shortName ?? m.awayTeam?.name?.slice(0, 3).toUpperCase() ?? '',
      logoUrl: m.awayTeam?.logo ?? null,
    },
    homeScore: score.home,
    awayScore: score.away,
    status: normStatus(m.state?.description ?? ''),
    kickoff: m.startDateTimestamp ? new Date(m.startDateTimestamp * 1000).toISOString() : (m.startDate ?? ''),
    round: m.round ? `Round ${m.round}` : null,
    periods,
  }
}

export async function fetchMatchesByDate(date: string, leagueId: string, leagueName: string, leagueLogo: string | null, highlightlyId: number): Promise<Match[]> {
  try {
    const data = await hlFetch<any[]>(`/matches?leagueId=${highlightlyId}&date=${date}`)
    if (!Array.isArray(data)) return []
    return data.map(m => normMatch(m, leagueId, leagueName, leagueLogo))
  } catch {
    return []
  }
}

export async function fetchMatchById(hlMatchId: string): Promise<Match | null> {
  try {
    const id = hlMatchId.replace('hl_', '')
    const data = await hlFetch<any>(`/matches/${id}`)
    if (!data) return null
    return normMatch(data, `hl_league_${data.leagueId}`, data.leagueName ?? '', data.leagueLogo ?? null)
  } catch {
    return null
  }
}

export async function fetchStandings(highlightlyId: number, leagueId: string): Promise<Standing[]> {
  try {
    const data = await hlFetch<any>(`/standings?leagueId=${highlightlyId}`)
    // Highlightly returns { standings: [...] } or an array directly
    const rows: any[] = Array.isArray(data) ? data : (data?.standings ?? [])
    return rows.map((s: any) => ({
      position: s.position ?? s.rank ?? 0,
      team: {
        id: `hl_team_${s.team?.id}`,
        name: s.team?.name ?? '',
        shortName: s.team?.shortName ?? s.team?.name?.slice(0, 3).toUpperCase() ?? '',
        logoUrl: s.team?.logo ?? null,
      },
      played:        s.played ?? s.matchesPlayed ?? 0,
      won:           s.won ?? s.wins ?? 0,
      drawn:         s.drawn ?? s.draws ?? 0,
      lost:          s.lost ?? s.losses ?? 0,
      pointsFor:     s.pointsFor ?? s.goalsFor ?? 0,
      pointsAgainst: s.pointsAgainst ?? s.goalsAgainst ?? 0,
      pointsDiff:    s.pointsDiff ?? ((s.pointsFor ?? 0) - (s.pointsAgainst ?? 0)),
      points:        s.points ?? 0,
      form:          s.form ?? null,
      description:   s.description ?? null,
    }))
  } catch {
    return []
  }
}

export async function fetchHighlights(hlMatchId: string): Promise<Highlight[]> {
  try {
    const id = hlMatchId.replace('hl_', '')
    const data = await hlFetch<any>(`/highlights?matchId=${id}`)
    const items: any[] = Array.isArray(data) ? data : (data?.highlights ?? [])
    return items.map((h: any) => ({
      id: String(h.id ?? h.url),
      title: h.title ?? '',
      url: h.url ?? h.embedUrl ?? '',
      thumbnailUrl: h.thumbnail ?? h.image ?? null,
      publishedAt: h.publishedAt ?? null,
      source: h.source ?? 'Highlightly',
    }))
  } catch {
    return []
  }
}

export async function fetchH2H(hlMatchId: string): Promise<Match[]> {
  try {
    const id = hlMatchId.replace('hl_', '')
    const data = await hlFetch<any[]>(`/matches/${id}/h2h`)
    if (!Array.isArray(data)) return []
    return data.map(m => normMatch(m, `hl_league_${m.leagueId}`, m.leagueName ?? '', m.leagueLogo ?? null))
  } catch {
    return []
  }
}

export async function fetchIncidents(hlMatchId: string): Promise<Incident[]> {
  try {
    const id = hlMatchId.replace('hl_', '')
    const data = await hlFetch<any[]>(`/matches/${id}/incidents`)
    if (!Array.isArray(data)) return []
    return data.map((inc: any) => ({
      id: String(inc.id ?? Math.random()),
      type: inc.type ?? 'unknown',
      minute: inc.minute ?? null,
      team: inc.isHome ? 'home' : 'away',
      playerName: inc.player?.name ?? inc.playerName ?? null,
      homeScore: inc.homeScore ?? null,
      awayScore: inc.awayScore ?? null,
    }))
  } catch {
    return []
  }
}
