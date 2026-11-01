import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import type { NftSummary } from '@/contracts/nft'
import { useNftList } from '../queries'
import { useCatalogFilters } from '../search'
import { CatalogPagination } from './catalog-pagination'
import { CatalogToolbar } from './catalog-toolbar'
import { FiltersPanel } from './filters-panel'
import { NftGrid } from './nft-grid'
import { SpotlightCard } from './spotlight-card'

type CatalogSectionProps = {
  spotlight: NftSummary | undefined
  isSpotlightLoading: boolean
  favoriteIds: ReadonlySet<string>
  onAddToCart: (nft: NftSummary) => void
  onToggleFavorite: (nft: NftSummary) => void
  filtersOpen: boolean
  onFiltersOpenChange: (open: boolean) => void
}

export function CatalogSection({
  spotlight,
  isSpotlightLoading,
  favoriteIds,
  onAddToCart,
  onToggleFavorite,
  filtersOpen,
  onFiltersOpenChange,
}: CatalogSectionProps) {
  const { search, setFilters, clearFilters } = useCatalogFilters()
  const list = useNftList(search)

  const filtersPanel = (
    <FiltersPanel
      facets={list.data?.facets}
      priceRange={list.data?.priceRange}
      value={{
        category: search.category,
        network: search.network,
        minPrice: search.minPrice,
        maxPrice: search.maxPrice,
      }}
      onChange={setFilters}
    />
  )

  const loaded = list.data && !list.isPlaceholderData
  const errorMessage = list.isError
    ? list.error instanceof Error && list.error.message
      ? list.error.message
      : 'Não foi possível carregar os NFTs.'
    : null

  return (
    <section id="catalogo" aria-label="Catálogo de NFTs" className="mx-auto w-full max-w-page px-gutter py-8 md:py-12 lg:pt-24">
      <div className="grid gap-8 lg:grid-cols-[19.375rem_1fr] lg:items-start lg:gap-12">
        <aside aria-label="Filtros" className="hidden lg:block">
          {filtersPanel}
        </aside>

        <div className="min-w-0 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <CatalogToolbar
            tab={search.tab ?? 'all'}
            sort={search.sort ?? 'recent'}
            onTabChange={(tab) => setFilters({ tab })}
            onSortChange={(sort) => setFilters({ sort })}
          />

          {/* anuncia o total quando a lista carrega (não durante a troca de filtros) */}
          <p role="status" aria-live="polite" className="sr-only">
            {loaded ? `${list.data.total} ${list.data.total === 1 ? 'resultado' : 'resultados'}` : ''}
          </p>

          <NftGrid
            items={list.data?.items}
            isPending={list.isPending}
            isRefreshing={list.isPlaceholderData}
            errorMessage={errorMessage}
            favoriteIds={favoriteIds}
            onAddToCart={onAddToCart}
            onToggleFavorite={onToggleFavorite}
            onRetry={() => void list.refetch()}
            onClearFilters={clearFilters}
          />

          {list.data && (
            <CatalogPagination page={list.data.page} total={list.data.total} pageSize={list.data.pageSize} />
          )}
        </div>

        <div className="mx-auto w-full max-w-sm lg:col-start-1 lg:row-start-2 lg:max-w-none">
          <SpotlightCard nft={spotlight} isLoading={isSpotlightLoading} />
        </div>
      </div>

      <Sheet open={filtersOpen} onOpenChange={onFiltersOpenChange}>
        <SheetContent side="left" className="w-[85%] overflow-y-auto bg-background">
          <SheetHeader>
            <SheetTitle>Filtros</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-4">{filtersPanel}</div>
        </SheetContent>
      </Sheet>
    </section>
  )
}
