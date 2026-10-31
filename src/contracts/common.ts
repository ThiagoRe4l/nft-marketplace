import { z } from 'zod'

export const Id = z.string().min(1)
export const IsoDate = z.iso.datetime()

// ETH trafega como string decimal, nunca como number
export const EthAmount = z.string().regex(/^\d+(\.\d{1,18})?$/, 'Valor em ETH inválido')
export type EthAmount = z.infer<typeof EthAmount>

export const ApiErrorCode = z.enum([
  'VALIDATION_ERROR',     // 422, com fieldErrors
  'UNAUTHENTICATED',      // 401, sessão inválida ou expirada
  'FORBIDDEN',            // 403
  'NOT_FOUND',            // 404
  'CONFLICT',             // 409, ex.: e-mail já cadastrado
  'OUT_OF_STOCK',         // 409, disponibilidade
  'QUOTE_STALE',          // 409, preço/estoque/cupom mudou desde a cotação
  'COUPON_INVALID',       // 422
  'COUPON_EXPIRED',       // 422
  'WALLET_REJECTED',      // 422, usuário recusou a conexão da carteira
  'IDEMPOTENCY_CONFLICT', // 409, mesma chave com outro conteúdo
  'TRANSIENT',            // 503, falha temporária
])
export type ApiErrorCode = z.infer<typeof ApiErrorCode>

export const ApiError = z.object({
  code: ApiErrorCode,
  message: z.string(),
  fieldErrors: z.record(z.string(), z.array(z.string())).optional(),
})
export type ApiError = z.infer<typeof ApiError>

export const paginated = <T extends z.ZodType>(item: T) =>
  z.object({
    items: z.array(item),
    page: z.number().int().min(1),
    pageSize: z.number().int(),
    total: z.number().int(),
  })

// resumo de valores: usado no carrinho, na cotação e no pedido
export const PriceSummary = z.object({
  subtotal: EthAmount,
  discount: EthAmount,
  networkFee: EthAmount,
  total: EthAmount,
})
export type PriceSummary = z.infer<typeof PriceSummary>