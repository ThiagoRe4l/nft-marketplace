import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { SlidersHorizontalIcon } from 'lucide-react'
import { SearchForm } from '@/components/layout/search-form'
import { CatalogSection } from '@/features/catalog/components/catalog-section'
import { HeroCarousel } from '@/features/catalog/components/hero-carousel'
import { JournalSection } from '@/features/catalog/components/journal-section'
import { PromoBanners } from '@/features/catalog/components/promo-banners'
import { nftListQuery, useFeatured } from '@/features/catalog/queries'
import { CatalogSearch, useCatalogFilters } from '@/features/catalog/search'
import { useSubmitSearch } from '@/features/catalog/use-submit-search'
import { useQuickAdd } from '@/features/cart/use-quick-add'
import { useFavoriteIds, useToggleFavorite } from '@/features/favorites/queries'

export const Route = createFileRoute('/')({
  validateSearch: CatalogSearch,
  loaderDeps: ({ search }) => search,
  // começa a buscar antes de a tela montar, sem bloquear a navegação (o skeleton aparece)
  loader: ({ context, deps }) => {
    void context.queryClient.prefetchQuery(nftListQuery(deps))
  },
  component: Home,
})

function Home() {
  const { search } = useCatalogFilters()
  const featured = useFeatured()
  const submitSearch = useSubmitSearch()
  const quickAdd = useQuickAdd()
  const [filtersOpen, setFiltersOpen] = useState(false)

  const hero = featured.data?.hero ?? []
  const spotlight = featured.data?.spotlight

  return (
    <>
      {/* campo e botão de filtros só no mobile (frame do Figma) */}
      <div className="mx-auto flex w-full max-w-page gap-3 px-gutter pt-4 lg:hidden">
        <SearchForm
          // recomeça do texto da URL quando a busca muda
          key={search.q ?? ''}
          className="flex-1"
          label="Explorar coleções"
          placeholder="Explorar coleções"
          defaultValue={search.q}
          onSearch={submitSearch}
        />
        <button
          type="button"
          aria-label="Filtros"
          aria-expanded={filtersOpen}
          onClick={() => setFiltersOpen(true)}
          className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-hover text-primary-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring"
        >
          <SlidersHorizontalIcon className="size-5" />
        </button>
      </div>

      <HeroCarousel
        slides={hero}
        isLoading={featured.isPending}
        error={featured.isError ? 'Não foi possível carregar os destaques.' : null}
        onRetry={() => void featured.refetch()}
      />

      <CatalogSection
        spotlight={spotlight}
        isSpotlightLoading={featured.isPending}
        favoriteIds={useFavoriteIds()}
        onAddToCart={quickAdd}
        // provisório: ligar ao carrinho e aos favoritos quando esses dados existirem
        onToggleFavorite={useToggleFavorite()}
        filtersOpen={filtersOpen}
        onFiltersOpenChange={setFiltersOpen}
      />

      <PromoBanners />
      <JournalSection />
    </>
  )
}
