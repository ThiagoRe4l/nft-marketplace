import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import type { Wallet } from '@/contracts/wallet'
import { useApiFormError } from '@/features/auth/components/use-api-form-error'
import { useUpsertWallet } from '../mutations'
import {
  EMPTY_WALLET,
  WALLET_FIELD_KEYS,
  WalletFormSchema,
  walletToValues,
  type WalletFormValues,
} from '../wallet-schema'
import { useFocusFirstError } from './use-focus-first-error'
import { WalletFields } from './wallet-fields'

const COPY = {
  primary: {
    title: 'Carteira principal',
    description: 'Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.',
    empty: 'Você ainda não adicionou uma carteira principal.',
    saved: 'Carteira principal salva',
  },
  secondary: {
    title: 'Carteira secundária',
    description: null,
    empty: 'Você ainda não adicionou uma carteira secundária.',
    saved: 'Carteira secundária salva',
  },
} as const

// Uma carteira (por slot): estado vazio com "Adicionar" ou formulário (preenchido, se já existir).
export function WalletSection({
  slot,
  wallet,
  primary,
}: {
  slot: Wallet['slot']
  wallet: Wallet | undefined
  primary?: Wallet
}) {
  const copy = COPY[slot]
  const upsert = useUpsertWallet()
  const [adding, setAdding] = useState(false)
  const open = wallet !== undefined || adding
  const saved = wallet ? walletToValues(wallet) : undefined

  const form = useForm<WalletFormValues>({
    resolver: zodResolver(WalletFormSchema),
    defaultValues: saved ?? EMPTY_WALLET,
  })
  const { formError, setFormError, handle } = useApiFormError(form.setError, WALLET_FIELD_KEYS)
  const { ref, focus } = useFocusFirstError()
  const titleId = `wallet-${slot}-title`

  // "igual à principal" é derivado: marcado enquanto todos os campos coincidem com os da principal
  const values = useWatch({ control: form.control })
  const primaryValues = primary ? walletToValues(primary) : undefined
  const sameAsPrimary = !!primaryValues && WALLET_FIELD_KEYS.every((key) => values[key] === primaryValues[key])

  const toggleSame = (checked: boolean) => {
    if (!primaryValues) return
    setAdding(true)
    form.clearErrors()
    form.reset(checked ? primaryValues : (saved ?? EMPTY_WALLET), { keepDefaultValues: true })
  }

  const submit = form.handleSubmit((input) => {
    setFormError(null)
    upsert.mutate(
      { slot, input: { ...input, secondaryAddress: input.secondaryAddress.trim() || null } },
      {
        onSuccess: (result) => {
          form.reset(walletToValues(result))
          toast.success(copy.saved)
        },
        onError: (error) => {
          handle(error)
          focus()
        },
      },
    )
  }, focus)

  return (
    <section aria-labelledby={titleId} className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
        <div>
          <h2 id={titleId} className="text-base font-bold">
            {copy.title}
          </h2>
          {copy.description && <p className="mt-1 text-xs text-muted-foreground">{copy.description}</p>}
        </div>
        <div className="flex items-center gap-4">
          {slot === 'secondary' && (
            <label className="flex items-center gap-2 text-xs">
              <Checkbox checked={sameAsPrimary} disabled={!primary} onCheckedChange={toggleSame} />
              Igual à carteira principal
            </label>
          )}
          {!open && (
            <Button type="button" variant="link" className="h-auto p-0 font-bold" onClick={() => setAdding(true)}>
              Adicionar
            </Button>
          )}
        </div>
      </div>

      {open ? (
        <form ref={ref} onSubmit={submit} noValidate aria-labelledby={titleId} className="space-y-5">
          {formError && (
            <p role="alert" className="border border-destructive/50 p-3 text-sm text-destructive">
              {formError}
            </p>
          )}
          <WalletFields form={form} prefix={`wallet-${slot}`} />
          <div className="flex gap-3">
            <Button type="submit" size="lg" className="h-10 px-6 font-bold" disabled={upsert.isPending}>
              {upsert.isPending ? 'Salvando...' : 'Salvar carteira'}
            </Button>
            {!wallet && (
              <Button
                type="button"
                variant="ghost"
                size="lg"
                className="h-10"
                onClick={() => {
                  setAdding(false)
                  form.reset(EMPTY_WALLET)
                }}
              >
                Cancelar
              </Button>
            )}
          </div>
        </form>
      ) : (
        <p className="text-xs text-muted-foreground">{copy.empty}</p>
      )}
    </section>
  )
}
