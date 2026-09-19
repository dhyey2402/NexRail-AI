import { motion } from 'framer-motion'

export function HowItWorks() {
  const steps = [
    { num: '01', title: 'Connect', desc: 'Live railway and environmental data feeds' },
    { num: '02', title: 'Analyze', desc: 'AI processes current network conditions' },
    { num: '03', title: 'Predict', desc: 'Dynamic ETA with delay intelligence' },
    { num: '04', title: 'Act', desc: 'Recovery plans and alternative routes' },
  ]

  return (
    <section id="how-it-works" className="bg-bg py-20 border-t border-border">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mb-12">
          <h2 className="text-xl font-semibold tracking-tight text-ink md:text-2xl">
            How It Works
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="relative"
            >
              {i < steps.length - 1 && (
                <div className="absolute left-6 top-5 hidden h-px w-full bg-border lg:block" />
              )}
              
              <div className="relative mb-4 flex h-10 w-10 items-center justify-center rounded-md border border-border bg-surface font-mono text-[12px] font-semibold text-accent">
                {step.num}
              </div>
              
              <h3 className="mb-1 text-[14px] font-semibold text-ink">{step.title}</h3>
              <p className="text-[12px] text-muted leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
