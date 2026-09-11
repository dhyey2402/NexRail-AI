import { motion } from 'framer-motion'
import { CloudRain, CloudLightning, Sun } from 'lucide-react'

export function WeatherIntelligence() {
  return (
    <section className="bg-[#050608] py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-medium tracking-tight text-white md:text-5xl">
            Weather-Aware Intelligence
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/40">
            Real-time environmental telemetry integrated directly into the route prediction engine.
          </p>
        </div>

        <div className="mx-auto max-w-4xl rounded-2xl border border-white/5 bg-white/[0.02] p-8 md:p-12">
          <div className="flex flex-col md:flex-row gap-12 items-center justify-center">
            
            <div className="flex-1 w-full space-y-6 relative before:absolute before:left-3 before:top-4 before:bottom-4 before:w-[1px] before:bg-white/10">
              <div className="relative flex items-center gap-6 pl-10">
                <div className="absolute left-1.5 h-3 w-3 rounded-full bg-white/20 border-2 border-[#050608]" />
                <div className="flex-1">
                  <div className="text-white">Ahmedabad</div>
                </div>
                <div className="flex items-center gap-2 text-white/50">
                  <Sun className="h-4 w-4 text-amber-400" />
                  <span className="text-sm">Clear</span>
                </div>
              </div>

              <div className="relative flex items-center gap-6 pl-10">
                <div className="absolute left-1.5 h-3 w-3 rounded-full bg-rose-500 border-2 border-[#050608]" />
                <div className="flex-1">
                  <div className="text-white">Vadodara</div>
                </div>
                <div className="flex items-center gap-2 text-white/50">
                  <CloudLightning className="h-4 w-4 text-rose-400" />
                  <span className="text-sm text-rose-400">Storm</span>
                </div>
              </div>

              <div className="relative flex items-center gap-6 pl-10">
                <div className="absolute left-1.5 h-3 w-3 rounded-full bg-amber-400 border-2 border-[#050608]" />
                <div className="flex-1">
                  <div className="text-white">Surat</div>
                </div>
                <div className="flex items-center gap-2 text-white/50">
                  <CloudRain className="h-4 w-4 text-amber-400" />
                  <span className="text-sm text-amber-400">Rain</span>
                </div>
              </div>
            </div>

            <motion.div 
              className="w-full md:w-64 rounded-xl border border-rose-500/20 bg-rose-500/5 p-6 backdrop-blur-md"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              <div className="mb-4 font-mono text-xs text-rose-400/80">WEATHER RISK</div>
              <div className="text-3xl font-medium text-rose-400">High</div>
              <div className="mt-4 border-t border-rose-500/20 pt-4">
                <div className="text-sm text-rose-400/80">Expected Impact</div>
                <div className="font-mono text-lg text-rose-400">+12–18 min</div>
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </section>
  )
}
