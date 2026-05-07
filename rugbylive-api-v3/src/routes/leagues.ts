import { Router } from 'express'
import { getActiveLeagues } from '../config/leagues'
import { getStandings, getLeagueMatches } from '../services/matchesService'
import * as AS from '../providers/apiSports'
import type { ApiResponse } from '../types/internal'

const router = Router()

function ok<T>(res: any, data: T, source = 'firestore'): void {
  const payload: ApiResponse<T> = {
    data,
    meta: { timestamp: new Date().toISOString(), cached: false, source },
  }
  res.json(payload)
}

// GET /leagues
router.get('/', async (_req, res, next) => {
  try {
    const leagues = await getActiveLeagues()
    ok(res, leagues)
  } catch (e) { next(e) }
})

// GET /leagues/:id/seasons
// Returns a list of available seasons (years) for the league.
// API-Sports seasons are global (not per-league), so we return all years
// and let the client pick the current one.
router.get('/:id/seasons', async (req, res, next) => {
  try {
    const seasons = await AS.fetchSeasons(0) // 0 = no league filter = global list
    ok(res, seasons, 'api-sports')
  } catch (e) { next(e) }
})

// GET /leagues/:id/standings?season=YYYY
router.get('/:id/standings', async (req, res, next) => {
  try {
    const season = req.query.season as string | undefined
    if (!season) return res.status(400).json({ error: 'season query param is required (e.g. ?season=2025)' })
    const standings = await getStandings(req.params.id, season)
    ok(res, standings, 'multi')
  } catch (e) { next(e) }
})

// GET /leagues/:id/games?season=YYYY
router.get('/:id/games', async (req, res, next) => {
  try {
    const season = req.query.season as string | undefined
    const matches = await getLeagueMatches(req.params.id, season)
    ok(res, matches, 'multi')
  } catch (e) { next(e) }
})

export default router
