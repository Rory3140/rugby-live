/**
 * Cross-provider match ID resolver.
 *
 * Given a match known by one provider's ID, finds the corresponding ID in
 * another provider by:
 *   1. ID-based: look up HL team IDs from the Firestore teams cache, then find
 *      the HL match where both team IDs match (fast, exact)
 *   2. Name-based fallback: normalise + fuzzy team name matching (for teams not
 *      yet in the cache)
 *
 * Cache: per (date, leagueHlId) key → { normalisedTeamPair → hlMatchId }
 * TTL: 60 min (covers a full match day without re-fetching)
 */

import fetch from 'node-fetch'
import { normaliseTeamName, teamNamesMatch } from './matchResolver'
import { getHlTeamId, backfillHlTeamId } from '../config/teams'

const BASE_HL = 'https://rugby.highlightly.net'
const KEY_HL = process.env.HIGHLIGHTLY_KEY ?? ''

interface HlCacheEntry {
  ts: number
  byTeamPair: Map<string, number>   // `homeNorm__awayNorm` → hlMatchId
  byId: Map<number, any>            // hlMatchId → raw match object
  rawItems: any[]
}

const hlDateLeagueCache = new Map<string, HlCacheEntry>()
const TTL = 60 * 60 * 1000

async function loadHlMatchesForDate(date: string, hlLeagueId: number): Promise<HlCacheEntry> {
  const key = `${date}__${hlLeagueId}`
  const existing = hlDateLeagueCache.get(key)
  if (existing && Date.now() - existing.ts < TTL) return existing

  try {
    const res = await fetch(`${BASE_HL}/matches?leagueId=${hlLeagueId}&date=${date}`, {
      headers: { 'x-rapidapi-key': KEY_HL },
    })
    if (!res.ok) throw new Error(`HL ${res.status}`)
    const json = await res.json() as any
    const items: any[] = Array.isArray(json.data) ? json.data : []

    const entry: HlCacheEntry = { ts: Date.now(), byTeamPair: new Map(), byId: new Map(), rawItems: items }
    for (const m of items) {
      const home = normaliseTeamName(m.homeTeam?.name ?? '')
      const away = normaliseTeamName(m.awayTeam?.name ?? '')
      if (home && away) entry.byTeamPair.set(`${home}__${away}`, m.id)
      if (m.id) entry.byId.set(m.id, m)
    }
    hlDateLeagueCache.set(key, entry)
    return entry
  } catch {
    const empty: HlCacheEntry = { ts: Date.now(), byTeamPair: new Map(), byId: new Map(), rawItems: [] }
    hlDateLeagueCache.set(key, empty)
    return empty
  }
}

// After a name-based match, write HL team IDs back to Firestore async so future
// lookups use the fast ID path. Fire-and-forget — never blocks the response.
function maybeBackfill(
  hlMatchId: number,
  entry: HlCacheEntry,
  asHomeId?: number | null,
  asAwayId?: number | null,
): void {
  const m = entry.byId.get(hlMatchId)
  if (!m) return
  const hlHomeId: number | undefined = m.homeTeam?.id
  const hlAwayId: number | undefined = m.awayTeam?.id
  if (asHomeId && hlHomeId) backfillHlTeamId(asHomeId, hlHomeId).catch(() => {})
  if (asAwayId && hlAwayId) backfillHlTeamId(asAwayId, hlAwayId).catch(() => {})
}

/**
 * Given an API-Sports match, returns the matching Highlightly match ID or null.
 *
 * Pass asHomeTeamId / asAwayTeamId (numeric, from "as_team_123") to enable
 * ID-based resolution via the Firestore teams cache. Falls back to name matching.
 */
export async function resolveHlMatchId(
  homeTeamName: string,
  awayTeamName: string,
  date: string,
  hlLeagueId: number | null,
  asHomeTeamId?: number | null,
  asAwayTeamId?: number | null,
): Promise<number | null> {
  if (!hlLeagueId) return null
  const entry = await loadHlMatchesForDate(date, hlLeagueId)
  if (entry.rawItems.length === 0) return null

  // --- Pass 1: ID-based lookup via Firestore teams cache ---
  if (asHomeTeamId && asAwayTeamId) {
    const [hlHomeId, hlAwayId] = await Promise.all([
      getHlTeamId(asHomeTeamId),
      getHlTeamId(asAwayTeamId),
    ])
    if (hlHomeId && hlAwayId) {
      const idMatch = entry.rawItems.find(
        m => m.homeTeam?.id === hlHomeId && m.awayTeam?.id === hlAwayId
      )
      if (idMatch?.id != null) return idMatch.id
    }
  }

  // --- Pass 2: exact normalised name match ---
  const homeNorm = normaliseTeamName(homeTeamName)
  const awayNorm = normaliseTeamName(awayTeamName)
  const exact = entry.byTeamPair.get(`${homeNorm}__${awayNorm}`)
  if (exact != null) {
    maybeBackfill(exact, entry, asHomeTeamId, asAwayTeamId)
    return exact
  }

  // --- Pass 3: fuzzy substring name match ---
  const fuzzy = entry.rawItems.find(m =>
    teamNamesMatch(m.homeTeam?.name ?? '', homeTeamName) &&
    teamNamesMatch(m.awayTeam?.name ?? '', awayTeamName)
  )
  if (fuzzy?.id != null) {
    maybeBackfill(fuzzy.id, entry, asHomeTeamId, asAwayTeamId)
    return fuzzy.id
  }
  return null
}

// ---- Highlightly detail fetch ----

interface HlDetailCache {
  ts: number
  data: any
}
const hlDetailCache = new Map<number, HlDetailCache>()
const DETAIL_TTL = 30 * 60 * 1000

export async function fetchHlMatchDetail(hlMatchId: number): Promise<any | null> {
  const cached = hlDetailCache.get(hlMatchId)
  if (cached && Date.now() - cached.ts < DETAIL_TTL) return cached.data

  try {
    const res = await fetch(`${BASE_HL}/matches/${hlMatchId}`, {
      headers: { 'x-rapidapi-key': KEY_HL },
    })
    if (!res.ok) return null
    const json = await res.json() as any
    // HL match detail returns a top-level array: [{...}]
    // List endpoints return { data: [...] }
    let data: any
    if (Array.isArray(json)) {
      data = json[0]
    } else if (Array.isArray(json?.data)) {
      data = json.data[0]
    } else {
      data = json?.data ?? json
    }
    if (!data) return null
    hlDetailCache.set(hlMatchId, { ts: Date.now(), data })
    return data
  } catch {
    return null
  }
}

export async function fetchHlHighlightsForMatch(hlMatchId: number): Promise<any[]> {
  try {
    const res = await fetch(`${BASE_HL}/highlights?matchId=${hlMatchId}&limit=10`, {
      headers: { 'x-rapidapi-key': KEY_HL },
    })
    if (!res.ok) return []
    const json = await res.json() as any
    return Array.isArray(json.data) ? json.data : []
  } catch {
    return []
  }
}
