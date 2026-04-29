import { Router, Request, Response, NextFunction } from 'express'
import { getGamesByDate, getGameById, getH2H } from '../services/apiSports'
import {
  getDailyGamesFromRTDB,
  saveDailyGamesToRTDB,
  getMatchFromFirestore,
  getMatchesByDateFromFirestore,
  getActiveLeagueIds,
} from '../services/store'
import type { Match } from '../types/internal'

const router = Router()

function ok<T>(data: T, source: 'realtime' | 'firestore' | 'api-sports') {
  return {
    data,
    meta: { timestamp: new Date().toISOString(), cached: source !== 'api-sports', source },
  }
}

function filterActive(matches: Match[], activeIds: Set<string> | null): Match[] {
  if (!activeIds || activeIds.size === 0) return matches // not seeded yet — show everything
  return matches.filter(m => activeIds.has(m.competition.id))
}

// GET /matches?date=YYYY-MM-DD
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const date = String(req.query['date'] || new Date().toISOString().slice(0, 10))
    const today = new Date().toISOString().slice(0, 10)
    const activeIds = await getActiveLeagueIds()

    // Today → try RTDB first (kept fresh by poll job)
    if (date === today) {
      const cached = await getDailyGamesFromRTDB(date)
      if (cached && cached.length > 0) {
        return res.json(ok(filterActive(cached, activeIds), 'realtime'))
      }
    }

    // Past dates → try Firestore historical store
    if (date < today) {
      const historical = await getMatchesByDateFromFirestore(date)
      if (historical && historical.length > 0) {
        return res.json(ok(filterActive(historical, activeIds), 'firestore'))
      }
    }

    // Fall back to API-Sports, and prime RTDB cache for today
    const matches = await getGamesByDate(date)
    if (date === today) {
      await saveDailyGamesToRTDB(date, filterActive(matches, activeIds)).catch(() => {})
    }
    res.json(ok(filterActive(matches, activeIds), 'api-sports'))
  } catch (err) {
    next(err)
  }
})

// GET /matches/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params['id'] as string

    // Try Firestore first — finished games are stored there permanently
    const stored = await getMatchFromFirestore(id)
    if (stored) {
      return res.json(ok(stored, 'firestore'))
    }

    // Fall back to live API
    const match = await getGameById(id)
    if (!match) return res.status(404).json({ error: 'Match not found' })
    res.json(ok(match, 'api-sports'))
  } catch (err) {
    next(err)
  }
})

// GET /matches/:id/h2h
router.get('/:id/h2h', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params['id'] as string

    // Get the match (Firestore or API)
    const stored = await getMatchFromFirestore(id)
    const match = stored ?? await getGameById(id)
    if (!match) return res.status(404).json({ error: 'Match not found' })

    const h2h = await getH2H(match.homeTeam.id, match.awayTeam.id)
    const history = h2h
      .filter((m: Match) => m.id !== id)
      .sort((a: Match, b: Match) => new Date(b.kickoff).getTime() - new Date(a.kickoff).getTime())
      .slice(0, 10)

    res.json(ok(history, 'api-sports'))
  } catch (err) {
    next(err)
  }
})

export default router
