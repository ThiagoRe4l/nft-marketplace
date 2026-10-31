import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SignupInput } from '@/contracts/auth'
import { useSignup } from '../session'
import { Field, fieldProps } from './field'
import { PasswordInput } from './password-input'
import { useApiFormError } from './use-api-form-error'

type SignupValues = z.infer<typeof SignupInput>

export function SignupForm({ onSuccess }: { onSuccess: (displayName: string) => void }) {
  const signup = useSignup()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SignupValues>({ resolver: zodResolver(SignupInput) })
  const { formError, setFormError, handle } = useApiFormError(setError, [
    'username',
    'email',
    'password',
    'confirmPassword',
  ])

  const submit = handleSubmit((values) => {
    setFormError(null)
    signup.mutate(values, {
      onSuccess: (auth) => onSuccess(auth.user.displayName),
      onError: handle,
    })
  })

  const username = errors.username?.message
  const email = errors.email?.message
  const password = errors.password?.message
  const confirm = errors.confirmPassword?.message

  return (
    <form onSubmit={submit} noValidate className="space-y-3">
      {formError && (
        <p role="alert" className="border border-destructive/50 p-3 text-sm text-destructive">
          {formError}
        </p>
      )}
      <Field id="signup-username" label="Nome de usuário" error={username}>
        <Input
          autoComplete="username"
          placeholder="Nome de usuário"
          {...fieldProps('signup-username', username)}
          {...register('username')}
        />
      </Field>
      <Field id="signup-email" label="E-mail" error={email}>
        <Input
          type="email"
          autoComplete="email"
          placeholder="Digite seu e-mail"
          {...fieldProps('signup-email', email)}
          {...register('email')}
        />
      </Field>
      <Field id="signup-password" label="Senha" error={password}>
        <PasswordInput
          autoComplete="new-password"
          placeholder="Senha"
          {...fieldProps('signup-password', password)}
          {...register('password')}
        />
      </Field>
      <Field id="signup-confirm" label="Confirmar senha" error={confirm}>
        <PasswordInput
          autoComplete="new-password"
          placeholder="Confirmar senha"
          {...fieldProps('signup-confirm', confirm)}
          {...register('confirmPassword')}
        />
      </Field>
      <Button type="submit" size="lg" className="mt-3 h-11 w-full font-bold" disabled={signup.isPending}>
        {signup.isPending ? 'Criando conta...' : 'Criar conta'}
      </Button>
    </form>
  )
}
