import { useId, useState, type KeyboardEvent } from 'react'
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

  // não é um <form>: o mesmo bloco também aparece dentro do formulário do pagamento, e form dentro de form é inválido
  const submit = () => {
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

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return
    // Enter aqui aplica o cupom e nunca envia o formulário em volta
    event.preventDefault()
    submit()
  }

  return (
    <div role="group" aria-label="Cupom promocional">
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
          onKeyDown={onKeyDown}
          placeholder="Digite o código promocional..."
          autoComplete="off"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="h-10 rounded-r-none border-border-strong text-xs max-lg:rounded-l-full"
        />
        <Button type="button" onClick={submit} disabled={apply.isPending} className="h-10 rounded-l-none px-5 font-bold max-lg:rounded-r-full">
          Aplicar
        </Button>
      </div>
      <p id={errorId} aria-live="polite" className="mt-1.5 min-h-4 text-xs text-destructive">
        {error}
      </p>
    </div>
  )
}
