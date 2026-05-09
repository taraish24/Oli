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
      className="fixed left-0 top-0 flex h-screen w-[190px] flex-col border-r border-[rgba(0,255,136,0.12)] px-4 py-5 glass"
      style={{ borderRadius: '0 4px 4px 0' }}
    >
      <div className="flex items-baseline justify-between">
        <h1 className="m-0 text-lg font-semibold tracking-tight" style={{ color: 'var(--accent)' }}>
          Oli
        </h1>
      </div>

      <nav className="mt-8 flex flex-col gap-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className="rounded-[4px] py-2 pl-3 pr-2 text-sm font-medium no-underline"
            style={({ isActive }) => ({
              color: isActive ? 'var(--accent)' : 'var(--text)',
              borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
              background: isActive ? 'rgba(0, 255, 136, 0.1)' : 'transparent',
              marginLeft: 0,
            })}
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div
        style={{
          background: 'rgba(0, 255, 136, 0.05)',
          border: '1px solid rgba(0, 255, 136, 0.15)',
          borderRadius: '4px',
          padding: '12px',
          marginTop: 'auto',
        }}
      >
        <p className="m-0 text-sm font-semibold leading-tight" style={{ color: 'var(--text)' }}>
          {userName}
        </p>
        {userEmail ? (
          <p className="m-0 mt-1 text-xs break-all" style={{ color: 'var(--muted)' }}>
            {userEmail}
          </p>
        ) : null}

        <button
          type="button"
          onClick={onLogout}
          className="mt-3 w-full rounded-[4px] px-3 py-2 text-xs font-semibold glass-field"
          style={{ color: 'var(--text)' }}
        >
          Log out
        </button>
      </div>
    </aside>
  )
}

export default AppSidebar
