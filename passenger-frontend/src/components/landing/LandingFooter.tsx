import { TrainFront } from 'lucide-react'

export function LandingFooter() {
  return (
    <footer className="bg-[#050608] border-t border-white/5 py-12">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          
          <div className="flex items-center gap-2 text-white">
            <TrainFront className="h-4 w-4 text-[#4aa3e8]" />
            <span className="font-semibold tracking-tight text-white/90">NexRail AI</span>
          </div>

          <div className="text-sm text-white/40">
            &copy; {new Date().getFullYear()} NexRail Intelligence. All rights reserved.
          </div>

          <div className="flex gap-6 text-sm text-white/40">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">API</a>
          </div>

        </div>
      </div>
    </footer>
  )
}
