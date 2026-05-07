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
  round: string | null
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
  category: string | null
  active?: boolean
}

export interface Season {
  id: string    // year string e.g. "2025" — used as ?season= param
  name: string
  year: string
  current?: boolean
}

// ── v3 match detail types ─────────────────────────────────────────────────────

export interface Venue {
  name: string | null
  city: string | null
  country: string | null
  capacity: number | null
}

export interface Referee {
  name: string | null
  nationality: string | null
}

export interface Weather {
  status: string | null
  temperature: string | null
}

export interface LineupPlayer {
  name: string
  shortName: string | null
  number: number | null
  position: string | null
  country: string | null
}

export interface LineupSide {
  starters: LineupPlayer[]
  substitutes: LineupPlayer[]
}

export interface Lineups {
  home: LineupSide
  away: LineupSide
}

export interface Prediction {
  type: string
  homeProb: string | null   // e.g. "62.4%"
  drawProb: string | null
  awayProb: string | null
  description: string | null
}

export interface Incident {
  id: string
  type: string              // 'try' | 'conversion' | 'penalty' | 'drop_goal' | 'yellow_card' | 'red_card' | ...
  minute: number | null
  team: 'home' | 'away'
  playerName: string | null
  homeScore: number | null
  awayScore: number | null
}

export interface Highlight {
  id: string
  title: string
  url: string
  thumbnailUrl: string | null
  publishedAt: string | null
  source: string
}

export interface H2HDetail {
  homeWins: number
  awayWins: number
  draws: number
  recentMatches: Match[]
}

export interface MatchDetail {
  match: Match
  venue: Venue | null
  referee: Referee | null
  weather: Weather | null
  lineups: Lineups | null
  predictions: Prediction | null
  incidents: Incident[]
  highlights: Highlight[]
  h2h: H2HDetail | null
}

// kept for any existing usages
export interface H2HSummary {
  homeWins: number
  awayWins: number
  draws: number
}
