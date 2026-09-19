import { Train } from 'lucide-react'

export function LandingFooter() {
  return (
    <footer className="bg-bg border-t border-border py-8">
      <div className="mx-auto max-w-5xl px-6">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2 text-ink">
            <Train className="h-3.5 w-3.5 text-accent" />
            <span className="text-[13px] font-semibold tracking-tight">NexRail AI</span>
          </div>

          <div className="text-[11px] text-faint">
            &copy; {new Date().getFullYear()} NexRail AI — Smart India Hackathon 2026
          </div>
        </div>
      </div>
    </footer>
  )
}
