import type { ComponentProps, ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import type { z } from 'zod'
import { FormField } from '@/components/form/form-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { User } from '@/contracts/auth'
import { UpdateProfileInput } from '@/contracts/profile'
import { fieldProps } from '@/features/auth/components/field'
import { useApiFormError } from '@/features/auth/components/use-api-form-error'
import { useUpdateProfile } from '../mutations'
import { useFocusFirstError } from './use-focus-first-error'

type Values = z.infer<typeof UpdateProfileInput>
const FIELDS = ['displayName', 'username', 'email', 'ensName', 'walletNickname'] as const

// o avatar entra como slot só para ocupar a grade como no Figma; ele salva por conta própria
export function ProfileForm({ user, avatar }: { user: User; avatar: ReactNode }) {
  const update = useUpdateProfile()
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(UpdateProfileInput),
    defaultValues: {
      displayName: user.displayName,
      username: user.username,
      email: user.email,
      ensName: user.ensName ?? '',
      walletNickname: user.walletNickname ?? '',
    },
  })
  const { formError, setFormError, handle } = useApiFormError(setError, FIELDS)
  const { ref, focus } = useFocusFirstError()

  const submit = handleSubmit((values) => {
    setFormError(null)
    update.mutate(values, {
      onSuccess: () => {
        reset(values)
        toast.success('Dados do perfil salvos')
      },
      onError: (error) => {
        handle(error)
        focus()
      },
    })
  }, focus)

  const field = (name: (typeof FIELDS)[number], label: string, extra?: ComponentProps<'input'>) => {
    const id = `profile-${name}`
    const error = errors[name]?.message
    return (
      <FormField id={id} label={label} error={error}>
        <Input {...fieldProps(id, error)} aria-required="true" {...extra} {...register(name)} />
      </FormField>
    )
  }
  const ensError = errors.ensName?.message
  const ensProps = fieldProps('profile-ensName', ensError)

  return (
    <form ref={ref} onSubmit={submit} noValidate aria-label="Dados do perfil" className="space-y-5">
      {formError && (
        <p role="alert" className="border border-destructive/50 p-3 text-sm text-destructive">
          {formError}
        </p>
      )}
      <div className="grid gap-x-8 gap-y-5 md:grid-cols-2">
        {field('displayName', 'Nome de exibição', { autoComplete: 'name' })}
        {field('username', 'Nome de usuário', { autoComplete: 'username' })}
        {field('email', 'E-mail', { type: 'email', autoComplete: 'email' })}
        <FormField id="profile-ensName" label="Nome ENS" error={ensError}>
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
        {field('walletNickname', 'Apelido da carteira', { autoComplete: 'off' })}
        {avatar}
      </div>
      <Button type="submit" size="lg" className="h-10 px-6 font-bold" disabled={update.isPending}>
        {update.isPending ? 'Salvando...' : 'Salvar dados'}
      </Button>
    </form>
  )
}
