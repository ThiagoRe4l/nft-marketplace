import { http, HttpResponse } from 'msw'
import { authHandlers } from './auth'
import { cartHandlers } from './cart'

export const handlers = [
  http.get('/api/health', () => HttpResponse.json({ status: 'ok' })),
  ...authHandlers,
  ...cartHandlers
]