import { useEffect, useRef, useState } from 'react'
import { NftCard } from '@/components/nft/nft-card'
import { NftCardSkeleton } from '@/components/nft/nft-card-skeleton'
import type { NftSummary } from '@/contracts/nft'
import { cn } from '@/lib/utils'

import { useFavoriteIds, useToggleFavorite } from '@/features/favorites/queries'

const itemClass = 'w-[10.5rem] shrink-0 snap-start md:w-[calc((100%-3rem)/5)]'
const GAP = 12 // gap-3

type NftCarouselProps = {
  id: string
  title: string
  listLabel: string
  items: NftSummary[]
  isPending: boolean
  onAddToCart: (nft: NftSummary) => void
}

// uma "página" é uma largura visível da lista; os pontos abaixo levam de página em página
function measurePages(el: HTMLElement) {
  const step = el.clientWidth + GAP
  const pages = Math.max(1, Math.ceil((el.scrollWidth - el.clientWidth - 1) / step) + 1)
  const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1
  return { pages, page: atEnd ? pages - 1 : Math.min(pages - 1, Math.round(el.scrollLeft / step)) }
}

function usePages(itemCount: number) {
  const track = useRef<HTMLUListElement>(null)
  const [state, setState] = useState({ pages: 1, page: 0 })

  // o ResizeObserver mede ao observar e a cada mudança de largura; itemCount refaz a observação quando a lista carrega
  useEffect(() => {
    const el = track.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => setState(measurePages(el)))
    observer.observe(el)
    return () => observer.disconnect()
  }, [itemCount])

  return { track, ...state, onScroll: (event: React.UIEvent<HTMLUListElement>) => setState(measurePages(event.currentTarget)) }
}

export function NftCarousel({ id, title, listLabel, items, isPending, onAddToCart }: NftCarouselProps) {
  const favoriteIds = useFavoriteIds()
  const toggleFavorite = useToggleFavorite()
  const { track, pages, page, onScroll } = usePages(items.length)

  const goTo = (index: number) => {
    const el = track.current
    if (el) el.scrollTo({ left: index * (el.clientWidth + GAP), behavior: 'smooth' })
  }

  return (
    <section aria-labelledby={id} className="mt-16 md:mt-24">
      {/* a linha fica a 12 px do título (Figma) */}
      <div className="border-b pb-3">
        <h2 id={id} className="text-base leading-4 font-bold text-highlight md:text-[1.0625rem]">
          {title}
        </h2>
      </div>
      <ul
        ref={track}
        aria-label={listLabel}
        onScroll={onScroll}
        className="mt-6 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 md:mt-8 md:gap-3"
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

      {pages > 1 && (
        <div role="group" aria-label={`Páginas de ${listLabel}`} className="mt-4 flex items-center justify-center gap-2 md:mt-6">
          {Array.from({ length: pages }, (_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Ir para a página ${i + 1} de ${pages}`}
              aria-current={i === page ? 'true' : undefined}
              onClick={() => goTo(i)}
              className={cn(
                "relative size-3 rounded-full border-[1.3px] border-primary outline-none transition-colors after:absolute after:-inset-2 after:content-[''] focus-visible:ring-3 focus-visible:ring-ring",
                i === page ? 'bg-primary' : 'bg-transparent hover:bg-primary/40',
              )}
            />
          ))}
        </div>
      )}
    </section>
  )
}
