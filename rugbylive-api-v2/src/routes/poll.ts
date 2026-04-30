import { Router, Request, Response, NextFunction } from 'express'
import * as sap from '../services/sportsApiPro'
import { Match } from '../types/internal'

const router = Router()

// In-memory store of the last-seen state for change detection.
// In a full deployment this would live in Redis or Firestore.
// v2 is stateless — poll returns a diff summary rather than writing anywhere.
const lastSeen: Map<string, { status: string; homeScore: number | null; awayScore: number | null }> = new Map()

interface PollChange {
  matchId: string
  type: 'score_update' | 'status_change' | 'full_time'
  match: Match
}

// ─── POST /poll ───────────────────────────────────────────────────────────────
// Called by Cloud Scheduler on a cadence (every 15s during live windows).
// Uses /api/live for active matches (cleaner than polling by date + filtering).
// Falls back to /api/today when no live matches are found.
// Returns a summary of changes detected since the last poll cycle.
// No Firebase writes in v2 — purely a data-diff endpoint.
router.post('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    // Always fetch today's full schedule for complete picture
    const todayResult = await sap.getTodayMatches()
    const allMatches = todayResult.data

    // Also fetch dedicated live endpoint for real-time accuracy
    let liveMatches: Match[] = []
    try {
      const liveResult = await sap.getLiveMatches()
      liveMatches = liveResult.data
    } catch {
      // /api/live may 404 when no live matches — gracefully ignore
    }

    // Merge: live endpoint takes precedence for any match that appears in both
    const liveIds = new Set(liveMatches.map((m) => m.id))
    const merged: Match[] = [
      ...liveMatches,
      ...allMatches.filter((m) => !liveIds.has(m.id)),
    ]

    const changes: PollChange[] = []

    for (const match of merged) {
      const prev = lastSeen.get(match.id)

      if (!prev) {
        // First time seeing this match — seed state, no change to report
        lastSeen.set(match.id, {
          status: match.status,
          homeScore: match.homeScore,
          awayScore: match.awayScore,
        })
        continue
      }

      const scoreChanged =
        match.homeScore !== prev.homeScore || match.awayScore !== prev.awayScore
      const statusChanged = match.status !== prev.status
      const justFinished = match.status === 'FT' && prev.status !== 'FT'

      if (justFinished) {
        changes.push({ matchId: match.id, type: 'full_time', match })
      } else if (scoreChanged) {
        changes.push({ matchId: match.id, type: 'score_update', match })
      } else if (statusChanged) {
        changes.push({ matchId: match.id, type: 'status_change', match })
      }

      // Update seen state
      lastSeen.set(match.id, {
        status: match.status,
        homeScore: match.homeScore,
        awayScore: match.awayScore,
      })
    }

    const liveCount = merged.filter(
      (m) => m.status === '1H' || m.status === 'HT' || m.status === '2H'
    ).length

    res.json({
      data: {
        polled: merged.length,
        live: liveCount,
        changes,
      },
      meta: {
        timestamp: new Date().toISOString(),
        cached: false,
        source: 'sportsapipro',
      },
    })
  } catch (err) {
    next(err)
  }
})

export default router
