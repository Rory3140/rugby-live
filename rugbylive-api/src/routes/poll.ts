import { Router, Request, Response, NextFunction } from 'express'
import { getGamesByDate } from '../services/apiSports'
import {
  getPreviousDailyGamesFromRTDB,
  saveDailyGamesToRTDB,
  saveMatchToFirestore,
  upsertTeam,
  getActiveLeagueIds,
} from '../services/store'
import type { Match } from '../types/internal'

const router = Router()

// POST /poll — called by Cloud Scheduler every 15s during live windows
router.post('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const today = new Date().toISOString().slice(0, 10)

    // Read previous RTDB state before overwriting — used to detect FT transitions
    const previous = await getPreviousDailyGamesFromRTDB(today)

    // Fetch latest from API-Sports
    const allGames = await getGamesByDate(today)

    // Filter to active leagues only — inactive leagues are hidden globally
    const activeIds = await getActiveLeagueIds()
    const games = (activeIds && activeIds.size > 0)
      ? allGames.filter((g: Match) => activeIds.has(g.competition.id))
      : allGames

    // Detect games that just flipped to FT this poll cycle
    const newlyFinished = games.filter((g: Match) => {
      const prev = previous[g.id]
      return g.status === 'FT' && (!prev || prev.status !== 'FT')
    })

    // Write active-only games to RTDB (atomic replace)
    await saveDailyGamesToRTDB(today, games)

    // Persist newly-finished games to Firestore and upsert their teams
    await Promise.all(
      newlyFinished.map(async (g: Match) => {
        await saveMatchToFirestore(g)
        await upsertTeam(g.homeTeam)
        await upsertTeam(g.awayTeam)
      })
    )

    // Also upsert teams for any game seen for the first time (no-op if already cached)
    await Promise.all(
      games.flatMap((g: Match) => [upsertTeam(g.homeTeam), upsertTeam(g.awayTeam)])
    )

    const live = games.filter((g: Match) => g.status !== 'NS' && g.status !== 'FT')

    console.log(
      `[poll] ${today}: ${games.length} games, ${live.length} live, ${newlyFinished.length} just finished`
    )

    res.json({
      ok: true,
      date: today,
      total: games.length,
      live: live.length,
      finished: newlyFinished.length,
    })
  } catch (err) {
    next(err)
  }
})

export default router
