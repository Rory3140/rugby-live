import { Router, Request, Response, NextFunction } from 'express'
import * as sap from '../services/sportsApiPro'
import { getActiveLeagues, getActiveIds } from '../config/leagueStore'

const router = Router()

// ─── GET /leagues ─────────────────────────────────────────────────────────────
// Returns all active rugby tournaments from the curated allowlist.
// Shape matches what the frontend League type expects.
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const active = getActiveLeagues()
    const data = active.map(l => ({
      id: l.id,
      name: l.name,
      shortName: l.name.slice(0, 3).toUpperCase(),
      logoUrl: null,
      country: l.country,
      category: l.category,
      active: true,
    }))
    res.json({
      data,
      meta: { timestamp: new Date().toISOString(), cached: false, source: 'sportsapipro' },
    })
  } catch (err) {
    next(err)
  }
})

// ─── GET /leagues/:id ────────────────────────────────────────────────────────
// Full tournament info — title holder, competition color, hasRounds/hasGroups flags.
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
// Season IDs (strings like "82834") are required for standings, rounds, events.
router.get('/:id/seasons', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await sap.getSeasons(String(req.params['id']))
    res.json(result)
  } catch (err) {
    next(err)
  }
})

// ─── GET /leagues/:id/standings?season=:sid ───────────────────────────────────
// Returns standings table(s) for a tournament season.
// season param is a SAP season ID string (e.g. "82834"), NOT a year.
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
// Returns matches for a tournament season.
// season param is SAP season ID string. round param is optional round number.
router.get('/:id/games', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const seasonId = typeof req.query.season === 'string' ? req.query.season : null
    const round = typeof req.query.round === 'string' ? req.query.round : null

    if (!seasonId) {
      res.status(400).json({ error: 'season query parameter is required' })
      return
    }

    const tid = String(req.params['id'])
    const activeIds = getActiveIds()

    const result = round
      ? await sap.getRoundEvents(tid, seasonId, round)
      : await sap.getSeasonEvents(tid, seasonId)

    // Filter out matches from inactive tournaments
    const filtered = {
      ...result,
      data: result.data.filter(m => activeIds.has(m.competition.id)),
    }

    res.json(filtered)
  } catch (err) {
    next(err)
  }
})

export default router
