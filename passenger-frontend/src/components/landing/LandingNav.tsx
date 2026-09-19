import { useState, useEffect } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Train } from 'lucide-react'
import { NavLink } from 'react-router-dom'

export function LandingNav() {
  const { scrollY } = useScroll()
  const [_, setIsScrolled] = useState(false)

  useEffect(() => {
    return scrollY.on('change', (latest) => {
      setIsScrolled(latest > 50)
    })
  }, [scrollY])

  const navBg = useTransform(
    scrollY,
    [0, 100],
    ['rgba(10, 12, 16, 0)', 'rgba(10, 12, 16, 0.9)']
  )

  const navBorder = useTransform(
    scrollY,
    [0, 100],
    ['rgba(35, 41, 56, 0)', 'rgba(35, 41, 56, 0.6)']
  )

  return (
    <motion.header
      style={{
        backgroundColor: navBg,
        borderColor: navBorder,
      }}
      className="fixed top-0 z-50 w-full border-b backdrop-blur-sm transition-all"
    >
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <div className="flex items-center gap-2.5 text-ink">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent">
            <Train className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-[13px] font-semibold tracking-tight text-ink/90">NexRail AI</span>
        </div>

        <nav className="hidden items-center gap-6 md:flex">
          <a href="#features" className="text-[13px] text-muted transition-colors hover:text-ink">Features</a>
          <a href="#how-it-works" className="text-[13px] text-muted transition-colors hover:text-ink">How It Works</a>
        </nav>

        <NavLink
          to="/search"
          className="rounded-md bg-accent px-4 py-1.5 text-[12px] font-medium text-white transition-all hover:bg-accent/90"
        >
          Track a Train
        </NavLink>
      </div>
    </motion.header>
  )
}
