import { http, HttpResponse } from 'msw'
import { AddCartItemInput, ApplyCouponInput, MergeCartInput, UpdateCartItemInput, type Cart } from '@/contracts/cart'
import { db } from '../db/store'
import type { DbCart, DbState } from '../db/types'
import { apiError, optionalSession, parseBody, requireSession } from '../lib/http'
import { checkCoupon, findEdition, maxQuantity, summarize } from '../lib/pricing'

// Logado: o carrinho do usuário. Visitante: o do header X-Cart-Id, ou um novo.
// Só pode ser chamada dentro de db.write, porque pode criar o carrinho.
function resolveCart(s: DbState, request: Request): DbCart {
  const session = optionalSession(request)
  const existing = session
    ? s.carts.find((c) => c.userId === session.userId)
    : s.carts.find((c) => c.userId === null && c.id === request.headers.get('X-Cart-Id'))
  if (existing) return existing

  const cart: DbCart = { id: crypto.randomUUID(), userId: session?.userId ?? null, items: [], couponCode: null }
  s.carts.push(cart)
  return cart
}

// monta a resposta com preço e estoque ATUAIS do catálogo
function toResponse(s: Readonly<DbState>, cart: DbCart): Cart {
  const items = cart.items.flatMap((item) => {
    const found = findEdition(s, item.nftId, item.editionId)
    if (!found) return []
    const { nft, edition } = found
    return [{
      ...item,
      nft: {
        name: nft.name,
        tokenId: nft.tokenId,
        image: nft.images[0],
        editionLabel: edition.label,
        unitPrice: edition.price,
        available: edition.available,
        maxPerOrder: edition.maxPerOrder,
        version: nft.version,
      },
    }]
  })
  return { id: cart.id, items, couponCode: cart.couponCode, summary: summarize(s, cart.items, cart.couponCode) }
}

const limitMessage = (limit: number) =>
  limit === 0 ? 'Esta edição está esgotada' : `Limite de ${limit} unidade(s) para esta edição`

export const cartHandlers = [
  http.get('/api/cart', ({ request }) =>
    HttpResponse.json(db.write((s) => toResponse(s, resolveCart(s, request)))),
  ),

  http.post('/api/cart/items', async ({ request }) => {
    const input = await parseBody(request, AddCartItemInput)
    return db.write((s) => {
      const cart = resolveCart(s, request)
      const found = findEdition(s, input.nftId, input.editionId)
      if (!found) return apiError('NOT_FOUND', 'NFT ou edição não encontrado')

      // mesmo NFT e mesma edição: soma na linha existente
      const line = cart.items.find((i) => i.nftId === input.nftId && i.editionId === input.editionId)
      const quantity = (line?.quantity ?? 0) + input.quantity
      const limit = maxQuantity(found.edition)
      if (quantity > limit) return apiError('OUT_OF_STOCK', limitMessage(limit))

      if (line) line.quantity = quantity
      else cart.items.push({ id: crypto.randomUUID(), nftId: input.nftId, editionId: input.editionId, quantity })
      return HttpResponse.json(toResponse(s, cart))
    })
  }),

  http.patch('/api/cart/items/:itemId', async ({ request, params }) => {
    const input = await parseBody(request, UpdateCartItemInput)
    return db.write((s) => {
      const cart = resolveCart(s, request)
      const line = cart.items.find((i) => i.id === params.itemId)
      if (!line) return apiError('NOT_FOUND', 'Este item não está no carrinho')

      const found = findEdition(s, line.nftId, line.editionId)
      const limit = found ? maxQuantity(found.edition) : 0
      if (input.quantity > limit) return apiError('OUT_OF_STOCK', limitMessage(limit))

      line.quantity = input.quantity
      return HttpResponse.json(toResponse(s, cart))
    })
  }),

  // remover algo que já não está lá não é erro: o resultado final é o mesmo
  http.delete('/api/cart/items/:itemId', ({ request, params }) =>
    db.write((s) => {
      const cart = resolveCart(s, request)
      cart.items = cart.items.filter((i) => i.id !== params.itemId)
      return HttpResponse.json(toResponse(s, cart))
    }),
  ),

  http.put('/api/cart/coupon', async ({ request }) => {
    const { code } = await parseBody(request, ApplyCouponInput)
    return db.write((s) => {
      const cart = resolveCart(s, request)
      const check = checkCoupon(s, code)
      if (!check.ok) {
        const message = check.code === 'COUPON_EXPIRED' ? 'Este cupom expirou' : 'Cupom inválido'
        return apiError(check.code, message, { code: [message] })
      }
      cart.couponCode = check.coupon.code
      return HttpResponse.json(toResponse(s, cart))
    })
  }),

  http.delete('/api/cart/coupon', ({ request }) =>
    db.write((s) => {
      const cart = resolveCart(s, request)
      cart.couponCode = null
      return HttpResponse.json(toResponse(s, cart))
    }),
  ),

  http.post('/api/cart/merge', async ({ request }) => {
    requireSession(request)
    const { guestCartId } = await parseBody(request, MergeCartInput)
    return db.write((s) => {
      const userCart = resolveCart(s, request)
      const guest = s.carts.find((c) => c.id === guestCartId && c.userId === null)

      // se o carrinho de visitante já não existe (merge repetido), só devolve o do usuário
      if (guest) {
        for (const item of guest.items) {
          const found = findEdition(s, item.nftId, item.editionId)
          if (!found) continue
          const line = userCart.items.find((i) => i.nftId === item.nftId && i.editionId === item.editionId)
          // soma as quantidades, respeitando o limite da edição
          const quantity = Math.min((line?.quantity ?? 0) + item.quantity, maxQuantity(found.edition))
          if (quantity <= 0) continue
          if (line) line.quantity = quantity
          else userCart.items.push({ ...item, id: crypto.randomUUID(), quantity })
        }
        userCart.couponCode ??= guest.couponCode
        s.carts = s.carts.filter((c) => c.id !== guest.id)
      }
      return HttpResponse.json(toResponse(s, userCart))
    })
  }),
]