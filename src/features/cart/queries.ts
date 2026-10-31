import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { z } from 'zod'
import { AddCartItemInput, Cart } from '@/contracts/cart'
import { useSession } from '@/features/auth/session'
import { request } from '@/shared/api/client'
import { cartIdStorage, tokenStorage } from '@/shared/api/storage'

// dado privado: a chave leva o dono (usuário ou visitante)
export const cartKeys = {
  all: ['cart'] as const,
  owner: (owner: string) => [...cartKeys.all, owner] as const,
}

function useCartKey() {
  const session = useSession()
  return cartKeys.owner(session.data?.user.id ?? 'guest')
}

// o visitante guarda o id do carrinho criado pelo mock para mandar no X-Cart-Id
function rememberGuestCart(cart: Cart) {
  if (!tokenStorage.get()) cartIdStorage.set(cart.id)
}

export function useCart() {
  const session = useSession()
  const queryKey = useCartKey()
  return useQuery({
    queryKey,
    queryFn: async ({ signal }) => {
      const cart = await request(Cart, { url: '/cart', signal })
      rememberGuestCart(cart)
      return cart
    },
    enabled: !session.isPending, // só busca depois de saber quem é o dono
  })
}

function useCartMutation<TVars>(mutationFn: (vars: TVars) => Promise<Cart>) {
  const queryClient = useQueryClient()
  const queryKey = useCartKey()
  return useMutation({
    mutationFn,
    // mesma fila para todas as mutations do carrinho: a resposta de um clique antigo nunca sobrescreve a de um clique mais novo
    scope: { id: 'cart' },
    onSuccess: (cart) => {
      rememberGuestCart(cart)
      queryClient.setQueryData(queryKey, cart) // a resposta já é o carrinho atualizado
    },
    // falhou (ex.: estoque mudou): busca o estado real de novo
    onError: () => queryClient.invalidateQueries({ queryKey }),
  })
}

export const useAddToCart = () =>
  useCartMutation((input: z.infer<typeof AddCartItemInput>) =>
    request(Cart, { method: 'POST', url: '/cart/items', data: input }),
  )

export const useUpdateCartItem = () =>
  useCartMutation(({ itemId, quantity }: { itemId: string; quantity: number }) =>
    request(Cart, { method: 'PATCH', url: `/cart/items/${itemId}`, data: { quantity } }),
  )

export const useRemoveCartItem = () =>
  useCartMutation((itemId: string) => request(Cart, { method: 'DELETE', url: `/cart/items/${itemId}` }))

export const useApplyCoupon = () =>
  useCartMutation((code: string) => request(Cart, { method: 'PUT', url: '/cart/coupon', data: { code } }))

export const useRemoveCoupon = () =>
  useCartMutation(() => request(Cart, { method: 'DELETE', url: '/cart/coupon' }))

export const cartItemCount = (cart: Cart | undefined) =>
  cart?.items.reduce((total, item) => total + item.quantity, 0) ?? 0