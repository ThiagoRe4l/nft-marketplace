import { createFileRoute } from '@tanstack/react-router'
import { CatalogSearch, useCatalogFilters } from '@/features/catalog/search'
import { nftListQuery, useNftList } from '@/features/catalog/queries'

export const Route = createFileRoute('/')({
  validateSearch: CatalogSearch,
  loaderDeps: ({ search }) => search,
  // começa a buscar antes de a tela montar, sem bloquear a navegação (o skeleton aparece)
  loader: ({ context, deps }) => {
    void context.queryClient.prefetchQuery(nftListQuery(deps))
  },
  component: Home,
})

function Home() {
  const { search, setFilters, setPage, clearFilters } = useCatalogFilters()
  const list = useNftList(search)

  return (
    <main className="space-y-3 p-4 font-mono text-sm">
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setFilters({ q: 'ape' })}>[busca: ape]</button>
        <button onClick={() => setFilters({ category: ['music', '3d-art'] })}>[música + 3D]</button>
        <button onClick={() => setFilters({ sort: 'price_asc' })}>[menor preço]</button>
        <button onClick={() => setPage((search.page ?? 1) + 1)}>[próxima página]</button>
        <button onClick={clearFilters}>[limpar]</button>
      </div>
      <p>
        {list.isPending ? 'carregando...' : `${list.data?.total ?? 0} resultados`}
        {list.isPlaceholderData && ' (atualizando...)'}
        {list.isError && ' (erro)'}
      </p>
      <ul className={list.isPlaceholderData ? 'opacity-50' : undefined}>
        {list.data?.items.map((nft) => (
          <li key={nft.id}>{nft.name} — {nft.price} ETH</li>
        ))}
      </ul>
    </main>
  )
}