import { createFileRoute, redirect } from '@tanstack/react-router'
import { sessionQuery } from '@/features/auth/session'

export const Route = createFileRoute('/_auth')({
  beforeLoad: async ({ context, location }) => {
    const session = await context.queryClient.ensureQueryData(sessionQuery)
    if (!session) throw redirect({ to: '/login', search: { redirect: location.href } })
    return { session }
  },
})