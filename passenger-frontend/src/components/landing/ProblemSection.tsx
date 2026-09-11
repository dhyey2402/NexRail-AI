import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { CloudRain, Activity, Clock, Zap } from 'lucide-react'

export function ProblemSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  })

  const y1 = useTransform(scrollYProgress, [0, 1], [100, -100])
  const y2 = useTransform(scrollYProgress, [0, 1], [-100, 100])
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0])

  return (
    <section ref={containerRef} className="relative overflow-hidden bg-[#050608] py-32 md:py-48">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTYwIDBMMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAyKSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48L3N2Zz4=')] [mask-image:linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)]" />

      <motion.div style={{ opacity }} className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="grid gap-16 lg:grid-cols-2 lg:gap-24">
          
          {/* Left Column - Editorial Text */}
          <div className="flex flex-col justify-center">
            <h2 className="mb-6 text-3xl font-medium tracking-tight text-white md:text-5xl lg:text-6xl">
              Railways don't run on<br />
              <span className="text-white/40">schedules alone.</span>
            </h2>
            <p className="mb-10 max-w-xl text-lg text-white/50">
              A timetable is a static promise. Real journeys are dynamic—affected by network congestion, speed restrictions, weather systems, and cascading delays from incoming rakes.
            </p>

            <div className="grid grid-cols-2 gap-6 border-l border-white/10 pl-6">
              <div>
                <Activity className="mb-3 h-5 w-5 text-[#4aa3e8]" />
                <h3 className="mb-1 font-medium text-white">Network Congestion</h3>
                <p className="text-sm text-white/40">Sectional blocks and cross-traffic</p>
              </div>
              <div>
                <CloudRain className="mb-3 h-5 w-5 text-[#4aa3e8]" />
                <h3 className="mb-1 font-medium text-white">Weather Systems</h3>
                <p className="text-sm text-white/40">Visibility and track conditions</p>
              </div>
              <div>
                <Clock className="mb-3 h-5 w-5 text-[#4aa3e8]" />
                <h3 className="mb-1 font-medium text-white">Cascading Delays</h3>
                <p className="text-sm text-white/40">Late arriving rakes</p>
              </div>
              <div>
                <Zap className="mb-3 h-5 w-5 text-[#4aa3e8]" />
                <h3 className="mb-1 font-medium text-white">Speed Restrictions</h3>
                <p className="text-sm text-white/40">Temporary engineering works</p>
              </div>
            </div>
          </div>

          {/* Right Column - Visual Abstract Timeline */}
          <div className="relative flex h-[500px] items-center justify-center">
            {/* Center Line */}
            <div className="absolute left-1/2 top-0 h-full w-[1px] -translate-x-1/2 bg-gradient-to-b from-transparent via-white/20 to-transparent" />
            
            {/* Animated Nodes Left */}
            <motion.div style={{ y: y1 }} className="absolute left-0 right-1/2 flex flex-col items-end gap-16 pr-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-mono text-xs text-white/30">EXPECTED</div>
                    <div className="font-mono text-lg text-white/60">10:4{i}</div>
                  </div>
                  <div className="h-2 w-2 rounded-full bg-white/20" />
                </div>
              ))}
            </motion.div>

            {/* Animated Nodes Right (Reality) */}
            <motion.div style={{ y: y2 }} className="absolute left-1/2 right-0 flex flex-col items-start gap-24 pl-8 pt-12">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="h-2 w-2 rounded-full bg-[#4aa3e8] shadow-[0_0_10px_rgba(74,163,232,0.5)]" />
                  <div>
                    <div className="font-mono text-xs text-[#4aa3e8]/50">PREDICTED</div>
                    <div className="font-mono text-lg text-[#4aa3e8]">11:0{i+2}</div>
                    <div className="text-xs text-rose-400">+{20 + i*4} min</div>
                  </div>
                </div>
              ))}
            </motion.div>

            {/* Connecting lines abstract */}
            <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
              <motion.path
                d="M 250 150 Q 300 250 250 350"
                stroke="rgba(74, 163, 232, 0.2)"
                strokeWidth="1"
                fill="none"
                strokeDasharray="4 4"
              />
            </svg>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
