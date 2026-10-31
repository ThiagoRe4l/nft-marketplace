import { toast } from 'sonner'
import type { NftSummary } from '@/contracts/nft'
import { useAddToCart } from '@/features/cart/queries'
import { toAppError } from '@/shared/api/errors'

// adição rápida (1 unidade da edição em destaque) usada nos cards e carrosséis
export function useQuickAdd() {
  const addToCart = useAddToCart()
  return (nft: NftSummary) =>
    addToCart.mutate(
      { nftId: nft.id, editionId: nft.editionId, quantity: 1 },
      {
        onSuccess: () => toast.success(`${nft.name} adicionado ao carrinho`),
        onError: (error) => toast.error(toAppError(error).message),
      },
    )
}
