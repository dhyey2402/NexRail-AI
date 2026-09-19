import { NavLink, useLocation } from 'react-router-dom'
import { Train, Sun, Moon } from 'lucide-react'
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
    <header className="sticky top-0 z-40 border-b border-border bg-bg/90 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <NavLink to="/" className="flex items-center gap-2.5 text-ink">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent shrink-0">
            <Train className="h-3.5 w-3.5 text-white" />
          </span>
          <span className="leading-tight">
            <span className="block text-[13px] font-semibold tracking-tight">NexRail AI</span>
            <span className="block text-[10px] text-muted">Live Train Status</span>
          </span>
        </NavLink>

        <div className="flex items-center gap-1">
          <nav className="flex items-center gap-0.5">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'rounded-md px-3 py-1.5 text-[13px] font-medium text-muted transition-colors hover:text-ink',
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
            className="ml-2 flex h-7 w-7 items-center justify-center rounded-md border border-border bg-surface text-muted transition-colors hover:text-ink"
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>

          <div className="ml-2 flex items-center border-l border-border pl-3">
            {user ? (
              <div className="flex items-center gap-2.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/10 text-accent text-[10px] font-semibold">
                  {user.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="hidden sm:inline text-[12px] font-medium text-ink max-w-[120px] truncate">{user.email}</span>
                <button
                  onClick={logout}
                  className="rounded-md px-2.5 py-1 text-[11px] font-medium text-danger transition-colors hover:bg-danger/10"
                >
                  Log out
                </button>
              </div>
            ) : (
              <NavLink
                to="/login"
                className="rounded-md bg-accent px-3.5 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-accent/90"
              >
                Log In
              </NavLink>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-5 text-[11px] text-faint sm:flex-row sm:items-center sm:justify-between">
        <p>NexRail AI — AI-powered Train ETA Intelligence</p>
        <p>Smart India Hackathon 2026</p>
      </div>
    </footer>
  )
}
