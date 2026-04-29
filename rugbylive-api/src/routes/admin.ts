import { Router } from 'express'
import { getAllLeaguesFromFirestore, setLeagueActive, setLeagueCategory, invalidateActiveLeagueCache } from '../services/store'

const router = Router()

// GET /admin/leagues — all leagues including inactive (for management UI)
router.get('/leagues', async (_req, res, next) => {
  try {
    const leagues = await getAllLeaguesFromFirestore()
    if (!leagues) return res.status(503).json({ error: 'Leagues not yet seeded — hit GET /leagues first' })
    res.json({ data: leagues })
  } catch (err) {
    next(err)
  }
})

// PATCH /admin/leagues/:id — update active and/or category
router.patch('/leagues/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const body = req.body as { active?: boolean; category?: string | null }
    if (typeof body.active !== 'boolean' && !('category' in body)) {
      return res.status(400).json({ error: 'Provide active (boolean) and/or category (string|null)' })
    }
    if (typeof body.active === 'boolean') {
      await setLeagueActive(id, body.active)
      invalidateActiveLeagueCache()
    }
    if ('category' in body) {
      await setLeagueCategory(id, body.category ?? null)
    }
    res.json({ ok: true, id, ...body })
  } catch (err) {
    next(err)
  }
})

export default router
