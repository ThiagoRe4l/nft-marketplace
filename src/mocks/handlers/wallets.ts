import { http, HttpResponse } from 'msw'
import { UpsertWalletInput, Wallet, WalletSlot } from '@/contracts/wallet'
import { db } from '../db/store'
import { apiError, parseBody, requireSession } from '../lib/http'

// lança 422 se o slot da URL não for "primary" nem "secondary"
function parseSlot(value: unknown) {
  const slot = WalletSlot.safeParse(value)
  if (!slot.success) throw apiError('VALIDATION_ERROR', 'Slot inválido', { slot: ['Use "primary" ou "secondary"'] })
  return slot.data
}

export const walletHandlers = [
  http.get('/api/wallets', ({ request }) => {
    const { userId } = requireSession(request)
    const wallets = db.read().wallets.filter((w) => w.userId === userId)
    return HttpResponse.json(wallets.map((w) => Wallet.parse(w)))
  }),

  http.put('/api/wallets/:slot', async ({ request, params }) => {
    const { userId } = requireSession(request)
    const slot = parseSlot(params.slot)
    const input = await parseBody(request, UpsertWalletInput)
    return db.write((s) => {
      const existing = s.wallets.find((w) => w.userId === userId && w.slot === slot)
      if (existing) {
        Object.assign(existing, input)
        return HttpResponse.json(Wallet.parse(existing))
      }
      const wallet = { ...input, id: crypto.randomUUID(), slot, userId }
      s.wallets.push(wallet)
      return HttpResponse.json(Wallet.parse(wallet))
    })
  }),

  http.post('/api/wallets/:slot/connect', ({ request, params }) => {
    const { userId } = requireSession(request)
    const slot = parseSlot(params.slot)
    const wallet = db.read().wallets.find((w) => w.userId === userId && w.slot === slot)
    if (!wallet) return apiError('NOT_FOUND', 'Nenhuma carteira neste slot')
    return new HttpResponse(null, { status: 204 })
  }),
]
