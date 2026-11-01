import { Link } from '@tanstack/react-router'
import { StarIcon } from 'lucide-react'
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { NotFoundPage } from '@/components/layout/status-pages'
import type { Nft } from '@/contracts/nft'
import { useNft } from '@/features/catalog/queries'
import { useMediaQuery } from '@/shared/hooks/use-media-query'
import { toAppError } from '@/shared/api/errors'
import { MoreFromCollection } from './more-from-collection'
import { NftGallery } from './nft-gallery'
import { NftInfoTabs } from './nft-info-tabs'
import { NftDetailSkeleton, NftLoadError } from './nft-states'
import { EditionPicker } from './edition-picker'
import { DetailTopBar } from './detail-top-bar'
import { EditionPrice, MobileBuyBar, PurchaseActions } from './purchase-panel'
import { useEditionSelection } from '../use-edition-selection'
import { ShareLinks } from './share-links'

const linkClass = 'outline-none hover:text-primary focus-visible:ring-3 focus-visible:ring-ring'

export function NftDetail({ id }: { id: string }) {
  const query = useNft(id)

  if (query.isError && toAppError(query.error).code === 'NOT_FOUND') return <NotFoundPage />

  return (
    <div className="mx-auto w-full max-w-page px-gutter py-6 max-md:p-0 md:pt-8 md:pb-10">
      <Breadcrumb className="mb-4 max-md:hidden">
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

      {/* sem o NFT carregado, no mobile só o botão de voltar (o header some nesta tela) */}
      {!query.data && <DetailTopBar className="px-gutter" />}

      {query.isPending ? (
        <div className="max-md:px-gutter">
          <NftDetailSkeleton />
        </div>
      ) : query.isError ? (
        <div className="max-md:px-gutter">
          <NftLoadError message={toAppError(query.error).message} onRetry={() => query.refetch()} />
        </div>
      ) : (
        // key: trocar de NFT (ex.: pelo carrossel) reinicia edição e quantidade
        <NftContent key={query.data.id} nft={query.data} />
      )}
    </div>
  )
}

function NftContent({ nft }: { nft: Nft }) {
  const selection = useEditionSelection(nft)
  // a compra existe uma vez só: painel no desktop, barra fixa no rodapé do mobile (sem duplicar os controles no DOM)
  const desktop = useMediaQuery('(min-width: 768px)')

  return (
    <>
      <div className="grid gap-8 max-md:gap-0 lg:grid-cols-[35.8125rem_minmax(0,1fr)] lg:gap-8">
        {/* mobile (Figma): faixa com o degradê, barra do topo e imagem; o painel de detalhes sobe 30 px por cima dela */}
        <div className="max-md:bg-[linear-gradient(143.28deg,var(--card)_-12%,#2f1d15_106.59%)] max-md:px-7 max-md:pt-4">
          <DetailTopBar nft={nft} className="mb-2" />
          <NftGallery
            name={nft.name}
            image={nft.images[0]}
            editions={nft.editions}
            selectedEditionId={selection.edition.id}
            onSelectEdition={selection.selectEdition}
          />
        </div>

        {/* Figma: título, preço e avaliações, sobre o NFT, edição, quantidade e compra, dados do token, compartilhar */}
        <div className="flex min-w-0 flex-col gap-5 max-md:relative max-md:z-10 max-md:-mt-[1.875rem] max-md:gap-3 max-md:rounded-t-[1.9375rem] max-md:bg-card max-md:px-6 max-md:pt-8 max-md:pb-6 lg:min-h-[28rem] lg:justify-between">
          <div className="space-y-3 max-md:flex max-md:items-center max-md:justify-between max-md:gap-3 max-md:space-y-0">
            <h1 className="text-2xl font-bold max-md:text-xl max-md:leading-5 md:text-[1.75rem] md:leading-[2.3125rem]">{nft.name}</h1>
            <RatingPill rating={nft.rating} count={nft.reviewCount} />
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b pb-3 max-md:hidden">
              <EditionPrice selection={selection} />
              <Rating rating={nft.rating} count={nft.reviewCount} />
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-[0.9375rem] leading-4 font-bold max-md:sr-only">Sobre este NFT:</h2>
            <p className="text-xs leading-6 text-muted-foreground max-md:text-sm md:text-sm">{nft.description}</p>
          </div>

          <EditionPicker editions={nft.editions} value={selection.edition.id} onChange={selection.selectEdition} />

          {desktop && <PurchaseActions nft={nft} selection={selection} />}

          <div className="space-y-3">
          <dl className="space-y-3 text-sm text-muted-foreground max-md:text-[0.9375rem] max-md:leading-5 max-md:text-soft-text md:text-[0.9375rem] md:leading-5">
            <div className="flex gap-1 max-md:gap-[1ch]">
              <dt>ID do token:</dt>
              <dd>{nft.tokenId}</dd>
            </div>
            <div className="flex gap-1 max-md:gap-[1ch]">
              <dt>Coleção:</dt>
              <dd>{nft.collection}</dd>
            </div>
            <div className="flex gap-1 max-md:gap-[1ch]">
              <dt>Atributos:</dt>
              <dd>{nft.attributes.join(', ')}</dd>
            </div>
          </dl>

          <ShareLinks name={nft.name} className="max-md:hidden" />
          </div>
        </div>
      </div>

      <div className="mt-12 max-md:mt-0 max-md:bg-card max-md:px-6 max-md:pb-6 md:mt-24">
        <NftInfoTabs nft={nft} />
      </div>

      <MoreFromCollection
        nftId={nft.id}
        collection={nft.collection}
        className="max-md:mt-0 max-md:bg-card max-md:px-6 max-md:pt-4 max-md:pb-8"
      />

      {!desktop && <MobileBuyBar nft={nft} selection={selection} />}
    </>
  )
}

// mobile (Figma): pílula com a estrela, a nota e a contagem ao lado do nome
function RatingPill({ rating, count }: { rating: number; count: number }) {
  return (
    <p className="flex shrink-0 items-center gap-1 rounded-full border border-primary px-2 py-[0.3125rem] text-sm leading-4 md:hidden">
      <span className="sr-only">
        Nota {rating.toFixed(1)} de 5, {count} avaliações de colecionadores
      </span>
      <span aria-hidden="true" className="flex items-center gap-1">
        <StarIcon className="size-3 fill-amber text-amber" />
        <span className="font-medium">{rating.toFixed(1)}</span>
        <span className="text-muted-foreground">({count})</span>
      </span>
    </p>
  )
}

function Rating({ rating, count }: { rating: number; count: number }) {
  const filled = Math.round(rating)
  return (
    <p className="flex flex-wrap items-center gap-x-1 gap-y-1 text-xs max-md:hidden text-muted-foreground md:text-[0.9375rem] md:leading-5 md:text-foreground">
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
