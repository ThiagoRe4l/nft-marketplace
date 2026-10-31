import { http, HttpResponse } from 'msw'
import { authHandlers } from './auth'
import { cartHandlers } from './cart'
import { checkoutHandlers } from './checkout'
import { favoriteHandlers } from './favorites'
import { nftHandlers } from './nfts'
import { profileHandlers } from './profile'
import { walletHandlers } from './wallets'
import { controlHandlers } from './control'

export const handlers = [
  http.get('/api/health', () => HttpResponse.json({ status: 'ok' })),
  ...authHandlers,
  ...cartHandlers,
  ...checkoutHandlers,
  ...nftHandlers,
  ...favoriteHandlers,
  ...profileHandlers,
  ...walletHandlers,
  ...controlHandlers
]
