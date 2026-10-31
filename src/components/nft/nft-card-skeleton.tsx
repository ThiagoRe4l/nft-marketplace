import { Skeleton } from '@/components/ui/skeleton'

// mesmas dimensões do NftCard: bloco da imagem quadrado + duas linhas de texto
export function NftCardSkeleton() {
  return (
    <div role="status" aria-label="Carregando NFT">
      <div className="rounded-xl bg-card p-1.5 md:rounded-sm md:p-3">
        <Skeleton className="aspect-square w-full rounded-lg" />
      </div>
      <div className="mt-2 space-y-1.5 px-1 md:px-0">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-5 w-1/3" />
      </div>
    </div>
  )
}
