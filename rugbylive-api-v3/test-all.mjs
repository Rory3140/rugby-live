#!/usr/bin/env node
/**
 * Comprehensive v3 backend test
 * Run with: node test-all.mjs
 */

const BASE = 'http://localhost:4002'

const R = { pass: 0, warn: 0, fail: 0 }
const issues = []

const C = {
  reset: '\x1b[0m',
  bold:  '\x1b[1m',
  red:   '\x1b[31m',
  grn:   '\x1b[32m',
  yel:   '\x1b[33m',
  cyn:   '\x1b[36m',
}

function b(s) { return `${C.bold}${s}${C.reset}` }
function grn(s) { return `${C.grn}${s}${C.reset}` }
function red(s) { return `${C.red}${s}${C.reset}` }
function yel(s) { return `${C.yel}${s}${C.reset}` }
function cyn(s) { return `${C.cyn}${s}${C.reset}` }

async function req(url, opts = {}) {
  const start = Date.now()
  try {
    const res = await fetch(url, opts)
    const ms = Date.now() - start
    let json = null
    try { json = await res.json() } catch {}
    return { ok: res.ok, status: res.status, ms, json }
  } catch (e) {
    return { ok: false, status: 0, ms: Date.now() - start, json: null, error: e.message }
  }
}

function speedLabel(ms) {
  if (ms > 5000) return red(`${ms}ms ⚠ SLOW`)
  if (ms > 2000) return yel(`${ms}ms ⚠`)
  if (ms > 1000) return yel(`${ms}ms`)
  return grn(`${ms}ms`)
}

function check(label, { ok, status, ms, json, error }, dataChecks = []) {
  const speed = speedLabel(ms)
  let passed = ok && json && ('data' in json)

  const itemCount = Array.isArray(json?.data) ? json.data.length : (json?.data ? 'obj' : '—')

  let details = []
  for (const { path, expect, warn: warnOnly } of dataChecks) {
    const val = path.split('.').reduce((o, k) => o?.[k], json)
    const present = val !== null && val !== undefined
    const isEmpty = Array.isArray(val) ? val.length === 0 : false
    const label2 = `${path}`
    if (!present) {
      details.push({ sym: yel('◦'), label: label2, val: 'null', warn: true })
      if (!warnOnly) issues.push(`${label} → ${label2} is null`)
    } else if (isEmpty) {
      details.push({ sym: yel('◦'), label: label2, val: '[] empty', warn: true })
    } else if (Array.isArray(val)) {
      details.push({ sym: grn('✓'), label: label2, val: `[${val.length}]` })
    } else if (typeof val === 'object') {
      details.push({ sym: grn('✓'), label: label2, val: JSON.stringify(val).slice(0, 70) })
    } else {
      details.push({ sym: grn('✓'), label: label2, val: String(val).slice(0, 70) })
    }
  }

  if (!passed) {
    console.log(`  ${red('✗')} ${b(label)} — ${speed} | HTTP ${status} ${error || ''}`)
    issues.push(`${label} FAILED (HTTP ${status})`)
    R.fail++
  } else if (ms > 5000) {
    console.log(`  ${yel('⚠')} ${b(label)} — ${speed} | items: ${itemCount}`)
    issues.push(`${label} SLOW (${ms}ms)`)
    R.warn++
  } else {
    console.log(`  ${grn('✓')} ${b(label)} — ${speed} | items: ${itemCount}`)
    R.pass++
  }

  for (const d of details) {
    console.log(`     ${d.sym} ${d.label}: ${d.val}`)
  }

  return json
}

async function bench(label, url, n = 3) {
  const times = []
  for (let i = 0; i < n; i++) {
    const r = await req(url)
    times.push(r.ms)
  }
  const avg = Math.round(times.reduce((a,b) => a+b, 0) / n)
  const max = Math.max(...times)
  const min = Math.min(...times)
  const flag = avg > 3000 ? red('⚠ SLOW') : avg > 1000 ? yel('⚡ OK') : grn('fast')
  console.log(`  ${b(label)}: avg ${avg}ms, min ${min}ms, max ${max}ms — ${flag}`)
  if (avg > 3000) issues.push(`${label} avg ${avg}ms`)
  return avg
}

// ─────────────────────────────────────────────────────────────────────────────

const today = new Date().toISOString().slice(0, 10)

console.log('')
console.log(b('━'.repeat(56)))
console.log(b(`  rugbylive-api-v3 comprehensive test — ${today}`))
console.log(b('━'.repeat(56)))

// ── 1. Health ─────────────────────────────────────────────────────────────────
console.log(`\n${cyn('── 1. Health')}`)
check('/health', await req(`${BASE}/health`))

// ── 2. Leagues ───────────────────────────────────────────────────────────────
console.log(`\n${cyn('── 2. Leagues')}`)
const leaguesR = await req(`${BASE}/leagues`)
const leagues = check('/leagues', leaguesR)
const leagueList = leagues?.data ?? []

if (leagueList.length > 0) {
  const l = leagueList[0]
  const fields = ['id','name','category','active','apiSportsId','highlightlyId','sapId','logoUrl']
  console.log('  Sample league fields:')
  for (const f of fields) {
    const val = l[f]
    const sym = val !== null && val !== undefined ? grn('✓') : yel('◦')
    console.log(`     ${sym} ${f}: ${JSON.stringify(val)?.slice(0,60)}`)
  }
}

// ── 3. Seasons ───────────────────────────────────────────────────────────────
console.log(`\n${cyn('── 3. Seasons')}`)
check('/leagues/13/seasons (Premiership)', await req(`${BASE}/leagues/13/seasons`))
check('/leagues/51/seasons (Six Nations)',  await req(`${BASE}/leagues/51/seasons`))
check('/leagues/76/seasons (URC)',          await req(`${BASE}/leagues/76/seasons`))

// ── 4. Standings ─────────────────────────────────────────────────────────────
console.log(`\n${cyn('── 4. Standings')}`)
check('/leagues/13/standings?season=2025 (Prem)',   await req(`${BASE}/leagues/13/standings?season=2025`))
check('/leagues/76/standings?season=2025 (URC)',    await req(`${BASE}/leagues/76/standings?season=2025`))
check('/leagues/51/standings?season=2026 (6N)',     await req(`${BASE}/leagues/51/standings?season=2026`))
check('/leagues/16/standings?season=2025 (Top 14)', await req(`${BASE}/leagues/16/standings?season=2025`))
check('/leagues/85/standings?season=2025 (Rugby Championship)', await req(`${BASE}/leagues/85/standings?season=2025`))

// ── 5. League games ───────────────────────────────────────────────────────────
console.log(`\n${cyn('── 5. League games')}`)
check('/leagues/13/games?season=2025 (Prem)',   await req(`${BASE}/leagues/13/games?season=2025`))
check('/leagues/51/games?season=2026 (6N)',     await req(`${BASE}/leagues/51/games?season=2026`))

// ── 6. Matches by date ────────────────────────────────────────────────────────
console.log(`\n${cyn('── 6. Matches by date')}`)
const matchesToday   = check(`/matches?date=${today} (today)`,          await req(`${BASE}/matches?date=${today}`))
const matchesSat     = check('/matches?date=2026-04-26 (busy Sat)',      await req(`${BASE}/matches?date=2026-04-26`))
const matchesMay3    = check('/matches?date=2026-05-03',                 await req(`${BASE}/matches?date=2026-05-03`))
const matchesQuiet   = check('/matches?date=2026-01-01 (quiet)',         await req(`${BASE}/matches?date=2026-01-01`))

// Breakdown of busy Saturday
const satMatches = matchesSat?.data ?? []
if (satMatches.length) {
  const byComp = {}
  for (const m of satMatches) {
    const name = m.competition?.name ?? '?'
    byComp[name] = (byComp[name] ?? 0) + 1
  }
  console.log(`  Breakdown of 2026-04-26 (${satMatches.length} matches):`)
  Object.entries(byComp).sort((a,b) => b[1]-a[1]).forEach(([c,n]) => {
    console.log(`    ${n}x ${c}`)
  })

  // Check match object shape
  const m = satMatches[0]
  const requiredFields = ['id','competition','homeTeam','awayTeam','homeScore','awayScore','status','kickoff','round','periods']
  console.log('  Match object fields:')
  for (const f of requiredFields) {
    const val = m[f]
    const sym = val !== null && val !== undefined ? grn('✓') : yel('◦')
    console.log(`     ${sym} ${f}: ${JSON.stringify(val)?.slice(0,60) ?? 'undefined'}`)
  }
}

// Pick best match for detail tests — prefer URC or Prem (more HL data)
const allTestMatches = [...(matchesMay3?.data ?? []), ...(matchesSat?.data ?? [])]
const bestMatch = allTestMatches.find(m => /United Rugby|Premiership|Six Nations|Champions|Challenge/.test(m.competition?.name ?? ''))
  ?? allTestMatches[0]
const testMatchId = bestMatch?.id

console.log(`\n  Test match for detail: ${testMatchId ?? 'none'} — ${bestMatch?.homeTeam?.name} v ${bestMatch?.awayTeam?.name} (${bestMatch?.competition?.name})`)

// ── 7. Live ───────────────────────────────────────────────────────────────────
console.log(`\n${cyn('── 7. Live')}`)
const liveR = await req(`${BASE}/matches/live`)
const live = check('/matches/live', liveR)
if (live?.data?.length === 0) {
  console.log(`     ${yel('◦')} 0 live matches (expected if no games in progress right now)`)
}

// ── 8. Match by ID ────────────────────────────────────────────────────────────
console.log(`\n${cyn('── 8. Match by ID')}`)
if (testMatchId) {
  check(`/matches/${testMatchId}`, await req(`${BASE}/matches/${testMatchId}`), [
    { path: 'data.id',                 expect: true },
    { path: 'data.status',             expect: true },
    { path: 'data.homeScore',          expect: true, warn: true },
    { path: 'data.periods.first.home', expect: true, warn: true },
    { path: 'data.round',              expect: true, warn: true },
  ])
}

// ── 9. H2H ───────────────────────────────────────────────────────────────────
console.log(`\n${cyn('── 9. H2H')}`)
if (testMatchId) {
  const h2hR = await req(`${BASE}/matches/${testMatchId}/h2h`)
  check(`/matches/${testMatchId}/h2h`, h2hR)
  const h2h = h2hR.json?.data ?? []
  if (h2h.length > 0) {
    const m = h2h[0]
    console.log(`     Sample: ${m.homeTeam?.name} v ${m.awayTeam?.name} — ${m.homeScore}-${m.awayScore} (${m.status})`)
  }
}

// ── 10. Highlights ────────────────────────────────────────────────────────────
console.log(`\n${cyn('── 10. Highlights')}`)
if (testMatchId) {
  const hlR = await req(`${BASE}/matches/${testMatchId}/highlights`)
  check(`/matches/${testMatchId}/highlights`, hlR)
  const hl = hlR.json?.data ?? []
  if (hl.length > 0) {
    console.log(`     Sample: "${hl[0].title?.slice(0,60)}" — ${hl[0].url?.slice(0,50)}`)
  } else {
    // Try the last Six Nations final if AS match has no HL cross-ref
    console.log(`     ${yel('◦')} Empty (AS match may not have HL cross-ref — expected for non-HL-primary matches)`)
  }
}

// ── 11. Incidents ─────────────────────────────────────────────────────────────
console.log(`\n${cyn('── 11. Incidents')}`)
if (testMatchId) {
  const incR = await req(`${BASE}/matches/${testMatchId}/incidents`)
  check(`/matches/${testMatchId}/incidents`, incR)
  const inc = incR.json?.data ?? []
  if (inc.length > 0) {
    console.log(`     Sample: type=${inc[0].type} min=${inc[0].minute} player=${inc[0].playerName}`)
  } else {
    console.log(`     ${yel('◦')} Empty (incidents only available via HL for hl_ prefixed matches)`)
  }
}

// ── 12. /detail ───────────────────────────────────────────────────────────────
console.log(`\n${cyn('── 12. /detail')}`)
if (testMatchId) {
  const detR = await req(`${BASE}/matches/${testMatchId}/detail`)
  check(`/matches/${testMatchId}/detail`, detR, [
    { path: 'data.match',        expect: true },
    { path: 'data.venue',        expect: true, warn: true },
    { path: 'data.referee',      expect: true, warn: true },
    { path: 'data.weather',      expect: true, warn: true },
    { path: 'data.lineups',      expect: true, warn: true },
    { path: 'data.predictions',  expect: true, warn: true },
    { path: 'data.incidents',    expect: true, warn: true },
    { path: 'data.highlights',   expect: true, warn: true },
    { path: 'data.h2h',         expect: true, warn: true },
    { path: 'data.sources',     expect: true },
  ])

  const sources = detR.json?.data?.sources ?? {}
  console.log(`     sources: ${JSON.stringify(sources)}`)
}

// ── 13. Test a second match (try to find one with richer HL data) ─────────────
console.log(`\n${cyn('── 13. Detail — second match attempt (different date)')}`)
// Try a recent URC or Prem game
for (const date of ['2026-05-02','2026-04-27','2026-04-25','2026-04-19']) {
  const r = await req(`${BASE}/matches?date=${date}`)
  const found = r.json?.data?.find(m => /United Rugby|Premiership|Champions|Challenge/.test(m.competition?.name ?? ''))
  if (found) {
    console.log(`  Found ${found.id} — ${found.homeTeam?.name} v ${found.awayTeam?.name} (${date})`)
    const detR = await req(`${BASE}/matches/${found.id}/detail`)
    const det = detR.json?.data
    check(`/matches/${found.id}/detail (${found.competition?.name})`, detR, [
      { path: 'data.venue',       expect: true, warn: true },
      { path: 'data.lineups',     expect: true, warn: true },
      { path: 'data.incidents',   expect: true, warn: true },
      { path: 'data.highlights',  expect: true, warn: true },
    ])
    if (det?.sources) {
      console.log(`     sources: ${JSON.stringify(det.sources)}`)
    }
    break
  }
}

// ── 14. Edge cases ────────────────────────────────────────────────────────────
console.log(`\n${cyn('── 14. Edge cases')}`)

// 404 on unknown match
const notFound = await req(`${BASE}/matches/as_999999999`)
if (notFound.status === 404) {
  console.log(`  ${grn('✓')} /matches/as_999999999 → 404 (correct)`)
  R.pass++
} else {
  console.log(`  ${red('✗')} /matches/as_999999999 → ${notFound.status} (expected 404)`)
  issues.push('Unknown match ID should return 404')
  R.fail++
}

// Empty date
const emptyDate = await req(`${BASE}/matches?date=2020-01-01`)
const emptyItems = emptyDate.json?.data
if (Array.isArray(emptyItems)) {
  console.log(`  ${grn('✓')} Old date returns array (${emptyItems.length} items — empty is fine)`)
  R.pass++
} else {
  console.log(`  ${red('✗')} Old date — expected array, got: ${JSON.stringify(emptyItems)?.slice(0,80)}`)
  R.fail++
}

// Missing season param on standings
const noSeason = await req(`${BASE}/leagues/13/standings`)
if (noSeason.status === 400 || (noSeason.ok && Array.isArray(noSeason.json?.data))) {
  console.log(`  ${grn('✓')} /leagues/13/standings (no season) — ${noSeason.status}`)
  R.pass++
} else {
  console.log(`  ${yel('⚠')} /leagues/13/standings (no season) — ${noSeason.status} ${JSON.stringify(noSeason.json)?.slice(0,60)}`)
  R.warn++
}

// Admin
const adminR = await req(`${BASE}/admin/leagues`)
check('/admin/leagues', adminR)

// ── 15. Benchmarks ────────────────────────────────────────────────────────────
console.log(`\n${cyn('── 15. Response time benchmarks (3 runs each, warm cache)')}`)
await bench('/health',                         `${BASE}/health`)
await bench('/leagues',                        `${BASE}/leagues`)
await bench(`/matches?date=2026-04-26`,        `${BASE}/matches?date=2026-04-26`)
await bench('/matches/live',                   `${BASE}/matches/live`)
if (testMatchId) {
  await bench(`/matches/:id`,                  `${BASE}/matches/${testMatchId}`)
  await bench(`/matches/:id/h2h`,              `${BASE}/matches/${testMatchId}/h2h`)
  await bench(`/matches/:id/detail`,           `${BASE}/matches/${testMatchId}/detail`)
}
await bench('/leagues/13/standings?season=2025', `${BASE}/leagues/13/standings?season=2025`)
await bench('/leagues/13/games?season=2025',     `${BASE}/leagues/13/games?season=2025`)

// ── Summary ──────────────────────────────────────────────────────────────────
console.log('')
console.log(b('━'.repeat(56)))
console.log(b(`  ${grn(`${R.pass} passed`)} | ${yel(`${R.warn} warnings`)} | ${red(`${R.fail} failed`)}`))
if (issues.length > 0) {
  console.log(b('\n  Issues to address:'))
  issues.forEach((i, n) => console.log(`  ${n+1}. ${i}`))
}
console.log(b('━'.repeat(56)))
console.log('')
