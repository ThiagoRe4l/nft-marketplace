import { Link } from '@tanstack/react-router'
import { EyeIcon, HeartIcon, ShoppingCartIcon } from 'lucide-react'
import { cn } from "@/lib/utils"
import type { NftSummary } from '@/contracts/nft'
import { formatEth } from '@/shared/lib/money'

// dimensões intrínsecas da imagem: com o aspect-ratio fixo, evitam CLS
export const NFT_IMAGE_SIZE = 400

type NftCardProps = {
  nft: NftSummary
  isFavorite?: boolean
  onAddToCart: (nft: NftSummary) => void
  onToggleFavorite: (nft: NftSummary) => void
  className?: string
}

const actionClass =
  'inline-flex size-9 items-center justify-center rounded-full bg-background/80 text-foreground outline-none backdrop-blur-sm transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:ring-3 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50'

export function NftCard({ nft, isFavorite = false, onAddToCart, onToggleFavorite, className }: NftCardProps) {
  return (
    <article className={cn('group/card', className)}>
      <div className="relative rounded-xl bg-card p-1.5 md:rounded-sm md:p-3">
        <img
          src={nft.image}
          alt={nft.name}
          width={NFT_IMAGE_SIZE}
          height={NFT_IMAGE_SIZE}
          loading="lazy"
          decoding="async"
          className="aspect-square w-full rounded-lg object-cover"
        />
        {nft.rarity === 'rare' && (
          <span className="absolute top-1.5 left-1.5 bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground md:top-3 md:left-3">
            RARO
          </span>
        )}
        {/* aparecem no hover/foco; em telas de toque ficam sempre visíveis */}
        <div className="absolute right-3 bottom-3 flex gap-1.5 opacity-0 transition-opacity group-focus-within/card:opacity-100 group-hover/card:opacity-100 pointer-coarse:opacity-100 md:right-5 md:bottom-5">
          <Link
            to="/nft/$id"
            params={{ id: nft.id }}
            className={actionClass}
            aria-label={`Ver detalhes de ${nft.name}`}
          >
            <EyeIcon className="size-4" />
          </Link>
          <button
            type="button"
            className={actionClass}
            aria-label={isFavorite ? `Remover ${nft.name} dos favoritos` : `Favoritar ${nft.name}`}
            aria-pressed={isFavorite}
            onClick={() => onToggleFavorite(nft)}
          >
            <HeartIcon className={cn('size-4', isFavorite && 'fill-primary text-primary')} />
          </button>
          <button
            type="button"
            className={actionClass}
            aria-label={`Adicionar ${nft.name} ao carrinho`}
            disabled={nft.soldOut}
            onClick={() => onAddToCart(nft)}
          >
            <ShoppingCartIcon className="size-4" />
          </button>
        </div>
      </div>
      <div className="mt-2 space-y-0.5 px-1 md:px-0">
        <h3 className="truncate text-sm font-normal">{nft.name}</h3>
        <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
          {nft.soldOut ? (
            <span className="font-bold text-muted-foreground">Esgotado</span>
          ) : (
            <>
              <span className="font-bold text-primary">{formatEth(nft.price)}</span>
              {nft.compareAtPrice && (
                <s className="text-muted-foreground">
                  <span className="sr-only">Preço anterior: </span>
                  {formatEth(nft.compareAtPrice)}
                </s>
              )}
            </>
          )}
        </p>
      </div>
    </article>
  )
}
