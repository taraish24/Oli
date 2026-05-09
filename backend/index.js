const express = require('express')
const cors = require('cors')
require('dotenv').config()

if (!process.env.DATABASE_URL || !String(process.env.DATABASE_URL).trim()) {
  console.error('FATAL: DATABASE_URL is missing or empty. Set it in .env or the environment.')
  process.exit(1)
}

if (!process.env.JWT_SECRET || !String(process.env.JWT_SECRET).trim()) {
  console.error('FATAL: JWT_SECRET is missing or empty. Set it in .env or the environment.')
  process.exit(1)
}

const app = express()
app.use(cors())
app.use(express.json())

app.use('/auth', require('./src/routes/auth'))
app.use('/assignments', require('./src/routes/assignments'))
app.use('/attendance', require('./src/routes/attendance'))
app.use('/entries', require('./src/routes/entries'))

app.listen(process.env.PORT || 3000, () => {
  console.log(`Oli backend running on port ${process.env.PORT || 3000}`)
})
