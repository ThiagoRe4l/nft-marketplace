import { useEffect, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import type { Cart } from '@/contracts/cart'
import type { User } from '@/contracts/auth'
import type { Quote } from '@/contracts/quote'
import type { Wallet } from '@/contracts/wallet'
import { cartKeys } from '@/features/cart/queries'
import { toAppError } from '@/shared/api/errors'
import { buildDefaults, walletToValues } from '../defaults'
import { draftStorage } from '../draft'
import { useConnectWallet, useCreateQuote, usePlaceOrder } from '../queries'
import { cartMatchesQuote } from '../quote'
import { CheckoutFormSchema, type CheckoutValues } from '../schema'
import { CheckoutFields } from './checkout-fields'
import { OrderColumn } from './order-column'
import { WalletConnection, WalletPicker } from './wallet-picker'

type Notice = { kind: 'stock' | 'error'; message: string }

export const STALE_MESSAGE = 'Os valores mudaram. Revise o pedido antes de confirmar.'

export function CheckoutFlow({
  user,
  wallets,
  cart,
  cartUpdatedAt,
}: {
  user: User
  wallets: Wallet[]
  cart: Cart
  cartUpdatedAt: number
}) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const createQuote = useCreateQuote()
  const connect = useConnectWallet()
  const placeOrder = usePlaceOrder()

  const [quote, setQuote] = useState<Quote | null>(null)
  const [quotedAt, setQuotedAt] = useState(0)
  const [staleByApi, setStaleByApi] = useState(false)
  const [notice, setNotice] = useState<Notice | null>(null)
  const [connectedId, setConnectedId] = useState<string | null>(null)

  // rascunho: restaura o que o usuário deixou; sem rascunho, perfil + carteira principal
  const [defaultValues] = useState(() => buildDefaults(user, wallets, draftStorage.get(user.id)))
  const form = useForm<CheckoutValues>({ resolver: zodResolver(CheckoutFormSchema), defaultValues })
  const values = useWatch({ control: form.control })
  useEffect(() => {
    draftStorage.set(user.id, values)
  }, [user.id, values])

  const walletId = values.walletId ?? ''
  const selectedWallet = wallets.find((w) => w.id === walletId)
  const connected = !!selectedWallet && connectedId === selectedWallet.id

  // Desatualizada: a API disse (QUOTE_STALE) OU o carrinho foi relido depois da cotação e já não bate com ela.
  // O dataUpdatedAt sozinho não basta: ele muda a cada refetch, mesmo sem mudança nos dados.
  const cartChanged = quote !== null && cartUpdatedAt > quotedAt && !cartMatchesQuote(cart, quote)
  const stale = quote !== null && (staleByApi || cartChanged)
  const canConfirm = quote !== null && !stale && connected && !placeOrder.isPending
  const noWallet = wallets.length === 0

  const refreshCart = () => void queryClient.invalidateQueries({ queryKey: cartKeys.all })

  const handleError = (error: unknown) => {
    const { code, message } = toAppError(error)
    if (code === 'QUOTE_STALE') {
      setStaleByApi(true)
      setNotice(null)
      refreshCart()
    } else if (code === 'OUT_OF_STOCK') {
      setNotice({ kind: 'stock', message })
      refreshCart()
    } else {
      setNotice({ kind: 'error', message })
    }
  }

  const requestQuote = () => {
    setNotice(null)
    createQuote.mutate(undefined, {
      onSuccess: (next) => {
        setQuote(next)
        setQuotedAt(Date.now())
        setStaleByApi(false)
      },
      onError: handleError,
    })
  }

  const confirm = (data: CheckoutValues) => {
    if (!quote || !canConfirm) return
    setNotice(null)
    placeOrder.mutate(
      { quoteId: quote.id, walletId: data.walletId, network: data.network, note: data.note.trim() || undefined },
      {
        onSuccess: (order) => {
          draftStorage.clear(user.id)
          void navigate({ to: '/pedidos/$id', params: { id: order.id } })
        },
        onError: handleError,
      },
    )
  }

  // "Revisar pedido" valida o formulário e cria a cotação; com cotação em mãos o mesmo botão vira "Confirmar compra"
  const onSubmit = form.handleSubmit((data) => (quote ? confirm(data) : requestQuote()))

  const chooseWallet = (id: string) => {
    const wallet = wallets.find((w) => w.id === id)
    if (!wallet) return
    form.reset({ ...walletToValues(wallet), note: form.getValues('note') })
    setConnectedId(null)
    connect.reset()
  }

  const disconnect = () => {
    setConnectedId(null)
    connect.reset()
  }

  const hint = quote && !stale && !connected ? 'Conecte a carteira para confirmar a compra.' : null

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      aria-label="Pagamento"
      className="grid gap-y-10 lg:grid-cols-[minmax(0,1fr)_25.3125rem] lg:gap-x-8"
    >
      <CheckoutFields form={form} />

      <div className="space-y-6">
        <OrderColumn cart={cart} quote={quote} />

        <section aria-labelledby="checkout-wallet-title" className="space-y-3">
          <h2 id="checkout-wallet-title" className="text-base font-bold">
            Carteira e rede
          </h2>
          <WalletPicker
            wallets={wallets}
            value={walletId}
            onChange={chooseWallet}
            error={form.formState.errors.walletId?.message}
          />
          <WalletConnection
            wallet={selectedWallet}
            connected={connected}
            pending={connect.isPending}
            error={connect.isError ? toAppError(connect.error).message : null}
            onConnect={() => {
              if (!selectedWallet) return
              connect.mutate(selectedWallet.slot, { onSuccess: () => setConnectedId(selectedWallet.id) })
            }}
            onDisconnect={disconnect}
          />
        </section>

        {stale && (
          <div role="alert" className="space-y-3 border border-primary/60 p-3 text-sm text-primary">
            <p>{STALE_MESSAGE}</p>
            <Button type="button" variant="outline" disabled={createQuote.isPending} onClick={requestQuote}>
              {createQuote.isPending ? 'Atualizando...' : 'Atualizar cotação'}
            </Button>
          </div>
        )}
        {notice && (
          <div role="alert" className="space-y-2 border border-destructive/50 p-3 text-sm text-destructive">
            <p>{notice.message}</p>
            {notice.kind === 'stock' && (
              <Link to="/carrinho" className="inline-block underline outline-none focus-visible:ring-3 focus-visible:ring-ring">
                Voltar ao carrinho
              </Link>
            )}
          </div>
        )}

        <div className="space-y-2">
          {quote ? (
            <Button
              type="submit"
              size="lg"
              disabled={!canConfirm}
              aria-describedby={hint ? 'checkout-confirm-hint' : undefined}
              className="h-11 w-full font-bold max-lg:rounded-full max-lg:bg-gradient-to-r max-lg:from-primary max-lg:to-primary-hover"
            >
              {placeOrder.isPending ? 'Enviando...' : 'Confirmar compra'}
            </Button>
          ) : (
            <Button
              type="submit"
              size="lg"
              disabled={noWallet || createQuote.isPending}
              className="h-11 w-full font-bold max-lg:rounded-full max-lg:bg-gradient-to-r max-lg:from-primary max-lg:to-primary-hover"
            >
              {createQuote.isPending ? 'Revisando...' : 'Revisar pedido'}
            </Button>
          )}
          {hint && (
            <p id="checkout-confirm-hint" className="text-xs text-muted-foreground">
              {hint}
            </p>
          )}
        </div>
      </div>
    </form>
  )
}
