import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { HeartIcon, ShoppingIcon } from '@/components/icons'
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

// compra (vai ao carrinho) e adição sem sair da página; usados pelo painel do desktop e pela barra do mobile
function usePurchase(nft: Nft, selection: EditionSelection) {
  const navigate = useNavigate()
  const addToCart = useAddToCart()
  const { edition, quantity } = selection
  const payload = { nftId: nft.id, editionId: edition.id, quantity }

  const buy = () =>
    addToCart.mutate(payload, {
      onSuccess: () => navigate({ to: '/carrinho' }),
      onError: (error) => toast.error(toAppError(error).message),
    })

  const addOnly = () =>
    addToCart.mutate(payload, {
      onSuccess: () => toast.success(`${nft.name} adicionado ao carrinho`),
      onError: (error) => toast.error(toAppError(error).message),
    })

  return { buy, addOnly, isPending: addToCart.isPending }
}

// quantidade, COMPRAR e Favoritar (desktop; o mobile usa a MobileBuyBar)
export function PurchaseActions({ nft, selection }: { nft: Nft; selection: EditionSelection }) {
  const purchase = usePurchase(nft, selection)
  const favoriteIds = useFavoriteIds()
  const toggleFavorite = useToggleFavorite()
  const isFavorite = favoriteIds.has(nft.id)
  const { edition, soldOut, max, quantity, setQuantity } = selection

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
          disabled={soldOut || purchase.isPending}
          onClick={purchase.buy}
        >
          {purchase.isPending ? 'Adicionando...' : 'Comprar'}
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

// barra fixa do rodapé no mobile (Figma): quantidade, preço, COMPRAR e carrinho; respeita a área segura do aparelho
export function MobileBuyBar({ nft, selection }: { nft: Nft; selection: EditionSelection }) {
  const purchase = usePurchase(nft, selection)
  const { edition, soldOut, max, quantity, setQuantity } = selection
  const atMax = !soldOut && quantity >= max

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 rounded-t-[2.5rem] bg-card px-6 pt-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-[0_0_20px_rgba(10,6,4,0.45)] md:hidden">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span aria-hidden="true" className="text-[0.9375rem] font-medium text-muted-foreground">
            Qtd.
          </span>
          <QuantityStepper value={quantity} max={max} disabled={soldOut} onChange={setQuantity} />
        </div>
        <div className="text-right [&_p]:justify-end [&_p]:text-xl [&_s]:hidden">
          <EditionPrice selection={selection} />
        </div>
      </div>
      <p role="status" className="text-xs text-muted-foreground empty:hidden">
        {atMax ? quantityHint(edition) : ''}
      </p>
      <div className="mt-5 flex items-center gap-3">
        <Button
          className="h-[3.75rem] flex-1 rounded-full bg-[linear-gradient(93.21deg,var(--primary)_-3.96%,rgb(210_138_76/0.8)_121.97%)] text-base font-bold"
          disabled={soldOut || purchase.isPending}
          onClick={purchase.buy}
        >
          {purchase.isPending ? 'Adicionando...' : 'Comprar NFT'}
        </Button>
        <button
          type="button"
          aria-label={`Adicionar ${nft.name} ao carrinho`}
          disabled={soldOut || purchase.isPending}
          onClick={purchase.addOnly}
          className="inline-flex size-[3.75rem] shrink-0 items-center justify-center rounded-full border border-border bg-[#2f1d15] text-soft-text outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
        >
          <ShoppingIcon className="size-5" />
        </button>
      </div>
    </div>
  )
}
