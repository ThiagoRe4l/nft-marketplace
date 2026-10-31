import { z } from 'zod'
import { Id, IsoDate } from './common'
import { Edition } from './nft'
import { OrderStatus } from './order'

const envelope = <K extends string, R extends string, P extends z.ZodType>(
  type: K, resourceType: R, payload: P,
) =>
  z.object({
    eventId: Id,                                       // dedupe de duplicatas
    type: z.literal(type),
    resource: z.object({ type: z.literal(resourceType), id: Id }),
    version: z.number().int().min(1),                  // descarta eventos antigos
    occurredAt: IsoDate,
    payload,
  })

export const NftUpdatedEvent = envelope('nft.updated', 'nft', z.object({
  editions: z.array(Edition.pick({ id: true, price: true, compareAtPrice: true, available: true })),
}))
export type NftUpdatedEvent = z.infer<typeof NftUpdatedEvent>

export const OrderUpdatedEvent = envelope('order.updated', 'order', z.object({
  status: OrderStatus,
  txHash: z.string().nullable(),
  rejectionReason: z.string().nullable(),
}))
export type OrderUpdatedEvent = z.infer<typeof OrderUpdatedEvent>