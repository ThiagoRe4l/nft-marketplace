import { createFileRoute } from '@tanstack/react-router'
import { requireAuth } from '@/features/auth/require-auth'

export const Route = createFileRoute('/checkout')({
  beforeLoad: requireAuth,
  component: () => <p className="mx-auto w-full max-w-page px-gutter py-10">Pagamento (provisório)</p>,
})
