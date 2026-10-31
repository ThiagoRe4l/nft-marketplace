import { Link } from '@tanstack/react-router'
import { Button, buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { LINE_COLUMNS } from './cart-line'

export function CartEmpty() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl bg-card px-6 py-16 text-center">
      <h2 className="text-lg font-bold">Seu carrinho está vazio</h2>
      <p className="text-sm text-muted-foreground">Explore o catálogo e adicione os NFTs que você gostou.</p>
      <Link to="/" hash="catalogo" className={cn(buttonVariants({ size: 'lg' }), 'h-10 px-6 font-bold')}>
        Explorar o catálogo
      </Link>
    </div>
  )
}

export function CartError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-4 rounded-xl bg-card px-6 py-16 text-center">
      <h2 className="text-lg font-bold">Não foi possível carregar o carrinho</h2>
      <p className="text-sm text-muted-foreground">{message}</p>
      <Button type="button" size="lg" className="h-10 px-6 font-bold" onClick={onRetry}>
        Tentar novamente
      </Button>
    </div>
  )
}

// mesma grade das linhas reais
export function CartLinesSkeleton() {
  return (
    <ul role="status" aria-label="Carregando carrinho" className="space-y-3">
      {Array.from({ length: 3 }, (_, i) => (
        <li
          key={i}
          className={cn(
            'grid grid-cols-[6rem_minmax(0,1fr)] overflow-hidden rounded-xl bg-card lg:items-center lg:rounded-sm lg:pr-4',
            LINE_COLUMNS,
          )}
        >
          <Skeleton className="size-24 rounded-none lg:size-[4.375rem]" />
          <div className="space-y-2 p-3 lg:hidden">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-6 w-1/3" />
          </div>
          <div className="hidden lg:contents">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="size-9 rounded-full" />
          </div>
        </li>
      ))}
    </ul>
  )
}
