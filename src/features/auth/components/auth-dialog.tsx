import { useNavigate, useRouter, useSearch } from '@tanstack/react-router'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { safeRedirect } from '../session'
import { LoginForm } from './login-form'
import { SignupForm } from './signup-form'
import { SocialButtons } from './social-buttons'

type Mode = 'login' | 'signup'

const COPY: Record<Mode, { title: string; description: string; switchText: string; switchAction: string }> = {
  login: {
    title: 'Entrar',
    description: 'Entre para gerenciar sua carteira, coleção e perfil de criador.',
    switchText: 'Novo na Kurio?',
    switchAction: 'Crie uma conta',
  },
  signup: {
    title: 'Criar conta',
    description: 'Crie seu perfil de colecionador e conecte uma carteira quando quiser.',
    switchText: 'Já tem uma conta?',
    switchAction: 'Entre',
  },
}

const tabClass = (active: boolean) =>
  cn(
    'px-3 py-1 text-lg outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring',
    active ? 'text-primary' : 'text-foreground hover:text-primary',
  )

// diálogo de login/cadastro controlado pela URL (?auth=login|signup): fica por cima da página atual
export function AuthDialog() {
  const { auth, redirect, reason } = useSearch({ from: '__root__' })
  const navigate = useNavigate()
  const router = useRouter()

  const setAuth = (next: Mode) => navigate({ to: '.', search: (prev) => ({ ...prev, auth: next }), replace: true })

  const close = () =>
    navigate({
      to: '.',
      search: (prev) => ({ ...prev, auth: undefined, redirect: undefined, reason: undefined }),
    })

  const handleSuccess = (displayName: string) => {
    toast.success(`Bem-vindo(a), ${displayName}`)
    if (redirect) router.history.push(safeRedirect(redirect))
    else close()
  }

  // mantém o último modo enquanto a animação de saída roda
  const mode: Mode = auth ?? 'login'
  const copy = COPY[mode]

  return (
    <Dialog open={auth !== undefined} onOpenChange={(open) => !open && close()}>
      <DialogContent
        initialFocus={() => document.getElementById(mode === 'login' ? 'login-email' : 'signup-username')}
        className={cn(
          'border-b-4 border-b-primary p-0',
          // mobile: tela cheia como no Figma; md+: modal de 500px
          'max-md:inset-0 max-md:h-dvh max-md:max-h-none max-md:w-full max-md:translate-x-0 max-md:translate-y-0 max-md:rounded-t-3xl max-md:border-b-0 max-md:bg-background',
          'md:w-[31.25rem] md:max-w-[calc(100%-2rem)]',
        )}
      >
        <div className="flex min-h-full flex-col px-7 pt-20 pb-6 max-md:gap-10 md:px-10 md:pt-12 md:pb-14">
          {reason === 'expired' && (
            <p role="alert" className="mb-4 border border-primary/60 p-3 text-sm text-primary">
              Sua sessão expirou. Entre novamente para continuar.
            </p>
          )}

          <p className="flex h-34 items-center justify-center text-[2rem] leading-[2.625rem] font-bold tracking-[0.1em] md:hidden" aria-hidden="true">
            KURIO
          </p>

          <div>
            <div role="presentation" className="hidden items-center justify-center md:flex">
              <button
                type="button"
                className={tabClass(mode === 'login')}
                aria-current={mode === 'login' ? 'true' : undefined}
                onClick={() => setAuth('login')}
              >
                Entrar
              </button>
              <span className="h-5 w-px bg-primary" aria-hidden="true" />
              <button
                type="button"
                className={tabClass(mode === 'signup')}
                aria-current={mode === 'signup' ? 'true' : undefined}
                onClick={() => setAuth('signup')}
              >
                Criar conta
              </button>
            </div>

            <DialogTitle className="text-center text-xl leading-4 font-bold md:sr-only md:leading-normal">{copy.title}</DialogTitle>
            <DialogDescription className="mt-6 hidden text-center text-xs text-foreground md:block">
              {copy.description}
            </DialogDescription>

            <div className="mt-6 max-md:mt-10">
              {mode === 'login' ? (
                <LoginForm onSuccess={handleSuccess} />
              ) : (
                <SignupForm onSuccess={handleSuccess} />
              )}
            </div>
          </div>

          <SocialButtons />

          <p className="text-center text-[0.9375rem] leading-5 text-muted-foreground md:hidden">
            {copy.switchText}{' '}
            <button
              type="button"
              className="-my-3 py-3 underline outline-none focus-visible:ring-3 focus-visible:ring-ring"
              onClick={() => setAuth(mode === 'login' ? 'signup' : 'login')}
            >
              {copy.switchAction}
            </button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
