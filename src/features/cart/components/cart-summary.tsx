import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Button, buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { Cart } from '@/contracts/cart'
import { cn } from '@/lib/utils'
import { formatEth } from '@/shared/lib/money'
import { CouponForm } from './coupon-form'

// mesmo contêiner para o resumo real e o skeleton: as dimensões não mudam ao carregar
const panelClass = 'max-lg:-mx-gutter max-lg:rounded-t-3xl max-lg:bg-card max-lg:px-gutter max-lg:py-6'

const rowClass = 'flex h-8 items-center justify-between text-sm'
const ctaClass = cn(
  buttonVariants({ size: 'lg' }),
  'h-10 w-full font-bold max-lg:rounded-full max-lg:bg-gradient-to-r max-lg:from-primary max-lg:to-primary-hover',
)

function useTotalAnnouncement(total: string) {
  const [previous, setPrevious] = useState(total)
  const [message, setMessage] = useState('')
  // ajuste durante a renderização: só anuncia quando o total muda, não na carga inicial
  if (total !== previous) {
    setPrevious(total)
    setMessage(`Total atualizado: ${formatEth(total)}`)
  }
  return message
}

export function CartSummary({ cart }: { cart: Cart }) {
  const { summary } = cart
  const empty = cart.items.length === 0
  const announcement = useTotalAnnouncement(summary.total)

  return (
    <aside aria-labelledby="cart-summary-title" className={panelClass}>
      <h2 id="cart-summary-title" className="hidden border-b pb-3 text-base font-bold lg:block">
        Resumo da carteira
      </h2>
      <div className="lg:py-6">
        <CouponForm couponCode={cart.couponCode} />
      </div>
      <dl className="mt-2 lg:mt-0">
        <div className={rowClass}>
          <dt>Subtotal</dt>
          <dd>{formatEth(summary.subtotal)}</dd>
        </div>
        <div className={rowClass}>
          <dt>Desconto do lançamento</dt>
          <dd>(-) {formatEth(summary.discount)}</dd>
        </div>
        <div className={rowClass}>
          <dt>Taxa de rede</dt>
          <dd>{formatEth(summary.networkFee)}</dd>
        </div>
        <p className="h-4 text-right text-[0.6875rem] text-primary">Taxa estimada</p>
        <div className="mt-3 flex h-8 items-center justify-between text-sm font-bold">
          <dt>Total</dt>
          <dd className="text-primary">{formatEth(summary.total)}</dd>
        </div>
      </dl>
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
      <div className="mt-6 space-y-3">
        {empty ? (
          <Button type="button" size="lg" disabled className="h-10 w-full font-bold max-lg:rounded-full">
            Conectar e finalizar
          </Button>
        ) : (
          <Link to="/checkout" className={ctaClass}>
            Conectar e finalizar
          </Link>
        )}
        <Link
          to="/"
          hash="catalogo"
          className="flex h-8 items-center justify-center rounded-lg text-sm text-primary outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring"
        >
          Continuar explorando
        </Link>
      </div>
    </aside>
  )
}

export function CartSummarySkeleton() {
  return (
    <div role="status" aria-label="Carregando resumo" className={panelClass}>
      <div className="hidden border-b pb-3 lg:block">
        <Skeleton className="h-6 w-44" />
      </div>
      <div className="lg:py-6">
        <Skeleton className="h-10 w-full" />
        <div className="h-[1.375rem]" />
      </div>
      <div className="mt-2 lg:mt-0">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className={rowClass}>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-20" />
          </div>
        ))}
        <div className="h-4" />
        <div className="mt-3 flex h-8 items-center justify-between">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-24" />
        </div>
      </div>
      <div className="mt-6 space-y-3">
        <Skeleton className="h-10 w-full" />
        <div className="flex h-8 items-center justify-center">
          <Skeleton className="h-5 w-36" />
        </div>
      </div>
    </div>
  )
}
