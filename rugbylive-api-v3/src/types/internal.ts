export type MatchStatus =
  | 'NS' | '1H' | 'HT' | '2H' | 'FT'
  | 'AET' | 'AP' | 'PEN'
  | 'AW' | 'AWD' | 'WO' | 'ABD' | 'CANC' | 'PST'
  | string

export interface Team {
  id: string
  name: string
  shortName: string
  logoUrl: string | null
}

export interface Competition {
  id: string
  name: string
  shortName: string
  logoUrl: string | null
}

export interface PeriodScores {
  first:    { home: number | null; away: number | null }
  second:   { home: number | null; away: number | null }
  overtime: { home: number | null; away: number | null }
}

export interface Match {
  id: string
  competition: Competition
  homeTeam: Team
  awayTeam: Team
  homeScore: number | null
  awayScore: number | null
  status: MatchStatus
  kickoff: string       // ISO 8601
  round: string | null
  periods: PeriodScores
}

export interface Standing {
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
  form: string | null
  description: string | null
}

export interface Highlight {
  id: string
  title: string
  url: string
  thumbnailUrl: string | null
  publishedAt: string | null
  source: string
}

export interface H2HMatch extends Match {
  // identical to Match — typed alias for clarity
}

export interface Incident {
  id: string
  type: 'try' | 'conversion' | 'penalty' | 'drop_goal' | 'yellow_card' | 'red_card' | 'substitution' | string
  minute: number | null
  team: 'home' | 'away'
  playerName: string | null
  homeScore: number | null
  awayScore: number | null
}

export interface League {
  id: string
  name: string
  shortName: string
  logoUrl: string | null
  country: string | null
  category: string | null
  active: boolean
  // provider IDs
  apiSportsId: number | null
  highlightlyId: number | null
  sapId: string | null
}

export interface Season {
  id: string
  name: string
  year: string
}

export interface ApiResponse<T> {
  data: T
  meta: {
    timestamp: string
    cached: boolean
    source: string
  }
}
