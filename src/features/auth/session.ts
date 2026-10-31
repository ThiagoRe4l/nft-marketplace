import { queryOptions, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import type { z } from 'zod'
import { AuthResponse, LoginInput, Session, SignupInput } from '@/contracts/auth'
import { api, request } from '@/shared/api/client'
import { cartIdStorage, tokenStorage } from '@/shared/api/storage'

export const sessionQuery = queryOptions({
  queryKey: ['session'],
  queryFn: async (): Promise<Session | null> => {
    if (!tokenStorage.get()) return null
    try {
      return await request(Session, { url: '/auth/session' })
    } catch (error) {
      // token vencido no refresh: vira visitante sem alarde
      if (isAxiosError(error) && error.response?.status === 401) {
        tokenStorage.set(null)
        return null
      }
      throw error
    }
  },
  staleTime: Infinity, // só muda por login, logout ou 401
})

export const useSession = () => useQuery(sessionQuery)

// Troca de identidade: limpa TODO o cache, para nada do visitante ou do usuário anterior sobreviver, e só então grava a sessão nova.
async function startSession(queryClient: QueryClient, auth: z.infer<typeof AuthResponse>) {
  tokenStorage.set(auth.token)

  const guestCartId = cartIdStorage.get()
  if (guestCartId) {
    try {
      await api.post('/cart/merge', { guestCartId })
      cartIdStorage.set(null) // só esquece o carrinho de visitante se o merge deu certo
    } catch {
      // merge falhou: o id fica guardado e o merge é tentado de novo no próximo login
    }
  }

  queryClient.clear()
  const session: Session = { user: auth.user, expiresAt: auth.expiresAt }
  queryClient.setQueryData(sessionQuery.queryKey, session)
}

export function endSession(queryClient: QueryClient) {
  tokenStorage.set(null)
  queryClient.clear()
  queryClient.setQueryData(sessionQuery.queryKey, null)
}

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: z.infer<typeof LoginInput>) =>
      request(AuthResponse, { method: 'POST', url: '/auth/login', data: input }),
    onSuccess: (auth) => startSession(queryClient, auth),
  })
}

export function useSignup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: z.infer<typeof SignupInput>) =>
      request(AuthResponse, { method: 'POST', url: '/auth/signup', data: input }),
    onSuccess: (auth) => startSession(queryClient, auth),
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    // se o logout falhar na rede, a sessão local é encerrada mesmo assim
    mutationFn: () => api.post('/auth/logout').catch(() => undefined),
    onSettled: () => endSession(queryClient),
  })
}

// evita redirecionamento aberto: só aceita caminhos internos
export const safeRedirect = (target: string | undefined) =>
  target && target.startsWith('/') && !target.startsWith('//') ? target : '/'