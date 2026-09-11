import { useState, type FormEvent } from 'react'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type SearchBarProps = {
  initialValue?: string
  onSubmit: (trainNumber: string) => void
  size?: 'default' | 'large'
}

export function SearchBar({ initialValue = '', onSubmit, size = 'default' }: SearchBarProps) {
  const [value, setValue] = useState(initialValue)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const next = value.replace(/\s/g, '')
    if (!next) return
    onSubmit(next)
  }

  return (
    <form onSubmit={handleSubmit} className={cn('flex w-full gap-2', size === 'large' && 'sm:gap-3')}>
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          inputMode="numeric"
          placeholder="Enter train number"
          aria-label="Train number"
          className={cn(
            'w-full rounded-[10px] border border-border bg-surface-2 pl-10 pr-3 text-sm text-ink outline-none placeholder:text-faint focus:border-accent',
            size === 'large' ? 'h-12' : 'h-10',
          )}
        />
      </div>
      <Button type="submit" size={size === 'large' ? 'lg' : 'default'}>
        Track Train
      </Button>
    </form>
  )
}
