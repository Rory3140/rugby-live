/**
 * Populates the Firestore `teams` collection.
 *
 * For each active league:
 *   - Fetches teams from API-Sports (primary — gets AS ID + logo + country)
 *   - Fetches teams from Highlightly standings (gets HL ID + nameCode)
 *   - Matches HL → AS by normalised name
 *   - Writes { asTeamId, hlTeamId, sapTeamId, name, nameCode, country, customLogoUrl, asLogoUrl }
 *
 * sapTeamId is left null — can be populated separately once SAP reliability improves.
 *
 * Run with: npx ts-node src/scripts/populateTeams.ts
 */

import 'dotenv/config'
import fetch from 'node-fetch'
import { initFirebase, db } from '../config/firebase'
import { getActiveLeagues } from '../config/leagues'
import { normaliseTeamName, teamNamesMatch } from '../services/matchResolver'
import type { TeamMapping } from '../config/teams'

const AS_BASE = 'https://v1.rugby.api-sports.io'
const AS_KEY = process.env.API_SPORTS_KEY ?? ''
const HL_BASE = 'https://rugby.highlightly.net'
const HL_KEY = process.env.HIGHLIGHTLY_KEY ?? ''

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

// ---- API-Sports ----

interface AsTeamRaw {
  id: number
  name: string
  logo: string | null
  country: string | null
}

async function fetchAsTeams(apiSportsId: number, season: number): Promise<AsTeamRaw[]> {
  await sleep(250)
  try {
    const res = await fetch(`${AS_BASE}/teams?league=${apiSportsId}&season=${season}`, {
      headers: { 'x-rapidapi-key': AS_KEY, 'x-rapidapi-host': 'v1.rugby.api-sports.io' },
    })
    if (!res.ok) return []
    const json = await res.json() as any
    if (json.errors && Object.keys(json.errors).length > 0) return []
    const data: any[] = Array.isArray(json.response) ? json.response : []
    return data.map(t => {
      // Handle both flat { id, name, logo } and nested { team: { id, name, logo }, country }
      const team = t.team ?? t
      return {
        id: team.id ?? t.id,
        name: team.name ?? t.name ?? '',
        logo: team.logo ?? t.logo ?? null,
        country: typeof t.country === 'string' ? t.country : (t.country?.name ?? null),
      }
    }).filter(t => t.id)
  } catch {
    return []
  }
}

// ---- Highlightly ----

interface HlTeamRaw {
  id: number
  name: string
  nameCode: string | null
}

async function fetchHlTeamsFromStandings(hlLeagueId: number, season: number): Promise<HlTeamRaw[]> {
  await sleep(300)
  try {
    const res = await fetch(`${HL_BASE}/standings?leagueId=${hlLeagueId}&season=${season}`, {
      headers: { 'x-rapidapi-key': HL_KEY },
    })
    if (!res.ok) return []
    const json = await res.json() as any
    const data = json.data ?? json

    // HL standings: { groups: [{ standings: [...] }] } or flat array
    let rows: any[] = []
    if (Array.isArray(data?.groups)) {
      for (const g of data.groups) {
        if (Array.isArray(g.standings)) rows.push(...g.standings)
      }
    } else if (Array.isArray(data)) {
      rows = data
    } else if (Array.isArray(data?.standings)) {
      rows = data.standings
    }

    return rows
      .filter((r: any) => r.team?.id)
      .map((r: any) => ({
        id: r.team.id,
        name: r.team.name ?? '',
        nameCode: r.team.shortName ?? r.team.nameCode ?? null,
      }))
  } catch {
    return []
  }
}

async function fetchHlTeamsFromStandingsLatest(hlLeagueId: number): Promise<HlTeamRaw[]> {
  // Try most recent seasons in order until we get data
  for (const season of [2026, 2025, 2024]) {
    const teams = await fetchHlTeamsFromStandings(hlLeagueId, season)
    if (teams.length > 0) return teams
  }
  return []
}

// ---- Firestore helpers ----

async function clearTeamsCollection(): Promise<number> {
  const snap = await db().collection('teams').get()
  if (snap.empty) return 0

  let deleted = 0
  const chunks: typeof snap.docs[] = []
  for (let i = 0; i < snap.docs.length; i += 500) {
    chunks.push(snap.docs.slice(i, i + 500))
  }
  for (const chunk of chunks) {
    const batch = db().batch()
    chunk.forEach(doc => batch.delete(doc.ref))
    await batch.commit()
    deleted += chunk.length
  }
  return deleted
}

async function writeTeams(teams: TeamMapping[]): Promise<void> {
  const chunks: TeamMapping[][] = []
  for (let i = 0; i < teams.length; i += 500) {
    chunks.push(teams.slice(i, i + 500))
  }
  for (const chunk of chunks) {
    const batch = db().batch()
    for (const t of chunk) {
      const ref = db().collection('teams').doc(String(t.asTeamId))
      batch.set(ref, t)
    }
    await batch.commit()
  }
}

// ---- Main ----

async function main() {
  initFirebase()
  const leagues = await getActiveLeagues()
  console.log(`Loaded ${leagues.length} active leagues`)

  // Step 1: collect all AS teams across all active leagues
  // Key: asTeamId → raw team data
  const asTeamMap = new Map<number, AsTeamRaw>()

  for (const league of leagues) {
    if (!league.apiSportsId) continue

    // Try season 2025 first (covers most active competitions), fall back to 2026
    let teams = await fetchAsTeams(league.apiSportsId, 2025)
    if (teams.length === 0) {
      teams = await fetchAsTeams(league.apiSportsId, 2026)
    }
    if (teams.length === 0) {
      teams = await fetchAsTeams(league.apiSportsId, 2024)
    }

    for (const t of teams) {
      if (!asTeamMap.has(t.id)) asTeamMap.set(t.id, t)
    }
    console.log(`  AS league ${league.apiSportsId} (${league.name}): ${teams.length} teams`)
  }

  console.log(`Total unique AS teams: ${asTeamMap.size}`)

  // Step 2: collect all HL teams from standings across active leagues
  // Key: normalised name → HL team data (for matching)
  const hlByNorm = new Map<string, HlTeamRaw>()

  for (const league of leagues) {
    if (!league.highlightlyId) continue

    const teams = await fetchHlTeamsFromStandingsLatest(league.highlightlyId)
    for (const t of teams) {
      const norm = normaliseTeamName(t.name)
      if (norm && !hlByNorm.has(norm)) hlByNorm.set(norm, t)
    }
    console.log(`  HL league ${league.highlightlyId} (${league.name}): ${teams.length} teams`)
  }

  console.log(`Total unique HL teams: ${hlByNorm.size}`)

  // Step 3: match HL → AS by normalised name, build merged TeamMapping list
  const merged: TeamMapping[] = []
  let matched = 0

  for (const [asId, asTeam] of asTeamMap) {
    // Try exact normalised match first, then fuzzy
    const asNorm = normaliseTeamName(asTeam.name)
    let hlTeam: HlTeamRaw | null = hlByNorm.get(asNorm) ?? null

    if (!hlTeam) {
      // Fuzzy: find HL team where names are substring-compatible
      for (const [, hl] of hlByNorm) {
        if (teamNamesMatch(asTeam.name, hl.name)) {
          hlTeam = hl
          break
        }
      }
    }

    if (hlTeam) matched++

    merged.push({
      asTeamId: asId,
      hlTeamId: hlTeam?.id ?? null,
      sapTeamId: null,
      name: asTeam.name,
      nameCode: hlTeam?.nameCode ?? null,
      country: asTeam.country,
      customLogoUrl: null,
      asLogoUrl: asTeam.logo,
    })
  }

  console.log(`Matched ${matched}/${merged.length} teams to a Highlightly ID`)

  // Step 4: clear existing teams and write new ones
  const deleted = await clearTeamsCollection()
  console.log(`Deleted ${deleted} existing team docs`)

  await writeTeams(merged)
  console.log(`Written ${merged.length} teams to Firestore`)

  // Summary: unmatched teams (no HL ID)
  const unmatched = merged.filter(t => !t.hlTeamId).map(t => t.name)
  if (unmatched.length > 0) {
    console.log(`\nTeams with no HL match (${unmatched.length}):`)
    unmatched.forEach(n => console.log(`  - ${n}`))
  }
}

main().then(() => {
  console.log('\nDone.')
  process.exit(0)
}).catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
