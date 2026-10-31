import { HttpResponse } from 'msw'
import { z } from 'zod'
import type { ApiErrorCode } from '@/contracts/common'
import { db } from '../db/store'

const STATUS: Record<ApiErrorCode, number> = {
  VALIDATION_ERROR: 422,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  OUT_OF_STOCK: 409,
  QUOTE_STALE: 409,
  COUPON_INVALID: 422,
  COUPON_EXPIRED: 422,
  WALLET_REJECTED: 422,
  IDEMPOTENCY_CONFLICT: 409,
  TRANSIENT: 503,
}

export function apiError(code: ApiErrorCode, message: string, fieldErrors?: Record<string, string[]>) {
  return HttpResponse.json({ code, message, fieldErrors }, { status: STATUS[code] })
}

// valida o corpo com o mesmo schema do contrato; lança 422 com erros por campo
export async function parseBody<T extends z.ZodType>(request: Request, schema: T): Promise<z.infer<T>> {
  const json = await request.json().catch(() => null)
  const result = schema.safeParse(json)
  if (!result.success) {
    throw apiError('VALIDATION_ERROR', 'Dados inválidos', z.flattenError(result.error).fieldErrors as Record<string, string[]>)
  }
  return result.data
}

// Lança 401 (UNAUTHENTICATED) em três casos: sem token, token inexistente
// (logout/reset) ou sessão expirada. O throw interrompe o handler: nada
// depois desta chamada executa, e o MSW devolve a resposta lançada.
export function requireSession(request: Request) {
  const token = request.headers.get('Authorization')?.replace(/^Bearer /, '')
  const session = token ? db.read().sessions.find((s) => s.token === token) : undefined
  if (!session || new Date(session.expiresAt) <= new Date()) {
    throw apiError('UNAUTHENTICATED', 'Sua sessão expirou. Entre novamente.')
  }
  return session
}

// Visitante é permitido; mas se veio um token e ele é inválido, continua sendo 401, para o app perceber que a sessão expirou em vez de virar visitante sem avisar
export function optionalSession(request: Request) {
  if (!request.headers.has('Authorization')) return null
  return requireSession(request)
}