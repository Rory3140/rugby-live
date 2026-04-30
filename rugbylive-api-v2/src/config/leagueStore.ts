// In-memory store for runtime league active/category overrides.
// Initialised from ALLOWED_LEAGUES on startup.
// Changes via PATCH /admin/leagues/:id persist for the lifetime of the process only.
// Replace with Firestore writes if you need persistence across restarts.

import { ALLOWED_LEAGUES, LeagueConfig } from './allowedLeagues'

export interface LeagueRecord extends LeagueConfig {
  active: boolean
}

// Initialise from static config — all active by default
const store = new Map<string, LeagueRecord>(
  ALLOWED_LEAGUES.map(l => [l.id, { ...l, active: true }])
)

export function getAllLeagues(): LeagueRecord[] {
  return Array.from(store.values())
}

export function getActiveLeagues(): LeagueRecord[] {
  return Array.from(store.values()).filter(l => l.active)
}

export function getActiveIds(): Set<string> {
  return new Set(getActiveLeagues().map(l => l.id))
}

export function updateLeague(id: string, patch: Partial<Pick<LeagueRecord, 'active' | 'category'>>): LeagueRecord | null {
  const existing = store.get(id)
  if (!existing) return null
  const updated = { ...existing, ...patch }
  store.set(id, updated)
  return updated
}
