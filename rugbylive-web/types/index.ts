export type MatchStatus = 'NS' | '1H' | 'HT' | '2H' | 'FT' | 'ET' | 'PEN' | 'CANC' | 'PST' | 'ABD' | string

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

export interface Match {
  id: string
  competition: Competition
  homeTeam: Team
  awayTeam: Team
  homeScore: number | null
  awayScore: number | null
  status: MatchStatus
  kickoff: string
  round: string | null    // round number or name e.g. "Round 18", "Semi-final" (was 'week' in v1)
  periods: {
    first:    { home: number | null; away: number | null }
    second:   { home: number | null; away: number | null }
    overtime: { home: number | null; away: number | null }
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
  shortName: string
  logoUrl: string | null
  country: string | null
  category: string | null   // 'International' | 'Club' | 'Sevens' | null
  active?: boolean          // present on admin endpoints
}

export interface Season {
  id: string    // SAP internal season ID (e.g. "82834") — use for standings/games API calls
  name: string  // e.g. "URC 2024/2025"
  year: string  // e.g. "2024/2025"
}

export interface H2HSummary {
  homeWins: number
  awayWins: number
  draws: number
}
