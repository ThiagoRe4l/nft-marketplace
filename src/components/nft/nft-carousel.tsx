import { useRef } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { NftCard } from '@/components/nft/nft-card'
import { NftCardSkeleton } from '@/components/nft/nft-card-skeleton'
import type { NftSummary } from '@/contracts/nft'

import { useFavoriteIds, useToggleFavorite } from '@/features/favorites/queries'

const navButton =
  'inline-flex size-8 items-center justify-center rounded-full border border-border-strong text-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring'

const itemClass = 'w-[10.5rem] shrink-0 snap-start md:w-[calc((100%-3rem)/5)]'

type NftCarouselProps = {
  id: string
  title: string
  listLabel: string
  items: NftSummary[]
  isPending: boolean
  onAddToCart: (nft: NftSummary) => void
}

export function NftCarousel({ id, title, listLabel, items, isPending, onAddToCart }: NftCarouselProps) {
  const favoriteIds = useFavoriteIds()
  const toggleFavorite = useToggleFavorite()
  const track = useRef<HTMLUListElement>(null)

  const scroll = (direction: 1 | -1) => {
    const el = track.current
    if (el) el.scrollBy({ left: direction * el.clientWidth * 0.9, behavior: 'smooth' })
  }

  return (
    <section aria-labelledby={id} className="mt-16">
      <div className="flex items-center justify-between border-b pb-3">
        <h2 id={id} className="text-base font-bold text-primary">
          {title}
        </h2>
        <div className="flex gap-2">
          <button type="button" className={navButton} aria-label="Anterior" onClick={() => scroll(-1)}>
            <ChevronLeftIcon className="size-4" />
          </button>
          <button type="button" className={navButton} aria-label="Próximo" onClick={() => scroll(1)}>
            <ChevronRightIcon className="size-4" />
          </button>
        </div>
      </div>
      <ul
        ref={track}
        aria-label={listLabel}
        className="mt-6 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 md:gap-3"
      >
        {isPending
          ? Array.from({ length: 5 }, (_, i) => (
              <li key={i} className={itemClass}>
                <NftCardSkeleton />
              </li>
            ))
          : items.map((item) => (
              <li key={item.id} className={itemClass}>
                <NftCard 
                  nft={item} 
                  isFavorite={favoriteIds.has(item.id)}
                  onAddToCart={onAddToCart} 
                  onToggleFavorite={toggleFavorite} 
                />
              </li>
            ))}
      </ul>
    </section>
  )
}
