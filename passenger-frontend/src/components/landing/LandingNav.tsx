import { useState, useEffect } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { TrainFront } from 'lucide-react'
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
    ['rgba(5, 6, 8, 0)', 'rgba(5, 6, 8, 0.85)']
  )

  const navBorder = useTransform(
    scrollY,
    [0, 100],
    ['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.08)']
  )

  return (
    <motion.header
      style={{
        backgroundColor: navBg,
        borderColor: navBorder,
      }}
      className="fixed top-0 z-50 w-full border-b backdrop-blur-md transition-all"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-3 text-white">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 shadow-inner">
            <TrainFront className="h-4 w-4 text-[#4aa3e8]" />
          </div>
          <span className="font-semibold tracking-tight text-white/90">NexRail AI</span>
        </div>

        <nav className="hidden items-center gap-8 md:flex">
          <a href="#intelligence" className="text-sm text-white/60 transition-colors hover:text-white">Intelligence</a>
          <a href="#capabilities" className="text-sm text-white/60 transition-colors hover:text-white">Capabilities</a>
          <a href="#how-it-works" className="text-sm text-white/60 transition-colors hover:text-white">How It Works</a>
        </nav>

        <div className="flex items-center gap-4">
          <NavLink
            to="/search"
            className="group relative overflow-hidden rounded-full bg-white px-5 py-2 text-sm font-medium text-black transition-all hover:bg-white/90 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]"
          >
            Launch NexRail
          </NavLink>
        </div>
      </div>
    </motion.header>
  )
}
