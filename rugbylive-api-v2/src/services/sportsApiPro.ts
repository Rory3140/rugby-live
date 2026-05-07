import fetch from 'node-fetch'
import {
  SAPResponse,
  SAPEvent,
  SAPScheduleResponse,
  SAPIncident,
  SAPIncidentsResponse,
  SAPStatisticsResponse,
  SAPLineupsResponse,
  SAPPlayerStatisticsResponse,
  SAPHighlightsResponse,
  SAPStandingsResponse,
  SAPTournamentSeasonsResponse,
  SAPRoundsResponse,
  SAPCategoryTournamentsResponse,
  SAPTournamentInfo,
} from '../types/sportsApiPro'
import {
  ApiResponse,
  Match,
  MatchStatus,
  Team,
  Competition,
  Incident,
  IncidentType,
  Stat,
  Lineup,
  LineupPlayer,
  PlayerMatchStat,
  Highlight,
  StandingRow,
  Standings,
  Tournament,
  Season,
  Round,
} from '../types/internal'

// ─── Config ───────────────────────────────────────────────────────────────────

const BASE_URL = 'https://v2.rugby.sportsapipro.com'
const API_KEY = process.env.SPORTS_API_PRO_KEY || ''

// Rugby union category IDs on SportsAPI Pro
const RUGBY_UNION_CATEGORY = 82
const RUGBY_LEAGUE_CATEGORY = 83

// ─── HTTP helper ──────────────────────────────────────────────────────────────

const SAP_TIMEOUT_MS = 5_000

async function sapFetch<T>(path: string): Promise<T> {
  const url = `${BASE_URL}${path}`
  console.log(`[sap] GET ${url}`)

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), SAP_TIMEOUT_MS)

  let res: Awaited<ReturnType<typeof fetch>>
  try {
    res = await fetch(url, {
      headers: { 'x-api-key': API_KEY },
      signal: controller.signal,
    })
  } catch (err: any) {
    clearTimeout(timer)
    if (err?.name === 'AbortError') {
      throw new Error(`SportsAPI Pro timeout for ${path}`)
    }
    throw err
  }
  clearTimeout(timer)

  if (!res.ok) {
    throw new Error(`SportsAPI Pro ${res.status} for ${path}`)
  }

  const body = (await res.json()) as SAPResponse<T>

  if (!body.success) {
    throw new Error(`SportsAPI Pro returned success=false for ${path}`)
  }

  return body.data
}

function meta(cached = false): ApiResponse<unknown>['meta'] {
  return { timestamp: new Date().toISOString(), cached, source: 'sportsapipro' }
}

// SAP returns 503 (no data) or times out — both mean "treat as empty"
function isSapEmpty(err: any): boolean {
  const msg: string = err?.message ?? ''
  return msg.includes('503') || msg.includes('timeout')
}

// ─── Simple in-memory cache ───────────────────────────────────────────────────

interface CacheEntry<T> { data: T; expiresAt: number }
const cache = new Map<string, CacheEntry<any>>()

function fromCache<T>(key: string): T | null {
  const entry = cache.get(key)
  if (!entry || Date.now() > entry.expiresAt) { cache.delete(key); return null }
  return entry.data as T
}

function setCache<T>(key: string, data: T, ttlMs: number): void {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs })
}

const TTL = {
  schedule:      30_000,   // 30s — live scores need to refresh
  scheduleEmpty: 120_000,  // 2m  — dead dates: don't hammer SAP while it's struggling
  seasons:     3_600_000,  // 1h  — season list rarely changes
  standings:     300_000,  // 5m
  events:         60_000,  // 1m
  eventsEmpty:   120_000,  // 2m  — same as scheduleEmpty
}

// ─── Status normalisation ─────────────────────────────────────────────────────

function mapStatus(status: { type: string; description: string }): MatchStatus {
  switch (status.type) {
    case 'notstarted':
      return 'NS'
    case 'finished':
      return 'FT'
    case 'cancelled':
      return 'CANC'
    case 'postponed':
      return 'PST'
    case 'inprogress': {
      const d = status.description.toLowerCase()
      if (d.includes('half time') || d.includes('halftime') || d === 'ht') return 'HT'
      if (d.includes('2nd') || d.includes('second')) return '2H'
      return '1H'
    }
    default:
      return status.type
  }
}

// ─── Match normalisation ──────────────────────────────────────────────────────

function normaliseTeam(t: SAPEvent['homeTeam']): Team {
  return {
    id: String(t.id),
    name: t.name,
    shortName: t.nameCode,
    logoUrl: null,
    primaryColor: t.teamColors?.primary ?? null,
    secondaryColor: t.teamColors?.secondary ?? null,
  }
}

function normaliseCompetition(event: SAPEvent): Competition {
  const ut = event.tournament.uniqueTournament
  // Use uniqueTournament.id as the competition ID — this is the stable competition identifier
  // used throughout SportsAPI Pro (matches allowedLeagues IDs in leagueStore).
  const id = ut ? String(ut.id) : String(event.tournament.id)
  return {
    id,
    name: ut?.name ?? event.tournament.name,
    logoUrl: null,
    primaryColor: ut?.primaryColorHex ?? null,
    secondaryColor: ut?.secondaryColorHex ?? null,
    category: event.tournament.category?.name ?? null,
    hasRounds: false,
    hasGroups: false,
  }
}

function scorePair(score?: { current?: number | null }): number | null {
  return score?.current ?? null
}

function period(score?: { period1?: number | null; period2?: number | null }, half: 1 | 2 = 1): number | null {
  if (!score) return null
  return half === 1 ? (score.period1 ?? null) : (score.period2 ?? null)
}

function normaliseEvent(event: SAPEvent): Match {
  const homeScore = event.homeScore as { current?: number | null; period1?: number | null; period2?: number | null } | undefined
  const awayScore = event.awayScore as { current?: number | null; period1?: number | null; period2?: number | null } | undefined

  const roundInfo = event.roundInfo
  let round: string | null = null
  if (roundInfo) {
    round = roundInfo.name ?? String(roundInfo.round)
  }

  return {
    id: String(event.id),
    competition: normaliseCompetition(event),
    season: event.season
      ? { id: String(event.season.id), name: event.season.name, year: event.season.year }
      : null,
    round,
    homeTeam: normaliseTeam(event.homeTeam),
    awayTeam: normaliseTeam(event.awayTeam),
    homeScore: scorePair(homeScore),
    awayScore: scorePair(awayScore),
    periods: {
      first: { home: period(homeScore, 1), away: period(awayScore, 1) },
      second: { home: period(homeScore, 2), away: period(awayScore, 2) },
    },
    winnerCode: event.winnerCode ?? null,
    status: mapStatus(event.status),
    kickoff: new Date(event.startTimestamp * 1000).toISOString(),
    venue: event.venue?.name ?? null,
    referee: event.referee?.name ?? null,
  }
}

// ─── Incident normalisation ───────────────────────────────────────────────────

function mapIncidentType(inc: SAPIncident): IncidentType | null {
  if (inc.incidentType === 'period') {
    if (inc.text === 'HT') return 'half_time'
    if (inc.text === 'FT') return 'full_time'
    return null
  }
  if (inc.incidentType === 'substitution') return 'substitution'
  // Cards arrive as incidentType: 'card' or as goals with class 'yellow'/'red'
  if (inc.incidentType === 'card') {
    if (inc.incidentClass === 'yellow') return 'yellow_card'
    if (inc.incidentClass === 'red') return 'red_card'
    return 'yellow_card'
  }
  if (inc.incidentType === 'goal') {
    switch (inc.incidentClass) {
      case 'try':         return 'try'
      case 'twoPoints':   return 'conversion'   // union conversion (2pts)
      case 'onePoint':    return 'conversion'   // league conversion (1pt)
      case 'threePoints': return 'penalty'      // penalty goal (3pts)
      case 'dropGoal':    return 'drop_goal'
      case 'yellow':      return 'yellow_card'  // observed in some feeds
      case 'red':         return 'red_card'
      default:            return 'try'
    }
  }
  return null
}

function normaliseIncident(inc: SAPIncident, index: number): Incident | null {
  const type = mapIncidentType(inc)
  if (!type) return null

  return {
    id: inc.id != null ? String(inc.id) : `inc-${index}`,
    type,
    minute: inc.time ?? null,
    team: inc.isHome === true ? 'home' : inc.isHome === false ? 'away' : null,
    player: inc.player?.name ?? null,
    playerIn: inc.playerIn?.name ?? null,
    playerOut: inc.playerOut?.name ?? null,
    homeScore: inc.homeScore ?? null,
    awayScore: inc.awayScore ?? null,
  }
}

// ─── Stat normalisation ───────────────────────────────────────────────────────

const STAT_LABELS: Record<string, { label: string; unit: '%' | '' | 'm' }> = {
  possession:             { label: 'Possession',          unit: '%' },
  territory:              { label: 'Territory',           unit: '%' },
  tries:                  { label: 'Tries',               unit: ''  },
  conversions:            { label: 'Conversions',         unit: ''  },
  penaltyGoals:           { label: 'Penalties',           unit: ''  },
  dropGoals:              { label: 'Drop Goals',          unit: ''  },
  carries:                { label: 'Carries',             unit: ''  },
  metersRun:              { label: 'Metres Run',          unit: 'm' },
  cleanBreaks:            { label: 'Clean Breaks',        unit: ''  },
  offloads:               { label: 'Offloads',            unit: ''  },
  passes:                 { label: 'Passes',              unit: ''  },
  tackles:                { label: 'Tackles',             unit: ''  },
  tacklesMissed:          { label: 'Tackles Missed',      unit: ''  },
  lineoutsWon:            { label: 'Lineouts Won',        unit: ''  },
  lineoutsLost:           { label: 'Lineouts Lost',       unit: ''  },
  scrumWon:               { label: 'Scrums Won',          unit: ''  },
  scrumLost:              { label: 'Scrums Lost',         unit: ''  },
  yellowCards:            { label: 'Yellow Cards',        unit: ''  },
  redCards:               { label: 'Red Cards',           unit: ''  },
  kicksFromHand:          { label: 'Kicks from Hand',     unit: ''  },
}

// ─── Stat normalisation ───────────────────────────────────────────────────────

function normaliseStats(raw: SAPStatisticsResponse): Stat[] {
  const out: Stat[] = []

  for (const periodGroup of raw.statistics) {
    const period = periodGroup.period as 'ALL' | '1ST' | '2ND'
    for (const group of periodGroup.groups) {
      for (const item of group.statisticsItems) {
        const meta = STAT_LABELS[item.key] ?? { label: item.name, unit: '' as const }
        out.push({
          key: item.key,
          label: meta.label,
          home: item.homeValue,
          away: item.awayValue,
          unit: meta.unit,
          period,
        })
      }
    }
  }

  return out
}

// ─── Lineup normalisation ─────────────────────────────────────────────────────

function normaliseLineupPlayer(p: SAPLineupsResponse['home']['players'][number]): LineupPlayer {
  return {
    id: String(p.player.id),
    name: p.player.name,
    shortName: p.player.shortName,
    number: p.shirtNumber,
    position: p.player.position ?? null,
    substitute: p.substitute,
    country: p.player.country?.name ?? null,
  }
}

// ─── Player stat normalisation ────────────────────────────────────────────────

function normalisePlayerStat(
  p: SAPPlayerStatisticsResponse['home'][number],
  team: 'home' | 'away'
): PlayerMatchStat {
  const s = p.statistics
  return {
    playerId: String(p.player.id),
    name: p.player.name,
    shortName: p.player.shortName,
    number: p.shirtNumber,
    position: p.player.position ?? null,
    substitute: p.substitute,
    team,
    stats: {
      points:        s.points        ?? null,
      tries:         s.tries         ?? null,
      conversions:   s.conversions   ?? null,
      penaltyGoals:  s.penaltyGoals  ?? null,
      dropGoals:     s.dropGoals     ?? null,
      carries:       s.carries       ?? null,
      metersRun:     s.metersRun     ?? null,
      cleanBreaks:   s.cleanBreaks   ?? null,
      offloads:      s.offloads      ?? null,
      passes:        s.passes        ?? null,
      tackles:       s.tackles       ?? null,
      tacklesMissed: s.tacklesMissed ?? null,
      tryAssists:    s.tryAssists    ?? null,
      yellowCard:    s.yellowCard    ?? null,
      redCard:       s.redCard       ?? null,
    },
  }
}

// ─── Standing row normalisation ───────────────────────────────────────────────

function normaliseStandingRow(row: import('../types/sportsApiPro').SAPStandingRow): StandingRow {
  const team: Team = {
    id: String(row.team.id),
    name: row.team.name,
    shortName: row.team.nameCode,
    logoUrl: null,
    primaryColor: null,
    secondaryColor: null,
  }
  return {
    position: row.position,
    team,
    played: row.matches,
    won: row.wins,
    drawn: row.draws,
    lost: row.losses,
    pointsFor: row.scoresFor,
    pointsAgainst: row.scoresAgainst,
    pointsDiff: row.scoresFor - row.scoresAgainst,
    points: row.points,
    scoreDiffFormatted: row.scoreDiffFormatted,
    promotion: row.promotion?.text ?? null,
    descriptions: row.descriptions ?? [],
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getMatchesByDate(date: string): Promise<ApiResponse<Match[]>> {
  const cacheKey = `schedule:${date}`
  const cached = fromCache<Match[]>(cacheKey)
  if (cached) return { data: cached, meta: meta(true) }

  try {
    const data = await sapFetch<SAPScheduleResponse>(`/api/schedule/${date}`)
    const matches = data.events.map(normaliseEvent)
    setCache(cacheKey, matches, TTL.schedule)
    return { data: matches, meta: meta() }
  } catch (err: any) {
    if (isSapEmpty(err)) {
      setCache(cacheKey, [], TTL.scheduleEmpty)
      return { data: [], meta: meta() }
    }
    throw err
  }
}

export async function getLiveMatches(): Promise<ApiResponse<Match[]>> {
  // /api/live returns data: null when no matches are currently live; may 503 or timeout when unavailable
  try {
    const data = await sapFetch<SAPScheduleResponse | null>('/api/live')
    return {
      data: data?.events?.map(normaliseEvent) ?? [],
      meta: meta(),
    }
  } catch (err: any) {
    if (isSapEmpty(err)) return { data: [], meta: meta() }
    throw err
  }
}

export async function getTodayMatches(): Promise<ApiResponse<Match[]>> {
  try {
    const data = await sapFetch<SAPScheduleResponse>('/api/today')
    return {
      data: data.events.map(normaliseEvent),
      meta: meta(),
    }
  } catch (err: any) {
    if (isSapEmpty(err)) return { data: [], meta: meta() }
    throw err
  }
}

export async function getMatch(id: string): Promise<ApiResponse<Match>> {
  // /api/match/:id now confirmed working — returns full event with venue + referee
  const data = await sapFetch<{ event: SAPEvent }>(`/api/match/${id}`)
  return {
    data: normaliseEvent(data.event),
    meta: meta(),
  }
}

export async function getIncidents(id: string): Promise<ApiResponse<Incident[]>> {
  const data = await sapFetch<SAPIncidentsResponse>(`/api/match/${id}/incidents`)
  const incidents: Incident[] = []
  data.incidents.forEach((inc, i) => {
    const normalised = normaliseIncident(inc, i)
    if (normalised) incidents.push(normalised)
  })
  return { data: incidents, meta: meta() }
}

export async function getStatistics(id: string): Promise<ApiResponse<Stat[]>> {
  const data = await sapFetch<SAPStatisticsResponse>(`/api/match/${id}/statistics`)
  return { data: normaliseStats(data), meta: meta() }
}

export async function getLineups(id: string): Promise<ApiResponse<Lineup>> {
  const data = await sapFetch<SAPLineupsResponse>(`/api/match/${id}/lineups`)
  return {
    data: {
      confirmed: data.confirmed,
      home: data.home.players.map(normaliseLineupPlayer),
      away: data.away.players.map(normaliseLineupPlayer),
    },
    meta: meta(),
  }
}

export async function getPlayerStatistics(id: string): Promise<ApiResponse<PlayerMatchStat[]>> {
  const data = await sapFetch<SAPPlayerStatisticsResponse>(`/api/match/${id}/player-statistics`)
  const home = data.home.map((p) => normalisePlayerStat(p, 'home'))
  const away = data.away.map((p) => normalisePlayerStat(p, 'away'))
  return { data: [...home, ...away], meta: meta() }
}

export async function getHighlights(id: string): Promise<ApiResponse<Highlight[]>> {
  const data = await sapFetch<SAPHighlightsResponse>(`/api/match/${id}/highlights`)
  const highlights: Highlight[] = data.highlights.map((h) => ({
    id: String(h.id),
    title: h.title,
    subtitle: h.subtitle ?? null,
    url: h.url,
    thumbnailUrl: h.thumbnailUrl ?? null,
    isKeyHighlight: h.keyHighlight ?? false,
  }))
  return { data: highlights, meta: meta() }
}

export async function getTournaments(): Promise<ApiResponse<Tournament[]>> {
  const [unionData, leagueData] = await Promise.all([
    sapFetch<SAPCategoryTournamentsResponse>(`/api/categories/${RUGBY_UNION_CATEGORY}/tournaments`),
    sapFetch<SAPCategoryTournamentsResponse>(`/api/categories/${RUGBY_LEAGUE_CATEGORY}/tournaments`),
  ])

  const all: Tournament[] = []

  for (const categoryData of [unionData, leagueData]) {
    for (const group of categoryData.groups) {
      for (const t of group.uniqueTournaments) {
        all.push({
          id: String(t.id),
          name: t.name,
          primaryColor: t.primaryColorHex ?? null,
          secondaryColor: t.secondaryColorHex ?? null,
          hasRounds: t.hasRounds ?? false,
          hasGroups: t.hasGroups ?? false,
          userCount: t.userCount ?? null,
          titleHolder: null,
        })
      }
    }
  }

  return { data: all, meta: meta() }
}

export async function getSeasons(tournamentId: string): Promise<ApiResponse<Season[]>> {
  const cacheKey = `seasons:${tournamentId}`
  const cached = fromCache<Season[]>(cacheKey)
  if (cached) return { data: cached, meta: meta(true) }

  try {
    const data = await sapFetch<SAPTournamentSeasonsResponse>(`/api/tournament/${tournamentId}/seasons`)
    const seasons: Season[] = data.seasons.map((s) => ({
      id: String(s.id),
      name: s.name,
      year: s.year,
      editor: s.editor ?? false,
    }))
    setCache(cacheKey, seasons, TTL.seasons)
    return { data: seasons, meta: meta() }
  } catch (err: any) {
    if (isSapEmpty(err)) return { data: [], meta: meta() }
    throw err
  }
}

export async function getStandings(tournamentId: string, seasonId: string): Promise<ApiResponse<Standings[]>> {
  const cacheKey = `standings:${tournamentId}:${seasonId}`
  const cached = fromCache<Standings[]>(cacheKey)
  if (cached) return { data: cached, meta: meta(true) }

  try {
    const data = await sapFetch<SAPStandingsResponse>(
      `/api/tournament/${tournamentId}/season/${seasonId}/standings`
    )
    const standings: Standings[] = data.standings.map((s) => ({
      type: s.type,
      rows: s.rows.map(normaliseStandingRow),
      tieBreakingRule: s.tieBreakingRule?.text ?? null,
    }))
    setCache(cacheKey, standings, TTL.standings)
    return { data: standings, meta: meta() }
  } catch (err: any) {
    if (isSapEmpty(err)) return { data: [], meta: meta() }
    throw err
  }
}

export async function getRounds(tournamentId: string, seasonId: string): Promise<ApiResponse<{ currentRound: number | null; rounds: Round[] }>> {
  const data = await sapFetch<SAPRoundsResponse>(
    `/api/tournament/${tournamentId}/season/${seasonId}/rounds`
  )
  return {
    data: {
      currentRound: data.currentRound?.round ?? null,
      rounds: data.rounds,
    },
    meta: meta(),
  }
}

export async function getSeasonEvents(tournamentId: string, seasonId: string): Promise<ApiResponse<Match[]>> {
  const cacheKey = `events:${tournamentId}:${seasonId}`
  const cached = fromCache<Match[]>(cacheKey)
  if (cached) return { data: cached, meta: meta(true) }

  try {
    const data = await sapFetch<SAPScheduleResponse>(
      `/api/tournament/${tournamentId}/season/${seasonId}/events/last/0`
    )
    const matches = data.events.map(normaliseEvent)
    setCache(cacheKey, matches, TTL.events)
    return { data: matches, meta: meta() }
  } catch (err: any) {
    if (isSapEmpty(err)) {
      setCache(cacheKey, [], TTL.eventsEmpty)
      return { data: [], meta: meta() }
    }
    throw err
  }
}

export async function getRoundEvents(tournamentId: string, seasonId: string, round: string): Promise<ApiResponse<Match[]>> {
  try {
    const data = await sapFetch<SAPScheduleResponse>(
      `/api/tournament/${tournamentId}/season/${seasonId}/events/round/${round}`
    )
    return {
      data: data.events.map(normaliseEvent),
      meta: meta(),
    }
  } catch (err: any) {
    if (isSapEmpty(err)) {
      return { data: [], meta: meta() }
    }
    throw err
  }
}

// ─── Tournament info ──────────────────────────────────────────────────────────

export async function getTournamentInfo(tournamentId: string): Promise<ApiResponse<import('../types/internal').Tournament>> {
  const data = await sapFetch<SAPTournamentInfo>(`/api/tournament/${tournamentId}/info`)
  const ut = data.uniqueTournament
  return {
    data: {
      id: String(ut.id),
      name: ut.name,
      primaryColor: ut.primaryColorHex ?? null,
      secondaryColor: ut.secondaryColorHex ?? null,
      hasRounds: ut.hasRounds ?? false,
      hasGroups: ut.hasGroups ?? false,
      userCount: null,
      titleHolder: ut.titleHolder?.name ?? null,
    },
    meta: meta(),
  }
}

// ─── Team profile ─────────────────────────────────────────────────────────────

export async function getTeam(teamId: string): Promise<ApiResponse<import('../types/internal').TeamProfile>> {
  const data = await sapFetch<{
    team: {
      id: number; name: string; shortName: string; nameCode: string
      teamColors?: { primary: string; secondary: string }
      venue?: { name?: string }
    }
    pregameForm?: { value?: string }
  }>(`/api/teams/${teamId}`)

  const t = data.team
  return {
    data: {
      id: String(t.id),
      name: t.name,
      shortName: t.shortName,
      nameCode: t.nameCode,
      primaryColor: t.teamColors?.primary ?? null,
      secondaryColor: t.teamColors?.secondary ?? null,
      venue: t.venue?.name ?? null,
      form: data.pregameForm?.value ?? null,
    },
    meta: meta(),
  }
}

// ─── Team last results (paginated, 30 per page) ───────────────────────────────

export async function getTeamLastResults(teamId: string, page = 0): Promise<ApiResponse<import('../types/internal').TeamMatches>> {
  const data = await sapFetch<{ events: SAPEvent[]; hasNextPage: boolean }>(
    `/api/teams/${teamId}/events/last/${page}`
  )
  return {
    data: {
      matches: data.events.map(normaliseEvent),
      hasNextPage: data.hasNextPage,
    },
    meta: meta(),
  }
}

// ─── Team upcoming fixtures (paginated) ──────────────────────────────────────

export async function getTeamNextFixtures(teamId: string, page = 0): Promise<ApiResponse<import('../types/internal').TeamMatches>> {
  const data = await sapFetch<{ events: SAPEvent[]; hasNextPage: boolean }>(
    `/api/teams/${teamId}/events/next/${page}`
  )
  return {
    data: {
      matches: data.events.map(normaliseEvent),
      hasNextPage: data.hasNextPage,
    },
    meta: meta(),
  }
}

// ─── Team near-events (previous + next match) ─────────────────────────────────

export async function getTeamNearEvents(teamId: string): Promise<ApiResponse<{ previous: Match | null; next: Match | null }>> {
  const data = await sapFetch<{ previousEvent?: SAPEvent; nextEvent?: SAPEvent }>(
    `/api/teams/${teamId}/near-events`
  )
  return {
    data: {
      previous: data.previousEvent ? normaliseEvent(data.previousEvent) : null,
      next: data.nextEvent ? normaliseEvent(data.nextEvent) : null,
    },
    meta: meta(),
  }
}

// ─── Match coaches ────────────────────────────────────────────────────────────

export async function getManagers(id: string): Promise<ApiResponse<import('../types/internal').Coaches>> {
  const data = await sapFetch<{
    homeManager?: { id: number; name: string; shortName: string } | null
    awayManager?: { id: number; name: string; shortName: string } | null
  }>(`/api/match/${id}/managers`)

  return {
    data: {
      home: data.homeManager
        ? { id: String(data.homeManager.id), name: data.homeManager.name, shortName: data.homeManager.shortName }
        : null,
      away: data.awayManager
        ? { id: String(data.awayManager.id), name: data.awayManager.name, shortName: data.awayManager.shortName }
        : null,
    },
    meta: meta(),
  }
}

// ─── Match H2H summary ────────────────────────────────────────────────────────

export async function getH2HSummary(id: string): Promise<ApiResponse<import('../types/internal').H2HSummary>> {
  const data = await sapFetch<{
    teamDuel?: { homeWins: number; awayWins: number; draws: number } | null
  }>(`/api/match/${id}/h2h`)

  return {
    data: {
      homeWins: data.teamDuel?.homeWins ?? 0,
      awayWins: data.teamDuel?.awayWins ?? 0,
      draws: data.teamDuel?.draws ?? 0,
    },
    meta: meta(),
  }
}

// ─── Fan votes ────────────────────────────────────────────────────────────────

export async function getVotes(id: string): Promise<ApiResponse<import('../types/internal').Vote>> {
  const data = await sapFetch<{
    vote?: { vote1: number; vote2: number; voteX: number }
  }>(`/api/match/${id}/votes`)

  return {
    data: {
      homeVotes: data.vote?.vote1 ?? 0,
      awayVotes: data.vote?.vote2 ?? 0,
      drawVotes: data.vote?.voteX ?? 0,
    },
    meta: meta(),
  }
}
