import type { ReactNode } from 'react'
import { Label } from '@/components/ui/label'

// rótulo visível (o Figma tem rótulo acima do campo) + controle + mensagem ligada por aria-describedby
export function FormField({
  id,
  label,
  required = true,
  error,
  hideLabel = false,
  children,
}: {
  id: string
  label: string
  required?: boolean
  error?: string
  /** sem rótulo visível (o Figma deixa só o placeholder); o rótulo continua no DOM, só para leitores de tela */
  hideLabel?: boolean
  children: ReactNode
}) {
  return (
    // com rótulo oculto o campo se alinha à base da linha, como o vizinho que tem rótulo
    <div className={hideLabel ? 'flex flex-col justify-end space-y-1.5' : 'space-y-1.5'}>
      <Label htmlFor={id} className={hideLabel ? 'sr-only' : 'text-sm md:text-[0.9375rem]'}>
        {label}
        {required && (
          <span aria-hidden="true" className="text-primary">
            {' '}
            *
          </span>
        )}
      </Label>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
