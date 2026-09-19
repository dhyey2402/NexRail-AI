import { motion } from 'framer-motion'
import { Route, Zap, Cloud, Bot, Clock, BarChart3 } from 'lucide-react'

const features = [
  {
    title: 'Dynamic ETA',
    desc: 'AI-powered arrival time predictions that update in real-time based on current conditions.',
    icon: Clock,
  },
  {
    title: 'Delay Propagation',
    desc: 'See how delays spread through the network and impact your journey.',
    icon: BarChart3,
  },
  {
    title: 'Recovery Intelligence',
    desc: 'Identify opportunities to recover lost time along the corridor.',
    icon: Zap,
  },
  {
    title: 'Smart Alternatives',
    desc: 'Find faster routes and alternative trains when plans change.',
    icon: Route,
  },
  {
    title: 'Weather Intelligence',
    desc: 'Understand how weather conditions impact train operations.',
    icon: Cloud,
  },
  {
    title: 'AI Assistant',
    desc: 'Ask NexRail what happens next — plain language journey insights.',
    icon: Bot,
  },
]

export function CoreCapabilities() {
  return (
    <section id="features" className="bg-bg py-20">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mb-12">
          <h2 className="text-xl font-semibold tracking-tight text-ink md:text-2xl">
            What NexRail Does
          </h2>
          <p className="text-[14px] text-muted mt-2 max-w-lg">
            Built for Indian Railways passengers who need reliable arrival information.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className="group rounded-md border border-border bg-surface p-5 hover:border-border-strong transition-colors"
            >
              <div className="flex items-center gap-3 mb-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-surface-2 border border-border text-muted group-hover:text-accent transition-colors shrink-0">
                  <feature.icon className="h-4 w-4" />
                </div>
                <h3 className="text-[13px] font-semibold text-ink">{feature.title}</h3>
              </div>
              <p className="text-[12px] text-muted leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
