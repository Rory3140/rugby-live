import fetch from 'node-fetch'
import type { Match, Standing, PeriodScores, Incident } from '../types/internal'
import type { Lineups, LineupPlayer } from '../types/detail'

const BASE = 'https://v2.rugby.sportsapipro.com'
const KEY = process.env.SAP_KEY ?? ''
const TIMEOUT = 8000
const DETAIL_TIMEOUT = 4000  // strict cap for match detail calls — SAP is unreliable

async function sapFetch<T>(path: string, timeoutMs = TIMEOUT): Promise<T | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { 'x-api-key': KEY },
      signal: controller.signal as any,
    })
    clearTimeout(timer)
    if (res.status === 503 || res.status === 404) return null
    if (!res.ok) throw new Error(`SAP ${res.status}: ${path}`)
    const json = await res.json() as any
    return (json.data ?? json) as T
  } catch (err: any) {
    clearTimeout(timer)
    if (err.name === 'AbortError') return null
    return null
  }
}

function normStatus(s: string): string {
  if (!s) return 'NS'
  const u = s.toUpperCase()
  const map: Record<string, string> = {
    'NOT_STARTED': 'NS', 'NOTSTARTED': 'NS',
    'FIRST_HALF': '1H', 'FIRSTHALF': '1H',
    'HALF_TIME': 'HT', 'HALFTIME': 'HT',
    'SECOND_HALF': '2H', 'SECONDHALF': '2H',
    'FULL_TIME': 'FT', 'FULLTIME': 'FT', 'FINISHED': 'FT',
    'AFTER_EXTRA_TIME': 'AET', 'AFTER_PENALTIES': 'AP',
    'POSTPONED': 'PST', 'CANCELLED': 'CANC', 'ABANDONED': 'ABD',
  }
  return map[u] ?? s
}

function normPeriods(g: any): PeriodScores {
  return {
    first:    { home: g.firstHalfScoreHome ?? null,    away: g.firstHalfScoreAway ?? null },
    second:   { home: g.secondHalfScoreHome ?? null,   away: g.secondHalfScoreAway ?? null },
    overtime: { home: g.extraTimeScoreHome ?? null,    away: g.extraTimeScoreAway ?? null },
  }
}

function normMatch(g: any, leagueId: string, leagueName: string, leagueLogo: string | null): Match {
  const compName = g.competition?.name ?? g.league?.name ?? leagueName
  return {
    id: `sap_${g.id}`,
    competition: {
      id: leagueId,
      name: compName,
      shortName: compName,
      logoUrl: g.competition?.logo ?? g.league?.logo ?? leagueLogo,
    },
    homeTeam: {
      id: `sap_team_${g.homeTeam?.id}`,
      name: g.homeTeam?.name ?? '',
      shortName: g.homeTeam?.shortName ?? g.homeTeam?.name?.slice(0, 3).toUpperCase() ?? '',
      logoUrl: g.homeTeam?.logo ?? null,
    },
    awayTeam: {
      id: `sap_team_${g.awayTeam?.id}`,
      name: g.awayTeam?.name ?? '',
      shortName: g.awayTeam?.shortName ?? g.awayTeam?.name?.slice(0, 3).toUpperCase() ?? '',
      logoUrl: g.awayTeam?.logo ?? null,
    },
    homeScore: g.homeScore ?? g.scoreHome ?? null,
    awayScore: g.awayScore ?? g.scoreAway ?? null,
    status: normStatus(g.status ?? g.state ?? 'NS'),
    kickoff: g.startTime ?? g.date ?? '',
    round: g.round ? String(g.round) : null,
    periods: normPeriods(g),
  }
}

export async function fetchMatchesByDate(date: string, leagueId: string, leagueName: string, leagueLogo: string | null, sapId: string): Promise<Match[]> {
  const data = await sapFetch<any[]>(`/games?date=${date}&leagueId=${sapId}`)
  if (!Array.isArray(data)) return []
  return data.map(g => normMatch(g, leagueId, leagueName, leagueLogo))
}

export async function fetchStandings(sapId: string, leagueId: string): Promise<Standing[]> {
  const data = await sapFetch<any>(`/standings?leagueId=${sapId}`)
  if (!data) return []
  // SAP Pro returns { standings: [...] } or array
  const tables: any[] = Array.isArray(data) ? data : (data.standings ?? data.tables ?? [])

  // flatten: might be array of groups each with rows
  const rows: any[] = []
  for (const t of tables) {
    if (Array.isArray(t)) rows.push(...t)
    else if (t.rows) rows.push(...t.rows)
    else rows.push(t)
  }

  return rows.map((s: any) => ({
    position: s.position ?? s.rank ?? 0,
    team: {
      id: `sap_team_${s.team?.id}`,
      name: s.team?.name ?? '',
      shortName: s.team?.shortName ?? s.team?.name?.slice(0, 3).toUpperCase() ?? '',
      logoUrl: s.team?.logo ?? null,
    },
    played:        s.played ?? s.matchesPlayed ?? 0,
    won:           s.won ?? s.wins ?? 0,
    drawn:         s.drawn ?? s.draws ?? 0,
    lost:          s.lost ?? s.losses ?? 0,
    pointsFor:     s.pointsFor ?? s.pf ?? 0,
    pointsAgainst: s.pointsAgainst ?? s.pa ?? 0,
    pointsDiff:    s.pointsDiff ?? s.pd ?? ((s.pointsFor ?? 0) - (s.pointsAgainst ?? 0)),
    points:        s.points ?? s.pts ?? 0,
    form:          s.form ?? null,
    description:   s.description ?? null,
  }))
}

export async function fetchLeagueMatches(sapId: string, season: string, leagueId: string, leagueName: string, leagueLogo: string | null): Promise<Match[]> {
  const data = await sapFetch<any[]>(`/games?leagueId=${sapId}&season=${season}`)
  if (!Array.isArray(data)) return []
  return data.map(g => normMatch(g, leagueId, leagueName, leagueLogo))
}

// ── Match detail fetchers (4s timeout) ────────────────────────────────────────

function normSapLineupPlayer(p: any): LineupPlayer {
  const player = p.player ?? p
  return {
    name: player.name ?? player.shortName ?? '',
    shortName: player.shortName ?? null,
    number: p.shirtNumber ?? p.jerseyNumber ?? null,
    position: p.position ?? player.position ?? null,
    height: player.height ?? null,
    country: player.country?.name ?? null,
  }
}

export async function fetchSapLineups(sapMatchId: number): Promise<Lineups | null> {
  const data = await sapFetch<any>(`/api/match/${sapMatchId}/lineups`, DETAIL_TIMEOUT)
  if (!data || (!data.home && !data.away)) return null

  const mapSide = (side: any) => {
    const players: any[] = side?.players ?? []
    return {
      starters:    players.filter(p => !p.substitute).map(normSapLineupPlayer),
      substitutes: players.filter(p => p.substitute).map(normSapLineupPlayer),
    }
  }

  const home = mapSide(data.home)
  const away = mapSide(data.away)
  if (home.starters.length === 0 && away.starters.length === 0) return null
  return { home, away }
}

// SAP incident incidentType is "goal" | "card" | "period" | "substitution"
// incidentClass tells us what kind of goal/card
const SAP_INCIDENT_TYPE_MAP: Record<string, string> = {
  try:         'try',
  twoPoints:   'conversion',   // union conversion = 2pts
  onePoint:    'conversion',   // league conversion = 1pt
  threePoints: 'penalty',
  dropGoal:    'drop_goal',
  dropgoal:    'drop_goal',
  yellowCard:  'yellow_card',
  yellowcard:  'yellow_card',
  yellow:      'yellow_card',
  redCard:     'red_card',
  redcard:     'red_card',
  red:         'red_card',
}

export async function fetchSapIncidents(sapMatchId: number): Promise<Incident[]> {
  const data = await sapFetch<any>(`/api/match/${sapMatchId}/incidents`, DETAIL_TIMEOUT)
  const raw: any[] = data?.incidents ?? (Array.isArray(data) ? data : [])
  if (raw.length === 0) return []

  const results: Incident[] = []
  for (const e of raw) {
    // skip period markers and substitutions — only scoring + cards
    const cls = e.incidentClass ?? e.incidentType ?? ''
    const type = SAP_INCIDENT_TYPE_MAP[cls]
    if (!type) continue

    results.push({
      id: String(e.id ?? Math.random()),
      type,
      minute: e.time ?? null,
      team: e.isHome ? 'home' : 'away',
      playerName: e.player?.shortName ?? e.player?.name ?? null,
      homeScore: e.homeScore ?? null,
      awayScore: e.awayScore ?? null,
    })
  }
  return results
}
