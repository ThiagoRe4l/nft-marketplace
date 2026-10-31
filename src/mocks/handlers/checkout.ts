import { http, HttpResponse, delay } from 'msw'
import { CreateOrderInput, Order } from '@/contracts/order'
import { Quote } from '@/contracts/quote'
import { db } from '../db/store'
import type { DbCart, DbOrder, DbState } from '../db/types'
import { apiError, parseBody, requireSession } from '../lib/http'
import { checkCoupon, findEdition, maxQuantity, quoteFromCart } from '../lib/pricing'
import { publishNftUpdated, publishOrderUpdated } from '../realtime/events'
import { getScenario } from '../scenarios'

const QUOTE_TTL_MS = 10 * 60 * 1000 // cotação vale 10 minutos
const SETTLE_MS = 3000             // a simulação decide o pagamento em 3 segundos

// ---------- validações ----------

function validateCart(s: DbState, cart: DbCart): Response | null {
  for (const item of cart.items) {
    const found = findEdition(s, item.nftId, item.editionId)
    const limit = found ? maxQuantity(found.edition) : 0
    if (item.quantity > limit) {
      const message = `${found?.nft.name ?? 'Um item'} não tem mais essa quantidade disponível`
      return apiError('OUT_OF_STOCK', message, { [item.id]: [message] })
    }
  }
  if (cart.couponCode) {
    const check = checkCoupon(s, cart.couponCode)
    if (!check.ok) {
      const message = check.code === 'COUPON_EXPIRED' ? 'O cupom aplicado expirou' : 'O cupom aplicado não é mais válido'
      return apiError(check.code, message, { code: [message] })
    }
  }
  return null
}

// "impressão digital" dos valores: se qualquer preço, quantidade, cupom ou taxa mudou, ela muda
type QuoteValues = Pick<Quote, 'lines' | 'couponCode' | 'subtotal' | 'discount' | 'networkFee' | 'total'>
const fingerprint = (q: QuoteValues) =>
  JSON.stringify([q.lines, q.couponCode, q.subtotal, q.discount, q.networkFee, q.total])

// ---------- estoque, carrinho e decisão do pagamento ----------

function adjustStock(s: DbState, order: DbOrder, sign: 1 | -1) {
  for (const line of order.lines) {
    const found = findEdition(s, line.nftId, line.editionId)
    if (found && found.edition.available !== null) {
      found.edition.available += sign * line.quantity
      found.nft.version += 1
    }
  }
}

// remove do carrinho só os itens e as quantidades compradas
function removePurchasedFromCart(s: DbState, order: DbOrder) {
  const cart = s.carts.find((c) => c.userId === order.userId)
  if (!cart) return
  for (const line of order.lines) {
    const item = cart.items.find((i) => i.nftId === line.nftId && i.editionId === line.editionId)
    if (item) item.quantity -= line.quantity
  }
  cart.items = cart.items.filter((i) => i.quantity > 0)
  if (!cart.items.length) cart.couponCode = null
}

// decide os pedidos pendentes cujo prazo já passou
function settleDueOrders(s: DbState, now = new Date()): DbOrder[] {
  const settled: DbOrder[] = []
  for (const order of s.orders) {
    if (order.status !== 'pending' || new Date(order.settleAt) > now) continue
    order.status = order.outcome
    order.version += 1
    if (order.outcome === 'confirmed') {
      const hex = order.id.replace(/-/g, '')
      order.txHash = `0x${hex}${hex}` // 64 caracteres hexadecimais, determinístico
      order.explorerUrl = `https://etherscan.io/tx/${order.txHash}` // simulado
      order.confirmedAt = now.toISOString()
      removePurchasedFromCart(s, order)
    } else {
      order.rejectionReason = 'O pagamento foi recusado pela carteira.'
      adjustStock(s, order, 1) // devolve o estoque reservado
    }
    settled.push(order)
  }
  return settled
}

// emite nft.updated uma vez por NFT afetado pelo pedido
function publishNftsOf(order: DbOrder) {
  const ids = new Set(order.lines.map((l) => l.nftId))
  for (const nft of db.read().nfts) if (ids.has(nft.id)) publishNftUpdated(nft)
}

// decide o que venceu e avisa quem precisa saber
function settleAndPublish() {
  const settled = db.write((s) => settleDueOrders(s))
  for (const order of settled) {
    publishOrderUpdated(order)
    if (order.status === 'rejected') publishNftsOf(order) // estoque devolvido
  }
}

function scheduleSettlement(order: DbOrder) {
  const delay = Math.max(0, new Date(order.settleAt).getTime() - Date.now())
  setTimeout(settleAndPublish, delay)
}

// chamada ao iniciar o mock: decide o que venceu com a página fechada e reagenda o resto
export function resumePendingOrders() {
  settleAndPublish()
  for (const order of db.read().orders) {
    if (order.status === 'pending') scheduleSettlement(order)
  }
}

// ---------- handlers ----------

export const checkoutHandlers = [
  http.post('/api/quote', ({ request }) => {
    const { userId } = requireSession(request)
    return db.write((s) => {
      const cart = s.carts.find((c) => c.userId === userId)
      if (!cart?.items.length) return apiError('VALIDATION_ERROR', 'Seu carrinho está vazio')

      const invalid = validateCart(s, cart)
      if (invalid) return invalid

      const quote = {
        id: crypto.randomUUID(),
        userId,
        cartId: cart.id,
        expiresAt: new Date(Date.now() + QUOTE_TTL_MS).toISOString(),
        ...quoteFromCart(s, cart),
      }
      // uma cotação ativa por usuário: uma nova invalida a anterior
      s.quotes = [...s.quotes.filter((q) => q.userId !== userId), quote]
      return HttpResponse.json(Quote.parse(quote))
    })
  }),

  http.post('/api/orders', async ({ request }) => {
    const { userId } = requireSession(request)
    const key = request.headers.get('Idempotency-Key')
    if (!key) return apiError('VALIDATION_ERROR', 'O header Idempotency-Key é obrigatório')

    const input = await parseBody(request, CreateOrderInput)
    // o Zod devolve as chaves na ordem do schema, então o JSON é estável para comparar
    const bodyHash = JSON.stringify(input)
    // a chave é guardada por usuário: a chave de um nunca recupera o pedido de outro
    const recordKey = `${userId}:${key}`

    settleAndPublish() // decide pedidos vencidos antes de consultar o banco

    // IMPORTANTE: do início ao fim deste write não existe await.
    // Checar a chave e gravá-la acontecem juntos, então dois envios simultâneos não conseguem passar pela checagem ao mesmo tempo.
    const result = db.write((s): Response | DbOrder => {
      const record = s.idempotency[recordKey]
      if (record) {
        if (record.bodyHash !== bodyHash) {
          return apiError('IDEMPOTENCY_CONFLICT', 'Esta tentativa de compra já foi usada com outros dados')
        }
        const existing = s.orders.find((o) => o.id === record.orderId)
        if (!existing) return apiError('NOT_FOUND', 'Pedido não encontrado')
        return HttpResponse.json(Order.parse(existing)) // mesma tentativa: mesmo pedido, estado atual
      }

      const quote = s.quotes.find((q) => q.id === input.quoteId && q.userId === userId)
      const cart = s.carts.find((c) => c.userId === userId)
      if (!quote || !cart || new Date(quote.expiresAt) <= new Date()) {
        return apiError('QUOTE_STALE', 'Sua cotação expirou. Revise o pedido e confirme novamente.')
      }
      if (validateCart(s, cart) || fingerprint(quote) !== fingerprint(quoteFromCart(s, cart))) {
        return apiError('QUOTE_STALE', 'Preço, disponibilidade ou cupom mudaram. Revise o pedido e confirme novamente.')
      }

      const wallet = s.wallets.find((w) => w.id === input.walletId && w.userId === userId)
      if (!wallet) {
        return apiError('VALIDATION_ERROR', 'Carteira não encontrada', { walletId: ['Selecione uma carteira cadastrada'] })
      }

      const now = new Date()
      const order: DbOrder = {
        id: crypto.randomUUID(),
        userId,
        idempotencyKey: key,
        status: 'pending',
        version: 1,
        createdAt: now.toISOString(),
        confirmedAt: null,
        lines: structuredClone(quote.lines), // cópia: o recibo não muda com o catálogo
        subtotal: quote.subtotal,
        discount: quote.discount,
        networkFee: quote.networkFee,
        total: quote.total,
        wallet: { type: wallet.type, address: wallet.address, nickname: wallet.nickname },
        network: input.network,
        txHash: null,
        explorerUrl: null,
        rejectionReason: null,
        settleAt: new Date(now.getTime() + SETTLE_MS).toISOString(),
        outcome: getScenario() === 'payment-rejected' ? 'rejected' : 'confirmed',
      }

      adjustStock(s, order, -1) // reserva o estoque já na criação
      s.orders.push(order)
      s.idempotency[recordKey] = { userId, bodyHash, orderId: order.id }
      s.quotes = s.quotes.filter((q) => q.id !== quote.id) // cada cotação vale para um pedido
      return order
    })

    if (result instanceof Response) return result
    publishNftsOf(result) // estoque reservado
    scheduleSettlement(result)
    // o pedido JÁ existe; só a resposta se perde. O app reenvia com a mesma chave e recupera o pedido.
    if (getScenario() === 'order-timeout') await delay(15_000)
    return HttpResponse.json(Order.parse(result), { status: 201 })
  }),

  http.get('/api/orders/:id', ({ request, params }) => {
    const { userId } = requireSession(request)
    settleAndPublish()
      const order = db.read().orders.find((o) => o.id === params.id && o.userId === userId)
      // pedido de outro usuário responde 404, e não 403: não revela que ele existe
      if (!order) return apiError('NOT_FOUND', 'Pedido não encontrado')
      return HttpResponse.json(Order.parse(order))
    })
]