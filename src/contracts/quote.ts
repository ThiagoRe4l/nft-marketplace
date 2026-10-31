import { z } from 'zod'
import { EthAmount, Id, IsoDate, PriceSummary } from './common'

export const QuoteLine = z.object({
  nftId: Id,
  editionId: Id,
  name: z.string(),
  tokenId: z.string(),
  image: z.string(),
  editionLabel: z.string(),
  unitPrice: EthAmount,
  quantity: z.number().int(),
  lineTotal: EthAmount,
})

// a cotação "congela" os valores para o checkout
export const Quote = PriceSummary.extend({
  id: Id,
  lines: z.array(QuoteLine),
  couponCode: z.string().nullable(),
  expiresAt: IsoDate,
})
export type Quote = z.infer<typeof Quote>