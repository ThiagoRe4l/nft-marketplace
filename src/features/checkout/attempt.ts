import { z } from 'zod'
import { CreateOrderInput } from '@/contracts/order'

const Attempt = z.object({
  key: z.string(),
  body: CreateOrderInput,
  orderId: z.string().nullable(),
})
export type Attempt = z.infer<typeof Attempt>

// por usuário: a tentativa de um nunca aparece para outro
const storageKey = (userId: string) => `kurio-checkout-attempt:${userId}`

export const attemptStorage = {
  get(userId: string): Attempt | null {
    try {
      const raw = localStorage.getItem(storageKey(userId))
      if (!raw) return null
      const parsed = Attempt.safeParse(JSON.parse(raw))
      return parsed.success ? parsed.data : null
    } catch {
      return null
    }
  },
  set(userId: string, attempt: Attempt) {
    try {
      localStorage.setItem(storageKey(userId), JSON.stringify(attempt))
    } catch {
      // sem persistência: a proteção vale só até o refresh
    }
  },
  clear(userId: string) {
    try {
      localStorage.removeItem(storageKey(userId))
    } catch {
      // nada a fazer
    }
  },
}

// O parse normaliza a ordem das chaves, então a comparação é estável
const sameBody = (a: z.infer<typeof CreateOrderInput>, b: z.infer<typeof CreateOrderInput>) =>
  JSON.stringify(CreateOrderInput.parse(a)) === JSON.stringify(CreateOrderInput.parse(b))

// Mesmo conteúdo = mesma tentativa (reaproveita a chave, e o pedido se já existir).
// Conteúdo novo (outra cotação, outra carteira) = tentativa nova, com chave nova.
export function attemptFor(userId: string, body: z.infer<typeof CreateOrderInput>): Attempt {
  const current = attemptStorage.get(userId)
  if (current && sameBody(current.body, body)) return current
  const fresh: Attempt = { key: crypto.randomUUID(), body, orderId: null }
  attemptStorage.set(userId, fresh)
  return fresh
}

// pedido terminal (confirmado ou recusado): a tentativa acabou
export function finishAttempt(userId: string, orderId: string) {
  if (attemptStorage.get(userId)?.orderId === orderId) attemptStorage.clear(userId)
}