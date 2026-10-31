import { Link } from '@tanstack/react-router'
import { StarIcon } from 'lucide-react'
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import type { Nft } from '@/contracts/nft'
import { useNft } from '@/features/catalog/queries'
import { toAppError } from '@/shared/api/errors'
import { MoreFromCollection } from './more-from-collection'
import { NftGallery } from './nft-gallery'
import { NftInfoTabs } from './nft-info-tabs'
import { NftDetailSkeleton, NftLoadError, NftNotFound } from './nft-states'
import { PurchasePanel } from './purchase-panel'
import { ShareLinks } from './share-links'

const linkClass = 'outline-none hover:text-primary focus-visible:ring-3 focus-visible:ring-ring'

export function NftDetail({ id }: { id: string }) {
  const query = useNft(id)

  return (
    <div className="mx-auto w-full max-w-page px-gutter py-6 md:py-10">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <Link to="/" className={linkClass}>
              Início
            </Link>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <Link to="/" hash="catalogo" className={linkClass}>
              Mercado
            </Link>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {query.isPending ? (
        <NftDetailSkeleton />
      ) : query.isError ? (
        toAppError(query.error).code === 'NOT_FOUND' ? (
          <NftNotFound />
        ) : (
          <NftLoadError message={toAppError(query.error).message} onRetry={() => query.refetch()} />
        )
      ) : (
        // key: trocar de NFT (ex.: pelo carrossel) reinicia edição e quantidade
        <NftContent key={query.data.id} nft={query.data} />
      )}
    </div>
  )
}

function NftContent({ nft }: { nft: Nft }) {
  return (
    <>
      <div className="grid gap-8 lg:grid-cols-[5fr_6fr] lg:gap-10">
        <NftGallery name={nft.name} images={nft.images} />

        <div className="min-w-0 space-y-4">
          <h1 className="text-2xl font-bold md:text-3xl">{nft.name}</h1>
          <Rating rating={nft.rating} count={nft.reviewCount} />
          <PurchasePanel nft={nft} />

          <div className="border-t pt-4">
            <h2 className="text-sm font-bold">Sobre este NFT:</h2>
            <p className="mt-2 text-xs leading-6 text-muted-foreground">{nft.description}</p>
          </div>

          <dl className="space-y-2 text-sm text-muted-foreground">
            <div className="flex gap-1">
              <dt>ID do token:</dt>
              <dd>{nft.tokenId}</dd>
            </div>
            <div className="flex gap-1">
              <dt>Coleção:</dt>
              <dd>{nft.collection}</dd>
            </div>
            <div className="flex gap-1">
              <dt>Atributos:</dt>
              <dd>{nft.attributes.join(', ')}</dd>
            </div>
          </dl>

          <ShareLinks name={nft.name} />
        </div>
      </div>

      <div className="mt-12">
        <NftInfoTabs nft={nft} />
      </div>

      <MoreFromCollection nftId={nft.id} collection={nft.collection} />
    </>
  )
}

function Rating({ rating, count }: { rating: number; count: number }) {
  const filled = Math.round(rating)
  return (
    <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
      <span className="flex" aria-hidden="true">
        {Array.from({ length: 5 }, (_, i) => (
          <StarIcon key={i} className={i < filled ? 'size-4 fill-primary text-primary' : 'size-4 text-border-strong'} />
        ))}
      </span>
      <span>
        <span className="sr-only">Nota </span>
        {rating.toFixed(1)}
      </span>
      <span>{count} avaliações de colecionadores</span>
    </p>
  )
}
