import { http, HttpResponse } from 'msw'
import { z } from 'zod'
import { EthAmount } from '@/contracts/common'
import { db } from '../db/store'
import { apiError, parseBody } from '../lib/http'
import { publishNftUpdated, replayNftEvent } from '../realtime/events'
import { disconnectAll } from '../realtime/hub'

const EditionPatch = z.object({
  price: EthAmount.optional(),
  available: z.number().int().min(0).nullable().optional(),
})
const ReplayInput = z.object({ which: z.enum(['last', 'previous']) })

const noContent = () => new HttpResponse(null, { status: 204 })

export const controlHandlers = [
  http.post('/api/__mock/reset', () => {
    db.reset()
    return noContent()
  }),

  // simula uma mudança externa de preço ou estoque: altera o banco E emite o evento
  http.post('/api/__mock/nfts/:nftId/editions/:editionId', async ({ request, params }) => {
    const patch = await parseBody(request, EditionPatch)
    const nft = db.write((s) => {
      const nft = s.nfts.find((n) => n.id === params.nftId)
      const edition = nft?.editions.find((e) => e.id === params.editionId)
      if (!nft || !edition) return null
      if (patch.price !== undefined) edition.price = patch.price
      if (patch.available !== undefined) edition.available = patch.available
      nft.version += 1
      return nft
    })
    if (!nft) return apiError('NOT_FOUND', 'NFT ou edição não encontrado')
    publishNftUpdated(nft)
    return HttpResponse.json(nft)
  }),

  http.post('/api/__mock/realtime/replay', async ({ request }) => {
    const { which } = await parseBody(request, ReplayInput)
    return replayNftEvent(which) ? noContent() : apiError('NOT_FOUND', 'Nenhum evento para reenviar')
  }),

  http.post('/api/__mock/realtime/disconnect', () => {
    disconnectAll()
    return noContent()
  }),

  // expira todas as sessões: cenário "sessão expirada durante a navegação"
  http.post('/api/__mock/session/expire', () => {
    db.write((s) => {
      for (const session of s.sessions) session.expiresAt = new Date(0).toISOString()
    })
    return noContent()
  }),
]