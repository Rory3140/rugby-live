import { Router, Request, Response, NextFunction } from 'express'
import { getLeagues, getStandings, getGamesByLeague } from '../services/apiSports'

const router = Router()

function ok<T>(data: T) {
  return {
    data,
    meta: { timestamp: new Date().toISOString(), cached: false, source: 'api-sports' },
  }
}

// GET /leagues
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const leagues = await getLeagues()
    res.json(ok(leagues))
  } catch (err) {
    next(err)
  }
})

// GET /leagues/:id/standings?season=YYYY
router.get('/:id/standings', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const seasonParam = req.query['season']
    const season = parseInt(String(seasonParam || '')) || new Date().getFullYear()
    const standings = await getStandings(req.params['id'] as string, season)
    res.json(ok(standings))
  } catch (err) {
    next(err)
  }
})

// GET /leagues/:id/games?season=YYYY
router.get('/:id/games', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const seasonParam = req.query['season']
    const season = parseInt(String(seasonParam || '')) || new Date().getFullYear()
    const games = await getGamesByLeague(req.params['id'] as string, season)
    res.json(ok(games))
  } catch (err) {
    next(err)
  }
})

export default router
