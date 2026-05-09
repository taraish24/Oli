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
      <section className="ml-[220px] min-h-screen p-6">
        <header className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Analytics</h2>
          <div
            className="flex items-center gap-3 rounded-lg border px-4 py-2"
            style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
          >
            <button type="button" onClick={goToPrevMonth} className="text-lg" style={{ color: 'var(--text)' }}>
              {'\u2039'}
            </button>
            <span className="text-lg">
              {monthNames[monthIndex]} {year}
            </span>
            <button type="button" onClick={goToNextMonth} className="text-lg" style={{ color: 'var(--text)' }}>
              {'\u203a'}
            </button>
          </div>
        </header>

        {error ? (
          <div className="mb-6 rounded-xl border p-4" style={{ borderColor: 'rgba(255, 107, 107, 0.55)' }}>
            <p className="m-0 text-sm font-semibold" style={{ color: '#ff6b6b' }}>
              {error}
            </p>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border p-4" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
              Total hours tracked
            </p>
            <p className="mt-2 text-3xl font-bold">
              {isLoading ? '—' : formatHours(computed.totalMinutes)}
            </p>
          </div>

          <div className="rounded-xl border p-4" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
              Days with entries
            </p>
            <p className="mt-2 text-3xl font-bold">
              {isLoading ? '—' : `${computed.daysWithEntriesCount} / ${computed.workingDaysTotal}`}
            </p>
            <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
              (vs total working days in month)
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="rounded-xl border p-4" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <h3 className="m-0 text-base font-semibold">Breakdown by type</h3>
            <div className="mt-4 space-y-3">
              {computed.typeItems.map((item) => {
                const pct = computed.totalMinutes ? (item.minutes / computed.totalMinutes) * 100 : 0
                return (
                  <div key={item.type}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold">{item.type}</span>
                      <span style={{ color: 'var(--muted)' }}>{isLoading ? '—' : formatHours(item.minutes)}</span>
                    </div>
                    <div className="mt-2 h-2 w-full rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <div
                        className="h-2 rounded-full"
                        style={{ width: `${pct}%`, background: item.color }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="rounded-xl border p-4" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <h3 className="m-0 text-base font-semibold">Most used assignment</h3>
            <div className="mt-4">
              {isLoading ? (
                <p className="m-0 text-sm" style={{ color: 'var(--muted)' }}>
                  Loading…
                </p>
              ) : computed.mostUsedAssignment ? (
                <>
                  <p className="m-0 text-lg font-bold">{computed.mostUsedAssignment.name}</p>
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
