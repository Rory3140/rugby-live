import { getActiveLeagues } from '../config/leagues'
import { loadTeamLogoMap } from '../config/teams'
import * as AS from '../providers/apiSports'
import * as HL from '../providers/highlightly'
import * as SAP from '../providers/sportsApiPro'
import type { Match, Standing, Highlight, Incident } from '../types/internal'
import { matchKey } from './matchResolver'

function parseAsTeamId(id: string): number | null {
  const m = id.match(/^as_team_(\d+)$/)
  return m ? Number(m[1]) : null
}

const NON_LIVE = new Set(['NS', 'FT', 'AW', 'AWD', 'WO', 'CANC', 'PST', 'INT', 'ABD', 'TBD', 'AET', 'AP', 'PEN'])
export function isLive(status: string) { return !NON_LIVE.has(status) }

/**
 * Fetch all matches for a date.
 *
 * Strategy:
 * 1. API-Sports: ONE call for all leagues at once (`/games?date=`) — filtered to active leagues.
 *    This is the workhorse and costs only 1 API-Sports request per poll.
 * 2. We do NOT fall back to Highlightly for date polls — 100 req/day is too precious.
 *    Highlightly is reserved for match detail (highlights, incidents, H2H).
 */
export async function getMatchesByDate(date: string): Promise<Match[]> {
  const [leagues, teamLogoMap] = await Promise.all([getActiveLeagues(), loadTeamLogoMap()])
  const activeAsIds = new Set(leagues.map(l => l.apiSportsId).filter((id): id is number => id !== null))

  const matches = await AS.fetchAllMatchesByDate(date, activeAsIds)

  // Enrich each match with Firestore league + team logo overrides
  const leagueById = new Map(leagues.map(l => [l.apiSportsId, l]))
  return matches.map(m => {
    const asId = Number(m.competition.id)
    const league = leagueById.get(asId)
    const homeAsId = parseAsTeamId(m.homeTeam.id)
    const awayAsId = parseAsTeamId(m.awayTeam.id)
    return {
      ...m,
      competition: league ? {
        ...m.competition,
        id: league.id,
        name: league.name,
        shortName: league.shortName,
        logoUrl: league.logoUrl ?? m.competition.logoUrl,
      } : m.competition,
      homeTeam: {
        ...m.homeTeam,
        logoUrl: (homeAsId != null ? teamLogoMap.get(homeAsId) : null) ?? m.homeTeam.logoUrl,
      },
      awayTeam: {
        ...m.awayTeam,
        logoUrl: (awayAsId != null ? teamLogoMap.get(awayAsId) : null) ?? m.awayTeam.logoUrl,
      },
    }
  })
}

/**
 * Live matches only (status is 1H, HT, or 2H).
 */
export async function getLiveMatches(): Promise<Match[]> {
  const today = new Date().toISOString().slice(0, 10)
  const all = await getMatchesByDate(today)
  return all.filter(m => isLive(m.status))
}

/**
 * Get a single match by provider-prefixed ID.
 */
export async function getMatchById(id: string): Promise<Match | null> {
  if (id.startsWith('as_')) {
    return AS.fetchMatchById(id.replace('as_', ''))
  }
  if (id.startsWith('hl_')) {
    return HL.fetchMatchById(id)
  }
  return null
}

/**
 * Standings for a league.
 * Chain: API-Sports → Highlightly → SAP Pro
 */
export async function getStandings(leagueId: string, season?: string): Promise<Standing[]> {
  const [leagues, teamLogoMap] = await Promise.all([getActiveLeagues(), loadTeamLogoMap()])
  const league = leagues.find(l => l.id === leagueId)
  if (!league) return []

  const enrichStandings = (rows: Standing[]): Standing[] =>
    rows.map(r => {
      const asId = parseAsTeamId(r.team.id)
      const logo = (asId != null ? teamLogoMap.get(asId) : null) ?? r.team.logoUrl
      return { ...r, team: { ...r.team, logoUrl: logo } }
    })

  if (league.apiSportsId && season) {
    const rows = await AS.fetchStandings(league.apiSportsId, Number(season), leagueId)
    if (rows.length > 0) return enrichStandings(rows)
  }

  if (league.highlightlyId) {
    const rows = await HL.fetchStandings(league.highlightlyId, leagueId)
    if (rows.length > 0) return enrichStandings(rows)
  }

  if (league.sapId) {
    const rows = await SAP.fetchStandings(league.sapId, leagueId)
    if (rows.length > 0) return enrichStandings(rows)
  }

  return []
}

/**
 * All matches for a league/season (fixtures + results tabs).
 * Chain: API-Sports → SAP Pro
 */
export async function getLeagueMatches(leagueId: string, season?: string): Promise<Match[]> {
  const [leagues, teamLogoMap] = await Promise.all([getActiveLeagues(), loadTeamLogoMap()])
  const league = leagues.find(l => l.id === leagueId)
  if (!league) return []

  const enrichTeams = (m: Match): Match => {
    const homeAsId = parseAsTeamId(m.homeTeam.id)
    const awayAsId = parseAsTeamId(m.awayTeam.id)
    return {
      ...m,
      homeTeam: { ...m.homeTeam, logoUrl: (homeAsId != null ? teamLogoMap.get(homeAsId) : null) ?? m.homeTeam.logoUrl },
      awayTeam: { ...m.awayTeam, logoUrl: (awayAsId != null ? teamLogoMap.get(awayAsId) : null) ?? m.awayTeam.logoUrl },
    }
  }

  if (league.apiSportsId && season) {
    const matches = await AS.fetchLeagueMatches(league.apiSportsId, Number(season), leagueId)
    if (matches.length > 0) return matches.map(m => enrichTeams({
      ...m,
      competition: { ...m.competition, id: leagueId, name: league.name, shortName: league.shortName, logoUrl: league.logoUrl ?? m.competition.logoUrl },
    }))
  }

  if (league.sapId && season) {
    const matches = await SAP.fetchLeagueMatches(league.sapId, season, leagueId, league.name, league.logoUrl)
    if (matches.length > 0) return matches
  }

  return []
}

/**
 * Highlights — Highlightly only (they own this).
 * Only works for matches with hl_ IDs.
 */
export async function getHighlights(matchId: string): Promise<Highlight[]> {
  if (matchId.startsWith('hl_')) {
    return HL.fetchHighlights(matchId)
  }
  return []
}

/**
 * H2H — API-Sports for AS matches, Highlightly for HL matches.
 */
export async function getH2H(matchId: string): Promise<Match[]> {
  if (matchId.startsWith('as_')) {
    const match = await AS.fetchMatchById(matchId.replace('as_', ''))
    if (!match) return []
    return AS.fetchH2H(match.homeTeam.id, match.awayTeam.id, match.competition.id)
  }
  if (matchId.startsWith('hl_')) {
    return HL.fetchH2H(matchId)
  }
  return []
}

/**
 * Incidents — Highlightly only.
 */
export async function getIncidents(matchId: string): Promise<Incident[]> {
  if (matchId.startsWith('hl_')) {
    return HL.fetchIncidents(matchId)
  }
  return []
}

function deduplicateMatches(matches: Match[]): Match[] {
  const seen = new Map<string, Match>()
  for (const m of matches) {
    const k = `${m.kickoff.slice(0, 10)}__${matchKey(m.homeTeam.name, m.awayTeam.name)}`
    if (!seen.has(k)) {
      seen.set(k, m)
    } else {
      const existing = seen.get(k)!
      if (existing.id.startsWith('sap_') && !m.id.startsWith('sap_')) seen.set(k, m)
      if (existing.id.startsWith('hl_') && m.id.startsWith('as_')) seen.set(k, m)
    }
  }
  return Array.from(seen.values())
}
