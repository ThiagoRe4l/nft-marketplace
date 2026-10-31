import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { HeartIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import type { Nft } from '@/contracts/nft'
import { useAddToCart } from '@/features/cart/queries'
import { toAppError } from '@/shared/api/errors'
import { comingSoon } from '@/shared/lib/coming-soon'
import { formatEth } from '@/shared/lib/money'
import { defaultEdition, isSoldOut, maxQuantity, quantityHint } from '../purchase'
import { EditionPicker } from './edition-picker'
import { QuantityStepper } from './quantity-stepper'

export function PurchasePanel({ nft }: { nft: Nft }) {
  const navigate = useNavigate()
  const addToCart = useAddToCart()
  const [editionId, setEditionId] = useState<string | null>(null)
  const [requested, setRequested] = useState(1)

  // a edição vem sempre do dado atual: se o estoque mudar por evento, a tela acompanha
  const edition = nft.editions.find((e) => e.id === editionId) ?? defaultEdition(nft.editions)
  const soldOut = isSoldOut(edition)
  const max = Math.max(1, maxQuantity(edition))
  const quantity = Math.min(requested, max)

  const selectEdition = (id: string) => {
    setEditionId(id)
    setRequested(1)
  }

  const buy = () =>
    addToCart.mutate(
      { nftId: nft.id, editionId: edition.id, quantity },
      {
        onSuccess: () => navigate({ to: '/carrinho' }),
        onError: (error) => toast.error(toAppError(error).message),
      },
    )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline gap-x-3">
        <p className="text-2xl font-bold text-primary">
          {soldOut ? <span className="text-muted-foreground">Esgotado</span> : formatEth(edition.price)}
        </p>
        {!soldOut && edition.compareAtPrice && (
          <s className="text-sm text-muted-foreground">
            <span className="sr-only">Preço anterior: </span>
            {formatEth(edition.compareAtPrice)}
          </s>
        )}
      </div>

      <EditionPicker editions={nft.editions} value={edition.id} onChange={selectEdition} />

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div>
          <QuantityStepper value={quantity} max={max} disabled={soldOut} onChange={setRequested} />
          {!soldOut && <p className="mt-2 text-xs text-muted-foreground">{quantityHint(edition)}</p>}
        </div>
        <div className="flex w-full items-center gap-3 sm:ml-auto sm:w-auto">
          <Button
            size="lg"
            className="h-9 flex-1 px-8 font-bold uppercase sm:flex-none"
            disabled={soldOut || addToCart.isPending}
            onClick={buy}
          >
            {addToCart.isPending ? 'Adicionando...' : 'Comprar'}
          </Button>
          <Button variant="outline" size="lg" className="h-9 border-border-strong px-4" onClick={comingSoon}>
            <HeartIcon /> Favoritar
          </Button>
        </div>
      </div>
    </div>
  )
}
