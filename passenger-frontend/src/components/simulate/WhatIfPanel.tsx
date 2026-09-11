import { useState } from 'react'
import { ArrowRight, Beaker, Calculator } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardHint } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { simulateScenario, SCENARIOS } from '@/services/api'
import type { Prediction, SimulationResult, TrainLive } from '@/types/train'

type WhatIfPanelProps = {
  train: TrainLive
  prediction: Prediction
}

export function WhatIfPanel({ train, prediction }: WhatIfPanelProps) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SimulationResult | null>(null)
  const [activeScenario, setActiveScenario] = useState<string | null>(null)

  const handleSimulate = async (scenarioId: string) => {
    setLoading(true)
    setActiveScenario(scenarioId)
    try {
      const res = await simulateScenario(train, scenarioId)
      setResult(res)
      toast.success('Simulation complete')
    } catch (error) {
      toast.error('Simulation failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
      setResult(null)
      setActiveScenario(null)
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setResult(null)
    setActiveScenario(null)
  }

  return (
    <Card className="bg-surface pb-6">
      <CardHeader>
        <div className="flex w-full items-start justify-between">
          <div>
            <CardTitle>What-If Simulator</CardTitle>
            <CardHint>Test how network events impact arrival time</CardHint>
          </div>
          <Beaker className="h-4 w-4 text-accent" />
        </div>
      </CardHeader>

      <div className="mt-2 px-5 pb-2">
        <p className="text-sm leading-6 text-muted">
          Select a hypothetical operating scenario to re-run the ML prediction pipeline live.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {SCENARIOS.map((scenario) => {
            const isSelected = activeScenario === scenario.id
            return (
              <button
                key={scenario.id}
                disabled={loading}
                onClick={() => handleSimulate(scenario.id)}
                className={`flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all ${
                  isSelected
                    ? 'border-accent bg-accent/5 ring-1 ring-accent'
                    : 'border-border bg-surface hover:border-accent/40'
                } ${loading && !isSelected ? 'opacity-50' : ''}`}
              >
                <div className="flex w-full items-center justify-between">
                  <span
                    className={`text-sm font-medium ${
                      isSelected ? 'text-accent' : 'text-ink'
                    }`}
                  >
                    {scenario.label}
                  </span>
                  {isSelected && loading && (
                    <Calculator className="h-4 w-4 animate-pulse text-accent" />
                  )}
                </div>
                <span className="text-xs text-muted line-clamp-2">
                  {scenario.description}
                </span>
              </button>
            )
          })}
        </div>

        {result && (
          <div className="mt-6 animate-in slide-in-from-bottom-2 fade-in duration-300">
            <div className="rounded-[14px] border border-accent/20 bg-accent/5 p-5">
              <div className="flex items-start gap-4">
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10">
                  <Calculator className="h-4 w-4 text-accent" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-ink">Simulation Result</h4>
                  <p className="mt-1 text-sm text-muted">{result.impact}</p>

                  <div className="mt-4 flex flex-wrap items-center gap-4 sm:gap-6">
                    <div>
                      <p className="text-xs text-faint">Original ETA</p>
                      <p className="mt-1 font-mono text-lg font-medium text-ink">
                        {prediction.predictedEta}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted" />
                    <div>
                      <p className="text-xs text-faint">Simulated ETA</p>
                      <p className="mt-1 font-mono text-lg font-semibold text-danger">
                        {result.newEta}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex justify-end">
                    <Button variant="secondary" size="sm" onClick={reset}>
                      Reset
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
