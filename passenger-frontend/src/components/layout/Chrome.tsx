import { NavLink, useLocation } from 'react-router-dom'
import { TrainFront, Sun, Moon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'

const links = [
  { to: '/', label: 'Home' },
  { to: '/search', label: 'Track' },
]

export function Navbar() {
  const location = useLocation()
  const trackActive = location.pathname.startsWith('/search') || location.pathname.startsWith('/train')
  const { user, logout } = useAuth()
  const { theme, toggle: toggleTheme } = useTheme()

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <NavLink to="/" className="flex items-center gap-2.5 text-ink">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface">
            <TrainFront className="h-4 w-4 text-accent" />
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-semibold tracking-tight">NexRail AI</span>
            <span className="block text-[11px] text-muted">Passenger · v2.0</span>
          </span>
        </NavLink>

        <nav className="flex items-center gap-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                cn(
                  'rounded-md px-3 py-1.5 text-sm text-muted transition-colors hover:text-ink',
                  (link.to === '/search' ? trackActive : isActive) && 'text-accent',
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
          </nav>
          
          <button
            onClick={toggleTheme}
            className="ml-3 flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-muted transition-colors hover:text-ink"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>

          <div className="ml-3 flex items-center border-l border-border pl-4">
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-ink">{user.email}</span>
                <button
                  onClick={logout}
                  className="rounded-md px-3 py-1.5 text-xs text-danger transition-colors hover:bg-danger/10"
                >
                  Log out
                </button>
              </div>
            ) : (
              <NavLink
                to="/login"
                className="rounded-md bg-accent px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent/90"
              >
                Log In
              </NavLink>
            )}
          </div>
        </div>
      </header>
  )
}

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-6 text-xs text-faint sm:flex-row sm:items-center sm:justify-between">
        <p>NexRail AI v2.0 — Smart India Hackathon 2026</p>
        <p>Live status for passengers. Operations console is a separate surface.</p>
      </div>
    </footer>
  )
}
