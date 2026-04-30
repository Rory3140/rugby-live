// Internal normalised types for rugbylive-api-v2 — powered by SportsAPI Pro.
// All SportsAPI Pro shapes are mapped to these before leaving the service layer.

export interface ApiResponse<T> {
  data: T
  meta: {
    timestamp: string   // ISO 8601
    cached: boolean
    source: 'sportsapipro'
  }
}

// ─── Team / Competition ───────────────────────────────────────────────────────

export interface Team {
  id: string
  name: string
  shortName: string       // e.g. "IRE" — SportsAPI Pro nameCode
  logoUrl: string | null  // managed in Firebase; null here (not sourced from SAP)
  primaryColor: string | null   // hex from SportsAPI Pro teamColors.primary
  secondaryColor: string | null
}

export interface Competition {
  id: string
  name: string
  logoUrl: string | null  // managed in Firebase; null here
  primaryColor: string | null   // hex from SportsAPI Pro uniqueTournament.primaryColorHex
  secondaryColor: string | null
  category: string | null       // from SAP tournament.category.name
  hasRounds: boolean
  hasGroups: boolean
}

// ─── Match ────────────────────────────────────────────────────────────────────

export type MatchStatus = 'NS' | 'FT' | '1H' | 'HT' | '2H' | 'ET' | 'PEN' | 'CANC' | 'PST' | 'ABD' | string

export interface PeriodScores {
  home: number | null
  away: number | null
}

export interface Match {
  id: string
  competition: Competition
  season: { id: string; name: string; year: string } | null
  round: string | null          // round number or name e.g. "Semi-final"
  homeTeam: Team
  awayTeam: Team
  homeScore: number | null      // current total
  awayScore: number | null
  periods: {
    first: PeriodScores
    second: PeriodScores
  }
  winnerCode: 1 | 2 | null      // 1 = home, 2 = away, null = draw/NS
  status: MatchStatus
  kickoff: string               // ISO 8601
  venue: string | null          // event.venue.name
  referee: string | null        // event.referee.name
}

// ─── Incidents (try timeline) ─────────────────────────────────────────────────

export type IncidentType =
  | 'try'
  | 'conversion'
  | 'penalty'
  | 'drop_goal'
  | 'yellow_card'
  | 'red_card'
  | 'substitution'
  | 'half_time'
  | 'full_time'

export interface Incident {
  id: string
  type: IncidentType
  minute: number | null
  team: 'home' | 'away' | null  // null for period markers
  player: string | null
  playerIn: string | null       // substitutions: player coming on
  playerOut: string | null      // substitutions: player going off
  homeScore: number | null      // running score at time of incident
  awayScore: number | null
}

// ─── Statistics ───────────────────────────────────────────────────────────────

export interface Stat {
  key: string           // e.g. 'possession', 'tries', 'tackles'
  label: string         // e.g. 'Possession'
  home: number
  away: number
  unit: '%' | '' | 'm'
  period: 'ALL' | '1ST' | '2ND'
}

// ─── Lineups ──────────────────────────────────────────────────────────────────

export interface LineupPlayer {
  id: string
  name: string
  shortName: string
  number: number
  position: string | null
  substitute: boolean
  country: string | null
}

export interface Lineup {
  confirmed: boolean
  home: LineupPlayer[]
  away: LineupPlayer[]
}

// ─── Player match statistics ──────────────────────────────────────────────────

export interface PlayerMatchStat {
  playerId: string
  name: string
  shortName: string
  number: number
  position: string | null
  substitute: boolean
  team: 'home' | 'away'
  stats: {
    points: number | null
    tries: number | null
    conversions: number | null
    penaltyGoals: number | null
    dropGoals: number | null
    carries: number | null
    metersRun: number | null
    cleanBreaks: number | null
    offloads: number | null
    passes: number | null
    tackles: number | null
    tacklesMissed: number | null
    tryAssists: number | null
    yellowCard: number | null
    redCard: number | null
  }
}

// ─── Highlights ───────────────────────────────────────────────────────────────

export interface Highlight {
  id: string
  title: string
  subtitle: string | null
  url: string
  thumbnailUrl: string | null
  isKeyHighlight: boolean
}

// ─── Standings ────────────────────────────────────────────────────────────────

export interface StandingRow {
  position: number
  team: Team
  played: number
  won: number
  drawn: number
  lost: number
  pointsFor: number
  pointsAgainst: number
  pointsDiff: number
  points: number
  scoreDiffFormatted: string
  promotion: string | null      // promotion text e.g. "Playoffs"
  descriptions: string[]
}

export interface Standings {
  type: string
  rows: StandingRow[]
  tieBreakingRule: string | null
}

// ─── Tournament / Season / Round ──────────────────────────────────────────────

export interface Tournament {
  id: string
  name: string
  primaryColor: string | null
  secondaryColor: string | null
  hasRounds: boolean
  hasGroups: boolean
  userCount: number | null
  titleHolder: string | null    // defending champion team name
}

export interface Season {
  id: string
  name: string
  year: string
  editor: boolean
}

export interface Round {
  round: number
}

// ─── Team profile ─────────────────────────────────────────────────────────────

export interface TeamProfile {
  id: string
  name: string
  shortName: string
  nameCode: string
  primaryColor: string | null
  secondaryColor: string | null
  venue: string | null          // home ground name
  form: string | null           // e.g. "W-L-W-W-L" from pregameForm.value
}

// ─── Team match history ───────────────────────────────────────────────────────

export interface TeamMatches {
  matches: Match[]
  hasNextPage: boolean
}

// ─── Coaches ─────────────────────────────────────────────────────────────────

export interface Coaches {
  home: { id: string; name: string; shortName: string } | null
  away: { id: string; name: string; shortName: string } | null
}

// ─── Head-to-head summary ─────────────────────────────────────────────────────

export interface H2HSummary {
  homeWins: number
  awayWins: number
  draws: number
}

// ─── Fan vote ─────────────────────────────────────────────────────────────────

export interface Vote {
  homeVotes: number
  awayVotes: number
  drawVotes: number
}
