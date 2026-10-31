import { createFileRoute } from '@tanstack/react-router'
import { NftDetail } from '@/features/nft/components/nft-detail'

export const Route = createFileRoute('/nft/$id')({
  component: NftPage,
})

function NftPage() {
  const { id } = Route.useParams()
  return <NftDetail id={id} />
}
