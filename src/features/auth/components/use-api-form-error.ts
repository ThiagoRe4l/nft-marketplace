import { useState } from 'react'
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import { toAppError } from '@/shared/api/errors'

// leva o erro da API para o formulário: fieldErrors nos campos conhecidos; sem campo para apontar, vira alerta geral
export function useApiFormError<T extends FieldValues>(setError: UseFormSetError<T>, fields: readonly Path<T>[]) {
  const [formError, setFormError] = useState<string | null>(null)

  const handle = (error: unknown) => {
    const { message, fieldErrors } = toAppError(error)
    let placed = false
    for (const field of fields) {
      const first = fieldErrors?.[field]?.[0]
      if (first) {
        setError(field, { type: 'server', message: first })
        placed = true
      }
    }
    setFormError(placed ? null : message)
  }

  return { formError, setFormError, handle }
}
