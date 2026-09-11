import { Navigation2, ArrowRight } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardHint } from '@/components/ui/card'
import type { AlternativePlan } from '@/types/train'

export function AlternativePlannerPanel({ plan }: { plan: AlternativePlan | null | undefined }) {
  if (!plan) {
    return (
      <Card className="bg-surface">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Navigation2 className="h-5 w-5 text-accent" />
            <CardTitle>Smart Alternatives</CardTitle>
          </div>
          <CardHint>Faster travel options</CardHint>
        </CardHeader>
        <div className="mt-2 px-5 pb-6">
          <p className="text-sm text-muted">No faster alternative found.</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="bg-surface border-accent/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Navigation2 className="h-5 w-5 text-accent" />
          <CardTitle>Smart Alternatives</CardTitle>
        </div>
        <CardHint>Faster travel option available</CardHint>
      </CardHeader>
      <div className="mt-2 space-y-4 px-5 pb-6">
        <div className="rounded-lg border border-accent/20 bg-accent/5 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-ink">{plan.train_name}</p>
              <p className="text-xs font-medium text-muted">Train {plan.train_number}</p>
            </div>
            {plan.estimated_time_saved_minutes ? (
              <div className="rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-white">
                Save {plan.estimated_time_saved_minutes} min
              </div>
            ) : null}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs text-faint">Departs {plan.departure_station}</span>
              <span className="font-bold text-ink">{plan.departure_time}</span>
            </div>
            <ArrowRight className="h-4 w-4 text-muted" />
            <div className="flex flex-col items-end">
              <span className="text-xs text-faint">Arrives {plan.destination}</span>
              <span className="font-bold text-ink">{plan.arrival_time}</span>
            </div>
          </div>
          
          <div className="mt-3 border-t border-accent/10 pt-3">
            <p className="text-xs text-muted">{plan.reason}</p>
          </div>
        </div>
      </div>
    </Card>
  )
}
