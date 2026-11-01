import { Link } from '@tanstack/react-router'
import { NftImage } from '@/components/nft/nft-image'
import { Skeleton } from '@/components/ui/skeleton'
import type { NftSummary } from '@/contracts/nft'
import { formatEth } from '@/shared/lib/money'

export function SpotlightCard({ nft, isLoading }: { nft: NftSummary | undefined; isLoading: boolean }) {
  if (isLoading) return <Skeleton className="aspect-[3/4] w-full rounded-xl" />
  if (!nft) return null

  return (
    <section aria-labelledby="spotlight-title" className="overflow-hidden rounded-sm bg-card">
      <div className="px-5 pt-5 pb-3">
        <h2 id="spotlight-title" className="text-xl font-bold text-primary uppercase">
          NFT em destaque
        </h2>
        <p className="mt-2 text-center text-sm font-bold uppercase">Oferta limitada</p>
      </div>
      <Link
        to="/nft/$id"
        params={{ id: nft.id }}
        aria-label={`${nft.name}, ${formatEth(nft.price)}`}
        className="block outline-none focus-visible:ring-3 focus-visible:ring-ring"
      >
        <NftImage
          src={nft.image}
          alt=""
          width={400}
          height={500}
          sizes="(min-width: 768px) 400px, 90vw"
          loading="lazy"
          className="aspect-[4/5] w-full rounded-xl object-cover"
        />
      </Link>
    </section>
  )
}
