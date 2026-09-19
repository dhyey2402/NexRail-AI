import { motion } from 'framer-motion'
import { NavLink } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

export function FinalCTA() {
  return (
    <section className="relative overflow-hidden bg-bg py-24 border-t border-border">
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="mb-4 text-2xl font-semibold tracking-tight text-ink md:text-4xl">
            Ready to track<br />
            <span className="text-muted">your next journey?</span>
          </h2>
          <p className="mx-auto mb-8 max-w-md text-[14px] text-muted">
            Get real-time AI predictions for any Indian Railways train.
          </p>
          
          <NavLink
            to="/search"
            className="group inline-flex items-center gap-2 rounded-md bg-accent px-6 py-2.5 text-[13px] font-medium text-white transition-all hover:bg-accent/90"
          >
            Track a Train
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </NavLink>
        </motion.div>
      </div>
    </section>
  )
}
