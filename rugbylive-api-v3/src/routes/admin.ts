import { Router } from 'express'
import { getAllLeagues, updateLeague, invalidateLeagueCache } from '../config/leagues'
import type { ApiResponse } from '../types/internal'

const router = Router()

function ok<T>(res: any, data: T): void {
  const payload: ApiResponse<T> = {
    data,
    meta: { timestamp: new Date().toISOString(), cached: false, source: 'firestore' },
  }
  res.json(payload)
}

// GET /admin/leagues — all leagues including inactive
router.get('/leagues', async (_req, res, next) => {
  try {
    const leagues = await getAllLeagues()
    ok(res, leagues)
  } catch (e) { next(e) }
})

// PATCH /admin/leagues/:id
router.patch('/leagues/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const allowed: Record<string, unknown> = {}
    const body = req.body ?? {}

    if (typeof body.active === 'boolean') allowed.active = body.active
    if (typeof body.category === 'string' || body.category === null) allowed.category = body.category
    if (typeof body.highlightlyId === 'number' || body.highlightlyId === null) allowed.highlightlyId = body.highlightlyId
    if (typeof body.sapId === 'string' || body.sapId === null) allowed.sapId = body.sapId
    if (typeof body.apiSportsId === 'number' || body.apiSportsId === null) allowed.apiSportsId = body.apiSportsId

    if (Object.keys(allowed).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' })
    }

    await updateLeague(id, allowed)
    invalidateLeagueCache()
    res.json({ success: true, id, updated: allowed })
  } catch (e) { next(e) }
})

export default router
