import { Router, Request, Response, NextFunction } from 'express'
import { getGamesByDate, getGameById, getH2H } from '../services/apiSports'
import { Match } from '../types/internal'

const router = Router()

function ok<T>(data: T) {
  return {
    data,
    meta: { timestamp: new Date().toISOString(), cached: false, source: 'api-sports' },
  }
}

// GET /matches?date=YYYY-MM-DD
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dateParam = req.query['date']
    const date = String(dateParam || new Date().toISOString().slice(0, 10))
    const matches = await getGamesByDate(date)
    res.json(ok(matches))
  } catch (err) {
    next(err)
  }
})

// GET /matches/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const match = await getGameById(req.params['id'] as string)
    if (!match) return res.status(404).json({ error: 'Match not found' })
    res.json(ok(match))
  } catch (err) {
    next(err)
  }
})

// GET /matches/:id/h2h
router.get('/:id/h2h', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params['id'] as string
    const match = await getGameById(id)
    if (!match) return res.status(404).json({ error: 'Match not found' })
    const h2h = await getH2H(match.homeTeam.id, match.awayTeam.id)
    const history = h2h
      .filter((m: Match) => m.id !== id)
      .sort((a: Match, b: Match) => new Date(b.kickoff).getTime() - new Date(a.kickoff).getTime())
      .slice(0, 10)
    res.json(ok(history))
  } catch (err) {
    next(err)
  }
})

export default router
