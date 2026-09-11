import { useEffect, useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, Activity, MapPin } from 'lucide-react'
import { NavLink } from 'react-router-dom'

export function HeroSection() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { scrollY } = useScroll()
  
  // Parallax effects
  const textY = useTransform(scrollY, [0, 800], [0, 250])
  const opacity = useTransform(scrollY, [0, 400], [1, 0])

  // Canvas 3D Railway logic
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

    const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
      ctx.clearRect(0, 0, width, height)
      
      const cx = width / 2
      const cy = height * 0.4 // Horizon line slightly above center
      
      // Horizon fade gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height)
      bgGrad.addColorStop(0, '#050608')
      bgGrad.addColorStop(cy / height, '#080a0f')
      bgGrad.addColorStop(1, '#050608')
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, width, height)

      ctx.save()
      ctx.translate(cx, cy)

      // Perspective projection parameters
      const fov = 300
      const lines = 12
      const spread = 2000
      
      // Draw receding tracks
      ctx.beginPath()
      for (let i = -lines; i <= lines; i++) {
        const x = (i * spread) / lines
        // Bottom screen intersection
        const z = 800
        const scale = fov / (fov + z)
        const bx = x * scale
        const by = z * scale * 2 // exaggerated depth

        ctx.moveTo(0, 0)
        ctx.lineTo(bx, by)
      }
      ctx.strokeStyle = 'rgba(74, 163, 232, 0.05)'
      ctx.lineWidth = 1
      ctx.stroke()

      // Moving sleepers (horizontal lines)
      ctx.beginPath()
      const speed = 2
      const sleeperSpacing = 50
      const offset = (time * speed) % sleeperSpacing

      for (let z = 10; z < 800; z += sleeperSpacing) {
        const actualZ = z - offset
        if (actualZ < 1) continue // past camera

        const scale = fov / (fov + actualZ)
        const y = actualZ * scale * 2
        const w = spread * scale
        
        // fade in distance
        const alpha = Math.max(0, 1 - (actualZ / 800)) * 0.15

        ctx.moveTo(-w, y)
        ctx.lineTo(w, y)
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`
        ctx.stroke()
      }

      // Train representation (glow moving away)
      const trainZ = 400 + Math.sin(time * 0.005) * 100 // oscillating depth
      const trainScale = fov / (fov + trainZ)
      const ty = trainZ * trainScale * 2

      const glow = ctx.createRadialGradient(0, ty, 0, 0, ty, 100 * trainScale)
      glow.addColorStop(0, 'rgba(74, 163, 232, 0.4)')
      glow.addColorStop(1, 'rgba(74, 163, 232, 0)')
      
      ctx.fillStyle = glow
      ctx.fillRect(-200, ty - 100, 400, 200)

      // Train core
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
      ctx.fillRect(-15 * trainScale, ty - 10 * trainScale, 30 * trainScale, 20 * trainScale)

      ctx.restore()
    }

    const render = () => {
      time++
      drawGrid(ctx, canvas.width, canvas.height, time)
      animationFrameId = requestAnimationFrame(render)
    }
    
    render()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <section className="relative h-screen min-h-[800px] w-full overflow-hidden bg-[#050608]">
      {/* 3D Canvas Background */}
      <div className="absolute inset-0 z-0">
        <canvas 
          ref={canvasRef} 
          className="h-full w-full opacity-60 mix-blend-screen"
        />
        {/* Vignette/Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050608] via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050608] via-transparent to-[#050608]" />
      </div>

      {/* Content */}
      <motion.div 
        style={{ y: textY, opacity }}
        className="relative z-10 mx-auto flex h-full max-w-7xl flex-col items-center justify-center px-6 text-center"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="mb-6 font-mono text-sm tracking-[0.2em] text-[#4aa3e8]">
            NEXRAIL AI
          </h1>
          <h2 className="mb-6 text-5xl font-medium tracking-tight text-white md:text-7xl lg:text-8xl">
            Predict the Journey.<br />
            <span className="text-white/50">Before It Happens.</span>
          </h2>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-white/40 md:text-xl">
            AI-powered railway intelligence for faster, safer, and more predictable journeys.
          </p>
          
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <NavLink
              to="/search"
              className="group flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition-all hover:bg-white/90"
            >
              Explore NexRail
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </NavLink>
            <a
              href="#intelligence"
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-white/10"
            >
              <Activity className="h-4 w-4" />
              Live Intelligence
            </a>
          </div>
        </motion.div>

        {/* Telemetry Overlays (Absolute positioned around the hero) */}
        <motion.div 
          className="absolute left-10 top-1/3 hidden rounded-lg border border-white/10 bg-black/40 px-4 py-3 backdrop-blur-md md:block"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          <div className="mb-1 text-[10px] font-mono text-white/50 uppercase tracking-wider">Delay Risk</div>
          <div className="text-xl font-medium text-emerald-400">18% <span className="text-sm text-emerald-400/50">Low</span></div>
        </motion.div>

        <motion.div 
          className="absolute right-10 top-1/2 hidden rounded-lg border border-white/10 bg-black/40 px-4 py-3 backdrop-blur-md md:block"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7, duration: 0.8 }}
        >
          <div className="mb-1 text-[10px] font-mono text-white/50 uppercase tracking-wider">Next Station</div>
          <div className="flex items-center gap-2 text-sm text-white">
            <MapPin className="h-3 w-3 text-[#4aa3e8]" />
            Ahmedabad (ADI)
          </div>
          <div className="mt-1 text-xs text-white/40">ETA +04 min</div>
        </motion.div>

      </motion.div>

      {/* Bottom Trust Indicators */}
      <div className="absolute bottom-0 left-0 w-full border-t border-white/5 bg-black/20 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-8 px-6 py-4 text-xs font-mono uppercase tracking-widest text-white/30 md:gap-16">
          <span>Live Train Intelligence</span>
          <span className="hidden md:inline">·</span>
          <span>AI ETA Engine</span>
          <span className="hidden md:inline">·</span>
          <span className="hidden sm:inline">Decision Intelligence</span>
        </div>
      </div>
    </section>
  )
}
