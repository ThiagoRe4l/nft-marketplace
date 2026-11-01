import type { ReactNode } from 'react'
import { Controller, type UseFormReturn } from 'react-hook-form'
import { FormField } from '@/components/form/form-field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Network } from '@/contracts/nft'
import { WalletType } from '@/contracts/wallet'
import { fieldProps } from '@/features/auth/components/field'
import { NETWORK_LABELS } from '@/features/catalog/components/labels'
import { WALLET_TYPE_LABELS } from '../labels'
import type { CheckoutValues } from '../schema'

const NETWORK_ITEMS = Network.options.map((value) => ({ value, label: NETWORK_LABELS[value] }))
const TYPE_ITEMS = WalletType.options.map((value) => ({ value, label: WALLET_TYPE_LABELS[value] }))

export function CheckoutFields({ form }: { form: UseFormReturn<CheckoutValues> }) {
  const {
    register,
    control,
    formState: { errors },
  } = form

  // props comuns dos campos de texto
  const text = (name: Exclude<keyof CheckoutValues, 'network' | 'type' | 'note' | 'walletId'>, required = true) => {
    const id = `checkout-${name}`
    const error = errors[name]?.message
    return {
      field: (children: ReactNode, label: string) => (
        <FormField id={id} label={label} error={error} required={required}>
          {children}
        </FormField>
      ),
      input: { ...fieldProps(id, error), 'aria-required': required || undefined, ...register(name) },
    }
  }

  const displayName = text('displayName')
  const profileName = text('profileName')
  const nickname = text('nickname')
  const address = text('address')
  const secondary = text('secondaryAddress', false)
  const email = text('email')
  const referral = text('referralCode')
  const ens = text('ensName')

  const selectField = (
    name: 'network' | 'type',
    label: string,
    placeholder: string,
    items: readonly { value: string; label: string }[],
  ) => {
    const id = `checkout-${name}`
    const error = errors[name]?.message
    return (
      <FormField id={id} label={label} error={error}>
        <Controller
          control={control}
          name={name}
          render={({ field }) => (
            <Select
              items={items}
              value={field.value || null}
              onValueChange={(value) => field.onChange(value ?? '')}
            >
              <SelectTrigger
                id={id}
                aria-required="true"
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? `${id}-error` : undefined}
                onBlur={field.onBlur}
                className="h-10 w-full border-border px-4 text-base data-[size=default]:h-10 md:text-sm"
              >
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                {items.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </FormField>
    )
  }

  const noteError = errors.note?.message

  return (
    <div>
      <h2 className="mb-4 text-base font-bold">Perfil do colecionador</h2>
      <div className="grid gap-x-8 gap-y-5 md:grid-cols-2">
        {displayName.field(<Input autoComplete="name" {...displayName.input} />, 'Nome de exibição')}
        {profileName.field(<Input autoComplete="username" {...profileName.input} />, 'Nome de usuário')}
        {selectField('network', 'Rede', 'Selecione uma rede', NETWORK_ITEMS)}
        {nickname.field(<Input {...nickname.input} />, 'Nome do perfil')}
        {address.field(
          <Input placeholder="Endereço 0x da carteira" autoComplete="off" spellCheck={false} {...address.input} />,
          'Endereço da carteira',
        )}
        {secondary.field(
          <Input
            placeholder="ENS ou endereço (opcional)"
            autoComplete="off"
            spellCheck={false}
            {...secondary.input}
          />,
          'Carteira secundária',
        )}
        {selectField('type', 'Tipo de carteira', 'Selecione uma carteira', TYPE_ITEMS)}
        {referral.field(<Input autoComplete="off" {...referral.input} />, 'Código de indicação')}
        {email.field(<Input type="email" autoComplete="email" {...email.input} />, 'E-mail')}
        {ens.field(
          <div className="flex">
            <Input autoComplete="off" spellCheck={false} {...ens.input} className={`${ens.input.className} rounded-r-none`} />
            <span className="inline-flex h-10 items-center rounded-r-lg border border-l-0 border-border px-3 text-sm text-muted-foreground">
              .eth
            </span>
          </div>,
          'Nome ENS',
        )}
      </div>

      <div className="mt-5 space-y-1.5">
        <Label htmlFor="checkout-note" className="text-sm">
          Observação do colecionador (opcional)
        </Label>
        <Textarea
          id="checkout-note"
          rows={5}
          maxLength={500}
          aria-invalid={noteError ? true : undefined}
          aria-describedby={noteError ? 'checkout-note-error' : undefined}
          className="min-h-32 border-border bg-transparent md:max-w-md"
          {...register('note')}
        />
        {noteError && (
          <p id="checkout-note-error" className="text-xs text-destructive">
            {noteError}
          </p>
        )}
      </div>
    </div>
  )
}
