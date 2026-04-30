import { getFirestore, getDatabase } from './firebaseAdmin'
import type { Match, League } from '../types/internal'

// ─── In-memory set to avoid redundant team writes per server session ──────────
const seenTeams = new Set<string>()

// ─── Active league ID cache ────────────────────────────────────────────────────
// Avoids a Firestore round-trip on every request/poll. TTL = 5 minutes.
// Returns null when Firestore is empty (leagues not yet seeded) — callers skip filtering.
let _activeLeagueIds: Set<string> | null = null
let _activeLeagueCachedAt = 0
const ACTIVE_LEAGUE_TTL = 5 * 60 * 1000

export function invalidateActiveLeagueCache(): void {
  _activeLeagueIds = null
  _activeLeagueCachedAt = 0
}

export async function getActiveLeagueIds(): Promise<Set<string> | null> {
  if (_activeLeagueIds !== null && Date.now() - _activeLeagueCachedAt < ACTIVE_LEAGUE_TTL) {
    return _activeLeagueIds
  }
  try {
    const db = getFirestore()
    const snap = await db.collection('leagues').get()
    if (snap.empty) return null // not seeded yet — don't filter anything
    const ids = new Set<string>()
    snap.docs.forEach(d => {
      if (d.data().active !== false) ids.add(d.id)
    })
    _activeLeagueIds = ids
    _activeLeagueCachedAt = Date.now()
    return ids
  } catch {
    return _activeLeagueIds // return stale cache on error rather than blocking all matches
  }
}

// ─── Effective logo — customLogoUrl takes precedence over API logo ────────────
function effectiveLogo(doc: Record<string, any>): string | null {
  return (doc.customLogoUrl as string | null) ?? (doc.logoUrl as string | null) ?? null
}

// ─── Leagues ──────────────────────────────────────────────────────────────────

function mapLeagueDoc(data: Record<string, any>): League & { updatedAt: string; active: boolean } {
  return {
    id: data.id,
    name: data.name,
    logoUrl: effectiveLogo(data),
    type: data.type,
    country: data.country,
    category: data.category ?? null,
    seasons: data.seasons,
    currentSeason: data.currentSeason,
    updatedAt: data.updatedAt,
    active: data.active !== false, // default true if field missing
  }
}

export async function getLeaguesFromFirestore(): Promise<League[] | null> {
  try {
    const db = getFirestore()
    const snap = await db.collection('leagues').get()
    if (snap.empty) return null

    const leagues = snap.docs.map(d => mapLeagueDoc(d.data()))

    // Stale if oldest record is > 24 hours old
    const oldest = leagues.reduce((min, l) => {
      const t = new Date(l.updatedAt ?? 0).getTime()
      return t < min ? t : min
    }, Infinity)

    if (Date.now() - oldest > 86_400_000) return null

    // Only return active leagues to the public API
    return leagues.filter(l => l.active)
  } catch {
    return null
  }
}

export async function getAllLeaguesFromFirestore(): Promise<(League & { active: boolean })[] | null> {
  try {
    const db = getFirestore()
    const snap = await db.collection('leagues').get()
    if (snap.empty) return null
    return snap.docs.map(d => mapLeagueDoc(d.data()))
  } catch {
    return null
  }
}

export async function setLeagueActive(id: string, active: boolean): Promise<void> {
  const db = getFirestore()
  await db.collection('leagues').doc(id).update({ active })
}

export async function setLeagueCategory(id: string, category: string | null): Promise<void> {
  const db = getFirestore()
  await db.collection('leagues').doc(id).update({ category: category ?? null })
}

export async function saveLeaguesToFirestore(leagues: League[]): Promise<void> {
  try {
    const db = getFirestore()
    const batch = db.batch()
    const now = new Date().toISOString()

    for (const l of leagues) {
      const ref = db.collection('leagues').doc(l.id)
      const existing = await ref.get()
      const existingData = existing.exists ? existing.data()! : {}
      batch.set(ref, {
        id: l.id,
        name: l.name,
        logoUrl: l.logoUrl,
        customLogoUrl: existingData.customLogoUrl ?? null,
        active: existingData.active !== undefined ? existingData.active : true,
        category: existingData.category ?? null,  // preserve admin-set category on refresh
        type: l.type,
        country: l.country,
        seasons: l.seasons,
        currentSeason: l.currentSeason,
        updatedAt: now,
      })
    }

    await batch.commit()
  } catch (err) {
    console.error('[store] saveLeagues failed:', err)
  }
}

// ─── Teams ────────────────────────────────────────────────────────────────────

export async function upsertTeam(team: { id: string; name: string; logoUrl: string | null }): Promise<void> {
  if (seenTeams.has(team.id)) return
  seenTeams.add(team.id)

  try {
    const db = getFirestore()
    const ref = db.collection('teams').doc(team.id)
    const existing = await ref.get()

    if (!existing.exists) {
      await ref.set({
        id: team.id,
        name: team.name,
        logoUrl: team.logoUrl,
        customLogoUrl: null,
        updatedAt: new Date().toISOString(),
      })
    } else {
      await ref.update({
        name: team.name,
        logoUrl: team.logoUrl,
        updatedAt: new Date().toISOString(),
      })
    }
  } catch (err) {
    console.error(`[store] upsertTeam ${team.id} failed:`, err)
  }
}

// ─── Matches (Firestore — historical FT games only) ───────────────────────────

export async function getMatchFromFirestore(id: string): Promise<Match | null> {
  try {
    const db = getFirestore()
    const doc = await db.collection('matches').doc(id).get()
    if (!doc.exists) return null
    const data = doc.data()!
    return {
      ...data,
      homeTeam: {
        ...data.homeTeam,
        logoUrl: effectiveLogo(data.homeTeam),
      },
      awayTeam: {
        ...data.awayTeam,
        logoUrl: effectiveLogo(data.awayTeam),
      },
    } as Match
  } catch {
    return null
  }
}

export async function saveMatchToFirestore(match: Match): Promise<void> {
  try {
    const db = getFirestore()
    const ref = db.collection('matches').doc(match.id)
    const existing = await ref.get()
    if (existing.exists) return // already recorded, don't overwrite

    await ref.set({
      ...match,
      homeTeam: {
        ...match.homeTeam,
        customLogoUrl: null,
      },
      awayTeam: {
        ...match.awayTeam,
        customLogoUrl: null,
      },
      finalisedAt: new Date().toISOString(),
    })
  } catch (err) {
    console.error(`[store] saveMatch ${match.id} failed:`, err)
  }
}

export async function getMatchesByDateFromFirestore(date: string): Promise<Match[] | null> {
  try {
    const db = getFirestore()
    const snap = await db.collection('matches')
      .where('kickoff', '>=', `${date}T00:00:00`)
      .where('kickoff', '<=', `${date}T23:59:59`)
      .get()
    if (snap.empty) return null
    return snap.docs.map(d => {
      const data = d.data()
      return {
        ...data,
        homeTeam: { ...data.homeTeam, logoUrl: effectiveLogo(data.homeTeam) },
        awayTeam: { ...data.awayTeam, logoUrl: effectiveLogo(data.awayTeam) },
      } as Match
    })
  } catch {
    return null
  }
}

// ─── Daily games cache (RTDB — today's live + upcoming) ──────────────────────

export async function getDailyGamesFromRTDB(date: string): Promise<Match[] | null> {
  try {
    const db = getDatabase()
    const snap = await db.ref(`/games/${date}`).once('value')
    if (!snap.exists()) return null
    const val = snap.val() as Record<string, Match>
    return Object.values(val)
  } catch {
    return null
  }
}

export async function saveDailyGamesToRTDB(date: string, games: Match[]): Promise<void> {
  try {
    const db = getDatabase()
    const payload: Record<string, Match> = {}
    for (const g of games) payload[g.id] = g
    await db.ref(`/games/${date}`).set(payload)
  } catch (err) {
    console.error('[store] saveDailyGames failed:', err)
  }
}

export async function getPreviousDailyGamesFromRTDB(date: string): Promise<Record<string, Match>> {
  try {
    const db = getDatabase()
    const snap = await db.ref(`/games/${date}`).once('value')
    if (!snap.exists()) return {}
    return snap.val() as Record<string, Match>
  } catch {
    return {}
  }
}
