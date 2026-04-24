import { Router, Request, Response, NextFunction } from 'express'
import { getGamesByDate } from '../services/apiSports'

const router = Router()

// POST /poll — called by Cloud Scheduler every 15s during live windows
// Fetches today's games, writes live ones to cache (Firebase RTDB — wired in Phase 2)
router.post('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const today = new Date().toISOString().slice(0, 10)
    const games = await getGamesByDate(today)

    const live = games.filter(
      (g) => g.status !== 'NS' && g.status !== 'FT'
    )

    // TODO Phase 2: write to Firebase Realtime Database at /games/{date}/{gameId}
    // TODO Phase 2: compare previous state to detect FT flip → trigger FCM notification

    console.log(`[poll] ${today}: ${games.length} games total, ${live.length} live`)
    res.json({ ok: true, date: today, total: games.length, live: live.length })
  } catch (err) {
    next(err)
  }
})

export default router
