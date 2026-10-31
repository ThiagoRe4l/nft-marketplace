import { MinusIcon, PlusIcon } from 'lucide-react'

const buttonClass =
  'inline-flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground outline-none transition-colors hover:bg-primary-hover focus-visible:ring-3 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40'

type QuantityStepperProps = {
  value: number
  max: number
  disabled?: boolean
  onChange: (value: number) => void
}

export function QuantityStepper({ value, max, disabled = false, onChange }: QuantityStepperProps) {
  return (
    <div role="group" aria-label="Quantidade" className="flex items-center gap-3">
      <button
        type="button"
        className={buttonClass}
        aria-label="Diminuir quantidade"
        disabled={disabled || value <= 1}
        onClick={() => onChange(value - 1)}
      >
        <MinusIcon className="size-4" />
      </button>
      <output aria-live="polite" className="min-w-5 text-center text-sm">
        {value}
      </output>
      <button
        type="button"
        className={buttonClass}
        aria-label="Aumentar quantidade"
        disabled={disabled || value >= max}
        onClick={() => onChange(value + 1)}
      >
        <PlusIcon className="size-4" />
      </button>
    </div>
  )
}
