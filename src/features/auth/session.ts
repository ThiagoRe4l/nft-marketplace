import { queryOptions, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import type { z } from 'zod'
import { Cart } from '@/contracts/cart'
import { AuthResponse, LoginInput, Session, SignupInput } from '@/contracts/auth'
import { cartKeys } from '@/features/cart/queries'
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

// Esvazia o cache, menos a sessão. NÃO usar queryClient.clear(): ele remove a query da sessão enquanto componentes ainda a
// observam; eles ficam presos à query removida, não re-renderizam com o novo dono e a tela mostra dados do dono anterior.
const clearCache = (queryClient: QueryClient) =>
  queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== sessionQuery.queryKey[0] })

// Troca de identidade: limpa TODO o cache, para nada do visitante ou do usuário anterior sobreviver, e só então grava a sessão nova.
async function startSession(queryClient: QueryClient, auth: z.infer<typeof AuthResponse>) {
  tokenStorage.set(auth.token)

  const guestCartId = cartIdStorage.get()
  let mergedCart: Cart | null = null
  if (guestCartId) {
    try {
      mergedCart = await request(Cart, { method: 'POST', url: '/cart/merge', data: { guestCartId } })
      cartIdStorage.set(null) // só esquece o carrinho de visitante se o merge deu certo
    } catch {
      // merge falhou: o id fica guardado e o merge é tentado de novo no próximo login
    }
  }

  clearCache(queryClient)
  const session: Session = { user: auth.user, expiresAt: auth.expiresAt }
  queryClient.setQueryData(sessionQuery.queryKey, session)
  // o merge devolve o carrinho já somado: grava no cache do dono (depois do clear), senão a tela fica com o carrinho de antes
  if (mergedCart) queryClient.setQueryData(cartKeys.owner(auth.user.id), mergedCart)
}

export function endSession(queryClient: QueryClient) {
  tokenStorage.set(null)
  clearCache(queryClient)
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