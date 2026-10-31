import Big from 'big.js'
import type { PriceSummary } from '@/contracts/common'
import type { Edition } from '@/contracts/nft'
import type { Coupon, DbCartItem, DbState } from '../db/types'

type Db = Readonly<DbState>

export const NETWORK_FEE = '0.016'

export function findEdition(s: Db, nftId: string, editionId: string) {
  const nft = s.nfts.find((n) => n.id === nftId)
  const edition = nft?.editions.find((e) => e.id === editionId)
  return nft && edition ? { nft, edition } : null
}

// o limite real é o menor entre o máximo por pedido e o estoque disponível
export function maxQuantity(edition: Edition) {
  return edition.available === null ? edition.maxPerOrder : Math.min(edition.maxPerOrder, edition.available)
}

type CouponCheck = { ok: true; coupon: Coupon } | { ok: false; code: 'COUPON_INVALID' | 'COUPON_EXPIRED' }

export function checkCoupon(s: Db, code: string, now = new Date()): CouponCheck {
  const coupon = s.coupons.find((c) => c.code.toUpperCase() === code.toUpperCase())
  if (!coupon) return { ok: false, code: 'COUPON_INVALID' }
  if (new Date(coupon.expiresAt) <= now) return { ok: false, code: 'COUPON_EXPIRED' }
  return { ok: true, coupon }
}

export function summarize(s: Db, items: DbCartItem[], couponCode: string | null): PriceSummary {
  const subtotal = items.reduce((sum, item) => {
    const found = findEdition(s, item.nftId, item.editionId)
    return found ? sum.plus(new Big(found.edition.price).times(item.quantity)) : sum
  }, new Big(0))

  const check = couponCode ? checkCoupon(s, couponCode) : null
  // arredonda o desconto em 6 casas: sem isso, 10% de um valor com 18 casas passaria do limite do EthAmount
  const discount = check?.ok ? subtotal.times(check.coupon.percentOff).div(100).round(6, Big.roundDown) : new Big(0)
  const networkFee = items.length ? new Big(NETWORK_FEE) : new Big(0)

  // toFixed() sem argumento: precisão total e nunca notação científica (1e-7)
  return {
    subtotal: subtotal.toFixed(),
    discount: discount.toFixed(),
    networkFee: networkFee.toFixed(),
    total: subtotal.minus(discount).plus(networkFee).toFixed(),
  }
}