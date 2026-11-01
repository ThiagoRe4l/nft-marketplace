import type { ComponentProps } from 'react'
import { Controller, type UseFormReturn } from 'react-hook-form'
import { FormField } from '@/components/form/form-field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Network } from '@/contracts/nft'
import { WalletType } from '@/contracts/wallet'
import { fieldProps } from '@/features/auth/components/field'
import { NETWORK_LABELS } from '@/features/catalog/components/labels'
import { WALLET_TYPE_LABELS } from '@/features/checkout/labels'
import type { WalletFormValues } from '../wallet-schema'

const NETWORK_ITEMS = Network.options.map((value) => ({ value, label: NETWORK_LABELS[value] }))
const TYPE_ITEMS = WalletType.options.map((value) => ({ value, label: WALLET_TYPE_LABELS[value] }))

type TextName = Exclude<keyof WalletFormValues, 'network' | 'type'>

// campos do formulário de carteira, na ordem do Figma; prefix mantém os ids únicos entre as duas carteiras
export function WalletFields({ form, prefix }: { form: UseFormReturn<WalletFormValues>; prefix: string }) {
  const {
    register,
    control,
    formState: { errors },
  } = form

  const text = (name: TextName, label: string, extra?: ComponentProps<'input'>, required = true) => {
    const id = `${prefix}-${name}`
    const error = errors[name]?.message
    return (
      <FormField id={id} label={label} error={error} required={required}>
        <Input
          {...fieldProps(id, error)}
          aria-required={required || undefined}
          autoComplete="off"
          {...extra}
          {...register(name)}
        />
      </FormField>
    )
  }

  const select = (
    name: 'network' | 'type',
    label: string,
    placeholder: string,
    items: readonly { value: string; label: string }[],
  ) => {
    const id = `${prefix}-${name}`
    const error = errors[name]?.message
    return (
      <FormField id={id} label={label} error={error}>
        <Controller
          control={control}
          name={name}
          render={({ field }) => (
            <Select items={items} value={field.value || null} onValueChange={(value) => field.onChange(value ?? '')}>
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

  const ensId = `${prefix}-ensName`
  const ensError = errors.ensName?.message
  const ensProps = fieldProps(ensId, ensError)

  return (
    <div className="grid gap-x-8 gap-y-5 md:grid-cols-2">
      {text('displayName', 'Nome de exibição', { autoComplete: 'name' })}
      {text('nickname', 'Apelido da carteira')}
      {select('network', 'Rede', 'Selecione uma rede', NETWORK_ITEMS)}
      {text('profileName', 'Nome do perfil')}
      {text('address', 'Endereço da carteira', { placeholder: 'Endereço 0x da carteira', spellCheck: false })}
      {text(
        'secondaryAddress',
        'ENS ou carteira secundária',
        { placeholder: 'ENS ou carteira secundária (opcional)', spellCheck: false },
        false,
      )}
      {select('type', 'Tipo de carteira', 'Selecione uma carteira', TYPE_ITEMS)}
      {text('referralCode', 'Código de indicação')}
      {text('email', 'E-mail', { type: 'email', autoComplete: 'email' })}
      <FormField id={ensId} label="Nome ENS" error={ensError}>
        <div className="flex">
          <Input
            {...ensProps}
            aria-required="true"
            autoComplete="off"
            spellCheck={false}
            {...register('ensName')}
            className={`${ensProps.className} rounded-r-none`}
          />
          <span className="inline-flex h-10 items-center rounded-r-lg border border-l-0 border-border px-3 text-sm text-muted-foreground">
            .eth
          </span>
        </div>
      </FormField>
    </div>
  )
}
