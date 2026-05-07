import { db } from './firebase'
import type { League } from '../types/internal'
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore'

let cache: League[] | null = null
let cacheTime = 0
const TTL = 5 * 60 * 1000 // 5 min

function docToLeague(doc: QueryDocumentSnapshot): League {
  const d = doc.data()
  // The Firestore doc ID is the API-Sports league ID (numeric string like "51")
  // apiSportsId field may not be explicitly stored — fall back to parsing the doc ID
  const docIdAsNumber = Number(doc.id)
  const apiSportsId = d.apiSportsId ?? (isNaN(docIdAsNumber) ? null : docIdAsNumber)
  return {
    id: doc.id,
    name: d.name ?? '',
    shortName: d.shortName ?? d.name ?? '',
    logoUrl: d.customLogoUrl ?? d.logoUrl ?? null,
    country: d.country ?? null,
    category: d.category ?? null,
    active: d.active !== false, // treat undefined as active
    apiSportsId,
    highlightlyId: d.highlightlyId ?? null,
    sapId: d.sapId ?? null,
  }
}

export async function getActiveLeagues(): Promise<League[]> {
  if (cache && Date.now() - cacheTime < TTL) return cache
  // active=false is the only explicit deactivation; undefined/true → active
  // We fetch all and filter in-memory to handle docs where the field was never set
  const snap = await db().collection('leagues').get()
  const leagues: League[] = snap.docs
    .map(docToLeague)
    .filter(l => l.active)
  cache = leagues
  cacheTime = Date.now()
  return leagues
}

export async function getAllLeagues(): Promise<League[]> {
  const snap = await db().collection('leagues').get()
  return snap.docs.map(docToLeague)
}

export async function updateLeague(id: string, fields: Record<string, unknown>): Promise<void> {
  await db().collection('leagues').doc(id).update(fields)
  cache = null // invalidate
}

export function invalidateLeagueCache() {
  cache = null
}
