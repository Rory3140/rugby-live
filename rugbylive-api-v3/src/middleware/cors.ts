import cors from 'cors'

export default cors({
  origin: ['https://rugbylive.app', 'http://localhost:3000', 'http://localhost:3001'],
  methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
})
