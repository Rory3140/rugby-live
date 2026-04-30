import { Router, Request, Response } from 'express'
import { getAllLeagues, updateLeague } from '../config/leagueStore'

const router = Router()

// ─── GET /admin/leagues ───────────────────────────────────────────────────────
// Returns all leagues including inactive ones — used by the manage page.
router.get('/leagues', (_req: Request, res: Response) => {
  const leagues = getAllLeagues().map(l => ({
    id: l.id,
    name: l.name,
    shortName: l.name.slice(0, 3).toUpperCase(),
    logoUrl: null,
    country: l.country,
    category: l.category,
    active: l.active,
  }))
  res.json({
    data: leagues,
    meta: { timestamp: new Date().toISOString(), cached: false, source: 'config' },
  })
})

// ─── PATCH /admin/leagues/:id ─────────────────────────────────────────────────
// Toggle active state or override category for a league.
// Note: changes persist in-memory only — they reset on process restart.
router.patch('/leagues/:id', (req: Request, res: Response) => {
  const id = String(req.params['id'])
  const { active, category } = req.body as { active?: boolean; category?: string | null }

  const patch: { active?: boolean; category?: any } = {}
  if (typeof active === 'boolean') patch.active = active
  if (category !== undefined) patch.category = category

  const updated = updateLeague(id, patch)
  if (!updated) {
    res.status(404).json({ error: `League ${id} not found in config` })
    return
  }

  res.json({
    data: { id: updated.id, name: updated.name, active: updated.active, category: updated.category },
    meta: { timestamp: new Date().toISOString(), cached: false, source: 'config' },
  })
})

export default router
