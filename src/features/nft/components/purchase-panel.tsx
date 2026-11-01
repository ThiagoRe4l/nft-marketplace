import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { HeartIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import type { Nft } from '@/contracts/nft'
import { useAddToCart } from '@/features/cart/queries'
import { useFavoriteIds, useToggleFavorite } from '@/features/favorites/queries'
import { toAppError } from '@/shared/api/errors'
import { formatEth } from '@/shared/lib/money'
import { quantityHint } from '../purchase'
import type { EditionSelection } from '../use-edition-selection'
import { QuantityStepper } from './quantity-stepper'

// preço da edição escolhida (na mesma linha das avaliações)
export function EditionPrice({ selection }: { selection: EditionSelection }) {
  const { edition, soldOut } = selection
  return (
    <div className="flex flex-wrap items-baseline gap-x-3">
      <p className="text-2xl leading-none font-bold text-highlight md:text-[1.375rem]">
        {soldOut ? <span className="text-muted-foreground">Esgotado</span> : formatEth(edition.price)}
      </p>
      {!soldOut && edition.compareAtPrice && (
        <s className="text-sm text-muted-foreground">
          <span className="sr-only">Preço anterior: </span>
          {formatEth(edition.compareAtPrice)}
        </s>
      )}
    </div>
  )
}

// quantidade, COMPRAR e Favoritar
export function PurchaseActions({ nft, selection }: { nft: Nft; selection: EditionSelection }) {
  const navigate = useNavigate()
  const addToCart = useAddToCart()
  const favoriteIds = useFavoriteIds()
  const toggleFavorite = useToggleFavorite()
  const isFavorite = favoriteIds.has(nft.id)
  const { edition, soldOut, max, quantity, setQuantity } = selection

  const buy = () =>
    addToCart.mutate(
      { nftId: nft.id, editionId: edition.id, quantity },
      {
        onSuccess: () => navigate({ to: '/carrinho' }),
        onError: (error) => toast.error(toAppError(error).message),
      },
    )

  // o limite só aparece quando o usuário chega nele (botão + desabilitado); a região fica no DOM para o leitor de tela anunciar
  const atMax = !soldOut && quantity >= max

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
      <div className="relative">
        <QuantityStepper value={quantity} max={max} disabled={soldOut} onChange={setQuantity} />
        <p role="status" className="absolute top-full left-0 mt-1 text-xs whitespace-nowrap text-muted-foreground">
          {atMax ? quantityHint(edition) : ''}
        </p>
      </div>
      <div className="flex w-full items-center gap-2 sm:w-auto">
        <Button
          size="lg"
          className="h-9 flex-1 px-8 font-bold uppercase sm:flex-none md:h-10 md:w-[8.125rem] md:rounded-md md:px-0"
          disabled={soldOut || addToCart.isPending}
          onClick={buy}
        >
          {addToCart.isPending ? 'Adicionando...' : 'Comprar'}
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="h-9 border-border-strong px-4 md:h-10 md:w-[8.125rem] md:rounded-md md:border-primary md:px-0 md:font-medium md:text-highlight"
          aria-pressed={isFavorite}
          onClick={() => toggleFavorite(nft)}
        >
          <HeartIcon filled={isFavorite} className="size-4 md:size-5" />
          Favoritar
        </Button>
      </div>
    </div>
  )
}
