import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Activity, Train } from 'lucide-react'
import { NavLink } from 'react-router-dom'

export function HeroSection() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Canvas railway grid
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let time = 0

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    
    window.addEventListener('resize', resize)
    resize()

    const render = () => {
      time++
      const { width, height } = canvas
      ctx.clearRect(0, 0, width, height)

      // Background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height)
      bgGrad.addColorStop(0, '#0a0c10')
      bgGrad.addColorStop(0.4, '#0d1017')
      bgGrad.addColorStop(1, '#0a0c10')
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, width, height)

      const cx = width / 2
      const cy = height * 0.4
      const fov = 300

      ctx.save()
      ctx.translate(cx, cy)

      // Receding track lines
      for (let i = -10; i <= 10; i++) {
        const x = (i * 2000) / 10
        const scale = fov / (fov + 800)
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.lineTo(x * scale, 800 * scale * 2)
        ctx.strokeStyle = 'rgba(59, 130, 196, 0.04)'
        ctx.lineWidth = 1
        ctx.stroke()
      }

      // Moving sleepers
      const offset = (time * 2) % 50
      for (let z = 10; z < 800; z += 50) {
        const actualZ = z - offset
        if (actualZ < 1) continue
        const scale = fov / (fov + actualZ)
        const y = actualZ * scale * 2
        const w = 2000 * scale
        const alpha = Math.max(0, 1 - (actualZ / 800)) * 0.08
        ctx.beginPath()
        ctx.moveTo(-w, y)
        ctx.lineTo(w, y)
        ctx.strokeStyle = `rgba(232, 234, 240, ${alpha})`
        ctx.stroke()
      }

      // Train glow
      const trainZ = 400 + Math.sin(time * 0.005) * 100
      const trainScale = fov / (fov + trainZ)
      const ty = trainZ * trainScale * 2
      const glow = ctx.createRadialGradient(0, ty, 0, 0, ty, 80 * trainScale)
      glow.addColorStop(0, 'rgba(59, 130, 196, 0.3)')
      glow.addColorStop(1, 'rgba(59, 130, 196, 0)')
      ctx.fillStyle = glow
      ctx.fillRect(-150, ty - 80, 300, 160)

      ctx.fillStyle = 'rgba(232, 234, 240, 0.7)'
      ctx.fillRect(-12 * trainScale, ty - 8 * trainScale, 24 * trainScale, 16 * trainScale)

      ctx.restore()

      animationFrameId = requestAnimationFrame(render)
    }
    
    render()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <section className="relative h-screen min-h-[700px] w-full overflow-hidden bg-bg">
      {/* Canvas */}
      <div className="absolute inset-0 z-0">
        <canvas 
          ref={canvasRef} 
          className="h-full w-full opacity-50 mix-blend-screen"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-bg/60 via-transparent to-bg/60" />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto flex h-full max-w-5xl flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 backdrop-blur-sm px-4 py-1.5 mb-6">
            <Train className="h-3.5 w-3.5 text-accent" />
            <span className="text-[12px] font-medium text-muted">AI-Powered Railway Intelligence</span>
          </div>

          <h1 className="mb-5 text-4xl font-semibold tracking-tight text-ink md:text-6xl lg:text-7xl">
            Know Your Train's<br />
            <span className="text-muted">Arrival Before It Does.</span>
          </h1>

          <p className="mx-auto mb-8 max-w-xl text-[15px] leading-relaxed text-muted md:text-base">
            Real-time AI predictions for Indian Railways. Track delays, explore 
            what-if scenarios, and get intelligent journey insights.
          </p>
          
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <NavLink
              to="/search"
              className="group flex items-center gap-2 rounded-md bg-accent px-6 py-2.5 text-[13px] font-medium text-white transition-all hover:bg-accent/90"
            >
              Track a Train
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </NavLink>
            <a
              href="#features"
              className="flex items-center gap-2 rounded-md border border-border bg-surface/50 backdrop-blur-sm px-6 py-2.5 text-[13px] font-medium text-ink transition-all hover:bg-surface"
            >
              <Activity className="h-3.5 w-3.5 text-accent" />
              How It Works
            </a>
          </div>
        </motion.div>
      </div>

      {/* Bottom strip */}
      <div className="absolute bottom-0 left-0 w-full border-t border-border/30 bg-bg/60 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-center gap-8 px-6 py-3 text-[10px] font-mono uppercase tracking-widest text-muted/50 md:gap-16">
          <span>Live ETA Predictions</span>
          <span className="hidden md:inline">·</span>
          <span>ML-Powered Intelligence</span>
          <span className="hidden md:inline">·</span>
          <span className="hidden sm:inline">Journey Analytics</span>
        </div>
      </div>
    </section>
  )
}
