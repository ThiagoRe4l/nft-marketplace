import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query'
import { FeaturedResponse, Nft, NftListResponse, type NftListParams } from '@/contracts/nft'
import { request } from '@/shared/api/client'

// chaves hierárquicas: invalidar ['nfts'] atinge listas, destaques e detalhes de uma vez
export const nftKeys = {
  all: ['nfts'] as const,
  list: (params: Partial<NftListParams>) => [...nftKeys.all, 'list', params] as const,
  featured: () => [...nftKeys.all, 'featured'] as const,
  detail: (id: string) => [...nftKeys.all, 'detail', id] as const,
}

export const nftListQuery = (params: Partial<NftListParams>) =>
  queryOptions({
    queryKey: nftKeys.list(params),
    // o signal cancela a requisição quando os filtros mudam antes de ela terminar
    queryFn: ({ signal }) => request(NftListResponse, { url: '/nfts', params, signal }),
    // mantém a lista anterior na tela enquanto a nova carrega (isPlaceholderData = true)
    placeholderData: keepPreviousData,
  })

export const featuredQuery = queryOptions({
  queryKey: nftKeys.featured(),
  queryFn: ({ signal }) => request(FeaturedResponse, { url: '/nfts/featured', signal }),
})

export const nftDetailQuery = (id: string) =>
  queryOptions({
    queryKey: nftKeys.detail(id),
    queryFn: ({ signal }) => request(Nft, { url: `/nfts/${id}`, signal }),
  })

export const useNftList = (params: Partial<NftListParams>) => useQuery(nftListQuery(params))
export const useFeatured = () => useQuery(featuredQuery)
export const useNft = (id: string) => useQuery(nftDetailQuery(id))