import { db } from './firebase'

export interface TeamMapping {
  asTeamId: number
  hlTeamId: number | null
  sapTeamId: string | null
  name: string
  nameCode: string | null       // 3-letter abbreviation e.g. "IRE"
  country: string | null
  customLogoUrl: string | null  // primary — manually set
  asLogoUrl: string | null      // secondary — API-Sports CDN
}

let cache: Map<number, TeamMapping> | null = null
let cacheTime = 0
const TTL = 10 * 60 * 1000

async function loadCache(): Promise<Map<number, TeamMapping>> {
  if (cache && Date.now() - cacheTime < TTL) return cache
  const snap = await db().collection('teams').get()
  const map = new Map<number, TeamMapping>()
  for (const doc of snap.docs) {
    const d = doc.data() as TeamMapping
    if (d.asTeamId) map.set(d.asTeamId, d)
  }
  cache = map
  cacheTime = Date.now()
  return map
}

export async function getHlTeamId(asTeamId: number): Promise<number | null> {
  const map = await loadCache()
  return map.get(asTeamId)?.hlTeamId ?? null
}

export async function getSapTeamId(asTeamId: number): Promise<string | null> {
  const map = await loadCache()
  return map.get(asTeamId)?.sapTeamId ?? null
}

export async function upsertTeam(t: TeamMapping): Promise<void> {
  await db().collection('teams').doc(String(t.asTeamId)).set(t, { merge: true })
  cache = null
}

// Backfill hlTeamId for a team already in the collection (called after a successful name-based match)
export async function backfillHlTeamId(asTeamId: number, hlTeamId: number): Promise<void> {
  try {
    await db().collection('teams').doc(String(asTeamId)).update({ hlTeamId })
    cache = null
  } catch {
    // Doc may not exist yet — upsert instead
    await db().collection('teams').doc(String(asTeamId)).set(
      { asTeamId, hlTeamId, sapTeamId: null, name: '', nameCode: null, country: null, customLogoUrl: null, asLogoUrl: null },
      { merge: true }
    )
    cache = null
  }
}

export function invalidateTeamCache() {
  cache = null
}
