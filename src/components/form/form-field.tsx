import type { ReactNode } from 'react'
import { Label } from '@/components/ui/label'

// rótulo visível (o Figma tem rótulo acima do campo) + controle + mensagem ligada por aria-describedby
export function FormField({
  id,
  label,
  required = true,
  error,
  children,
}: {
  id: string
  label: string
  required?: boolean
  error?: string
  children: ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm">
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
