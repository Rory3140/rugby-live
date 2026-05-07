import type { Match, Highlight, Incident } from './internal'

export interface LineupPlayer {
  name: string
  shortName: string | null
  number: number | null
  position: string | null
  height: string | null
  country: string | null
}

export interface Lineups {
  home: { starters: LineupPlayer[]; substitutes: LineupPlayer[] }
  away: { starters: LineupPlayer[]; substitutes: LineupPlayer[] }
}

export interface Prediction {
  type: 'prematch' | 'live' | string
  homeProb: string | null  // e.g. "55.3%"
  drawProb: string | null
  awayProb: string | null
  description: string | null
  generatedAt: string | null
}

export interface Weather {
  status: string | null
  temperature: string | null
}

export interface H2HData {
  homeWins: number
  awayWins: number
  draws: number
  recentMatches: Match[]
}

export interface MatchDetail {
  match: Match
  venue: { name: string | null; city: string | null; country: string | null; capacity: string | null } | null
  referee: { name: string | null; nationality: string | null } | null
  weather: Weather | null
  lineups: Lineups | null
  predictions: Prediction | null   // most recent prediction available
  incidents: Incident[]
  highlights: Highlight[]
  h2h: H2HData | null
  // which provider delivered each section (for debugging/transparency)
  sources: {
    match: string
    venue: string | null
    lineups: string | null
    predictions: string | null
    incidents: string | null
    highlights: string | null
    h2h: string | null
  }
}
