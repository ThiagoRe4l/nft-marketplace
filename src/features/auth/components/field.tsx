import type { ReactNode } from 'react'

// rótulo (visível só para leitores de tela: o Figma usa placeholder) + controle + mensagem ligada por aria-describedby
export function Field({
  id,
  label,
  error,
  children,
}: {
  id: string
  label: string
  error?: string
  children: ReactNode
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

export const fieldProps = (id: string, error?: string) => ({
  id,
  'aria-invalid': error ? true : undefined,
  'aria-describedby': error ? `${id}-error` : undefined,
  className: 'h-10 border-border bg-transparent px-4 focus-visible:border-primary md:text-sm dark:bg-transparent max-md:h-[50px] max-md:rounded-[10px] max-md:text-sm max-md:placeholder:text-soft-text',
})
