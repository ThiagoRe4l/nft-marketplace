import { useLayoutEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Button, buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { Cart } from '@/contracts/cart'
import { cn } from '@/lib/utils'
import { formatEth } from '@/shared/lib/money'
import { CouponForm } from './coupon-form'

// mesmo contêiner para o resumo real e o skeleton: as dimensões não mudam ao carregar
// mobile (Figma): painel de 40 px de raio FIXO no rodapé da tela (sem barra inferior), com área segura;
// a página reserva o espaço dele via --cart-panel-h. Entre 768 e 1023 px continua sticky, como antes.
const panelClass =
  'max-lg:z-10 max-lg:rounded-t-[2.5rem] max-lg:bg-card max-lg:px-gutter max-lg:pt-6 max-lg:shadow-[0_-10px_30px_rgba(10,6,4,0.45)] md:max-lg:sticky md:max-lg:bottom-[calc(4.25rem+env(safe-area-inset-bottom))] md:max-lg:-mx-gutter md:max-lg:pb-9 max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:pb-[calc(1.5rem+env(safe-area-inset-bottom))]'

// publica a altura do painel fixo para a página dar padding no fim da lista
function usePanelHeight() {
  const [node, setNode] = useState<HTMLElement | null>(null)
  useLayoutEffect(() => {
    if (!node) return
    const root = document.documentElement
    const update = () => {
      const fixed = getComputedStyle(node).position === 'fixed'
      root.style.setProperty('--cart-panel-h', fixed ? `${node.offsetHeight}px` : '0px')
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(node)
    return () => {
      observer.disconnect()
      root.style.removeProperty('--cart-panel-h')
    }
  }, [node])
  return setNode
}

const rowClass = 'flex h-8 items-center justify-between text-sm max-lg:h-5 max-lg:text-[0.9375rem] max-lg:[&>dd]:text-base'
const ctaClass = cn(
  buttonVariants({ size: 'lg' }),
  'h-10 w-full font-bold max-lg:h-[3.75rem] max-lg:rounded-full max-lg:bg-[linear-gradient(93.21deg,var(--primary)_-3.96%,rgb(210_138_76/0.8)_121.97%)] max-lg:text-base',
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
  const panelRef = usePanelHeight()

  return (
    <aside ref={panelRef} aria-labelledby="cart-summary-title" className={panelClass}>
      <h2 id="cart-summary-title" className="hidden border-b pb-3 text-base font-bold lg:block">
        Resumo da carteira
      </h2>
      <div className="lg:py-6">
        <CouponForm couponCode={cart.couponCode} />
      </div>
      <dl className="mt-2 max-lg:mt-3 lg:mt-0">
        <div className={rowClass}>
          <dt>Subtotal</dt>
          <dd>{formatEth(summary.subtotal)}</dd>
        </div>
        <div className={cn(rowClass, 'max-lg:mt-3')}>
          <dt>Desconto do lançamento</dt>
          <dd>(-) {formatEth(summary.discount)}</dd>
        </div>
        <div className={cn(rowClass, 'max-lg:mt-3')}>
          <dt>Taxa de rede</dt>
          <dd>{formatEth(summary.networkFee)}</dd>
        </div>
        <p className="h-4 text-right text-[0.6875rem] text-primary max-lg:text-xs max-lg:text-highlight">Taxa estimada</p>
        <div className="mt-3 flex h-8 items-center justify-between text-sm font-bold max-lg:h-4 max-lg:text-base">
          <dt>Total</dt>
          <dd className="text-primary max-lg:text-lg max-lg:text-highlight">{formatEth(summary.total)}</dd>
        </div>
      </dl>
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
      <div className="mt-6 space-y-3 max-lg:mt-8">
        {empty ? (
          <Button type="button" size="lg" disabled className="h-10 w-full font-bold max-lg:h-[3.75rem] max-lg:rounded-full max-lg:text-base">
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
          className="flex h-8 items-center justify-center rounded-lg text-sm text-primary outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring max-lg:hidden"
        >
          Continuar explorando
        </Link>
      </div>
    </aside>
  )
}

export function CartSummarySkeleton() {
  const panelRef = usePanelHeight()
  return (
    <div ref={panelRef} role="status" aria-label="Carregando resumo" className={panelClass}>
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
