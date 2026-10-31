import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { z } from 'zod'
import { CreateOrderInput, Order } from '@/contracts/order'
import { Quote } from '@/contracts/quote'
import type { WalletSlot } from '@/contracts/wallet'
import { useSession } from '@/features/auth/session'
import { orderKeys } from '@/features/orders/keys'
import { api, request } from '@/shared/api/client'
import { toAppError } from '@/shared/api/errors'
import { attemptFor, attemptStorage } from './attempt'

// a cotação congela os valores; é ela que o pedido confirma
export function useCreateQuote() {
  return useMutation({
    mutationFn: () => request(Quote, { method: 'POST', url: '/quote' }),
  })
}

export function useConnectWallet() {
  return useMutation({
    mutationFn: async (slot: z.infer<typeof WalletSlot>) => {
      await api.post(`/wallets/${slot}/connect`)
    },
  })
}

export function usePlaceOrder() {
  const queryClient = useQueryClient()
  const session = useSession()

  return useMutation({
    // cliques repetidos entram na mesma fila e caem na mesma tentativa
    scope: { id: 'checkout' },
    mutationFn: async (body: z.infer<typeof CreateOrderInput>) => {
      const userId = session.data?.user.id
      if (!userId) throw new Error('Sessão encerrada')

      const attempt = attemptFor(userId, body)
      // esta tentativa já gerou um pedido: só busca, nunca cria outro
      if (attempt.orderId) return request(Order, { url: `/orders/${attempt.orderId}` })

      const send = () =>
        request(Order, {
          method: 'POST',
          url: '/orders',
          data: attempt.body,
          headers: { 'Idempotency-Key': attempt.key },
        })

      let order: z.infer<typeof Order>
      try {
        order = await send()
      } catch (error) {
        // timeout ou queda: o pedido pode ter sido criado sem a resposta chegar.
        // Reenvia com a MESMA chave: o mock devolve o pedido existente.
        const { code } = toAppError(error)
        if (code !== 'TIMEOUT' && code !== 'NETWORK_ERROR') throw error
        order = await send()
      }

      attemptStorage.set(userId, { ...attempt, orderId: order.id })
      return order
    },
    onSuccess: (order) => queryClient.setQueryData(orderKeys.detail(order.id), order),
  })
}

// tentativa guardada deste usuário (para retomar depois de um refresh)
export function useStoredAttempt() {
  const session = useSession()
  const userId = session.data?.user.id
  return userId ? attemptStorage.get(userId) : null
}

export const orderQuery = (id: string) =>
  queryOptions({
    queryKey: orderKeys.detail(id),
    queryFn: ({ signal }) => request(Order, { url: `/orders/${id}`, signal }),
    // o socket é o caminho principal; a consulta periódica cobre o socket fora do ar
    refetchInterval: (query) => (query.state.data?.status === 'pending' ? 5000 : false),
  })

export const useOrder = (id: string) => useQuery(orderQuery(id))