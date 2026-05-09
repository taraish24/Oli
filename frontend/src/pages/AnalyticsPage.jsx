import AppSidebar from '../components/AppSidebar'
import { useEffect, useMemo, useState } from 'react'
import api from '../services/api'

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

function formatHours(minutes) {
  return `${(minutes / 60).toFixed(1)}h`
}

function isWorkingDay(year, monthIndex, day) {
  const weekday = new Date(year, monthIndex, day).getDay()
  return weekday !== 0 && weekday !== 6
}

function AnalyticsPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [monthIndex, setMonthIndex] = useState(now.getMonth())
  const [attendance, setAttendance] = useState(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const month = monthIndex + 1
  const totalDays = new Date(year, monthIndex + 1, 0).getDate()

  function goToPrevMonth() {
    const prev = new Date(year, monthIndex - 1, 1)
    setYear(prev.getFullYear())
    setMonthIndex(prev.getMonth())
  }

  function goToNextMonth() {
    const next = new Date(year, monthIndex + 1, 1)
    setYear(next.getFullYear())
    setMonthIndex(next.getMonth())
  }

  useEffect(() => {
    let mounted = true

    async function load() {
      setIsLoading(true)
      setError('')
      try {
        const response = await api.get(`/attendance/${year}/${month}`)
        if (!mounted) return
        setAttendance(response.data ?? null)
      } catch (err) {
        if (!mounted) return
        const message =
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          'Failed to load analytics'
        setError(message)
        setAttendance(null)
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [month, monthIndex, year])

  const computed = useMemo(() => {
    const entries = attendance?.entries ?? []

    let totalMinutes = 0
    const minutesByType = { WORK: 0, VACATION: 0, HOLIDAY: 0 }
    const minutesByAssignment = new Map()
    const daysWithEntries = new Set()

    for (const entry of entries) {
      totalMinutes += entry.workedMinutes ?? 0

      const type = entry.assignment?.type ?? 'WORK'
      if (minutesByType[type] == null) minutesByType[type] = 0
      minutesByType[type] += entry.workedMinutes ?? 0

      const assignmentName = entry.assignment?.name ?? 'Assignment'
      minutesByAssignment.set(
        assignmentName,
        (minutesByAssignment.get(assignmentName) ?? 0) + (entry.workedMinutes ?? 0),
      )

      const date = new Date(entry.date)
      const day = date.getUTCDate()
      daysWithEntries.add(day)
    }

    let workingDaysTotal = 0
    for (let day = 1; day <= totalDays; day += 1) {
      if (isWorkingDay(year, monthIndex, day)) workingDaysTotal += 1
    }

    let mostUsedAssignment = null
    for (const [name, minutes] of minutesByAssignment.entries()) {
      if (!mostUsedAssignment || minutes > mostUsedAssignment.minutes) {
        mostUsedAssignment = { name, minutes }
      }
    }

    const typeItems = [
      { type: 'WORK', minutes: minutesByType.WORK ?? 0, color: 'var(--cyan)' },
      { type: 'VACATION', minutes: minutesByType.VACATION ?? 0, color: 'var(--orange)' },
      { type: 'HOLIDAY', minutes: minutesByType.HOLIDAY ?? 0, color: 'var(--green)' },
    ]

    return {
      totalMinutes,
      typeItems,
      mostUsedAssignment,
      daysWithEntriesCount: daysWithEntries.size,
      workingDaysTotal,
    }
  }, [attendance, monthIndex, totalDays, year])

  return (
    <main className="min-h-screen">
      <AppSidebar />
      <section className="ml-[190px] min-h-screen px-6 py-5">
        <header className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--text)' }}>
            Analytics
          </h2>
          <div className="flex items-center gap-3 px-3 py-2 glass">
            <button type="button" onClick={goToPrevMonth} className="text-lg" style={{ color: 'var(--text)' }}>
              {'\u2039'}
            </button>
            <span className="text-sm font-semibold" style={{ letterSpacing: '0.02em', color: 'var(--text)' }}>
              {monthNames[monthIndex]} {year}
            </span>
            <button type="button" onClick={goToNextMonth} className="text-lg" style={{ color: 'var(--text)' }}>
              {'\u203a'}
            </button>
          </div>
        </header>

        {error ? (
          <div className="mb-6 p-4 glass" style={{ borderColor: 'rgba(255, 107, 107, 0.45)' }}>
            <p className="m-0 text-sm font-semibold" style={{ color: '#ff6b6b' }}>
              {error}
            </p>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 glass">
            <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
              Total hours tracked
            </p>
            <p className="mt-2 text-4xl font-semibold tracking-tight" style={{ color: 'var(--text)' }}>
              {isLoading ? '—' : formatHours(computed.totalMinutes)}
            </p>
          </div>

          <div className="p-4 glass">
            <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
              Days with entries
            </p>
            <p className="mt-2 text-4xl font-semibold tracking-tight" style={{ color: 'var(--text)' }}>
              {isLoading ? '—' : `${computed.daysWithEntriesCount} / ${computed.workingDaysTotal}`}
            </p>
            <p className="mt-1 text-xs font-light" style={{ color: 'var(--muted)' }}>
              (vs total working days in month)
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="p-4 glass">
            <h3 className="m-0 text-base font-semibold" style={{ color: 'var(--text)' }}>
              Breakdown by type
            </h3>
            <div className="mt-4 space-y-3">
              {computed.typeItems.map((item) => {
                const pct = computed.totalMinutes ? (item.minutes / computed.totalMinutes) * 100 : 0
                return (
                  <div key={item.type}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold" style={{ color: 'var(--text)' }}>
                        {item.type}
                      </span>
                      <span style={{ color: 'var(--muted)' }}>{isLoading ? '—' : formatHours(item.minutes)}</span>
                    </div>
                    <div className="mt-2 h-2 w-full rounded-[4px]" style={{ background: 'rgba(0, 255, 136, 0.1)' }}>
                      <div
                        className="h-2 rounded-[4px]"
                        style={{ width: `${pct}%`, background: item.color }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="p-4 glass">
            <h3 className="m-0 text-base font-semibold" style={{ color: 'var(--text)' }}>
              Most used assignment
            </h3>
            <div className="mt-4">
              {isLoading ? (
                <p className="m-0 text-sm" style={{ color: 'var(--muted)' }}>
                  Loading…
                </p>
              ) : computed.mostUsedAssignment ? (
                <>
                  <p className="m-0 text-lg font-semibold" style={{ color: 'var(--text)' }}>
                    {computed.mostUsedAssignment.name}
                  </p>
                  <p className="m-0 mt-1 text-sm" style={{ color: 'var(--muted)' }}>
                    {formatHours(computed.mostUsedAssignment.minutes)}
                  </p>
                </>
              ) : (
                <p className="m-0 text-sm" style={{ color: 'var(--muted)' }}>
                  No entries yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default AnalyticsPage
