import { motion } from 'framer-motion'

export function HowItWorks() {
  const steps = [
    {
      num: '01',
      title: 'Connect',
      desc: 'Live railway + environmental data'
    },
    {
      num: '02',
      title: 'Understand',
      desc: 'AI analyzes current conditions'
    },
    {
      num: '03',
      title: 'Predict',
      desc: 'Dynamic ETA and delay intelligence'
    },
    {
      num: '04',
      title: 'Act',
      desc: 'Recovery and alternative decisions'
    }
  ]

  return (
    <section id="how-it-works" className="bg-[#050608] py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-12 md:grid-cols-4">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="relative"
            >
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="absolute left-6 top-6 hidden h-[1px] w-full bg-white/10 md:block" />
              )}
              
              <div className="relative mb-6 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-[#050608] font-mono text-sm text-white">
                {step.num}
              </div>
              
              <h3 className="mb-2 text-lg font-medium text-white">{step.title}</h3>
              <p className="text-sm text-white/50">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
