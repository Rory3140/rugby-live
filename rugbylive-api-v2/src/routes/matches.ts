import { Router, Request, Response, NextFunction } from 'express'
import * as sap from '../services/sportsApiPro'

const router = Router()

// ─── GET /matches?date=YYYY-MM-DD ─────────────────────────────────────────────
// Returns all matches for a given date. Defaults to today.
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const date = typeof req.query.date === 'string'
      ? req.query.date
      : new Date().toISOString().slice(0, 10)

    const result = await sap.getMatchesByDate(date)
    res.json(result)
  } catch (err) {
    next(err)
  }
})

// ─── GET /matches/live ────────────────────────────────────────────────────────
// Returns currently live matches via the dedicated /api/live endpoint.
// Much cleaner than polling by date and filtering — unique to SportsAPI Pro.
router.get('/live', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await sap.getLiveMatches()
    res.json(result)
  } catch (err) {
    next(err)
  }
})

// ─── GET /matches/today ───────────────────────────────────────────────────────
// Convenience alias for today's full schedule.
router.get('/today', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await sap.getTodayMatches()
    res.json(result)
  } catch (err) {
    next(err)
  }
})

// ─── GET /matches/:id ────────────────────────────────────────────────────────
// Returns a single match by its SportsAPI Pro event ID.
// Uses /api/match/:id directly (confirmed working as of 2026-04-30).
// Returns full match data including venue name and referee name.
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await sap.getMatch(String(req.params['id']))
    res.json(result)
  } catch (err) {
    next(err)
  }
})

// ─── GET /matches/:id/incidents ───────────────────────────────────────────────
// Try timeline — all scoring events, cards, substitutions, and period markers.
// Returns a chronological list with running score at each incident.
router.get('/:id/incidents', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await sap.getIncidents(String(req.params['id']))
    res.json(result)
  } catch (err) {
    next(err)
  }
})

// ─── GET /matches/:id/statistics ─────────────────────────────────────────────
// Match statistics — possession, territory, carries, tackles, lineouts, scrums
// metres run, clean breaks, offloads, penalties, tries, yellow/red cards.
// Returns stats for ALL, 1ST half, and 2ND half periods.
router.get('/:id/statistics', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await sap.getStatistics(String(req.params['id']))
    res.json(result)
  } catch (err) {
    next(err)
  }
})

// ─── GET /matches/:id/lineups ─────────────────────────────────────────────────
// Starting XV and bench for both teams.
// substitute=false → starter, substitute=true → bench.
// Includes jersey number, position, height, country.
router.get('/:id/lineups', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await sap.getLineups(String(req.params['id']))
    res.json(result)
  } catch (err) {
    next(err)
  }
})

// ─── GET /matches/:id/player-statistics ──────────────────────────────────────
// Per-player match statistics for both teams combined.
// Stats include: points, tries, conversions, penalties, carries, metres run,
// clean breaks, offloads, passes, tackles, tackles missed, try assists.
// Only available after a match has started — 404 before kickoff.
router.get('/:id/player-statistics', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await sap.getPlayerStatistics(String(req.params['id']))
    res.json(result)
  } catch (err) {
    next(err)
  }
})

// ─── GET /matches/:id/highlights ─────────────────────────────────────────────
// Video highlights for a match. Returns YouTube URLs + thumbnails.
// Only available for matches where hasGlobalHighlights=true.
router.get('/:id/highlights', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await sap.getHighlights(String(req.params['id']))
    res.json(result)
  } catch (err) {
    next(err)
  }
})

// ─── GET /matches/:id/managers ────────────────────────────────────────────────
// Head coaches for both teams in a match.
// Returns { home: { id, name, shortName }, away: { ... } } — either may be null.
router.get('/:id/managers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await sap.getManagers(String(req.params['id']))
    res.json(result)
  } catch (err) {
    next(err)
  }
})

// ─── GET /matches/:id/h2h ─────────────────────────────────────────────────────
// Head-to-head record between the two teams — wins, draws, losses summary.
// Returns { homeWins, awayWins, draws } — all-time record, not season-filtered.
router.get('/:id/h2h', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await sap.getH2HSummary(String(req.params['id']))
    res.json(result)
  } catch (err) {
    next(err)
  }
})

// ─── GET /matches/:id/votes ───────────────────────────────────────────────────
// Fan prediction votes — who do supporters think will win?
// Returns { homeVotes, awayVotes, drawVotes } as raw counts.
router.get('/:id/votes', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await sap.getVotes(String(req.params['id']))
    res.json(result)
  } catch (err) {
    next(err)
  }
})

export default router
