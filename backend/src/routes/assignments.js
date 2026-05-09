const express = require('express')
const prisma = require('../prisma')
const authMiddleware = require('../middleware/auth')

const router = express.Router()

router.get('/', authMiddleware, async (_req, res) => {
  try {
    const assignments = await prisma.assignment.findMany({
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    })
    return res.json(assignments)
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router
