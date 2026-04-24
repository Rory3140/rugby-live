import cors from 'cors'

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim())

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. curl, server-to-server)
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) return callback(null, true)
    callback(new Error(`Origin ${origin} not allowed by CORS`))
  },
  methods: ['GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
})
