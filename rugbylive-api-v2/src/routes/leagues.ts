import { Router, Request, Response, NextFunction } from 'express'
import * as sap from '../services/sportsApiPro'

const router = Router()

// ─── GET /leagues ─────────────────────────────────────────────────────────────
// Returns all rugby tournaments from both the rugby union (82) and rugby
// league (83) categories. Includes color hex values for logo fallbacks
// and hasRounds / hasGroups flags for rendering hints.
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await sap.getTournaments()
    res.json(result)
  } catch (err) {
    next(err)
  }
})

// ─── GET /leagues/:id ────────────────────────────────────────────────────────
// Full tournament info — title holder, competition color, hasRounds/hasGroups flags.
// Also includes startDateTimestamp and endDateTimestamp if available.
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await sap.getTournamentInfo(String(req.params['id']))
    res.json(result)
  } catch (err) {
    next(err)
  }
})

// ─── GET /leagues/:id/seasons ─────────────────────────────────────────────────
// Returns available seasons for a tournament, most recent first.
// Season IDs are required for standings, rounds, and events endpoints.
// Example: tournament 419 (URC) returns season 79019 (25/26) and 64655 (24/25).
router.get('/:id/seasons', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await sap.getSeasons(String(req.params['id']))
    res.json(result)
  } catch (err) {
    next(err)
  }
})

// ─── GET /leagues/:id/standings?season=:sid ───────────────────────────────────
// Returns standings table for a tournament season. May return multiple tables
// (e.g. Conference A, Conference B) — each has a type label and row array.
// Row fields: position, team, played, won, drawn, lost, pointsFor, pointsAgainst,
// pointsDiff, points, scoreDiffFormatted, promotion text, descriptions.
router.get('/:id/standings', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const seasonId = typeof req.query.season === 'string' ? req.query.season : null
    if (!seasonId) {
      res.status(400).json({ error: 'season query parameter is required' })
      return
    }
    const result = await sap.getStandings(String(req.params['id']), seasonId)
    res.json(result)
  } catch (err) {
    next(err)
  }
})

// ─── GET /leagues/:id/rounds?season=:sid ─────────────────────────────────────
// Returns all round numbers for a tournament season plus the current round.
// Used to build a round navigator (e.g. Round 1 → Round 18).
router.get('/:id/rounds', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const seasonId = typeof req.query.season === 'string' ? req.query.season : null
    if (!seasonId) {
      res.status(400).json({ error: 'season query parameter is required' })
      return
    }
    const result = await sap.getRounds(String(req.params['id']), seasonId)
    res.json(result)
  } catch (err) {
    next(err)
  }
})

// ─── GET /leagues/:id/games?season=:sid&round=:r ──────────────────────────────
// Returns matches for a tournament season — either a specific round or the
// most recent batch of events when no round is given.
// Used for the Fixtures / Results tabs on the league detail page.
router.get('/:id/games', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const seasonId = typeof req.query.season === 'string' ? req.query.season : null
    const round = typeof req.query.round === 'string' ? req.query.round : null

    if (!seasonId) {
      res.status(400).json({ error: 'season query parameter is required' })
      return
    }

    const tid = String(req.params['id'])
    const result = round
      ? await sap.getRoundEvents(tid, seasonId, round)
      : await sap.getSeasonEvents(tid, seasonId)

    res.json(result)
  } catch (err) {
    next(err)
  }
})

export default router
