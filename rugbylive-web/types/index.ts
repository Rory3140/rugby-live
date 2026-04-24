export type MatchStatus = 'NS' | '1H' | 'HT' | '2H' | 'FT' | 'ET' | 'PEN' | string

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
  type: 'league' | 'cup'
  season: number
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
  week: string | null
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
  type: 'League' | 'Cup'
  country: string | null
  seasons: number[]
  currentSeason: number | null
}
