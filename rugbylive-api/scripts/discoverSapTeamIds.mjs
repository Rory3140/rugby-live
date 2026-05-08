/**
 * discoverSapTeamIds.mjs
 *
 * Fetches SAP standings for every active Firestore league that has a sapId,
 * extracts team names + SAP team IDs, name-matches against AS teams already
 * in Firestore, and writes sapTeamId back.
 *
 * Run: node scripts/discoverSapTeamIds.mjs
 */

import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import 'dotenv/config'

const __dirname = dirname(fileURLToPath(import.meta.url))
const saPath = resolve(__dirname, '../../rugbylive-api/rugby-live-9c1c7-firebase-adminsdk-fbsvc-a783e2b586.json')
const sa = JSON.parse(readFileSync(saPath, 'utf8'))
initializeApp({ credential: cert(sa) })
const db = getFirestore()

const SAP_KEY = process.env.SPORTS_API_PRO_KEY
const SAP_BASE = 'https://v2.rugby.sportsapipro.com'

// ── helpers ──────────────────────────────────────────────────────────────────

function normalise(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '').trim()
}

function namesMatch(a, b) {
  const na = normalise(a)
  const nb = normalise(b)
  return na === nb || na.includes(nb) || nb.includes(na)
}

async function sapFetch(path) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8000)
  try {
    const res = await fetch(`${SAP_BASE}${path}`, {
      headers: { 'x-api-key': SAP_KEY },
      signal: controller.signal,
    })
    clearTimeout(timer)
    if (!res.ok) return null
    return await res.json()
  } catch {
    clearTimeout(timer)
    return null
  }
}

// ── main ─────────────────────────────────────────────────────────────────────

async function main() {
  // 1. Load active leagues with sapId
  const leagueSnap = await db.collection('leagues').get()
  const leagues = leagueSnap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(l => l.active !== false && l.sapId)

  console.log(`Found ${leagues.length} active leagues with sapId\n`)

  // 2. Load existing AS teams from Firestore
  const teamSnap = await db.collection('teams').get()
  const asTeams = teamSnap.docs.map(d => ({ docId: d.id, ...d.data() }))
  console.log(`Loaded ${asTeams.length} teams from Firestore\n`)

  // 3. For each league: fetch SAP seasons, then standings
  const sapTeamMap = new Map() // sapTeamId (number) → { name, sapId }
  const seasonCache = new Map()

  for (const league of leagues) {
    const sapId = league.sapId
    process.stdout.write(`[${league.name}] sapId=${sapId} — fetching seasons... `)

    // Get season list
    let seasons = seasonCache.get(sapId)
    if (!seasons) {
      const sData = await sapFetch(`/api/tournament/${sapId}/seasons`)
      seasons = sData?.data?.seasons ?? []
      seasonCache.set(sapId, seasons)
    }

    const season = seasons[0]
    if (!season) { console.log('no seasons'); continue }

    process.stdout.write(`season=${season.id} — fetching standings... `)
    const sData = await sapFetch(`/api/tournament/${sapId}/season/${season.id}/standings`)
    // SAP standings: data.standings is array of groups, each with .rows[]
    const groups = sData?.data?.standings ?? []
    const rows = Array.isArray(groups)
      ? groups.flatMap(g => Array.isArray(g.rows) ? g.rows : [])
      : []

    if (!rows.length) { console.log('empty'); continue }

    let found = 0
    for (const row of rows) {
      const team = row.team
      if (!team?.id || !team?.name) continue
      if (!sapTeamMap.has(team.id)) {
        sapTeamMap.set(team.id, { name: team.name, sapId: team.id })
        found++
      }
    }
    console.log(`${rows.length} rows, ${found} new teams`)
  }

  console.log(`\nDiscovered ${sapTeamMap.size} unique SAP teams total\n`)

  // 4. Match SAP teams to Firestore AS teams by name
  let matched = 0
  let alreadySet = 0
  let unmatched = 0
  const unmatchedList = []

  const batch = db.batch()
  let batchCount = 0

  for (const [sapTeamId, sapTeam] of sapTeamMap) {
    const asTeam = asTeams.find(t => namesMatch(t.name ?? '', sapTeam.name))

    if (!asTeam) {
      unmatched++
      unmatchedList.push(sapTeam.name)
      continue
    }

    if (asTeam.sapTeamId === sapTeamId) {
      alreadySet++
      continue
    }

    const ref = db.collection('teams').doc(asTeam.docId)
    batch.update(ref, { sapTeamId: String(sapTeamId) })
    matched++
    batchCount++
    console.log(`  ✓ ${sapTeam.name.padEnd(35)} AS:${asTeam.docId.padEnd(6)} → SAP:${sapTeamId}`)

    // Commit in chunks of 400
    if (batchCount >= 400) {
      await batch.commit()
      batchCount = 0
    }
  }

  if (batchCount > 0) await batch.commit()

  console.log(`\n── Summary ──────────────────────────────`)
  console.log(`Matched & written : ${matched}`)
  console.log(`Already had sapId : ${alreadySet}`)
  console.log(`Unmatched         : ${unmatched}`)
  if (unmatchedList.length) {
    console.log(`\nUnmatched SAP teams (no AS equivalent found):`)
    unmatchedList.forEach(n => console.log(`  - ${n}`))
  }
}

main().catch(e => { console.error(e); process.exit(1) })
