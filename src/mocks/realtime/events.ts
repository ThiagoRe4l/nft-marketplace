import { NftUpdatedEvent, OrderUpdatedEvent } from '@/contracts/events'
import type { Nft } from '@/contracts/nft'
import type { DbOrder } from '../db/types'
import { emit } from './hub'

const nftHistory: NftUpdatedEvent[] = []

export function publishNftUpdated(nft: Nft) {
  const event = NftUpdatedEvent.parse({
    eventId: crypto.randomUUID(),
    type: 'nft.updated',
    resource: { type: 'nft', id: nft.id },
    version: nft.version,
    occurredAt: new Date().toISOString(),
    payload: {
      editions: nft.editions.map(({ id, price, compareAtPrice, available }) => ({ id, price, compareAtPrice, available })),
    },
  })
  nftHistory.push(event)
  emit('nft.updated', event)
}

export function publishOrderUpdated(order: DbOrder) {
  const event = OrderUpdatedEvent.parse({
    eventId: crypto.randomUUID(),
    type: 'order.updated',
    resource: { type: 'order', id: order.id },
    version: order.version,
    occurredAt: new Date().toISOString(),
    payload: { status: order.status, txHash: order.txHash, rejectionReason: order.rejectionReason },
  })
  emit('order.updated', event, order.userId) // só para o dono
}

// para os testes:
// "last" reenvia o último evento igual (duplicata: mesmo eventId) → testa a deduplicação
// "previous" reenvia o penúltimo com eventId novo (evento antigo e atrasado) → testa a versão
export function replayNftEvent(which: 'last' | 'previous') {
  const event = nftHistory.at(which === 'last' ? -1 : -2)
  if (!event) return false
  emit('nft.updated', which === 'last' ? event : { ...event, eventId: crypto.randomUUID() })
  return true
}