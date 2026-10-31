import { useRef } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { NftCard } from '@/components/nft/nft-card'
import { NftCardSkeleton } from '@/components/nft/nft-card-skeleton'
import { useNftList } from '@/features/catalog/queries'
import { comingSoon } from '@/shared/lib/coming-soon'

const navButton =
  'inline-flex size-8 items-center justify-center rounded-full border border-border-strong text-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring'

const itemClass = 'w-[10.5rem] shrink-0 snap-start md:w-[calc((100%-3rem)/5)]'

export function MoreFromCollection({ nftId, collection }: { nftId: string; collection: string }) {
  const list = useNftList({ q: collection })
  const track = useRef<HTMLUListElement>(null)
  const items = list.data?.items.filter((item) => item.id !== nftId) ?? []

  // sem resultado (ou com falha) a seção simplesmente não aparece: não bloqueia a compra
  if (!list.isPending && items.length === 0) return null

  const scroll = (direction: 1 | -1) => {
    const el = track.current
    if (el) el.scrollBy({ left: direction * el.clientWidth * 0.9, behavior: 'smooth' })
  }

  return (
    <section aria-labelledby="more-collection" className="mt-16">
      <div className="flex items-center justify-between border-b pb-3">
        <h2 id="more-collection" className="text-base font-bold text-primary">
          Mais desta coleção
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
        aria-label="NFTs da coleção"
        className="mt-6 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 md:gap-3"
      >
        {list.isPending
          ? Array.from({ length: 5 }, (_, i) => (
              <li key={i} className={itemClass}>
                <NftCardSkeleton />
              </li>
            ))
          : items.map((item) => (
              <li key={item.id} className={itemClass}>
                <NftCard nft={item} onAddToCart={comingSoon} onToggleFavorite={comingSoon} />
              </li>
            ))}
      </ul>
    </section>
  )
}
