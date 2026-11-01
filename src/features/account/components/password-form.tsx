import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import type { z } from 'zod'
import { FormField } from '@/components/form/form-field'
import { Button } from '@/components/ui/button'
import { ChangePasswordInput } from '@/contracts/profile'
import { fieldProps } from '@/features/auth/components/field'
import { PasswordInput } from '@/features/auth/components/password-input'
import { useApiFormError } from '@/features/auth/components/use-api-form-error'
import { useChangePassword } from '../mutations'
import { useFocusFirstError } from './use-focus-first-error'

type Values = z.infer<typeof ChangePasswordInput>
const FIELDS = ['currentPassword', 'newPassword', 'confirmPassword'] as const

export function PasswordForm() {
  const change = useChangePassword()
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(ChangePasswordInput),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })
  const { formError, setFormError, handle } = useApiFormError(setError, FIELDS)
  const { ref, focus } = useFocusFirstError()

  const submit = handleSubmit((values) => {
    setFormError(null)
    change.mutate(values, {
      onSuccess: () => {
        reset()
        toast.success('Senha alterada')
      },
      onError: (error) => {
        handle(error)
        focus()
      },
    })
  }, focus)

  const field = (name: (typeof FIELDS)[number], label: string, autoComplete: string) => {
    const id = `password-${name}`
    const error = errors[name]?.message
    return (
      <FormField id={id} label={label} error={error}>
        <PasswordInput {...fieldProps(id, error)} aria-required="true" autoComplete={autoComplete} {...register(name)} />
      </FormField>
    )
  }

  return (
    <form ref={ref} onSubmit={submit} noValidate aria-labelledby="password-title" className="space-y-5">
      <h2 id="password-title" className="text-base font-bold">
        Alterar senha
      </h2>
      {formError && (
        <p role="alert" className="border border-destructive/50 p-3 text-sm text-destructive">
          {formError}
        </p>
      )}
      <div className="grid max-w-md gap-y-5">
        {field('currentPassword', 'Senha atual', 'current-password')}
        {field('newPassword', 'Nova senha', 'new-password')}
        {field('confirmPassword', 'Confirmar nova senha', 'new-password')}
      </div>
      <Button type="submit" size="lg" className="h-10 px-6 font-bold" disabled={change.isPending}>
        {change.isPending ? 'Salvando...' : 'Alterar senha'}
      </Button>
    </form>
  )
}
