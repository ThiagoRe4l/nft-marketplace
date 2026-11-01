import { createFileRoute } from '@tanstack/react-router'
import { WalletsPage } from '@/features/account/components/wallets-page'
import { requireAuth } from '@/features/auth/require-auth'

export const Route = createFileRoute('/carteiras')({
  beforeLoad: requireAuth,
  component: WalletsPage,
})
