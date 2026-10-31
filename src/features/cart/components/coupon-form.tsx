import { useId, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useApplyCoupon, useRemoveCoupon } from '@/features/cart/queries'
import { toAppError } from '@/shared/api/errors'

export function CouponForm({ couponCode }: { couponCode: string | null }) {
  const apply = useApplyCoupon()
  const remove = useRemoveCoupon()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const inputId = useId()
  const errorId = `${inputId}-error`

  if (couponCode) {
    return (
      <div className="flex items-center justify-between gap-3 text-sm">
        <p>
          Cupom aplicado: <strong className="text-primary">{couponCode}</strong>
        </p>
        <Button
          type="button"
          variant="outline"
          disabled={remove.isPending}
          onClick={() => remove.mutate(undefined, { onError: (e) => toast.error(toAppError(e).message) })}
        >
          Remover cupom
        </Button>
      </div>
    )
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const trimmed = code.trim()
    if (!trimmed) {
      setError('Informe o cupom')
      return
    }
    apply.mutate(trimmed, {
      onSuccess: () => {
        setCode('')
        setError(null)
      },
      onError: (e) => setError(toAppError(e).message),
    })
  }

  return (
    <form onSubmit={submit} noValidate>
      <Label htmlFor={inputId} className="mb-2 text-xs font-bold max-lg:sr-only">
        Código promocional
      </Label>
      <div className="flex">
        <Input
          id={inputId}
          value={code}
          onChange={(event) => {
            setCode(event.target.value)
            setError(null)
          }}
          placeholder="Digite o código promocional..."
          autoComplete="off"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="h-10 rounded-r-none border-border-strong text-xs max-lg:rounded-l-full"
        />
        <Button type="submit" disabled={apply.isPending} className="h-10 rounded-l-none px-5 font-bold max-lg:rounded-r-full">
          Aplicar
        </Button>
      </div>
      <p id={errorId} aria-live="polite" className="mt-1.5 min-h-4 text-xs text-destructive">
        {error}
      </p>
    </form>
  )
}
