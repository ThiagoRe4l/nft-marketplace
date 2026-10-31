import type { User } from '@/contracts/auth'
import type { Nft } from '@/contracts/nft'
import type { Order } from '@/contracts/order'
import type { Quote } from '@/contracts/quote'
import type { Wallet } from '@/contracts/wallet'

export type DbUser = User & { passwordSalt: string; passwordHash: string }
export type DbSession = { token: string; userId: string; expiresAt: string }
export type DbCartItem = { id: string; nftId: string; editionId: string; quantity: number }
export type DbCart = { id: string; userId: string | null; items: DbCartItem[]; couponCode: string | null }
export type DbQuote = Quote & { userId: string; cartId: string }
export type DbOrder = Order & {
  userId: string
  idempotencyKey: string
  settleAt: string                      // quando a simulação decide o resultado
  outcome: 'confirmed' | 'rejected'
}
export type IdempotencyRecord = { userId: string; bodyHash: string; orderId: string }
export type Coupon = { code: string; percentOff: number; expiresAt: string }

export type DbState = {
  schemaVersion: 1
  users: DbUser[]
  sessions: DbSession[]
  nfts: Nft[]
  favorites: Record<string, string[]>   // userId -> nftIds
  carts: DbCart[]
  quotes: DbQuote[]
  orders: DbOrder[]
  idempotency: Record<string, IdempotencyRecord>
  wallets: (Wallet & { userId: string })[]
  coupons: Coupon[]
}