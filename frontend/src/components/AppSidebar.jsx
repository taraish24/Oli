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
      className="fixed left-0 top-0 h-screen w-[220px] border-r p-6"
      style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
    >
      <div>
        <h1 className="m-0 text-2xl font-bold">Oli</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
          by Olivia
        </p>
      </div>

      <nav className="mt-10 flex flex-col gap-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className="rounded-md px-3 py-2 text-sm font-medium no-underline"
            style={({ isActive }) => ({
              color: isActive ? 'var(--cyan)' : 'var(--text)',
              background: isActive ? 'rgba(0, 212, 255, 0.12)' : 'transparent',
            })}
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div
        className="absolute bottom-6 left-6 right-6 rounded-lg border p-4"
        style={{ background: '#121723', borderColor: 'var(--border)' }}
      >
        <p className="m-0 text-sm font-semibold">{userName}</p>
        {userEmail ? (
          <p className="m-0 mt-1 text-xs break-all" style={{ color: 'var(--muted)' }}>
            {userEmail}
          </p>
        ) : null}

        <button
          type="button"
          onClick={onLogout}
          className="mt-3 w-full rounded-md border px-3 py-2 text-xs font-semibold"
          style={{ borderColor: 'var(--border)', background: 'transparent', color: 'var(--text)' }}
        >
          Log out
        </button>
      </div>
    </aside>
  )
}

export default AppSidebar
