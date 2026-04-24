// Internal normalised types — these are what the backend returns to the frontend.
// All API-Sports shapes are mapped to these before leaving services/apiSports.ts.

export interface ApiResponse<T> {
  data: T
  meta: {
    timestamp: string
    cached: boolean
    source: 'realtime' | 'firestore' | 'api-sports'
  }
}

export interface Team {
  id: string
  name: string
  logoUrl: string | null
}

export interface Competition {
  id: string
  name: string
  logoUrl: string | null
  type: 'league' | 'cup'
  season: number
}

export interface PeriodScores {
  home: number | null
  away: number | null
}

// status.short values confirmed: 'NS' | 'FT'
// Live values (e.g. '1H' | 'HT' | '2H') unconfirmed — update when observed
export type MatchStatus = 'NS' | 'FT' | '1H' | 'HT' | '2H' | 'ET' | 'PEN' | string

export interface Match {
  id: string
  competition: Competition
  homeTeam: Team
  awayTeam: Team
  homeScore: number | null
  awayScore: number | null
  status: MatchStatus
  kickoff: string        // ISO 8601
  week: string | null
  periods: {
    first: PeriodScores
    second: PeriodScores
    overtime: PeriodScores
  }
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

export interface League {
  id: string
  name: string
  logoUrl: string | null
  type: 'League' | 'Cup'
  country: string | null
  seasons: number[]
  currentSeason: number | null
}
