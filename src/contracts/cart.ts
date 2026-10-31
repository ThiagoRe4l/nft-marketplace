import { z } from 'zod'
import { EthAmount, Id, PriceSummary } from './common'

export const MergeCartInput = z.object({ guestCartId: Id })

export const CartLine = z.object({
  id: Id,
  nftId: Id,
  editionId: Id,
  quantity: z.number().int().min(1),
  nft: z.object({
    name: z.string(),
    tokenId: z.string(),
    image: z.string(),
    editionLabel: z.string(),
    unitPrice: EthAmount,
    available: z.number().int().nullable(),
    maxPerOrder: z.number().int(),
    version: z.number().int(),
  }),
})

export const Cart = z.object({
  id: Id,
  items: z.array(CartLine),
  couponCode: z.string().nullable(),
  summary: PriceSummary, // calculado pelo mock
})
export type Cart = z.infer<typeof Cart>

export const AddCartItemInput = z.object({ nftId: Id, editionId: Id, quantity: z.number().int().min(1) })
export const UpdateCartItemInput = z.object({ quantity: z.number().int().min(1) })
export const ApplyCouponInput = z.object({ code: z.string().trim().min(1, 'Informe o cupom') })