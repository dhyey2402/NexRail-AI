import { motion } from 'framer-motion'
import { NavLink } from 'react-router-dom'

export function FinalCTA() {
  return (
    <section className="relative overflow-hidden bg-[#050608] py-32 md:py-48">
      {/* Background radial glow */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#4aa3e8]/5 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="mb-6 text-4xl font-medium tracking-tight text-white md:text-6xl lg:text-7xl">
            Make every journey<br />
            <span className="text-white/40">more predictable.</span>
          </h2>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-white/50">
            Experience railway intelligence built for the journey ahead.
          </p>
          
          <NavLink
            to="/search"
            className="inline-block rounded-full bg-white px-8 py-4 text-sm font-medium text-black transition-all hover:bg-white/90 hover:scale-105"
          >
            Launch NexRail AI
          </NavLink>
        </motion.div>
      </div>

      {/* Abstract tracks fading into the distance */}
      <div className="absolute bottom-0 left-0 right-0 h-48 opacity-30 flex justify-center pointer-events-none">
        <svg className="w-[300px] h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M 0 100 L 45 0 M 100 100 L 55 0" stroke="white" strokeWidth="0.5" fill="none" className="opacity-20" />
          <path d="M 10 100 L 90 100 M 20 80 L 80 80 M 30 60 L 70 60 M 38 40 L 62 40 M 43 20 L 57 20" stroke="white" strokeWidth="0.5" fill="none" className="opacity-10" />
        </svg>
      </div>
    </section>
  )
}
