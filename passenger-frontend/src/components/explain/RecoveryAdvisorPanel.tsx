import { Wrench, Clock } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardHint } from '@/components/ui/card'
import type { RecoveryAdvice } from '@/types/train'

export function RecoveryAdvisorPanel({ advice }: { advice: RecoveryAdvice[] | undefined }) {
  if (!advice || advice.length === 0) {
    return null
  }

  return (
    <Card className="bg-surface">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Wrench className="h-5 w-5 text-accent" />
          <CardTitle>Recovery Advisor</CardTitle>
        </div>
        <CardHint>Recommended operational interventions</CardHint>
      </CardHeader>
      <div className="mt-4 space-y-3 px-5 pb-6">
        {advice.map((item, i) => (
          <div key={i} className="flex gap-3 rounded-lg border border-border bg-ground p-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-ink">{item.action}</p>
              <p className="mt-1 text-xs text-muted">{item.reason}</p>
              {item.affected_station && (
                <p className="mt-1 text-xs text-faint">Area: {item.affected_station}</p>
              )}
            </div>
            {item.estimated_recovery_minutes ? (
              <div className="flex flex-col items-end justify-center rounded bg-ok/10 px-3 py-1 text-ok">
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide">
                  <Clock className="h-3 w-3" />
                  Save
                </span>
                <span className="text-sm font-bold">
                  {item.estimated_recovery_minutes} min
                </span>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </Card>
  )
}
