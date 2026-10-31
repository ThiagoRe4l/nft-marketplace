import { couponFixtures } from '../fixtures/coupons'
import { nftFixtures } from '../fixtures/nfts'
import type { DbState } from './types'
import { userFixtures, walletFixtures } from '../fixtures/users'

// structuredClone: o reset precisa de cópias novas, nunca das fixtures mutadas
export function createSeed(): DbState {
  return structuredClone({
    schemaVersion: 1,
    users: userFixtures,
    sessions: [],
    nfts: nftFixtures,
    favorites: {},
    carts: [],
    quotes: [],
    orders: [],
    idempotency: {},
    wallets: walletFixtures,
    coupons: couponFixtures,
  })
}