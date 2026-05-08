import { getActiveLeagues } from '../config/leagues'
import { loadTeamLogoMap } from '../config/teams'
import * as AS from '../providers/apiSports'
import * as SAP from '../providers/sportsApiPro'
import { getMatchById } from './matchesService'
import {
  resolveHlMatchId,
  fetchHlMatchDetail,
  fetchHlHighlightsForMatch,
  resolveSapMatchId,
} from './crossRefService'
import type { Match, Incident, Highlight } from '../types/internal'
import type {
  MatchDetail,
  Lineups,
  LineupPlayer,
  Prediction,
} from '../types/detail'

// ---- helpers ----

function normLineupPlayer(p: any): LineupPlayer {
  return {
    name: p.name ?? p.shortName ?? '',
    shortName: p.shortName ?? null,
    number: p.shirtNumber ?? p.jerseyNumber ?? null,
    position: p.position ?? null,
    height: p.height ?? null,
    country: p.countryName ?? p.country ?? null,
  }
}

function extractLineups(detail: any): Lineups | null {
  const hl = detail?.lineups
  if (!hl || (!hl.home && !hl.away)) return null

  const mapSide = (side: any) => ({
    starters: (side?.initialLineup ?? []).map(normLineupPlayer),
    substitutes: (side?.substitutions ?? []).map((s: any) => normLineupPlayer(s.playerIn ?? s)),
  })

  const home = mapSide(hl.home)
  const away = mapSide(hl.away)
  if (home.starters.length === 0 && away.starters.length === 0) return null
  return { home, away }
}

function extractPrediction(detail: any): Prediction | null {
  const preds = detail?.predictions
  if (!preds) return null

  // prefer live prediction if the match is underway, else most recent prematch
  const live: any[] = Array.isArray(preds.live) ? preds.live : []
  const prematch: any[] = Array.isArray(preds.prematch) ? preds.prematch : []
  const source = live.length > 0 ? live[live.length - 1] : prematch[prematch.length - 1]
  if (!source) return null

  const probs = source.probabilities ?? {}
  return {
    type: source.type ?? 'prematch',
    homeProb: probs.home ?? null,
    drawProb: probs.draw ?? null,
    awayProb: probs.away ?? null,
    description: source.description ?? null,
    generatedAt: source.generatedAt ?? null,
  }
}

function extractIncidents(detail: any): Incident[] {
  const inc: any[] = detail?.incidents ?? detail?.events ?? []
  if (!Array.isArray(inc) || inc.length === 0) return []

  return inc.map((e: any) => ({
    id: String(e.id ?? Math.random()),
    type: e.incidentType ?? e.type ?? 'unknown',
    minute: e.time ?? e.minute ?? null,
    team: e.isHome ? 'home' : 'away',
    playerName: e.player?.name ?? e.playerName ?? null,
    homeScore: e.homeScore ?? null,
    awayScore: e.awayScore ?? null,
  }))
}

function extractHighlights(items: any[]): Highlight[] {
  return items.map(h => ({
    id: String(h.id ?? h.url ?? Math.random()),
    title: h.title ?? '',
    url: h.url ?? h.embedUrl ?? h.videoUrl ?? '',
    thumbnailUrl: h.imgUrl ?? h.thumbnail ?? h.image ?? null,
    publishedAt: h.publishedAt ?? h.createdAt ?? null,
    source: h.channel ?? 'Highlightly',
  }))
}

// ---- main function ----

function parseAsTeamId(id: string): number | null {
  const m = id.match(/^as_team_(\d+)$/)
  return m ? Number(m[1]) : null
}

export async function getMatchDetail(matchId: string): Promise<MatchDetail | null> {
  // 1. Fetch the base match + team logo overrides in parallel
  const [matchRaw, teamLogoMap] = await Promise.all([getMatchById(matchId), loadTeamLogoMap()])
  if (!matchRaw) return null

  const applyTeamLogo = (team: Match['homeTeam']): Match['homeTeam'] => {
    const asId = parseAsTeamId(team.id)
    const logo = (asId != null ? teamLogoMap.get(asId) : null) ?? team.logoUrl
    return { ...team, logoUrl: logo }
  }

  // Resolve leagues now so we can enrich competition logo alongside team logos
  const leaguesForEnrich = await getActiveLeagues()
  const matchLeague = leaguesForEnrich.find(l => l.id === matchRaw.competition.id)

  const match: Match = {
    ...matchRaw,
    competition: {
      ...matchRaw.competition,
      logoUrl: matchLeague?.logoUrl ?? matchRaw.competition.logoUrl,
    },
    homeTeam: applyTeamLogo(matchRaw.homeTeam),
    awayTeam: applyTeamLogo(matchRaw.awayTeam),
  }

  const sources: MatchDetail['sources'] = {
    match: matchId.startsWith('as_') ? 'api-sports' : 'highlightly',
    venue: null,
    lineups: null,
    predictions: null,
    incidents: null,
    highlights: null,
    h2h: null,
  }

  // 2. Resolve Highlightly + SAP match IDs in parallel
  const date = match.kickoff.slice(0, 10)

  const hlLeagueId = matchLeague?.highlightlyId ?? null

  const asHomeId = match.homeTeam.id.startsWith('as_team_')
    ? Number(match.homeTeam.id.replace('as_team_', '')) : null
  const asAwayId = match.awayTeam.id.startsWith('as_team_')
    ? Number(match.awayTeam.id.replace('as_team_', '')) : null

  let hlMatchId: number | null = null
  let sapMatchId: number | null = null

  if (matchId.startsWith('as_')) {
    ;[hlMatchId, sapMatchId] = await Promise.all([
      hlLeagueId
        ? resolveHlMatchId(match.homeTeam.name, match.awayTeam.name, date, hlLeagueId, asHomeId, asAwayId)
        : Promise.resolve(null),
      resolveSapMatchId(date, match.homeTeam.name, match.awayTeam.name, asHomeId, asAwayId),
    ])
  } else if (matchId.startsWith('hl_')) {
    hlMatchId = Number(matchId.replace('hl_', ''))
  }

  // 3. Fetch all enrichment data in parallel — SAP calls have a hard 4s cap
  const [hlDetail, hlHighlightItems, h2hMatches, sapLineups, sapIncidents] = await Promise.all([
    hlMatchId ? fetchHlMatchDetail(hlMatchId) : Promise.resolve(null),
    hlMatchId ? fetchHlHighlightsForMatch(hlMatchId) : Promise.resolve([]),
    matchId.startsWith('as_')
      ? AS.fetchH2H(match.homeTeam.id, match.awayTeam.id, match.competition.id).catch(() => [] as Match[])
      : Promise.resolve([] as Match[]),
    // SAP fallbacks — 4s timeout already enforced inside these functions
    sapMatchId ? SAP.fetchSapLineups(sapMatchId).catch(() => null) : Promise.resolve(null),
    sapMatchId ? SAP.fetchSapIncidents(sapMatchId).catch(() => []) : Promise.resolve([] as Incident[]),
  ])

  // 4. Extract structured fields from HL detail (all gracefully handle null/missing)
  let venue: MatchDetail['venue'] = null
  let referee: MatchDetail['referee'] = null
  let weather: MatchDetail['weather'] = null
  let lineups: Lineups | null = null
  let prediction: Prediction | null = null
  let incidents: Incident[] = []

  if (hlDetail) {
    const v = hlDetail.venue
    if (v && (v.name || v.city)) {
      venue = {
        name: v.name ?? null,
        city: v.city ?? null,
        country: v.country ?? null,
        capacity: v.capacity ?? null,
      }
      sources.venue = 'highlightly'
    }

    const r = hlDetail.referee
    if (r && r.name) {
      referee = { name: r.name ?? null, nationality: r.nationality ?? null }
    }

    const f = hlDetail.forecast ?? hlDetail.weatherForecast
    if (f && (f.status || f.temperature)) {
      const rawTemp: string | null = f.temperature ?? null
      const temperature = rawTemp ? rawTemp.replace(/(\d+)\.\d+/, '$1') : null
      weather = { status: f.status ?? null, temperature }
    }

    lineups = extractLineups(hlDetail)
    if (lineups) sources.lineups = 'highlightly'

    prediction = extractPrediction(hlDetail)
    if (prediction) sources.predictions = 'highlightly'

    incidents = extractIncidents(hlDetail)
    if (incidents.length > 0) sources.incidents = 'highlightly'
  }

  // SAP fallbacks — only fill gaps HL couldn't provide
  if (!lineups && sapLineups) {
    lineups = sapLineups
    sources.lineups = 'sap'
  }
  if (incidents.length === 0 && sapIncidents.length > 0) {
    incidents = sapIncidents
    sources.incidents = 'sap'
  }

  const highlights = extractHighlights(hlHighlightItems)
  if (highlights.length > 0) sources.highlights = 'highlightly'

  // Apply team logo overrides to H2H matches
  const enrichedH2h = h2hMatches.map(m => ({
    ...m,
    homeTeam: applyTeamLogo(m.homeTeam),
    awayTeam: applyTeamLogo(m.awayTeam),
  }))

  // 5. Build H2H summary
  let h2h: MatchDetail['h2h'] = null
  if (enrichedH2h.length > 0) {
    const homeNorm = match.homeTeam.name
    const isCurrentMatch = (m: Match) =>
      m.id === matchId ||
      (m.kickoff === match.kickoff &&
       m.homeTeam.name === match.homeTeam.name &&
       m.awayTeam.name === match.awayTeam.name)
    let homeWins = 0, awayWins = 0, draws = 0
    for (const m of enrichedH2h) {
      if (isCurrentMatch(m)) continue
      if (m.homeScore === null || m.awayScore === null) continue
      const isHomeTeamHome = m.homeTeam.name === homeNorm
      const homeScore = isHomeTeamHome ? m.homeScore : m.awayScore
      const awayScore = isHomeTeamHome ? m.awayScore : m.homeScore
      if (homeScore > awayScore) homeWins++
      else if (awayScore > homeScore) awayWins++
      else draws++
    }
    h2h = {
      homeWins,
      awayWins,
      draws,
      recentMatches: enrichedH2h
        .filter(m => m.homeScore !== null && !isCurrentMatch(m))
        .sort((a, b) => b.kickoff.localeCompare(a.kickoff))
        .slice(0, 10),
    }
    sources.h2h = 'api-sports'
  }

  return {
    match,
    venue,
    referee,
    weather,
    lineups,
    predictions: prediction,
    incidents,
    highlights,
    h2h,
    sources,
  }
}
