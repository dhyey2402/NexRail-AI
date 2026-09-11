import { Brain, Sparkles } from 'lucide-react'
import { Card, CardHint, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/common/States'
import type { Prediction } from '@/types/train'

export function ReasoningPanel({ prediction }: { prediction: Prediction }) {
  if (!prediction.reasoning || prediction.reasoning.length === 0) {
    return (
      <Card className="h-full bg-surface pb-6">
        <CardHeader>
          <div>
            <CardTitle>AI Reasoning</CardTitle>
            <CardHint>How the model arrived at this ETA</CardHint>
          </div>
          <Sparkles className="h-4 w-4 text-accent" />
        </CardHeader>
        <div className="mt-2 px-5 pb-5">
          <EmptyState
            title="Reasoning Unavailable"
            message="The ML model did not return any specific contributing factors for this prediction."
          />
        </div>
      </Card>
    )
  }

  return (
    <Card className="h-full bg-surface">
      <CardHeader>
        <div>
          <CardTitle>AI Reasoning</CardTitle>
          <CardHint>Key factors driving the predicted ETA</CardHint>
        </div>
        <Brain className="h-4 w-4 text-accent" />
      </CardHeader>

      <ul className="mt-4 space-y-3 px-5 pb-5">
        {prediction.reasoning.map((item, i) => (
          <li key={i} className="flex gap-3">
            <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent/60" />
            <p className="text-sm text-muted">{item}</p>
          </li>
        ))}
      </ul>
    </Card>
  )
}
