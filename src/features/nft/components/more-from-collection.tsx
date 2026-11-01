import { NftCarousel } from '@/components/nft/nft-carousel'
import { useQuickAdd } from '@/features/cart/use-quick-add'
import { useNftList } from '@/features/catalog/queries'

export function MoreFromCollection({ nftId, collection, className }: { nftId: string; collection: string; className?: string }) {
  const list = useNftList({ q: collection })
  const quickAdd = useQuickAdd()
  const items = list.data?.items.filter((item) => item.id !== nftId) ?? []

  // sem resultado (ou com falha) a seção simplesmente não aparece: não bloqueia a compra
  if (!list.isPending && items.length === 0) return null

  return (
    <NftCarousel
      id="more-collection"
      title="Mais desta coleção"
      listLabel="NFTs da coleção"
      items={items}
      isPending={list.isPending}
      onAddToCart={quickAdd}
      className={className}
    />
  )
}
