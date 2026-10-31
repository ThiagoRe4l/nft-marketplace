import { useNavigate, useSearch } from '@tanstack/react-router'
import { z } from 'zod'
import { EthAmount } from '@/contracts/common'
import { Category, Network, NftSort, NftTab } from '@/contracts/nft'

export const CatalogSearch = z.object({
  q: z.string().trim().min(1).optional().catch(undefined),
  tab: NftTab.optional().catch(undefined),
  category: z.array(Category).optional().catch(undefined),
  network: z.array(Network).optional().catch(undefined),
  minPrice: EthAmount.optional().catch(undefined),
  maxPrice: EthAmount.optional().catch(undefined),
  sort: NftSort.optional().catch(undefined),
  page: z.number().int().min(1).optional().catch(undefined),
})
export type CatalogSearch = z.infer<typeof CatalogSearch>

// o que as telas usam: lê os filtros e muda a URL
export function useCatalogFilters() {
  const search = useSearch({ from: '/' })
  const navigate = useNavigate({ from: '/' })

  // qualquer mudança de filtro volta para a página 1
  const setFilters = (patch: Partial<Omit<CatalogSearch, 'page'>>) =>
    navigate({ search: (prev) => ({ ...prev, ...patch, page: undefined }), resetScroll: false })

  const setPage = (page: number) =>
    navigate({ search: (prev) => ({ ...prev, page: page === 1 ? undefined : page }) })

  const clearFilters = () => navigate({ search: {} })

  return { search, setFilters, setPage, clearFilters }
}