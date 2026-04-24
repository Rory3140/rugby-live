import 'dotenv/config'
import express from 'express'
import helmet from 'helmet'
import { corsMiddleware } from './middleware/cors'
import { rateLimiter } from './middleware/rateLimiter'
import { errorHandler } from './middleware/errorHandler'
import matchesRouter from './routes/matches'
import leaguesRouter from './routes/leagues'
import pollRouter from './routes/poll'

const app = express()
const PORT = parseInt(process.env.PORT || '4000', 10)

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(helmet())
app.use(corsMiddleware)
app.use(express.json())
app.use(rateLimiter)

// ─── Health check ────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() })
})

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/matches', matchesRouter)
app.use('/leagues', leaguesRouter)
app.use('/poll', pollRouter)

// ─── Error handler ───────────────────────────────────────────────────────────
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`rugbylive-api running on http://localhost:${PORT}`)
})

export default app
