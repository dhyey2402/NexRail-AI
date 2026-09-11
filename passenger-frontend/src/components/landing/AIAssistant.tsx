import { motion } from 'framer-motion'
import { Bot, User } from 'lucide-react'

export function AIAssistant() {
  return (
    <section className="bg-[#050608] py-24 border-t border-white/5">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-16 lg:grid-cols-2 lg:gap-24 items-center">
          
          <div className="order-2 lg:order-1 relative h-[500px] w-full rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col justify-end overflow-hidden p-6">
            
            <motion.div 
              className="mb-4 flex gap-4 max-w-[85%] self-end"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="rounded-2xl rounded-tr-sm bg-white/10 px-4 py-3 text-sm text-white">
                Will my train reach Mumbai on time?
              </div>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20">
                <User className="h-4 w-4 text-white" />
              </div>
            </motion.div>

            <motion.div 
              className="flex gap-4 max-w-[90%]"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#4aa3e8]/20">
                <Bot className="h-4 w-4 text-[#4aa3e8]" />
              </div>
              <div className="rounded-2xl rounded-tl-sm border border-[#4aa3e8]/20 bg-[#4aa3e8]/5 px-4 py-3 text-sm leading-relaxed text-white/80">
                Train 12951 is currently <strong className="text-rose-400">18 minutes late</strong> passing Ahmedabad. 
                <br /><br />
                However, based on current track clearance and recovery buffers, the delay is expected to reduce to approximately <strong className="text-emerald-400">5 minutes</strong> by Mumbai Central.
              </div>
            </motion.div>

          </div>

          <div className="order-1 lg:order-2">
            <h2 className="mb-6 text-3xl font-medium tracking-tight text-white md:text-5xl">
              Ask NexRail what<br />
              <span className="text-white/40">happens next.</span>
            </h2>
            <p className="mb-8 text-lg text-white/50">
              A conversational interface grounded entirely in real telemetry. Get instant answers about delays, connecting trains, and station amenities without interpreting complex data.
            </p>
          </div>

        </div>
      </div>
    </section>
  )
}
