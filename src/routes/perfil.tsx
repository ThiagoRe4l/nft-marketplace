import { createFileRoute } from '@tanstack/react-router'
import { ProfilePage } from '@/features/account/components/profile-page'
import { requireAuth } from '@/features/auth/require-auth'

export const Route = createFileRoute('/perfil')({
  beforeLoad: requireAuth,
  component: ProfilePage,
})
