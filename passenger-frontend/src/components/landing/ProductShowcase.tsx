import { motion } from 'framer-motion'
import { MapPin, Clock, ShieldAlert } from 'lucide-react'

export function ProductShowcase() {
  return (
    <section className="relative overflow-hidden bg-[#050608] py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-medium tracking-tight text-white md:text-5xl">
            Live Intelligence
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/40">
            A glimpse into the active intelligence engine.
          </p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-[#0a0c10] shadow-[0_0_50px_rgba(74,163,232,0.05)]"
        >
          {/* Mock Window Header */}
          <div className="flex items-center gap-2 border-b border-white/5 bg-white/[0.02] px-4 py-3">
            <div className="flex gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
              <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
              <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
            </div>
            <div className="mx-auto font-mono text-[10px] text-white/20 uppercase tracking-widest">
              Live Network
            </div>
          </div>

          <div className="p-6 md:p-10">
            {/* Top Bar */}
            <div className="mb-8 flex items-end justify-between border-b border-white/5 pb-4">
              <div>
                <div className="mb-1 font-mono text-xs text-[#4aa3e8]">TRAIN 12951</div>
                <h3 className="text-xl font-medium text-white md:text-2xl">Mumbai Central → New Delhi</h3>
              </div>
              <div className="text-right hidden sm:block">
                <div className="mb-1 font-mono text-xs text-white/30">STATUS</div>
                <div className="inline-flex items-center gap-2 rounded-full bg-rose-500/10 px-2.5 py-1 text-sm text-rose-400">
                  <div className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                  Delayed
                </div>
              </div>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {/* Stats */}
              <div className="space-y-6">
                <div>
                  <div className="mb-1 flex items-center gap-2 text-sm text-white/40">
                    <MapPin className="h-4 w-4" />
                    Currently At
                  </div>
                  <div className="text-lg text-white">Ahmedabad (ADI)</div>
                </div>
                <div>
                  <div className="mb-1 flex items-center gap-2 text-sm text-white/40">
                    <Clock className="h-4 w-4" />
                    Current Delay
                  </div>
                  <div className="text-lg text-rose-400">+18 min</div>
                </div>
                <div>
                  <div className="mb-1 flex items-center gap-2 text-sm text-white/40">
                    <ShieldAlert className="h-4 w-4" />
                    Delay Risk
                  </div>
                  <div className="text-lg text-amber-400">Moderate</div>
                </div>
              </div>

              {/* Timeline */}
              <div className="md:col-span-2">
                <div className="mb-4 font-mono text-xs text-white/30">PREDICTED ARRIVALS</div>
                <div className="relative border-l border-white/10 pl-6">
                  {/* Current */}
                  <div className="absolute left-[-5px] top-1.5 h-2.5 w-2.5 rounded-full border border-[#0a0c10] bg-[#4aa3e8]" />
                  <div className="mb-6">
                    <div className="flex items-center justify-between">
                      <div className="text-white">Ahmedabad</div>
                      <div className="font-mono text-[#4aa3e8]">Arrived</div>
                    </div>
                  </div>

                  {/* Next */}
                  <div className="absolute left-[-3.5px] top-[3.7rem] h-1.5 w-1.5 rounded-full bg-rose-500" />
                  <div className="mb-6">
                    <div className="flex items-center justify-between">
                      <div className="text-white/80">Vadodara</div>
                      <div className="text-right">
                        <div className="font-mono text-white/80">14:22</div>
                        <div className="text-xs text-rose-400">+16 min</div>
                      </div>
                    </div>
                  </div>

                  {/* Future */}
                  <div className="absolute left-[-3.5px] top-[8.1rem] h-1.5 w-1.5 rounded-full bg-amber-400" />
                  <div className="mb-6">
                    <div className="flex items-center justify-between">
                      <div className="text-white/60">Surat</div>
                      <div className="text-right">
                        <div className="font-mono text-white/60">16:45</div>
                        <div className="text-xs text-amber-400">+08 min</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Dest */}
                  <div className="absolute left-[-3.5px] bottom-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="text-white/40">Mumbai Central</div>
                      <div className="text-right">
                        <div className="font-mono text-white/40">20:30</div>
                        <div className="text-xs text-emerald-400">On Time</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
