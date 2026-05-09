const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
require('dotenv').config()

if (!process.env.DATABASE_URL || !String(process.env.DATABASE_URL).trim()) {
  console.error('FATAL: DATABASE_URL is missing or empty. Set it in .env or the environment.')
  process.exit(1)
}

if (!process.env.JWT_SECRET || !String(process.env.JWT_SECRET).trim()) {
  console.error('FATAL: JWT_SECRET is missing or empty. Set it in .env or the environment.')
  process.exit(1)
}

function parseCorsOrigins() {
  const raw = process.env.CORS_ORIGIN
  if (raw && String(raw).trim()) {
    return String(raw)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  }
  return ['http://localhost:5173', 'http://127.0.0.1:5173']
}

const app = express()

/** Behind a reverse proxy (Docker/nginx), trust X-Forwarded-* so rate limiting uses client IP. */
if (process.env.TRUST_PROXY === '1' || process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1)
}

app.use(helmet())
app.use(
  cors({
    origin: parseCorsOrigins(),
    credentials: true,
  }),
)
app.use(express.json())

app.use('/auth', require('./src/routes/auth'))
app.use('/assignments', require('./src/routes/assignments'))
app.use('/attendance', require('./src/routes/attendance'))
app.use('/entries', require('./src/routes/entries'))

app.listen(process.env.PORT || 3000, () => {
  console.log(`Oli backend running on port ${process.env.PORT || 3000}`)
})
