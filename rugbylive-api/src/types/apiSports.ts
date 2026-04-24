// Raw API-Sports response shapes — never leak past services/apiSports.ts

export interface ApiSportsResponse<T> {
  get: string
  parameters: Record<string, string>
  errors: Record<string, string> | []
  results: number
  paging: { current: number; total: number }
  response: T[]
}

export interface ApiSportsGame {
  id: number
  date: string
  time: string
  timestamp: number
  timezone: string
  week: string | null
  status: {
    long: string
    short: string
  }
  country: {
    id: number
    name: string
    code: string | null
    flag: string | null
  }
  league: {
    id: number
    name: string
    type: string
    logo: string
    season: number
  }
  teams: {
    home: ApiSportsTeam
    away: ApiSportsTeam
  }
  scores: {
    home: number | null
    away: number | null
  }
  periods: {
    first: { home: number | null; away: number | null }
    second: { home: number | null; away: number | null }
    overtime: { home: number | null; away: number | null }
    second_overtime: { home: number | null; away: number | null }
  }
}

export interface ApiSportsTeam {
  id: number
  name: string
  logo: string
}

export interface ApiSportsStanding {
  position: number
  stage: string | null
  group: { name: string | null }
  team: ApiSportsTeam
  league: {
    id: number
    name: string
    type: string
    logo: string
    season: number
  }
  country: {
    id: number | null
    name: string | null
    code: string | null
    flag: string | null
  }
  games: {
    played: number
    win: { total: number; percentage: string }
    draw: { total: number; percentage: string }
    lose: { total: number; percentage: string }
  }
  goals: {
    for: number
    against: number
  }
  points: number
  form: string | null
  description: string | null
}

export interface ApiSportsLeague {
  id: number
  name: string
  type: string
  logo: string
  country: {
    id: number
    name: string
    code: string | null
    flag: string | null
  }
  seasons: Array<{
    season: number
    current: boolean
    start: string
    end: string
  }>
}
