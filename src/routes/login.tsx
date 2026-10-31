import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

const LoginSearch = z.object({
  redirect: z.string().optional(),
  reason: z.enum(['expired']).optional(),
})

export const Route = createFileRoute('/login')({
  validateSearch: LoginSearch,
  component: () => <p className="p-4">Login (provisório)</p>,
})