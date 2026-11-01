import { createFileRoute } from '@tanstack/react-router'
import { requireAuth } from '@/features/auth/require-auth'
import { CheckoutPage } from '@/features/checkout/components/checkout-page'

export const Route = createFileRoute('/checkout')({
  beforeLoad: requireAuth,
  component: CheckoutPage,
})
