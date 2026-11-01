import { createFileRoute } from '@tanstack/react-router'
import { requireAuth } from '@/features/auth/require-auth'
import { OrderPage } from '@/features/checkout/components/order-page'

export const Route = createFileRoute('/pedidos/$id')({
  beforeLoad: requireAuth,
  component: function OrderRoute() {
    const { id } = Route.useParams()
    return <OrderPage id={id} />
  },
})
