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
      <div className="flex max-lg:h-[3.125rem] max-lg:items-center max-lg:rounded-full max-lg:border max-lg:border-[#3F2319] max-lg:bg-[#241612] max-lg:pl-4 max-lg:shadow-[0_6px_20px_rgba(10,6,4,0.45)] max-lg:focus-within:ring-3 max-lg:focus-within:ring-ring">
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
          className="h-10 rounded-r-none border-border-strong text-xs max-lg:h-full max-lg:rounded-none max-lg:border-0 max-lg:bg-transparent max-lg:px-0 max-lg:text-[0.8125rem] max-lg:leading-[22px] max-lg:placeholder:text-[#B39463] max-lg:focus-visible:ring-0"
        />
        <Button type="button" onClick={submit} disabled={apply.isPending} className="h-10 rounded-l-none px-5 font-bold max-lg:h-full max-lg:w-[6.0625rem] max-lg:rounded-full max-lg:bg-[linear-gradient(93.11deg,rgb(210_138_76/0.7)_-0.94%,#D28A4C_105.02%)] max-lg:px-0 max-lg:text-[#140d0a] max-lg:hover:bg-[linear-gradient(93.11deg,rgb(210_138_76/0.7)_-0.94%,#D28A4C_105.02%)] max-lg:text-[0.9375rem]">
          Aplicar
        </Button>
      </div>
      <p id={errorId} aria-live="polite" className="mt-1.5 min-h-4 text-xs text-destructive max-lg:mt-0 max-lg:min-h-0">
        {error}
      </p>
    </div>
  )
}
