import { Link } from '@tanstack/react-router'
import { CircleAlertIcon } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import type { Order } from '@/contracts/order'
import { cn } from '@/lib/utils'

export function OrderRejected({ order }: { order: Order }) {
  return (
    <div role="alert" className="mx-auto flex max-w-xl flex-col items-center gap-4 rounded-xl bg-card px-6 py-16 text-center">
      <CircleAlertIcon className="size-8 text-destructive" aria-hidden="true" />
      <h1 className="text-lg font-bold">Pagamento recusado</h1>
      <p className="text-sm">{order.rejectionReason ?? 'O pagamento não foi concluído.'}</p>
      <p className="text-sm text-muted-foreground">Nenhum valor foi cobrado e os itens continuam no seu carrinho.</p>
      <Link to="/carrinho" className={cn(buttonVariants({ size: 'lg' }), 'h-10 px-6 font-bold')}>
        Voltar ao carrinho
      </Link>
    </div>
  )
}
