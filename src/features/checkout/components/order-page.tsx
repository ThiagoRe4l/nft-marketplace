import { useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import { LoaderCircleIcon } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useSession } from '@/features/auth/session'
import { cn } from '@/lib/utils'
import { toAppError } from '@/shared/api/errors'
import { finishAttempt } from '../attempt'
import { useOrder } from '../queries'
import { OrderReceipt } from './order-receipt'
import { OrderRejected } from './order-rejected'

const wrapperClass = 'mx-auto w-full max-w-page px-gutter py-8 lg:py-12'

function OrderMessage({ title, text, role = 'alert', children }: { title: string; text: string; role?: 'alert' | 'status'; children: React.ReactNode }) {
  return (
    <div role={role} className="mx-auto flex max-w-xl flex-col items-center gap-4 rounded-xl bg-card px-6 py-16 text-center">
      <h1 className="text-lg font-bold">{title}</h1>
      <p className="text-sm text-muted-foreground">{text}</p>
      {children}
    </div>
  )
}

export function OrderPage({ id }: { id: string }) {
  const query = useOrder(id)
  const session = useSession()
  const userId = session.data?.user.id
  const order = query.data
  const terminal = order !== undefined && order.status !== 'pending'
  const orderId = order?.id

  // pedido terminal (confirmado ou recusado): a tentativa de compra acabou
  useEffect(() => {
    if (terminal && userId && orderId) finishAttempt(userId, orderId)
  }, [terminal, userId, orderId])

  if (!order) {
    if (query.isError) {
      const error = toAppError(query.error)
      if (error.code === 'NOT_FOUND') {
        return (
          <div className={wrapperClass}>
            <OrderMessage title="Pedido não encontrado" text="Este pedido não existe ou não pertence à sua conta.">
              <Link to="/" hash="catalogo" className={cn(buttonVariants({ size: 'lg' }), 'h-10 px-6 font-bold')}>
                Explorar o catálogo
              </Link>
            </OrderMessage>
          </div>
        )
      }
      return (
        <div className={wrapperClass}>
          <OrderMessage title="Não foi possível carregar o pedido" text={error.message}>
            <Button type="button" size="lg" className="h-10 px-6 font-bold" onClick={() => void query.refetch()}>
              Tentar novamente
            </Button>
          </OrderMessage>
        </div>
      )
    }
    return (
      <div className={wrapperClass}>
        <div role="status" aria-label="Carregando pedido" className="mx-auto max-w-xl space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className={wrapperClass}>
      {order.status === 'pending' && (
        <div
          role="status"
          aria-live="polite"
          className="mx-auto flex max-w-xl flex-col items-center gap-4 rounded-xl bg-card px-6 py-16 text-center"
        >
          <LoaderCircleIcon className="size-8 animate-spin text-primary motion-reduce:animate-none" aria-hidden="true" />
          <h1 className="text-lg font-bold">Aguardando confirmação da rede...</h1>
          <p className="text-sm text-muted-foreground">
            Seu pedido foi enviado. Esta página atualiza sozinha quando a rede responder.
          </p>
        </div>
      )}
      {order.status === 'confirmed' && <OrderReceipt order={order} />}
      {order.status === 'rejected' && <OrderRejected order={order} />}
    </div>
  )
}
