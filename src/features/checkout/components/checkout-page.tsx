import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useIsMutating, useMutationState } from '@tanstack/react-query'
import type { Order } from '@/contracts/order'
import { ChevronLeftIcon, LoaderCircleIcon } from 'lucide-react'
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Button, buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useProfile, useWallets } from '@/features/account/queries'
import { useSession } from '@/features/auth/session'
import { useCart } from '@/features/cart/queries'
import { cn } from '@/lib/utils'
import { toAppError } from '@/shared/api/errors'
import { attemptStorage } from '../attempt'
import { draftStorage } from '../draft'
import { PLACE_ORDER_KEY, usePlaceOrder, useStoredAttempt } from '../queries'
import { CheckoutFlow } from './checkout-flow'

const linkClass = 'outline-none hover:text-primary focus-visible:ring-3 focus-visible:ring-ring'

function CheckoutSkeleton() {
  return (
    <div role="status" aria-label="Carregando pagamento" className="grid gap-y-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-x-16">
      <div className="grid gap-x-8 gap-y-5 md:grid-cols-2">
        {Array.from({ length: 10 }, (_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
      <div className="space-y-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-11 w-full" />
      </div>
    </div>
  )
}

export function CheckoutPage() {
  const navigate = useNavigate()
  const session = useSession()
  const userId = session.data?.user.id
  const cartQuery = useCart()
  const profile = useProfile()
  const wallets = useWallets()
  const placeOrder = usePlaceOrder()
  const attempt = useStoredAttempt()

  // Refresh no meio do envio: a tentativa existe, mas ainda sem pedido. O corpo é lido uma vez, ao montar.
  const [resumeBody] = useState(() => (attempt && !attempt.orderId ? attempt.body : null))
  const [resuming, setResuming] = useState(resumeBody !== null)
  const [resumeError, setResumeError] = useState<string | null>(null)

  const { mutateAsync: place } = placeOrder
  const started = useRef(false)
  useEffect(() => {
    if (!resumeBody || !userId || started.current) return
    started.current = true
    // mesma chave de idempotência: se o pedido já nasceu, o servidor devolve o mesmo
    place(resumeBody).then(
      (order) => {
        draftStorage.clear(userId)
        void navigate({ to: '/pedidos/$id', params: { id: order.id }, replace: true })
      },
      (error: unknown) => {
        const { code, message } = toAppError(error)
        if (code === 'QUOTE_STALE') {
          // o servidor não criou o pedido (a cotação não vale mais): descarta a tentativa e volta ao fluxo normal
          attemptStorage.clear(userId)
        } else {
          setResumeError(message)
        }
        setResuming(false)
      },
    )
  }, [resumeBody, userId, place, navigate])

  // A compra pode terminar com o componente que a disparou já desmontado (o carrinho esvazia em tempo real
  // e a página troca o fluxo). Por isso observamos a mutation pela chave e navegamos daqui, que não desmonta.
  const buying = useIsMutating({ mutationKey: PLACE_ORDER_KEY }) > 0
  const [mountedAt] = useState(() => Date.now())
  const purchases = useMutationState({
    filters: { mutationKey: PLACE_ORDER_KEY, status: 'success' },
    select: (m) => ({ submittedAt: m.state.submittedAt, order: m.state.data as Order | undefined }),
  })
  // ignora compras de visitas anteriores que ainda estão no cache
  const purchasedId = purchases.filter((p) => p.submittedAt >= mountedAt).at(-1)?.order?.id
  const storedOrderId = attempt?.orderId ?? null
  const cartIsEmpty = !!cartQuery.data && cartQuery.data.items.length === 0
  // carrinho vazio com tentativa que já tem pedido: o lugar do usuário é o pedido
  const targetOrderId = purchasedId ?? (cartIsEmpty && !resuming ? storedOrderId : null)
  const navigatedTo = useRef<string | null>(null)
  useEffect(() => {
    if (!targetOrderId || !userId || navigatedTo.current === targetOrderId) return
    navigatedTo.current = targetOrderId
    if (purchasedId) draftStorage.clear(userId)
    void navigate({ to: '/pedidos/$id', params: { id: targetOrderId }, replace: true })
  }, [targetOrderId, purchasedId, userId, navigate])

  const cart = cartQuery.data
  const loadError = !cart && cartQuery.isError ? cartQuery.error : (profile.isError ? profile.error : wallets.isError ? wallets.error : null)
  const retryAll = () => {
    void cartQuery.refetch()
    void profile.refetch()
    void wallets.refetch()
  }

  let body
  if (resuming) {
    body = null
  } else if (targetOrderId || (buying && cartIsEmpty)) {
    // o carrinho esvaziou com a compra em andamento (ou o pedido já existe): nunca mostra "carrinho vazio" no meio do caminho.
    // Com itens no carrinho o formulário continua montado, para manter o botão "Enviando..."
    body = (
      <p role="status" aria-live="polite" className="flex items-center gap-3 rounded-sm bg-card p-4 text-sm">
        <LoaderCircleIcon className="size-4 animate-spin text-primary motion-reduce:animate-none" aria-hidden="true" />
        Finalizando sua compra...
      </p>
    )
  } else if (loadError) {
    body = (
      <div role="alert" className="flex flex-col items-center gap-4 rounded-xl bg-card px-6 py-16 text-center">
        <h2 className="text-lg font-bold">Não foi possível carregar o pagamento</h2>
        <p className="text-sm text-muted-foreground">{toAppError(loadError).message}</p>
        <Button type="button" size="lg" className="h-10 px-6 font-bold" onClick={retryAll}>
          Tentar novamente
        </Button>
      </div>
    )
  } else if (!cart || !profile.data || !wallets.data) {
    body = <CheckoutSkeleton />
  } else if (cart.items.length === 0) {
    body = (
      <div className="flex flex-col items-center gap-4 rounded-xl bg-card px-6 py-16 text-center">
        <h2 className="text-lg font-bold">Seu carrinho está vazio</h2>
        <p className="text-sm text-muted-foreground">Adicione NFTs ao carrinho para finalizar uma compra.</p>
        <Link to="/" hash="catalogo" className={cn(buttonVariants({ size: 'lg' }), 'h-10 px-6 font-bold')}>
          Explorar o catálogo
        </Link>
      </div>
    )
  } else {
    body = (
      <CheckoutFlow user={profile.data} wallets={wallets.data} cart={cart} cartUpdatedAt={cartQuery.dataUpdatedAt} />
    )
  }

  return (
    <div className="mx-auto w-full max-w-page px-gutter pt-4 pb-10 lg:py-8">
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
            <span aria-current="page">Pagamento</span>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="relative mb-6 flex items-center justify-center lg:mb-0 lg:block">
        <Link
          to="/carrinho"
          aria-label="Voltar ao carrinho"
          className="absolute left-0 inline-flex size-9 items-center justify-center rounded-full bg-card text-primary outline-none focus-visible:ring-3 focus-visible:ring-ring lg:hidden"
        >
          <ChevronLeftIcon className="size-5" />
        </Link>
        <h1 className="text-lg font-bold lg:sr-only">Pagamento com carteira</h1>
      </div>

      {resuming && (
        <p role="status" aria-live="polite" className="flex items-center gap-3 rounded-sm bg-card p-4 text-sm">
          <LoaderCircleIcon className="size-4 animate-spin text-primary motion-reduce:animate-none" aria-hidden="true" />
          Retomando sua compra...
        </p>
      )}

      {!resuming && attempt?.orderId && (
        <div role="status" className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-sm border border-primary/60 p-3 text-sm">
          <p>Você tem um pedido em andamento</p>
          <Link
            to="/pedidos/$id"
            params={{ id: attempt.orderId }}
            className="font-bold text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring"
          >
            Acompanhar pedido
          </Link>
        </div>
      )}

      {resumeError && (
        <p role="alert" className="mb-6 border border-destructive/50 p-3 text-sm text-destructive">
          {resumeError}
        </p>
      )}

      {body}
    </div>
  )
}
