import { Link } from '@tanstack/react-router'
import { ChevronLeftIcon } from 'lucide-react'
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { useCart } from '@/features/cart/queries'
import { toAppError } from '@/shared/api/errors'
import { AlsoViewed } from './also-viewed'
import { CartLine, LINE_COLUMNS } from './cart-line'
import { CartEmpty, CartError, CartLinesSkeleton } from './cart-states'
import { CartSummary, CartSummarySkeleton } from './cart-summary'
import { cn } from '@/lib/utils'

const linkClass = 'outline-none hover:text-primary focus-visible:ring-3 focus-visible:ring-ring'

export function CartPage() {
  const query = useCart()
  const cart = query.data

  return (
    <div className="mx-auto w-full max-w-page px-gutter pt-4 pb-[calc(2rem+var(--cart-panel-h,0px))] md:pb-8 lg:py-8">
      <Breadcrumb className="mb-4 max-lg:hidden">
        <BreadcrumbList>
          <BreadcrumbItem>
            <Link to="/" className={linkClass}>
              Início
            </Link>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <Link to="/" hash="catalogo" className={linkClass}>
              Mercado
            </Link>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <span aria-current="page">Carrinho</span>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* mobile: barra de título do frame; no desktop o h1 fica só para leitores de tela */}
      <div className="relative mb-4 flex items-center justify-center lg:mb-0 lg:block">
        <Link
          to="/"
          hash="catalogo"
          aria-label="Voltar ao catálogo"
          className="absolute left-0 inline-flex size-9 items-center justify-center rounded-full bg-card text-primary outline-none focus-visible:ring-3 focus-visible:ring-ring lg:hidden"
        >
          <ChevronLeftIcon className="size-5" />
        </Link>
        <h1 className="text-lg font-bold lg:sr-only">Carrinho de NFTs</h1>
      </div>

      <div className="grid gap-y-8 lg:grid-cols-[minmax(0,1fr)_20.75rem] lg:gap-x-20">
        <section aria-label="Itens do carrinho">
          {cart && cart.items.length > 0 && (
            <div
              aria-hidden="true"
              className={cn('mb-3 hidden border-b pb-3 text-sm font-bold lg:grid lg:pr-4', LINE_COLUMNS)}
            >
              <span>NFTs</span>
              <span>Preço</span>
              <span>Edições</span>
              <span>Total</span>
              <span />
            </div>
          )}
          {!cart && query.isError ? (
            <CartError message={toAppError(query.error).message} onRetry={() => void query.refetch()} />
          ) : !cart ? (
            <CartLinesSkeleton />
          ) : cart.items.length === 0 ? (
            <CartEmpty />
          ) : (
            <ul className="space-y-3">
              {cart.items.map((line) => (
                <CartLine key={line.id} line={line} />
              ))}
            </ul>
          )}
        </section>

        {cart ? <CartSummary cart={cart} /> : query.isError ? null : <CartSummarySkeleton />}
      </div>

      <div className="max-md:hidden">
        <AlsoViewed />
      </div>
    </div>
  )
}
