import { NftCarousel } from '@/components/nft/nft-carousel'
import { useQuickAdd } from '@/features/cart/use-quick-add'
import { useNftList } from '@/features/catalog/queries'

export function AlsoViewed() {
  const list = useNftList({ tab: 'trending' })
  const quickAdd = useQuickAdd()
  const items = list.data?.items ?? []

  // sem resultado (ou com falha) a seção não aparece: não atrapalha o fechamento da compra
  if (!list.isPending && items.length === 0) return null

  return (
    <NftCarousel
      id="also-viewed"
      title="Colecionadores também viram"
      listLabel="NFTs em alta"
      items={items}
      isPending={list.isPending}
      onAddToCart={quickAdd}
    />
  )
}
