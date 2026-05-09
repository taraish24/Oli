import { useEffect, useMemo, useState } from 'react'
import AppSidebar from '../components/AppSidebar'
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

function colorForAssignmentType(type) {
  if (type === 'WORK') return 'var(--cyan)'
  if (type === 'VACATION') return 'var(--orange)'
  if (type === 'HOLIDAY') return 'var(--green)'
  return 'var(--blue)'
}

function toEntryByDay(attendanceEntries) {
  const byDay = {}
  for (const entry of attendanceEntries ?? []) {
    const date = new Date(entry.date)
    const day = date.getUTCDate()
    if (!byDay[day]) byDay[day] = []

    const assignment = entry.assignment ?? {}
    byDay[day].push({
      id: entry.id,
      assignmentId: entry.assignmentId,
      title: assignment.name ?? 'Assignment',
      minutes: entry.workedMinutes,
      tag: assignment.code ?? assignment.type ?? 'ENTRY',
      type: assignment.type ?? 'WORK',
      color: colorForAssignmentType(assignment.type),
    })
  }
  return byDay
}

function CalendarPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [monthIndex, setMonthIndex] = useState(now.getMonth())
  const [selectedDay, setSelectedDay] = useState(now.getDate())
  const [attendanceId, setAttendanceId] = useState(null)
  const [entryByDay, setEntryByDay] = useState({})
  const [assignments, setAssignments] = useState([])
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('')
  const [workedMinutes, setWorkedMinutes] = useState('')
  const [saveError, setSaveError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [editingEntryId, setEditingEntryId] = useState(null)
  const [editAssignmentId, setEditAssignmentId] = useState('')
  const [editWorkedMinutes, setEditWorkedMinutes] = useState('')
  const [editError, setEditError] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [addEntryPanelOpen, setAddEntryPanelOpen] = useState(false)

  const month = monthIndex + 1
  const totalDays = new Date(year, monthIndex + 1, 0).getDate()

  function closeAddEntryPanel() {
    setAddEntryPanelOpen(false)
  }

  async function refreshAttendance() {
    const response = await api.get(`/attendance/${year}/${month}`)
    const attendance = response.data
    setAttendanceId(attendance?.id ?? null)
    setEntryByDay(toEntryByDay(attendance?.entries))
  }

  useEffect(() => {
    let isMounted = true

    async function load() {
      try {
        const [assignmentsResponse] = await Promise.all([api.get('/assignments')])

        if (!isMounted) return

        const loadedAssignments = assignmentsResponse.data ?? []
        setAssignments(loadedAssignments)
        if (loadedAssignments.length && !selectedAssignmentId) {
          setSelectedAssignmentId(String(loadedAssignments[0].id))
        }
      } catch (err) {
        // Keep page usable; errors are surfaced on save for now.
      }
    }

    load()
    return () => {
      isMounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    refreshAttendance()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, monthIndex])

  useEffect(() => {
    setSelectedDay((current) => Math.min(Math.max(1, current), totalDays))
  }, [totalDays])

  async function onSaveEntry() {
    setSaveError('')

    if (!attendanceId) {
      setSaveError('Attendance is not loaded yet. Please try again.')
      return
    }

    const assignmentIdNumber = Number(selectedAssignmentId)
    if (!Number.isInteger(assignmentIdNumber)) {
      setSaveError('Please select an assignment.')
      return
    }

    const minutesNumber = Number(workedMinutes)
    if (!Number.isInteger(minutesNumber) || minutesNumber < 1) {
      setSaveError('Please enter worked minutes (>= 1).')
      return
    }

    const dateIso = new Date(Date.UTC(year, monthIndex, selectedDay, 12, 0, 0, 0)).toISOString()

    setIsSaving(true)
    try {
      await api.post('/entries', {
        attendanceId,
        assignmentId: assignmentIdNumber,
        date: dateIso,
        workedMinutes: minutesNumber,
      })

      setWorkedMinutes('')
      await refreshAttendance()
    } catch (err) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        'Failed to save entry'
      setSaveError(message)
    } finally {
      setIsSaving(false)
    }
  }

  function startEdit(entry) {
    setEditError('')
    setEditingEntryId(entry.id)
    setEditAssignmentId(String(entry.assignmentId ?? ''))
    setEditWorkedMinutes(String(entry.minutes ?? ''))
  }

  function cancelEdit() {
    setEditingEntryId(null)
    setEditError('')
    setEditAssignmentId('')
    setEditWorkedMinutes('')
  }

  async function onSaveEdit(entryId) {
    setEditError('')

    const assignmentIdNumber = Number(editAssignmentId)
    if (!Number.isInteger(assignmentIdNumber)) {
      setEditError('Please select an assignment.')
      return
    }

    const minutesNumber = Number(editWorkedMinutes)
    if (!Number.isInteger(minutesNumber) || minutesNumber < 1) {
      setEditError('Please enter worked minutes (>= 1).')
      return
    }

    setIsEditing(true)
    try {
      await api.put(`/entries/${entryId}`, {
        assignmentId: assignmentIdNumber,
        workedMinutes: minutesNumber,
      })
      cancelEdit()
      await refreshAttendance()
    } catch (err) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        'Failed to update entry'
      setEditError(message)
    } finally {
      setIsEditing(false)
    }
  }

  async function onDeleteEntry(entryId) {
    setSaveError('')
    setEditError('')

    const ok = window.confirm('Delete this entry?')
    if (!ok) return

    try {
      await api.delete(`/entries/${entryId}`)
      await refreshAttendance()
    } catch (err) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        'Failed to delete entry'
      setEditError(message)
    }
  }

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

  const stats = useMemo(() => {
    const allDays = Object.keys(entryByDay).map((day) => Number(day))
    const daysLogged = allDays.filter((day) => (entryByDay[day] ?? []).length > 0).length

    const totalMinutes = Object.values(entryByDay).reduce(
      (sum, entries) => sum + entries.reduce((entrySum, entry) => entrySum + entry.minutes, 0),
      0,
    )
    const trackedHours = (totalMinutes / 60).toFixed(1)

    const vacationDays = allDays.filter((day) =>
      (entryByDay[day] ?? []).some((entry) => entry.type === 'VACATION'),
    ).length

    let workdaysWithoutEntries = 0
    for (let day = 1; day <= totalDays; day += 1) {
      const weekday = new Date(year, monthIndex, day).getDay()
      const isWeekend = weekday === 0 || weekday === 6
      if (!isWeekend && !(entryByDay[day] ?? []).length) {
        workdaysWithoutEntries += 1
      }
    }

    return [
      { label: 'Tracked Hours', value: `${trackedHours}h` },
      { label: 'Days Logged', value: `${daysLogged}` },
      { label: 'Vacation Days', value: `${vacationDays}` },
      { label: 'Missing Days', value: `${workdaysWithoutEntries}` },
    ]
  }, [entryByDay, monthIndex, totalDays, year])

  const days = useMemo(
    () => {
      const today = new Date()
      const isSameMonth = year === today.getFullYear() && monthIndex === today.getMonth()
      const isPastMonth =
        year < today.getFullYear() || (year === today.getFullYear() && monthIndex < today.getMonth())
      const isFutureMonth =
        year > today.getFullYear() || (year === today.getFullYear() && monthIndex > today.getMonth())

      return Array.from({ length: totalDays }, (_, idx) => {
        const day = idx + 1
        if (isPastMonth) return { day, type: 'past' }
        if (isFutureMonth) return { day, type: 'future' }
        if (isSameMonth && day === today.getDate()) return { day, type: 'today' }
        if (isSameMonth && day > today.getDate()) return { day, type: 'future' }
        return { day, type: 'past' }
      })
    },
    [monthIndex, totalDays, year],
  )

  const selectedEntries = entryByDay[selectedDay] ?? []

  return (
    <main className="min-h-screen">
      <AppSidebar />

      <section className="ml-[190px] mr-[320px] min-h-screen px-6 py-5">
        <header className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--text)' }}>
            Calendar
          </h2>
          <div className="flex items-center gap-3 px-3 py-2 glass">
            <button
              type="button"
              onClick={goToPrevMonth}
              className="text-lg leading-none"
              style={{ color: 'var(--text)' }}
            >
              {'\u2039'}
            </button>
            <span className="text-sm font-semibold" style={{ letterSpacing: '0.02em', color: 'var(--text)' }}>
              {monthNames[monthIndex]} {year}
            </span>
            <button
              type="button"
              onClick={goToNextMonth}
              className="text-lg leading-none"
              style={{ color: 'var(--text)' }}
            >
              {'\u203a'}
            </button>
          </div>
        </header>

        <div className="mb-6 grid grid-cols-4 gap-4">
          {stats.map((card) => (
            <div key={card.label} className="p-4 glass">
              <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                {card.label}
              </p>
              <p className="mt-2 text-3xl font-semibold tracking-tight" style={{ color: 'var(--text)' }}>
                {card.value}
              </p>
            </div>
          ))}
        </div>

        <div
          className="grid grid-cols-7 gap-3 text-center text-sm uppercase tracking-wide"
          style={{ color: '#5a9a8a', fontWeight: 600 }}
        >
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((name) => (
            <div key={name}>{name}</div>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-7 gap-3">
          {days.map((item) => {
            const isFuture = item.type === 'future'
            const isToday = item.type === 'today'
            const isSelected = item.day === selectedDay
            const entries = entryByDay[item.day] ?? []
            const totalHours = entries.reduce((sum, current) => sum + current.minutes, 0) / 60
            const clickable = !isFuture

            const todayGlow = isToday
              ? {
                  border: '1px solid var(--accent)',
                  boxShadow: '0 0 10px rgba(0, 255, 136, 0.35)',
                }
              : {}
            const selectedBorder =
              isSelected && !isToday
                ? { border: '1px solid rgba(0, 255, 136, 0.55)', boxShadow: 'none' }
                : !isToday
                  ? { border: '1px solid rgba(0, 255, 136, 0.08)', boxShadow: 'none' }
                  : {}

            return (
              <button
                type="button"
                key={item.day}
                disabled={!clickable}
                onClick={() => clickable && setSelectedDay(item.day)}
                className="calendar-day-cell h-32 p-3 text-left transition"
                style={{
                  background: 'transparent',
                  ...todayGlow,
                  ...(!isToday ? selectedBorder : {}),
                  opacity: isFuture ? 0.35 : 1,
                  cursor: clickable ? 'pointer' : 'not-allowed',
                }}
              >
                <p className="m-0 text-sm tabular-nums" style={{ color: '#e8f4f8', fontWeight: 600 }}>
                  {item.day}
                </p>
                {isFuture ? (
                  <p
                    className="mt-3 text-xs uppercase tracking-wide"
                    style={{ color: 'rgba(120, 180, 160, 0.6)', fontWeight: 500 }}
                  >
                    LOCKED
                  </p>
                ) : (
                  <>
                    <p className="mt-3 text-xs font-medium" style={{ color: '#7ab8c8' }}>
                      {totalHours.toFixed(1)}h
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {entries.slice(0, 2).map((entry) => (
                        <span
                          key={entry.title}
                          className="rounded-[4px] px-2 py-0.5 text-[11px] font-semibold"
                          style={{
                            background: 'rgba(5, 12, 8, 0.35)',
                            color: 'var(--accent)',
                            border: '1px solid rgba(0, 255, 136, 0.2)',
                          }}
                        >
                          {entry.tag}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </button>
            )
          })}
        </div>
      </section>

      <aside
        className="fixed right-0 top-0 flex h-screen w-[320px] flex-col overflow-hidden px-5 py-5 glass"
        style={{ borderRadius: '4px 0 0 4px' }}
      >
        <div className="shrink-0">
          <h3 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--text)' }}>
            Day {selectedDay}
          </h3>
          <p className="text-sm font-light" style={{ color: 'var(--muted)' }}>
            Selected day entries
          </p>
        </div>

        <div
          className="mt-4 space-y-3 pr-1"
          style={{ maxHeight: '40vh', overflowY: 'auto' }}
        >
          {selectedEntries.length === 0 ? (
            <div className="glass-outline p-3 text-sm" style={{ color: 'var(--muted)' }}>
              No entries yet.
            </div>
          ) : (
            selectedEntries.map((entry) => (
              <div key={entry.id} className="glass-outline p-3">
                {editingEntryId === entry.id ? (
                  <>
                    <select
                      className="glass-field w-full px-3 py-2 text-sm outline-none"
                      value={editAssignmentId}
                      onChange={(e) => setEditAssignmentId(e.target.value)}
                    >
                      {assignments.map((assignment) => (
                        <option key={assignment.id} value={String(assignment.id)}>
                          {assignment.name} ({assignment.type})
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      className="glass-field mt-2 w-full px-3 py-2 text-sm outline-none"
                      value={editWorkedMinutes}
                      onChange={(e) => setEditWorkedMinutes(e.target.value)}
                    />

                    {editError ? (
                      <p className="mt-2 text-sm" style={{ color: '#ff6b6b' }}>
                        {editError}
                      </p>
                    ) : null}

                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        disabled={isEditing}
                        onClick={() => onSaveEdit(entry.id)}
                        className="flex-1 rounded-[4px] px-3 py-2 text-sm font-semibold disabled:opacity-60"
                        style={{ background: 'var(--accent)', color: '#02131a' }}
                      >
                        {isEditing ? 'Saving…' : 'Save'}
                      </button>
                      <button
                        type="button"
                        disabled={isEditing}
                        onClick={cancelEdit}
                        className="glass-field flex-1 rounded-[4px] px-3 py-2 text-sm font-semibold disabled:opacity-60"
                        style={{ color: 'var(--text)' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="m-0 font-semibold" style={{ color: 'var(--text)' }}>
                      {entry.title}
                    </p>
                    <p className="m-0 mt-1 text-sm font-light" style={{ color: 'var(--muted)' }}>
                      {entry.minutes} min ({(entry.minutes / 60).toFixed(1)}h)
                    </p>
                    <span
                      className="mt-2 inline-block rounded-[4px] px-2 py-1 text-xs font-semibold"
                      style={{
                        background: 'rgba(5, 12, 8, 0.35)',
                        color: 'var(--accent)',
                        border: '1px solid rgba(0, 255, 136, 0.2)',
                      }}
                    >
                      {entry.tag}
                    </span>

                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(entry)}
                        className="glass-field flex-1 rounded-[4px] px-3 py-2 text-xs font-semibold"
                        style={{ color: 'var(--text)' }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteEntry(entry.id)}
                        className="flex-1 rounded-[4px] border px-3 py-2 text-xs font-semibold"
                        style={{ borderColor: 'rgba(255, 107, 107, 0.45)', background: 'transparent', color: '#ff6b6b' }}
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>

        <div className="mt-3 w-full shrink-0 space-y-3">
          {addEntryPanelOpen ? (
            <div className="p-4 glass">
              <div className="mb-4 flex items-center justify-between gap-2">
                <h4 className="m-0 text-base font-semibold" style={{ color: 'var(--text)' }}>
                  Add Entry
                </h4>
                <button
                  type="button"
                  onClick={closeAddEntryPanel}
                  className="glass-field shrink-0 rounded-[4px] px-3 py-1.5 text-xs font-semibold"
                  style={{ color: 'var(--muted)' }}
                >
                  Cancel
                </button>
              </div>

              <select
                value={selectedAssignmentId}
                onChange={(e) => setSelectedAssignmentId(e.target.value)}
                disabled={assignments.length === 0}
                style={{
                  width: '100%',
                  background: '#0a1a12',
                  color: '#e8f4f8',
                  border: '1px solid rgba(0, 255, 136, 0.2)',
                  borderRadius: '4px',
                  padding: '8px 12px',
                  outline: 'none',
                  cursor: assignments.length === 0 ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  opacity: assignments.length === 0 ? 0.5 : 1,
                }}
              >
                {assignments.map((a) => (
                  <option key={a.id} value={String(a.id)} style={{ background: '#0a1a12' }}>
                    {a.name} ({a.type})
                  </option>
                ))}
              </select>

              <input
                type="number"
                className="glass-field mt-2 w-full px-3 py-2 text-sm outline-none"
                placeholder="e.g. 480 = 8h"
                value={workedMinutes}
                onChange={(e) => setWorkedMinutes(e.target.value)}
              />

              <button
                type="button"
                disabled={isSaving}
                onClick={onSaveEntry}
                className="mt-3 w-full rounded-[4px] px-3 py-2 text-sm font-semibold"
                style={{ background: 'var(--accent)', color: '#02131a', opacity: isSaving ? 0.7 : 1 }}
              >
                {isSaving ? 'Saving…' : 'Save Entry'}
              </button>

              {saveError ? (
                <p className="mt-3 text-sm" style={{ color: '#ff6b6b' }}>
                  {saveError}
                </p>
              ) : null}
            </div>
          ) : (
            <button
              type="button"
              className="w-full rounded-[4px] px-3 py-3 text-sm font-semibold glass-field"
              style={{ color: 'var(--text)' }}
              onClick={() => setAddEntryPanelOpen(true)}
            >
              + Add Entry
            </button>
          )}
        </div>
      </aside>
    </main>
  )
}

export default CalendarPage
