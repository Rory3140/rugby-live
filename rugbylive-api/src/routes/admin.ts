import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import { getAllLeagues, updateLeague, invalidateLeagueCache } from '../config/leagues'
import { upsertTeam, invalidateTeamCache } from '../config/teams'
import { db, storage } from '../config/firebase'
import * as AS from '../providers/apiSports'
import type { ApiResponse } from '../types/internal'

const router = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } })

function ok<T>(res: any, data: T): void {
  const payload: ApiResponse<T> = {
    data,
    meta: { timestamp: new Date().toISOString(), cached: false, source: 'firestore' },
  }
  res.json(payload)
}

async function uploadToStorage(buffer: Buffer, destPath: string, contentType: string): Promise<string> {
  const bucket = storage()
  const file = bucket.file(destPath)
  await file.save(buffer, { contentType, resumable: false })
  await file.makePublic()
  // Append version timestamp so browsers always fetch the new image
  return `https://storage.googleapis.com/${bucket.name}/${destPath}?v=${Date.now()}`
}

// GET /admin/leagues — all leagues including inactive
router.get('/leagues', async (_req, res, next) => {
  try {
    const leagues = await getAllLeagues()
    ok(res, leagues)
  } catch (e) { next(e) }
})

// PATCH /admin/leagues/:id
router.patch('/leagues/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const allowed: Record<string, unknown> = {}
    const body = req.body ?? {}

    if (typeof body.active === 'boolean') allowed.active = body.active
    if (typeof body.category === 'string' || body.category === null) allowed.category = body.category
    if (typeof body.highlightlyId === 'number' || body.highlightlyId === null) allowed.highlightlyId = body.highlightlyId
    if (typeof body.sapId === 'string' || body.sapId === null) allowed.sapId = body.sapId
    if (typeof body.apiSportsId === 'number' || body.apiSportsId === null) allowed.apiSportsId = body.apiSportsId

    if (Object.keys(allowed).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' })
    }

    await updateLeague(id, allowed)
    invalidateLeagueCache()
    res.json({ success: true, id, updated: allowed })
  } catch (e) { next(e) }
})

// POST /admin/leagues/:id/logo — upload a custom logo for a league
router.post('/leagues/:id/logo', upload.single('logo'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
    const ext = path.extname(req.file.originalname).toLowerCase() || '.png'
    const destPath = `logos/leagues/${req.params.id}${ext}`
    const url = await uploadToStorage(req.file.buffer, destPath, req.file.mimetype)
    await updateLeague(req.params.id, { customLogoUrl: url })
    invalidateLeagueCache()
    res.json({ success: true, url })
  } catch (e) { next(e) }
})

// DELETE /admin/leagues/:id/logo — remove custom logo, revert to API-Sports
router.delete('/leagues/:id/logo', async (req, res, next) => {
  try {
    await updateLeague(req.params.id, { customLogoUrl: null })
    invalidateLeagueCache()
    res.json({ success: true })
  } catch (e) { next(e) }
})

// GET /admin/leagues/:id/teams — teams for a league (from standings)
router.get('/leagues/:id/teams', async (req, res, next) => {
  try {
    const leagues = await getAllLeagues()
    const league = leagues.find(l => l.id === req.params.id)
    if (!league?.apiSportsId) return ok(res, [])

    const seasons = await AS.fetchSeasons(Number(league.apiSportsId))
    const seasonYear = Number(seasons[0]?.year ?? new Date().getFullYear())
    const standings = await AS.fetchStandings(Number(league.apiSportsId), seasonYear, req.params.id)
    if (standings.length === 0) return ok(res, [])

    // Load Firestore team docs
    const snap = await db().collection('teams').get()
    const teamMap = new Map(snap.docs.map(d => {
      const data = d.data()
      return [`as_team_${data.asTeamId}`, { firestoreId: d.id, ...data }]
    }))

    const teams = standings.map(s => {
      const stored = teamMap.get(s.team.id) as any
      return {
        id: s.team.id,
        firestoreId: stored?.firestoreId ?? null,
        name: stored?.name || s.team.name,
        shortName: stored?.nameCode || s.team.shortName,
        logoUrl: stored?.customLogoUrl ?? stored?.asLogoUrl ?? s.team.logoUrl,
        customLogoUrl: stored?.customLogoUrl ?? null,
        asLogoUrl: stored?.asLogoUrl ?? s.team.logoUrl,
      }
    })

    ok(res, teams)
  } catch (e) { next(e) }
})

// PATCH /admin/teams/:id — rename a team (name / shortName)
router.patch('/teams/:id', async (req, res, next) => {
  try {
    const asTeamId = Number(req.params.id)
    if (isNaN(asTeamId)) return res.status(400).json({ error: 'Invalid team id' })
    const body = req.body ?? {}
    const allowed: Record<string, unknown> = {}
    if (typeof body.name === 'string') allowed.name = body.name.trim()
    if (typeof body.shortName === 'string') allowed.nameCode = body.shortName.trim().slice(0, 3).toUpperCase()
    if (Object.keys(allowed).length === 0) return res.status(400).json({ error: 'No valid fields' })
    await db().collection('teams').doc(String(asTeamId)).set(allowed, { merge: true })
    invalidateTeamCache()
    res.json({ success: true, updated: allowed })
  } catch (e) { next(e) }
})

// POST /admin/teams/:id/logo — upload a custom logo for a team
router.post('/teams/:id/logo', upload.single('logo'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
    const asTeamId = Number(req.params.id)
    if (isNaN(asTeamId)) return res.status(400).json({ error: 'Invalid team id' })
    const ext = path.extname(req.file.originalname).toLowerCase() || '.png'
    const destPath = `logos/teams/${asTeamId}${ext}`
    const url = await uploadToStorage(req.file.buffer, destPath, req.file.mimetype)
    await db().collection('teams').doc(String(asTeamId)).set({ customLogoUrl: url }, { merge: true })
    invalidateTeamCache()
    res.json({ success: true, url })
  } catch (e) { next(e) }
})

// DELETE /admin/teams/:id/logo — remove custom logo
router.delete('/teams/:id/logo', async (req, res, next) => {
  try {
    const asTeamId = Number(req.params.id)
    await db().collection('teams').doc(String(asTeamId)).set({ customLogoUrl: null }, { merge: true })
    invalidateTeamCache()
    res.json({ success: true })
  } catch (e) { next(e) }
})

export default router
