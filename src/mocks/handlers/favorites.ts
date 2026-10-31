import { http, HttpResponse } from 'msw'
import { db } from '../db/store'
import { apiError, requireSession } from '../lib/http'
import { toSummary } from './nfts'

export const favoriteHandlers = [
  http.get('/api/favorites', ({ request }) => {
    const { userId } = requireSession(request)
    const s = db.read()
    const ids = s.favorites[userId] ?? []
    return HttpResponse.json(s.nfts.filter((n) => ids.includes(n.id)).map(toSummary))
  }),

  // idempotente: favoritar duas vezes dá o mesmo resultado
  http.put('/api/favorites/:nftId', ({ request, params }) => {
    const { userId } = requireSession(request)
    const nftId = String(params.nftId)
    return db.write((s) => {
      if (!s.nfts.some((n) => n.id === nftId)) return apiError('NOT_FOUND', 'NFT não encontrado')
      const ids = (s.favorites[userId] ??= [])
      if (!ids.includes(nftId)) ids.push(nftId)
      return new HttpResponse(null, { status: 204 })
    })
  }),

  // desfavoritar o que não é favorito também não é erro
  http.delete('/api/favorites/:nftId', ({ request, params }) => {
    const { userId } = requireSession(request)
    db.write((s) => {
      if (s.favorites[userId]) s.favorites[userId] = s.favorites[userId].filter((id) => id !== params.nftId)
    })
    return new HttpResponse(null, { status: 204 })
  }),
]
