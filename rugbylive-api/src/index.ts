import 'dotenv/config'
import express from 'express'
import { initFirebase } from './config/firebase'
import corsMiddleware from './middleware/cors'
import { errorHandler } from './middleware/errorHandler'
import matchesRouter from './routes/matches'
import leaguesRouter from './routes/leagues'
import adminRouter from './routes/admin'

initFirebase()

const app = express()
app.use(corsMiddleware)
app.use(express.json())

app.get('/health', (_req, res) => res.json({ status: 'ok', version: 'v3', ts: new Date().toISOString() }))

app.use('/matches', matchesRouter)
app.use('/leagues', leaguesRouter)
app.use('/admin', adminRouter)

app.use(errorHandler)

const PORT = Number(process.env.PORT ?? 4002)
app.listen(PORT, () => console.log(`rugbylive-api-v3 listening on port ${PORT}`))
