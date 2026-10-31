import { Button } from '@/components/ui/button'
import { NftCard } from '@/components/nft/nft-card'
import { NftCardSkeleton } from '@/components/nft/nft-card-skeleton'
import type { NftSummary } from '@/contracts/nft'
import { cn } from '@/lib/utils'

// mobile: 2 colunas com a segunda deslocada (frame do Figma); a partir de md, 3 colunas alinhadas
const gridClass =
  'grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-3 md:gap-x-6 md:gap-y-10 [&>li:nth-child(even)]:mt-10 md:[&>li:nth-child(even)]:mt-0'

type NftGridProps = {
  items: NftSummary[] | undefined
  isPending: boolean
  isRefreshing: boolean
  errorMessage: string | null
  favoriteIds: ReadonlySet<string>
  onAddToCart: (nft: NftSummary) => void
  onToggleFavorite: (nft: NftSummary) => void
  onRetry: () => void
  onClearFilters: () => void
}

export function NftGrid({
  items,
  isPending,
  isRefreshing,
  errorMessage,
  favoriteIds,
  onAddToCart,
  onToggleFavorite,
  onRetry,
  onClearFilters,
}: NftGridProps) {
  if (errorMessage) {
    return (
      <div role="alert" className="mt-8 flex flex-col items-center gap-4 rounded-sm bg-card p-10 text-center">
        <p>{errorMessage}</p>
        <Button onClick={onRetry}>Tentar novamente</Button>
      </div>
    )
  }

  if (isPending || !items) {
    return (
      <ul className={cn(gridClass, 'mt-8')} aria-busy="true" aria-label="Carregando NFTs">
        {Array.from({ length: 9 }, (_, i) => (
          <li key={i}>
            <NftCardSkeleton />
          </li>
        ))}
      </ul>
    )
  }

  if (items.length === 0) {
    return (
      <div className="mt-8 flex flex-col items-center gap-4 rounded-sm bg-card p-10 text-center">
        <p>Nenhum NFT encontrado com esses filtros.</p>
        <Button onClick={onClearFilters}>Limpar filtros</Button>
      </div>
    )
  }

  return (
    <ul
      className={cn(gridClass, 'mt-8 transition-opacity', isRefreshing && 'opacity-50')}
      aria-busy={isRefreshing}
    >
      {items.map((nft) => (
        <li key={nft.id}>
          <NftCard
            nft={nft}
            isFavorite={favoriteIds.has(nft.id)}
            onAddToCart={onAddToCart}
            onToggleFavorite={onToggleFavorite}
          />
        </li>
      ))}
    </ul>
  )
}
