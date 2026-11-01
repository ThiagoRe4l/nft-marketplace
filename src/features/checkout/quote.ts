import Big from 'big.js'
import type { Cart } from '@/contracts/cart'
import type { Quote } from '@/contracts/quote'

// O carrinho ainda é o que a cotação congelou? Compara itens, quantidades, preços unitários, cupom e total.
export function cartMatchesQuote(cart: Cart, quote: Quote): boolean {
  if (cart.couponCode !== quote.couponCode) return false
  if (!new Big(cart.summary.total).eq(quote.total)) return false
  if (cart.items.length !== quote.lines.length) return false

  const lines = new Map(quote.lines.map((line) => [`${line.nftId}:${line.editionId}`, line]))
  return cart.items.every((item) => {
    const line = lines.get(`${item.nftId}:${item.editionId}`)
    return !!line && line.quantity === item.quantity && new Big(line.unitPrice).eq(item.nft.unitPrice)
  })
}
