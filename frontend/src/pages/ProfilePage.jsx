import AppSidebar from '../components/AppSidebar'
import { useMemo, useState } from 'react'
import api from '../services/api'

function ProfilePage() {
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') ?? 'null')
    } catch {
      return null
    }
  }, [])

  const name = user?.name || 'Unknown user'
  const email = user?.email || '—'
  const [draftName, setDraftName] = useState(name === 'Unknown user' ? '' : name)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function onSave() {
    setError('')
    setSuccess('')

    if (!draftName.trim()) {
      setError('Name cannot be empty.')
      return
    }

    setIsSaving(true)
    try {
      const response = await api.put('/auth/me', { name: draftName })
      const updatedUser = response.data
      localStorage.setItem('user', JSON.stringify(updatedUser))
      setSuccess('Saved.')
    } catch (err) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        'Failed to update name'
      setError(message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main className="min-h-screen">
      <AppSidebar />
      <section className="ml-[190px] min-h-screen px-6 py-5">
        <header className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--text)' }}>
            Profile
          </h2>
        </header>

        <div className="max-w-xl space-y-4">
          <div className="p-4 glass">
            <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
              Name
            </p>
            <p className="mt-2 text-xl font-semibold" style={{ color: 'var(--text)' }}>
              {name}
            </p>
          </div>

          <div className="p-4 glass">
            <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
              Email
            </p>
            <p className="mt-2 text-xl font-semibold break-all" style={{ color: 'var(--text)' }}>
              {email}
            </p>
          </div>

          <div className="p-4 glass">
            <h3 className="m-0 text-base font-semibold" style={{ color: 'var(--text)' }}>
              Update name
            </h3>
            <input
              className="glass-field mt-3 w-full px-3 py-2 text-sm outline-none"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              placeholder="Your name"
            />
            <button
              type="button"
              disabled={isSaving}
              onClick={onSave}
              className="mt-3 w-full rounded-[4px] px-3 py-2 text-sm font-semibold disabled:opacity-60"
              style={{ background: 'var(--accent)', color: '#02131a' }}
            >
              {isSaving ? 'Saving…' : 'Save'}
            </button>

            {error ? (
              <p className="mt-3 text-sm" style={{ color: '#ff6b6b' }}>
                {error}
              </p>
            ) : null}
            {success ? (
              <p className="mt-3 text-sm" style={{ color: 'var(--muted)' }}>
                {success}
              </p>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  )
}

export default ProfilePage
