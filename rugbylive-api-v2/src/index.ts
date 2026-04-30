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
const PORT = process.env.PORT ?? 4001

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(helmet())
app.use(corsMiddleware)
app.use(express.json())
app.use(rateLimiter)

// ─── Routes ───────────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', version: 'v2', timestamp: new Date().toISOString() })
})

app.use('/matches', matchesRouter)
app.use('/leagues', leaguesRouter)
app.use('/poll', pollRouter)

// ─── Error handler (must be last) ─────────────────────────────────────────────

app.use(errorHandler)

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`[rugbylive-api-v2] listening on port ${PORT}`)
  if (!process.env.SPORTS_API_PRO_KEY) {
    console.warn('[warn] SPORTS_API_PRO_KEY is not set — all API requests will fail')
  }
})

export default app
