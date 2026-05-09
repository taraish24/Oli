import { NavLink, useNavigate } from 'react-router-dom'

const links = [
  { to: '/calendar', label: 'Calendar' },
  { to: '/analytics', label: 'Analytics' },
  { to: '/profile', label: 'Profile' },
]

function AppSidebar() {
  const navigate = useNavigate()

  let user = null
  try {
    user = JSON.parse(localStorage.getItem('user') ?? 'null')
  } catch {
    user = null
  }

  const userName = user?.name || 'Unknown user'
  const userEmail = user?.email || ''

  function onLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  return (
    <aside
      className="fixed left-0 top-0 flex h-screen w-[190px] flex-col border-r px-4 py-5"
      style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-baseline justify-between">
        <h1 className="m-0 text-lg font-bold tracking-tight">Oli</h1>
        <span className="text-[11px] font-semibold tracking-wide" style={{ color: 'var(--muted)' }}>
          v1
        </span>
      </div>

      <nav className="mt-8 flex flex-col gap-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className="rounded-[4px] px-3 py-2 text-sm font-medium no-underline"
            style={({ isActive }) => ({
              color: isActive ? 'var(--cyan)' : 'var(--text)',
              background: isActive ? 'rgba(0, 212, 255, 0.08)' : 'transparent',
            })}
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto rounded-[4px] border p-3" style={{ borderColor: 'var(--border)', background: 'rgba(255,255,255,0.02)' }}>
        <p className="m-0 text-sm font-semibold leading-tight">{userName}</p>
        {userEmail ? (
          <p className="m-0 mt-1 text-xs break-all" style={{ color: 'var(--muted)' }}>
            {userEmail}
          </p>
        ) : null}

        <button
          type="button"
          onClick={onLogout}
          className="mt-3 w-full rounded-[4px] border px-3 py-2 text-xs font-semibold"
          style={{ borderColor: 'var(--border)', background: 'transparent', color: 'var(--text)' }}
        >
          Log out
        </button>
      </div>
    </aside>
  )
}

export default AppSidebar
