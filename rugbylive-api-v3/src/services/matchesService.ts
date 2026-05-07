import { getActiveLeagues } from '../config/leagues'
import * as AS from '../providers/apiSports'
import * as HL from '../providers/highlightly'
import * as SAP from '../providers/sportsApiPro'
import type { Match, Standing, Highlight, Incident } from '../types/internal'
import { matchKey } from './matchResolver'

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
  const leagues = await getActiveLeagues()
  const activeAsIds = new Set(leagues.map(l => l.apiSportsId).filter((id): id is number => id !== null))

  const matches = await AS.fetchAllMatchesByDate(date, activeAsIds)

  // Enrich each match with the Firestore league data (logo, category, etc.)
  // so the competition object reflects our stored metadata
  const leagueById = new Map(leagues.map(l => [l.apiSportsId, l]))
  return matches.map(m => {
    const asId = Number(m.competition.id)
    const league = leagueById.get(asId)
    if (!league) return m
    return {
      ...m,
      competition: {
        ...m.competition,
        id: league.id, // use Firestore doc ID as canonical ID
        name: league.name,
        shortName: league.shortName,
        logoUrl: league.logoUrl ?? m.competition.logoUrl,
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
  const leagues = await getActiveLeagues()
  const league = leagues.find(l => l.id === leagueId)
  if (!league) return []

  if (league.apiSportsId && season) {
    const rows = await AS.fetchStandings(league.apiSportsId, Number(season), leagueId)
    if (rows.length > 0) return rows
  }

  if (league.highlightlyId) {
    const rows = await HL.fetchStandings(league.highlightlyId, leagueId)
    if (rows.length > 0) return rows
  }

  if (league.sapId) {
    const rows = await SAP.fetchStandings(league.sapId, leagueId)
    if (rows.length > 0) return rows
  }

  return []
}

/**
 * All matches for a league/season (fixtures + results tabs).
 * Chain: API-Sports → SAP Pro
 */
export async function getLeagueMatches(leagueId: string, season?: string): Promise<Match[]> {
  const leagues = await getActiveLeagues()
  const league = leagues.find(l => l.id === leagueId)
  if (!league) return []

  if (league.apiSportsId && season) {
    const matches = await AS.fetchLeagueMatches(league.apiSportsId, Number(season), leagueId)
    if (matches.length > 0) return matches.map(m => ({
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
