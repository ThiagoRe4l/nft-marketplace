import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

// Mesmas dimensões da tela pronta: galeria (miniaturas + imagem) e coluna de informações.
// min-h-dvh reserva a altura de uma tela: o rodapé fica abaixo da dobra antes e depois do carregamento,
// em vez de ser empurrado para baixo quando o conteúdo (abas, mais da coleção) chega (era CLS 0,15).
export function NftDetailSkeleton() {
  return (
    <div role="status" aria-label="Carregando NFT" className="grid min-h-dvh content-start gap-8 lg:grid-cols-[5fr_6fr] lg:gap-10">
      <div className="flex flex-col-reverse gap-4 md:flex-row md:items-start">
        <div className="flex gap-3 md:w-[5.5rem] md:shrink-0 md:flex-col">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="aspect-square w-16 md:w-full" />
          ))}
        </div>
        <div className="min-w-0 flex-1 rounded-xl bg-card p-3 md:rounded-sm md:p-5">
          <Skeleton className="aspect-square w-full rounded-lg" />
        </div>
      </div>
      <div className="space-y-4">
        <Skeleton className="h-9 w-3/4" />
        <Skeleton className="h-7 w-1/2" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-7 w-2/3" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  )
}

export function NftLoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-4 rounded-sm bg-card p-10 text-center">
      <p>{message}</p>
      <Button onClick={onRetry}>Tentar novamente</Button>
    </div>
  )
}
