import { Router, Request, Response, NextFunction } from 'express'
import * as sap from '../services/sportsApiPro'

const router = Router()

// ─── GET /teams/:id ───────────────────────────────────────────────────────────
// Team profile — name, nameCode, team colors, home venue, current form string.
// Team IDs come from match objects (homeTeam.id / awayTeam.id).
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await sap.getTeam(String(req.params['id']))
    res.json(result)
  } catch (err) {
    next(err)
  }
})

// ─── GET /teams/:id/near-events ───────────────────────────────────────────────
// The team's immediately previous result and next fixture — both as full Match objects.
// Useful for the "form" strip on a team page without loading full history.
router.get('/:id/near-events', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await sap.getTeamNearEvents(String(req.params['id']))
    res.json(result)
  } catch (err) {
    next(err)
  }
})

// ─── GET /teams/:id/results?page=N ───────────────────────────────────────────
// Paginated match history — 30 results per page, most recent first.
// page=0 (default) → most recent 30, page=1 → next 30, etc.
// hasNextPage=true means more pages exist.
router.get('/:id/results', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = typeof req.query.page === 'string' ? parseInt(req.query.page, 10) : 0
    const result = await sap.getTeamLastResults(String(req.params['id']), isNaN(page) ? 0 : page)
    res.json(result)
  } catch (err) {
    next(err)
  }
})

// ─── GET /teams/:id/fixtures?page=N ──────────────────────────────────────────
// Paginated upcoming fixtures — 30 per page, soonest first.
// page=0 (default) → next 30 fixtures.
router.get('/:id/fixtures', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = typeof req.query.page === 'string' ? parseInt(req.query.page, 10) : 0
    const result = await sap.getTeamNextFixtures(String(req.params['id']), isNaN(page) ? 0 : page)
    res.json(result)
  } catch (err) {
    next(err)
  }
})

export default router
