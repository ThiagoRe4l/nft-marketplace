import { Link } from '@tanstack/react-router'
import { StarIcon } from 'lucide-react'
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { NotFoundPage } from '@/components/layout/status-pages'
import type { Nft } from '@/contracts/nft'
import { useNft } from '@/features/catalog/queries'
import { toAppError } from '@/shared/api/errors'
import { MoreFromCollection } from './more-from-collection'
import { NftGallery } from './nft-gallery'
import { NftInfoTabs } from './nft-info-tabs'
import { NftDetailSkeleton, NftLoadError } from './nft-states'
import { EditionPicker } from './edition-picker'
import { EditionPrice, PurchaseActions } from './purchase-panel'
import { useEditionSelection } from '../use-edition-selection'
import { ShareLinks } from './share-links'

const linkClass = 'outline-none hover:text-primary focus-visible:ring-3 focus-visible:ring-ring'

export function NftDetail({ id }: { id: string }) {
  const query = useNft(id)

  if (query.isError && toAppError(query.error).code === 'NOT_FOUND') return <NotFoundPage />

  return (
    <div className="mx-auto w-full max-w-page px-gutter py-6 md:pt-8 md:pb-10">
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
        <NftLoadError message={toAppError(query.error).message} onRetry={() => query.refetch()} />
      ) : (
        // key: trocar de NFT (ex.: pelo carrossel) reinicia edição e quantidade
        <NftContent key={query.data.id} nft={query.data} />
      )}
    </div>
  )
}

function NftContent({ nft }: { nft: Nft }) {
  const selection = useEditionSelection(nft)

  return (
    <>
      <div className="grid gap-8 lg:grid-cols-[35.8125rem_minmax(0,1fr)] lg:gap-8">
        <NftGallery
          name={nft.name}
          image={nft.images[0]}
          editions={nft.editions}
          selectedEditionId={selection.edition.id}
          onSelectEdition={selection.selectEdition}
        />

        {/* Figma: título, preço e avaliações, sobre o NFT, edição, quantidade e compra, dados do token, compartilhar */}
        <div className="flex min-w-0 flex-col gap-5 lg:min-h-[28rem] lg:justify-between">
          <div className="space-y-3">
            <h1 className="text-2xl font-bold md:text-[1.75rem] md:leading-[2.3125rem]">{nft.name}</h1>
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b pb-3">
              <EditionPrice selection={selection} />
              <Rating rating={nft.rating} count={nft.reviewCount} />
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-[0.9375rem] leading-4 font-bold">Sobre este NFT:</h2>
            <p className="text-xs leading-6 text-muted-foreground md:text-sm">{nft.description}</p>
          </div>

          <EditionPicker editions={nft.editions} value={selection.edition.id} onChange={selection.selectEdition} />

          <PurchaseActions nft={nft} selection={selection} />

          <div className="space-y-3">
          <dl className="space-y-3 text-sm text-muted-foreground md:text-[0.9375rem] md:leading-5">
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
      </div>

      <div className="mt-12 md:mt-24">
        <NftInfoTabs nft={nft} />
      </div>

      <MoreFromCollection nftId={nft.id} collection={nft.collection} />
    </>
  )
}

function Rating({ rating, count }: { rating: number; count: number }) {
  const filled = Math.round(rating)
  return (
    <p className="flex flex-wrap items-center gap-x-1 gap-y-1 text-xs text-muted-foreground md:text-[0.9375rem] md:leading-5 md:text-foreground">
      <span className="mr-1 flex" aria-hidden="true">
        {Array.from({ length: 5 }, (_, i) => (
          <StarIcon key={i} className={i < filled ? 'size-4 fill-primary text-primary md:size-[0.9375rem]' : 'size-4 text-border-strong md:size-[0.9375rem]'} />
        ))}
      </span>
      {/* no desktop o Figma mostra só as estrelas e a contagem */}
      <span className="md:sr-only">
        <span className="sr-only">Nota </span>
        {rating.toFixed(1)}
      </span>
      <span>{count} avaliações de colecionadores</span>
    </p>
  )
}
