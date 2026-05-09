import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function onSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const response = await api.post('/auth/login', { email, password })
      const { token, user } = response.data ?? {}

      if (!token || !user) {
        setError('Unexpected response from server. Please try again.')
        return
      }

      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))

      navigate('/calendar')
    } catch (err) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        'Login failed'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div
        className="w-full max-w-md rounded-2xl border p-8 shadow-2xl"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <div className="mb-8 text-center">
          <h1 className="m-0 text-3xl font-bold">Oli</h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>
            by Olivia
          </p>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="mb-2 block text-sm" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="w-full rounded-lg border px-3 py-2 outline-none"
              style={{ background: '#0f1522', borderColor: 'var(--border)', color: 'var(--text)' }}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="w-full rounded-lg border px-3 py-2 outline-none"
              style={{ background: '#0f1522', borderColor: 'var(--border)', color: 'var(--text)' }}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 block w-full rounded-lg px-4 py-2 text-center font-semibold disabled:opacity-60"
            style={{ background: 'var(--cyan)', color: '#02131a' }}
          >
            {isSubmitting ? 'Logging in…' : 'Log In'}
          </button>

          {error ? (
            <p className="mt-3 text-sm" style={{ color: '#ff6b6b' }}>
              {error}
            </p>
          ) : null}
        </form>
      </div>
    </main>
  )
}

export default LoginPage
