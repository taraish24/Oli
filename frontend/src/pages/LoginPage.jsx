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
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <div
        className="w-full max-w-md p-8 glass"
        style={{
          animation: 'borderGlow 3s ease-in-out infinite',
          border: '1px solid rgba(0, 255, 136, 0.2)',
        }}
      >
        <div className="mb-8 text-center">
          <h1 className="m-0 text-3xl font-semibold tracking-tight" style={{ color: 'var(--accent)' }}>
            Oli
          </h1>
          <p className="m-0 mt-1 text-xs" style={{ color: 'var(--muted)' }}>
            by Ta$h
          </p>
          <p className="mt-2 text-sm italic" style={{ color: 'var(--muted)' }}>
            Monthly attendance
          </p>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="mb-2 block text-sm font-medium" htmlFor="email" style={{ color: 'var(--muted)' }}>
              Email
            </label>
            <input
              id="email"
              type="email"
              className="glass-field w-full px-3 py-2 outline-none"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium" htmlFor="password" style={{ color: 'var(--muted)' }}>
              Password
            </label>
            <input
              id="password"
              type="password"
              className="glass-field w-full px-3 py-2 outline-none"
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
            className="mt-2 block w-full rounded-[4px] px-4 py-2 text-center text-sm font-semibold disabled:opacity-60"
            style={{ background: 'var(--accent)', color: '#02131a' }}
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
