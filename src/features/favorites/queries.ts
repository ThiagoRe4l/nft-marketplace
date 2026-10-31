import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import { NftSummary } from '@/contracts/nft'
import { useSession } from '@/features/auth/session'
import { withoutAuthParams } from '@/features/auth/redirect'
import { api, request } from '@/shared/api/client'
import { toAppError } from '@/shared/api/errors'

// dado privado: a chave leva o usuário
export const favoriteKeys = {
  owner: (userId: string) => ['favorites', userId] as const,
}

// o cache guarda só os ids: o coração funciona igual no card e no detalhe
export function useFavoriteIds() {
  const userId = useSession().data?.user.id
  const query = useQuery({
    queryKey: favoriteKeys.owner(userId ?? ''),
    queryFn: async ({ signal }) =>
      (await request(z.array(NftSummary), { url: '/favorites', signal })).map((nft) => nft.id),
    enabled: Boolean(userId),
  })
  return new Set(query.data ?? [])
}

type ToggleVars = { nftId: string; name: string; favorite: boolean }

function useToggleFavoriteMutation(userId: string) {
  const queryClient = useQueryClient()
  const queryKey = favoriteKeys.owner(userId)

  return useMutation({
    scope: { id: 'favorites' }, // cliques rápidos entram em fila
    mutationFn: ({ nftId, favorite }: ToggleVars) =>
      favorite ? api.put(`/favorites/${nftId}`) : api.delete(`/favorites/${nftId}`),

    // 1. otimista: a tela muda antes da resposta
    onMutate: async ({ nftId, favorite }) => {
      await queryClient.cancelQueries({ queryKey }) // uma busca em andamento não pode desfazer a mudança
      const previous = queryClient.getQueryData<string[]>(queryKey)
      queryClient.setQueryData<string[]>(queryKey, (old = []) =>
        favorite ? [...new Set([...old, nftId])] : old.filter((id) => id !== nftId),
      )
      return { previous }
    },

    // 2. rollback: falhou, volta exatamente ao estado anterior
    onError: (error, { name }, context) => {
      queryClient.setQueryData(queryKey, context?.previous)
      toast.error(`Não foi possível atualizar os favoritos (${name}). ${toAppError(error).message}`)
    },

    // 3. confirma com o servidor, dando certo ou não
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  })
}

// o que as telas usam: visitante vai para o login; logado alterna o favorito
export function useToggleFavorite() {
  const session = useSession()
  const userId = session.data?.user.id
  const mutation = useToggleFavoriteMutation(userId ?? '')
  const favoriteIds = useFavoriteIds()
  const navigate = useNavigate()
  const href = useRouterState({ select: (s) => s.location.href })

  return (nft: { id: string; name: string }) => {
    if (!userId) {
      // favoritos exigem conta: abre o diálogo e volta para esta página depois
      void navigate({
        to: '.',
        search: (prev) => ({ ...prev, auth: 'login', redirect: withoutAuthParams(href), reason: undefined }),
      })
      return
    }
    mutation.mutate({ nftId: nft.id, name: nft.name, favorite: !favoriteIds.has(nft.id) })
  }
}