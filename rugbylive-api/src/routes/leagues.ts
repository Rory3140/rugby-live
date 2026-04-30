import { Router, Request, Response, NextFunction } from 'express'
import { getLeagues, getStandings, getGamesByLeague } from '../services/apiSports'
import { getLeaguesFromFirestore, saveLeaguesToFirestore } from '../services/store'

const router = Router()

function ok<T>(data: T, source: 'realtime' | 'firestore' | 'api-sports') {
  return {
    data,
    meta: { timestamp: new Date().toISOString(), cached: source !== 'api-sports', source },
  }
}

// GET /leagues
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    // Try Firestore cache first (fresh if < 24h old)
    const cached = await getLeaguesFromFirestore()
    if (cached) {
      return res.json(ok(cached, 'firestore'))
    }

    // Fetch from API-Sports and persist to Firestore
    const leagues = await getLeagues()
    await saveLeaguesToFirestore(leagues).catch(() => {})
    res.json(ok(leagues, 'api-sports'))
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
    res.json(ok(standings, 'api-sports'))
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
    res.json(ok(games, 'api-sports'))
  } catch (err) {
    next(err)
  }
})

export default router
