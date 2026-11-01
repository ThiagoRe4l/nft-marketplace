import { createFileRoute } from '@tanstack/react-router'
import { requireAuth } from '@/features/auth/require-auth'

// provisória: será substituída pela tela de Carteiras
export const Route = createFileRoute('/carteiras')({
  beforeLoad: requireAuth,
  component: () => <p className="mx-auto w-full max-w-page px-gutter py-10">Carteiras (provisório)</p>,
})
