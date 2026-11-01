import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoginInput } from '@/contracts/auth'
import { comingSoon } from '@/shared/lib/coming-soon'
import { useLogin } from '../session'
import { Field, fieldProps } from './field'
import { PasswordInput } from './password-input'
import { useApiFormError } from './use-api-form-error'

type LoginValues = z.infer<typeof LoginInput>

export function LoginForm({ onSuccess }: { onSuccess: (displayName: string) => void }) {
  const login = useLogin()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(LoginInput) })
  const { formError, setFormError, handle } = useApiFormError(setError, ['email', 'password'])

  const submit = handleSubmit((values) => {
    setFormError(null)
    login.mutate(values, {
      onSuccess: (auth) => onSuccess(auth.user.displayName),
      onError: handle,
    })
  })

  const email = errors.email?.message
  const password = errors.password?.message

  return (
    <form onSubmit={submit} noValidate className="space-y-3">
      {formError && (
        <p role="alert" className="border border-destructive/50 p-3 text-sm text-destructive">
          {formError}
        </p>
      )}
      <Field id="login-email" label="E-mail" error={email}>
        <Input
          type="email"
          autoComplete="email"
          placeholder="contato@email.com"
          {...fieldProps('login-email', email)}
          {...register('email')}
        />
      </Field>
      <Field id="login-password" label="Senha" error={password}>
        <PasswordInput
          autoComplete="current-password"
          placeholder="Senha"
          {...fieldProps('login-password', password)}
          {...register('password')}
        />
      </Field>
      <div className="text-right max-md:flex max-md:h-4 max-md:items-center max-md:justify-end">
        <button
          type="button"
          onClick={comingSoon}
          className="text-xs text-primary outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring max-md:-my-3.5 max-md:py-3.5 max-md:text-sm max-md:leading-4 max-md:text-highlight"
        >
          Esqueceu a senha?
        </button>
      </div>
      <Button type="submit" size="lg" className="mt-3 h-11 w-full font-bold max-md:mt-7 max-md:h-[60px] max-md:rounded-[10px] max-md:text-base" disabled={login.isPending}>
        {login.isPending ? 'Entrando...' : 'Entrar'}
      </Button>
    </form>
  )
}
