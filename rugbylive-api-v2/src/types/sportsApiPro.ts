// Raw response shapes from SportsAPI Pro — only map what we actually use.
// All normalisation happens in services/sportsApiPro.ts.

export interface SAPResponse<T> {
  success: boolean
  data: T
  source?: string
  cacheHit?: boolean
}

// ─── Schedule / Match ────────────────────────────────────────────────────────

export interface SAPTeam {
  id: number
  name: string
  shortName: string
  nameCode: string
  teamColors?: {
    primary: string
    secondary: string
    text: string
  }
}

export interface SAPScore {
  current: number | null
  display: number | null
  period1: number | null
  period2: number | null
  normaltime: number | null
}

export interface SAPStatus {
  code: number
  description: string
  type: 'notstarted' | 'inprogress' | 'finished' | 'cancelled' | 'postponed' | string
}

export interface SAPTournament {
  name: string
  slug: string
  id: number
  uniqueTournament?: {
    id: number
    name: string
    slug: string
    primaryColorHex?: string
    secondaryColorHex?: string
  }
  category?: {
    id: number
    name: string
  }
}

export interface SAPSeason {
  id: number
  name: string
  year: string
  editor?: boolean
}

export interface SAPRoundInfo {
  round: number
  name?: string
  cupRoundType?: number
}

export interface SAPVenue {
  name?: string
  slug?: string
  city?: { name: string }
  capacity?: number
  venueCoordinates?: { latitude: number; longitude: number }
}

export interface SAPReferee {
  id?: number | string
  name: string
  slug?: string
  yellowCards?: number
  redCards?: number
  games?: number
}

export interface SAPEvent {
  id: number
  slug?: string
  customId?: string
  startTimestamp: number
  status: SAPStatus
  roundInfo?: SAPRoundInfo
  tournament: SAPTournament
  season?: SAPSeason
  homeTeam: SAPTeam
  awayTeam: SAPTeam
  homeScore?: SAPScore | { series?: number }
  awayScore?: SAPScore | { series?: number }
  winnerCode?: 1 | 2 | null
  venue?: SAPVenue
  referee?: SAPReferee
  time?: {
    played?: number
    periodLength?: number
    overtimeLength?: number
    totalPeriodCount?: number
    currentPeriodStartTimestamp?: number
  }
  hasGlobalHighlights?: boolean
  hasEventPlayerStatistics?: boolean
}

// ─── Schedule endpoint ───────────────────────────────────────────────────────

export interface SAPScheduleResponse {
  events: SAPEvent[]
}

// ─── Incidents ───────────────────────────────────────────────────────────────

export interface SAPIncidentPlayer {
  id: number
  name: string
  shortName: string
  position?: string
  jerseyNumber?: string
}

export interface SAPIncident {
  id?: number
  incidentType: 'goal' | 'card' | 'substitution' | 'period' | string
  incidentClass?: string   // 'try' | 'twoPoints' | 'threePoints' | 'dropGoal' | 'yellow' | 'red' | 'regular'
  from?: string
  text?: string            // for period markers: 'HT' | 'FT'
  time?: number            // minute
  timeSeconds?: number
  isHome?: boolean
  isLive?: boolean
  homeScore?: number
  awayScore?: number
  player?: SAPIncidentPlayer
  playerIn?: SAPIncidentPlayer
  playerOut?: SAPIncidentPlayer
}

export interface SAPIncidentsResponse {
  incidents: SAPIncident[]
}

// ─── Statistics ──────────────────────────────────────────────────────────────

export interface SAPStatItem {
  name: string
  key: string
  home: string
  away: string
  homeValue: number
  awayValue: number
  statisticsType: 'positive' | 'negative' | string
  renderType?: number
  compareCode?: number
}

export interface SAPStatPeriod {
  period: 'ALL' | '1ST' | '2ND' | string
  groups: {
    groupName: string
    statisticsItems: SAPStatItem[]
  }[]
}

export interface SAPStatisticsResponse {
  statistics: SAPStatPeriod[]
}

// ─── Lineups ─────────────────────────────────────────────────────────────────

export interface SAPLineupPlayer {
  player: {
    id: number
    name: string
    shortName: string
    firstName?: string
    lastName?: string
    position?: string
    jerseyNumber?: string
    height?: number
    country?: { alpha2: string; alpha3?: string; name: string }
  }
  teamId: number
  shirtNumber: number
  substitute: boolean
}

export interface SAPLineupsResponse {
  confirmed: boolean
  home: { players: SAPLineupPlayer[] }
  away: { players: SAPLineupPlayer[] }
}

// ─── Player statistics per match ─────────────────────────────────────────────

export interface SAPPlayerMatchStats {
  player: {
    id: number
    name: string
    shortName: string
    position?: string
    jerseyNumber?: string
  }
  shirtNumber: number
  substitute: boolean
  statistics: {
    points?: number
    carries?: number
    metersRun?: number
    cleanBreaks?: number
    offloads?: number
    passes?: number
    tackles?: number
    tacklesMissed?: number
    tryAssists?: number
    tries?: number
    conversions?: number
    penaltyGoals?: number
    dropGoals?: number
    yellowCard?: number
    redCard?: number
  }
}

export interface SAPPlayerStatisticsResponse {
  home: SAPPlayerMatchStats[]
  away: SAPPlayerMatchStats[]
}

// ─── Highlights ──────────────────────────────────────────────────────────────

export interface SAPHighlight {
  id: number
  title: string
  subtitle?: string
  url: string
  thumbnailUrl?: string
  mediaType?: number
  keyHighlight?: boolean
  livestream?: boolean
}

export interface SAPHighlightsResponse {
  highlights: SAPHighlight[]
}

// ─── Tournament ──────────────────────────────────────────────────────────────

export interface SAPTournamentInfo {
  uniqueTournament: {
    id: number
    name: string
    slug: string
    primaryColorHex?: string
    secondaryColorHex?: string
    titleHolder?: { id: number; name: string }
    hasRounds?: boolean
    hasGroups?: boolean
    gender?: string
    startDateTimestamp?: number
    endDateTimestamp?: number
  }
}

export interface SAPTournamentSeasonsResponse {
  seasons: SAPSeason[]
}

export interface SAPStandingRow {
  team: SAPTeam & { id: number; name: string }
  position: number
  matches: number
  wins: number
  losses: number
  draws: number
  scoresFor: number
  scoresAgainst: number
  points: number
  scoreDiffFormatted: string
  promotion?: { text: string; id: number }
  descriptions?: string[]
  id?: number
}

export interface SAPStandingsResponse {
  standings: {
    type: string
    rows: SAPStandingRow[]
    tieBreakingRule?: { text: string; id: number }
  }[]
}

export interface SAPRoundsResponse {
  currentRound: { round: number }
  rounds: { round: number }[]
}

export interface SAPCategoryTournament {
  id: number
  name: string
  slug: string
  primaryColorHex?: string
  secondaryColorHex?: string
  hasRounds?: boolean
  hasGroups?: boolean
  userCount?: number
}

export interface SAPCategoryTournamentsResponse {
  groups: {
    uniqueTournaments: SAPCategoryTournament[]
  }[]
}
