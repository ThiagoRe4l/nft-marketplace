import { MinusIcon, PlusIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

// "md": detalhe (botões de 33 px, número de 20 px); "sm": linha do carrinho (botões de 20 px, número de 17 px)
const sizes = {
  md: { button: 'size-[2.0625rem]', icon: 'size-4', value: 'min-w-3 text-xl' },
  sm: { button: 'size-5', icon: 'size-3.5', value: 'min-w-3 text-[1.0625rem]' },
}

// botão redondo na cor primária, com borda e sombra do Figma; o ::after amplia a área de clique
const buttonClass =
  "relative inline-flex shrink-0 items-center justify-center rounded-full border border-background bg-primary text-primary-foreground shadow-md shadow-background/15 outline-none transition-colors after:absolute after:-inset-1 max-md:after:-inset-2 after:content-[''] hover:bg-primary-hover focus-visible:ring-3 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40"

type QuantityStepperProps = {
  value: number
  max: number
  disabled?: boolean
  size?: keyof typeof sizes
  onChange: (value: number) => void
}

export function QuantityStepper({ value, max, disabled = false, size = 'md', onChange }: QuantityStepperProps) {
  const s = sizes[size]
  return (
    <div role="group" aria-label="Quantidade" className="flex items-center gap-3">
      <button
        type="button"
        className={cn(buttonClass, s.button)}
        aria-label="Diminuir quantidade"
        disabled={disabled || value <= 1}
        onClick={() => onChange(value - 1)}
      >
        <MinusIcon className={s.icon} />
      </button>
      <output aria-live="polite" className={cn('text-center leading-7', s.value)}>
        {value}
      </output>
      <button
        type="button"
        className={cn(buttonClass, s.button)}
        aria-label="Aumentar quantidade"
        disabled={disabled || value >= max}
        onClick={() => onChange(value + 1)}
      >
        <PlusIcon className={s.icon} />
      </button>
    </div>
  )
}
