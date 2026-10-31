import { z } from 'zod'
import { Id, IsoDate, PriceSummary } from './common'
import { Network } from './nft'
import { QuoteLine } from './quote'
import { WalletType } from './wallet'

export const OrderStatus = z.enum(['pending', 'confirmed', 'rejected'])
export type OrderStatus = z.infer<typeof OrderStatus>

// a Idempotency-Key vai no header, não no corpo
export const CreateOrderInput = z.object({
  quoteId: Id,
  walletId: Id,
  network: Network,
  note: z.string().max(500).optional(),
})

export const Order = PriceSummary.extend({
  id: Id,
  status: OrderStatus,
  version: z.number().int(),
  createdAt: IsoDate,
  confirmedAt: IsoDate.nullable(),
  lines: z.array(QuoteLine), // cópia: o recibo não muda se o catálogo mudar
  wallet: z.object({ type: WalletType, address: z.string(), nickname: z.string() }),
  network: Network,
  txHash: z.string().nullable(),
  explorerUrl: z.string().nullable(),
  rejectionReason: z.string().nullable(),
})
export type Order = z.infer<typeof Order>