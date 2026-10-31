import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/nft/$id')({
  component: NftPlaceholder,
})

function NftPlaceholder() {
  const { id } = Route.useParams()
  return <p className="mx-auto w-full max-w-page px-gutter py-10">NFT {id} (provisório)</p>
}
