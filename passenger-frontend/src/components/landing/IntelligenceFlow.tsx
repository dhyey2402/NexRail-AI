import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Database, Cpu, BrainCircuit, Navigation } from 'lucide-react'

const steps = [
  {
    id: '01',
    title: 'Live Telemetry',
    desc: 'Ingests real-time NTES GPS, signaling blocks, and weather APIs.',
    icon: Database,
  },
  {
    id: '02',
    title: 'AI Prediction Engine',
    desc: 'LightGBM model calculates probabilistic ETAs and delay propagation.',
    icon: Cpu,
  },
  {
    id: '03',
    title: 'Decision Intelligence',
    desc: 'Analyzes recovery buffers and identifies smart alternative routes.',
    icon: BrainCircuit,
  },
  {
    id: '04',
    title: 'Passenger Action',
    desc: 'Delivers actionable insights to the passenger through the UI.',
    icon: Navigation,
  },
]

export function IntelligenceFlow() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start center', 'end center'],
  })

  // We want a vertical progress line that fills as you scroll
  const height = useTransform(scrollYProgress, [0, 0.8], ['0%', '100%'])

  return (
    <section id="intelligence" ref={containerRef} className="relative bg-[#050608] py-32 md:py-48">
      <div className="mx-auto max-w-4xl px-6">
        <div className="mb-24 text-center">
          <h2 className="text-3xl font-medium tracking-tight text-white md:text-5xl">
            The Intelligence Engine
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/40">
            A real-time data pipeline transforming raw railway telemetry into actionable decisions.
          </p>
        </div>

        <div className="relative">
          {/* Background track line */}
          <div className="absolute left-8 top-0 h-full w-[1px] bg-white/5 md:left-1/2 md:-translate-x-1/2" />
          
          {/* Animated fill line */}
          <motion.div 
            style={{ height }}
            className="absolute left-8 top-0 w-[2px] bg-gradient-to-b from-[#4aa3e8] to-[#4aa3e8] shadow-[0_0_15px_rgba(74,163,232,0.6)] md:left-1/2 md:-translate-x-1/2" 
          />

          <div className="space-y-24">
            {steps.map((step, idx) => {
              const isEven = idx % 2 === 0
              
              return (
                <div key={step.id} className={`relative flex items-center gap-8 md:justify-between ${isEven ? 'md:flex-row-reverse' : ''}`}>
                  
                  {/* Empty half for desktop layout */}
                  <div className="hidden w-[calc(50%-3rem)] md:block" />

                  {/* Node marker */}
                  <div className="absolute left-8 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full border border-[#4aa3e8]/30 bg-[#050608] md:left-1/2">
                    <step.icon className="h-4 w-4 text-[#4aa3e8]" />
                  </div>

                  {/* Content card */}
                  <motion.div 
                    initial={{ opacity: 0, x: isEven ? -20 : 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6 }}
                    className={`w-full pl-16 md:w-[calc(50%-3rem)] md:pl-0 ${isEven ? 'md:text-right' : 'md:text-left'}`}
                  >
                    <div className="mb-2 font-mono text-xs text-white/30">{step.id}</div>
                    <h3 className="mb-3 text-xl font-medium text-white">{step.title}</h3>
                    <p className="text-sm text-white/50">{step.desc}</p>
                  </motion.div>

                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
