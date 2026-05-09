const express = require('express')
const prisma = require('../prisma')
const authMiddleware = require('../middleware/auth')

const router = express.Router()

function getYearMonthFromDate(inputDate) {
  const date = new Date(inputDate)
  if (Number.isNaN(date.getTime())) return null
  return { date, year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 }
}

async function validateEntryInput({ attendanceId, assignmentId, date, workedMinutes, excludeEntryId }) {
  const attendance = await prisma.attendance.findUnique({
    where: { id: attendanceId },
    include: { user: true },
  })
  if (!attendance) return { status: 404, error: 'Attendance not found' }

  const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } })
  if (!assignment) return { status: 404, error: 'Assignment not found' }

  if (!Number.isInteger(workedMinutes) || workedMinutes < 1 || workedMinutes > 1440) {
    return { status: 400, error: 'workedMinutes must be between 1 and 1440' }
  }

  const parsed = getYearMonthFromDate(date)
  if (!parsed) return { status: 400, error: 'Invalid date' }
  if (parsed.date > new Date()) return { status: 400, error: 'Date cannot be in the future' }
  if (parsed.year !== attendance.year || parsed.month !== attendance.month) {
    return { status: 400, error: 'Date must match attendance year/month' }
  }

  const dayStart = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.date.getUTCDate(), 0, 0, 0, 0))
  const dayEnd = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.date.getUTCDate(), 23, 59, 59, 999))

  const existingEntries = await prisma.timeEntry.findMany({
    where: {
      attendanceId,
      date: { gte: dayStart, lte: dayEnd },
      ...(excludeEntryId ? { id: { not: excludeEntryId } } : {}),
    },
  })

  const totalForDay = existingEntries.reduce((sum, entry) => sum + entry.workedMinutes, 0) + workedMinutes
  if (totalForDay > 1440) {
    return { status: 400, error: 'Total workedMinutes for date cannot exceed 1440' }
  }

  return { attendance, assignment, parsedDate: parsed.date }
}

router.use(authMiddleware)

router.post('/', async (req, res) => {
  try {
    const attendanceId = Number(req.body.attendanceId)
    const assignmentId = Number(req.body.assignmentId)
    const workedMinutes = Number(req.body.workedMinutes)
    const { date } = req.body

    const attendance = await prisma.attendance.findUnique({ where: { id: attendanceId } })
    if (!attendance || attendance.userId !== req.user.id) {
      return res.status(404).json({ error: 'Attendance not found' })
    }

    const validation = await validateEntryInput({
      attendanceId,
      assignmentId,
      date,
      workedMinutes,
    })
    if (validation.error) {
      return res.status(validation.status).json({ error: validation.error })
    }

    const entry = await prisma.timeEntry.create({
      data: {
        attendanceId,
        assignmentId,
        date: validation.parsedDate,
        workedMinutes,
      },
      include: { assignment: true },
    })

    return res.status(201).json(entry)
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    const existingEntry = await prisma.timeEntry.findUnique({
      where: { id },
      include: { attendance: true },
    })
    if (!existingEntry || existingEntry.attendance.userId !== req.user.id) {
      return res.status(404).json({ error: 'Entry not found' })
    }

    const attendanceId = Number(req.body.attendanceId ?? existingEntry.attendanceId)
    const assignmentId = Number(req.body.assignmentId ?? existingEntry.assignmentId)
    const workedMinutes = Number(req.body.workedMinutes ?? existingEntry.workedMinutes)
    const date = req.body.date ?? existingEntry.date

    if (attendanceId !== existingEntry.attendanceId) {
      const attendance = await prisma.attendance.findUnique({ where: { id: attendanceId } })
      if (!attendance || attendance.userId !== req.user.id) {
        return res.status(404).json({ error: 'Attendance not found' })
      }
    }

    const validation = await validateEntryInput({
      attendanceId,
      assignmentId,
      date,
      workedMinutes,
      excludeEntryId: id,
    })
    if (validation.error) {
      return res.status(validation.status).json({ error: validation.error })
    }

    const entry = await prisma.timeEntry.update({
      where: { id },
      data: {
        attendanceId,
        assignmentId,
        date: validation.parsedDate,
        workedMinutes,
      },
      include: { assignment: true },
    })

    return res.json(entry)
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    const existingEntry = await prisma.timeEntry.findUnique({
      where: { id },
      include: { attendance: true },
    })
    if (!existingEntry || existingEntry.attendance.userId !== req.user.id) {
      return res.status(404).json({ error: 'Entry not found' })
    }

    await prisma.timeEntry.delete({ where: { id } })
    return res.status(200).json({ message: 'Entry deleted' })
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router
