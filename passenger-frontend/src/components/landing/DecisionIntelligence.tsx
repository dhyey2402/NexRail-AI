import { motion } from 'framer-motion'


export function DecisionIntelligence() {
  return (
    <section className="bg-[#050608] py-32 border-t border-white/5">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-16 lg:grid-cols-2 lg:gap-24 items-center">
          
          <div>
            <h2 className="mb-6 text-3xl font-medium tracking-tight text-white md:text-5xl">
              What happens when<br />
              <span className="text-white/40">the journey changes?</span>
            </h2>
            <p className="mb-8 text-lg text-white/50">
              NexRail doesn't just predict problems. It helps you respond to them. When delays occur, the engine instantly calculates recovery opportunities and smart alternative routes.
            </p>
            
            <div className="space-y-4 border-l border-white/10 pl-6">
              <div className="flex items-center gap-4 text-white/40 opacity-50">
                <div className="font-mono text-xs">01</div>
                <div>Delay Propagates</div>
              </div>
              <div className="flex items-center gap-4 text-emerald-400">
                <div className="font-mono text-xs">02</div>
                <div>Recovery Opportunity Identified</div>
              </div>
              <div className="flex items-center gap-4 text-white">
                <div className="font-mono text-xs">03</div>
                <div>Alternative Route Suggested</div>
              </div>
            </div>
          </div>

          {/* Visual abstract */}
          <div className="relative h-[400px] w-full rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center overflow-hidden">
             {/* Main Route */}
             <div className="absolute left-10 right-10 h-1 bg-white/10 rounded-full">
               <motion.div 
                 className="absolute left-0 top-0 h-full bg-rose-500" 
                 initial={{ width: "0%" }}
                 whileInView={{ width: "40%" }}
                 transition={{ duration: 1, delay: 0.5 }}
               />
               <motion.div 
                 className="absolute left-[40%] top-0 h-full bg-emerald-400" 
                 initial={{ width: "0%" }}
                 whileInView={{ width: "20%" }}
                 transition={{ duration: 0.8, delay: 1.5 }}
               />
             </div>
             
             {/* Branch Route */}
             <motion.svg 
               className="absolute inset-0 h-full w-full"
               initial={{ opacity: 0 }}
               whileInView={{ opacity: 1 }}
               transition={{ delay: 2.5 }}
             >
               <path 
                 d="M 40% 50% Q 50% 30% 60% 30% T 80% 50%" 
                 fill="none" 
                 stroke="#4aa3e8" 
                 strokeWidth="3" 
                 strokeDasharray="6 6"
                 className="opacity-60"
               />
             </motion.svg>
             
             {/* Nodes */}
             <div className="absolute left-[40%] h-4 w-4 rounded-full bg-white border-4 border-[#050608] z-10" />
             <div className="absolute left-[80%] h-4 w-4 rounded-full bg-white border-4 border-[#050608] z-10" />
             
             <motion.div 
               className="absolute left-[60%] top-[25%] bg-[#4aa3e8]/20 text-[#4aa3e8] px-3 py-1 text-xs font-mono rounded-full border border-[#4aa3e8]/30 backdrop-blur-md"
               initial={{ opacity: 0, y: 10 }}
               whileInView={{ opacity: 1, y: 0 }}
               transition={{ delay: 2.8 }}
             >
               +12m Saved
             </motion.div>
          </div>

        </div>
      </div>
    </section>
  )
}
