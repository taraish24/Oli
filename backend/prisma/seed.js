require('dotenv').config()
const bcrypt = require('bcryptjs')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10)

  const usersData = [
    { email: 'bruncla@oli.dev', name: 'bruncla' },
    { email: 'jarekparek@oli.dev', name: 'jarekparek' },
    { email: 'dolakskolak@oli.dev', name: 'dolakskolak' },
  ]

  const users = {}
  for (const userData of usersData) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: { name: userData.name, passwordHash },
      create: { ...userData, passwordHash },
    })
    users[user.email] = user
  }

  const assignmentsData = [
    { name: 'Regular Work', code: 'REGULAR', type: 'WORK' },
    { name: 'Overtime', code: 'OVERTIME', type: 'WORK' },
    { name: 'On-site Visit', code: 'ONSITE', type: 'WORK' },
    { name: 'Vacation', code: 'VACATION', type: 'VACATION' },
    { name: 'Day Off', code: 'DAYOFF', type: 'VACATION' },
    { name: 'Public Holiday', code: 'PUBLIC_HOL', type: 'HOLIDAY' },
    { name: 'National Holiday', code: 'NATIONAL_HOL', type: 'HOLIDAY' },
  ]

  let regularWorkAssignment = null
  for (const assignmentData of assignmentsData) {
    const assignment = await prisma.assignment.upsert({
      where: { code: assignmentData.code },
      update: assignmentData,
      create: assignmentData,
    })
    if (assignment.code === 'REGULAR') regularWorkAssignment = assignment
  }

  const workingUsers = [users['bruncla@oli.dev'], users['jarekparek@oli.dev']]
  for (const user of workingUsers) {
    const attendance = await prisma.attendance.upsert({
      where: {
        userId_year_month: {
          userId: user.id,
          year: 2026,
          month: 4,
        },
      },
      update: {},
      create: {
        userId: user.id,
        year: 2026,
        month: 4,
      },
    })

    await prisma.timeEntry.deleteMany({ where: { attendanceId: attendance.id } })

    for (let day = 1; day <= 30; day += 1) {
      const date = new Date(Date.UTC(2026, 3, day, 9, 0, 0, 0))
      const weekDay = date.getUTCDay()
      const isWeekend = weekDay === 0 || weekDay === 6
      if (isWeekend) continue

      await prisma.timeEntry.create({
        data: {
          attendanceId: attendance.id,
          assignmentId: regularWorkAssignment.id,
          date,
          workedMinutes: 480,
        },
      })
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
