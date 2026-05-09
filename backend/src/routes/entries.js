const express = require('express')
const prisma = require('../prisma')
const authMiddleware = require('../middleware/auth')

const router = express.Router()

function toInt(value) {
  if (typeof value === 'number') return Number.isInteger(value) ? value : null
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value)
    return Number.isInteger(n) ? n : null
  }
  return null
}

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
    const attendanceId = toInt(req.body?.attendanceId)
    const assignmentId = toInt(req.body?.assignmentId)
    const workedMinutes = toInt(req.body?.workedMinutes)
    const date = req.body?.date

    if (!attendanceId || attendanceId < 1) {
      return res.status(400).json({ error: 'attendanceId is required' })
    }
    if (!assignmentId || assignmentId < 1) {
      return res.status(400).json({ error: 'assignmentId is required' })
    }
    if (workedMinutes == null) {
      return res.status(400).json({ error: 'workedMinutes is required' })
    }
    if (!date) {
      return res.status(400).json({ error: 'date is required' })
    }

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
    const id = toInt(req.params.id)
    if (!id || id < 1) {
      return res.status(400).json({ error: 'Invalid entry id' })
    }

    const existingEntry = await prisma.timeEntry.findUnique({
      where: { id },
      include: { attendance: true },
    })
    if (!existingEntry || existingEntry.attendance.userId !== req.user.id) {
      return res.status(404).json({ error: 'Entry not found' })
    }

    const attendanceIdRaw = req.body?.attendanceId
    const assignmentIdRaw = req.body?.assignmentId
    const workedMinutesRaw = req.body?.workedMinutes
    const dateRaw = req.body?.date

    const attendanceId = attendanceIdRaw == null ? existingEntry.attendanceId : toInt(attendanceIdRaw)
    const assignmentId = assignmentIdRaw == null ? existingEntry.assignmentId : toInt(assignmentIdRaw)
    const workedMinutes = workedMinutesRaw == null ? existingEntry.workedMinutes : toInt(workedMinutesRaw)
    const date = dateRaw == null ? existingEntry.date : dateRaw

    if (!attendanceId || attendanceId < 1) {
      return res.status(400).json({ error: 'attendanceId must be a positive integer' })
    }
    if (!assignmentId || assignmentId < 1) {
      return res.status(400).json({ error: 'assignmentId must be a positive integer' })
    }
    if (workedMinutes == null) {
      return res.status(400).json({ error: 'workedMinutes must be an integer' })
    }

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
    const id = toInt(req.params.id)
    if (!id || id < 1) {
      return res.status(400).json({ error: 'Invalid entry id' })
    }

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
