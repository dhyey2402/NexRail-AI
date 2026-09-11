import { motion } from 'framer-motion'
import { Route, Zap, Cloud, Bot, Clock, BarChart3 } from 'lucide-react'

const features = [
  {
    id: '01',
    title: 'Dynamic ETA',
    desc: 'Know when the train will actually arrive.',
    icon: Clock,
    visual: () => (
      <div className="flex h-full items-center justify-center">
        <div className="relative h-1 w-full max-w-[200px] overflow-hidden rounded-full bg-white/10">
          <motion.div 
            className="absolute left-0 top-0 h-full bg-[#4aa3e8]"
            animate={{ width: ['0%', '100%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </div>
    )
  },
  {
    id: '02',
    title: 'Delay Propagation',
    desc: 'See how today\'s delay moves through the network.',
    icon: BarChart3,
    visual: () => (
      <div className="flex h-full items-center justify-center gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <motion.div
            key={i}
            className="w-1 rounded-full bg-rose-500/80"
            animate={{ height: [10, 40, 10] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
    )
  },
  {
    id: '03',
    title: 'Recovery Intelligence',
    desc: 'Identify opportunities to recover lost time.',
    icon: Zap,
    visual: () => (
      <div className="flex h-full items-center justify-center">
        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="text-rose-400">-15m</span>
          <ArrowRight className="h-3 w-3 text-white/30" />
          <motion.span 
            className="text-emerald-400"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            -5m
          </motion.span>
        </div>
      </div>
    )
  },
  {
    id: '04',
    title: 'Smart Alternatives',
    desc: 'Find faster options when plans change.',
    icon: Route,
    visual: () => (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <div className="h-[1px] w-32 bg-white/10 relative">
          <div className="absolute right-0 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-white/20" />
        </div>
        <motion.div 
          className="h-[1px] w-32 bg-[#4aa3e8]/50 relative"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          transition={{ duration: 1 }}
          style={{ originX: 0 }}
        >
          <div className="absolute right-0 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-[#4aa3e8]" />
        </motion.div>
      </div>
    )
  },
  {
    id: '05',
    title: 'Weather Intelligence',
    desc: 'Understand how weather affects the journey.',
    icon: Cloud,
    visual: () => (
      <div className="flex h-full items-center justify-center">
        <motion.div
          animate={{ y: [-5, 5, -5] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <Cloud className="h-8 w-8 text-white/40" />
        </motion.div>
      </div>
    )
  },
  {
    id: '06',
    title: 'AI Passenger Assistant',
    desc: 'Ask NexRail what happens next.',
    icon: Bot,
    visual: () => (
      <div className="flex h-full w-full flex-col items-start justify-center gap-2 px-6">
        <div className="h-2 w-16 rounded-full bg-white/10" />
        <motion.div 
          className="h-2 rounded-full bg-[#4aa3e8]/50"
          animate={{ width: ['0%', '60%'] }}
          transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
        />
      </div>
    )
  },
]

import { ArrowRight } from 'lucide-react'

export function CoreCapabilities() {
  return (
    <section id="capabilities" className="bg-[#050608] py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16">
          <h2 className="text-2xl font-medium tracking-tight text-white md:text-4xl">
            Core Capabilities
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="group relative flex h-[280px] flex-col overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-6 hover:bg-white/[0.04]"
            >
              <div className="mb-auto flex items-center justify-between">
                <div className="font-mono text-xs text-white/30">{feature.id}</div>
                <feature.icon className="h-4 w-4 text-white/30 transition-colors group-hover:text-[#4aa3e8]" />
              </div>

              {/* Abstract Visual Box */}
              <div className="absolute inset-x-0 bottom-24 top-16 opacity-50 transition-opacity group-hover:opacity-100">
                <feature.visual />
              </div>

              <div className="relative z-10 mt-auto pt-4">
                <h3 className="mb-1 text-lg font-medium text-white">{feature.title}</h3>
                <p className="text-sm text-white/40">{feature.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
