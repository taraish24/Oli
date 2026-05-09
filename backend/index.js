const express = require('express')
const cors = require('cors')
require('dotenv').config()

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
