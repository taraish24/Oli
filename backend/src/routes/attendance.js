const express = require('express')
const prisma = require('../prisma')
const authMiddleware = require('../middleware/auth')

const router = express.Router()

router.get('/:year/:month', authMiddleware, async (req, res) => {
  try {
    const year = Number(req.params.year)
    const month = Number(req.params.month)

    if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
      return res.status(400).json({ error: 'Invalid year or month' })
    }

    const attendance = await prisma.attendance.upsert({
      where: {
        userId_year_month: {
          userId: req.user.id,
          year,
          month,
        },
      },
      update: {},
      create: {
        userId: req.user.id,
        year,
        month,
      },
      include: {
        entries: {
          include: { assignment: true },
          orderBy: { date: 'asc' },
        },
      },
    })

    return res.json(attendance)
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router
