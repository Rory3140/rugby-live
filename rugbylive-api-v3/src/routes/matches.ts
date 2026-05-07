import { Router } from 'express'
import * as svc from '../services/matchesService'
import { getMatchDetail } from '../services/matchDetailService'
import type { ApiResponse } from '../types/internal'

const router = Router()

function ok<T>(res: any, data: T, source = 'api'): void {
  const payload: ApiResponse<T> = {
    data,
    meta: { timestamp: new Date().toISOString(), cached: false, source },
  }
  res.json(payload)
}

// GET /matches?date=YYYY-MM-DD
router.get('/', async (req, res, next) => {
  try {
    const date = (req.query.date as string) ?? new Date().toISOString().slice(0, 10)
    const matches = await svc.getMatchesByDate(date)
    ok(res, matches, 'multi')
  } catch (e) { next(e) }
})

// GET /matches/live
router.get('/live', async (_req, res, next) => {
  try {
    const matches = await svc.getLiveMatches()
    ok(res, matches, 'multi')
  } catch (e) { next(e) }
})

// GET /matches/:id/detail — all available data in one shot (score, venue, lineups, incidents, highlights, h2h, predictions)
router.get('/:id/detail', async (req, res, next) => {
  try {
    const detail = await getMatchDetail(req.params.id)
    if (!detail) return res.status(404).json({ error: 'Match not found' })
    ok(res, detail, 'multi')
  } catch (e) { next(e) }
})

// GET /matches/:id
router.get('/:id', async (req, res, next) => {
  try {
    const match = await svc.getMatchById(req.params.id)
    if (!match) return res.status(404).json({ error: 'Match not found' })
    ok(res, match)
  } catch (e) { next(e) }
})

// GET /matches/:id/highlights
router.get('/:id/highlights', async (req, res, next) => {
  try {
    const highlights = await svc.getHighlights(req.params.id)
    ok(res, highlights, 'highlightly')
  } catch (e) { next(e) }
})

// GET /matches/:id/h2h
router.get('/:id/h2h', async (req, res, next) => {
  try {
    const h2h = await svc.getH2H(req.params.id)
    ok(res, h2h)
  } catch (e) { next(e) }
})

// GET /matches/:id/incidents
router.get('/:id/incidents', async (req, res, next) => {
  try {
    const incidents = await svc.getIncidents(req.params.id)
    ok(res, incidents, 'highlightly')
  } catch (e) { next(e) }
})

export default router
