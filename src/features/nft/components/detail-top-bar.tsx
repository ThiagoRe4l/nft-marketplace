import { useCanGoBack, useNavigate, useRouter } from '@tanstack/react-router'
import { ChevronLeftIcon } from 'lucide-react'
import { HeartIcon } from '@/components/icons'
import type { Nft } from '@/contracts/nft'
import { useFavoriteIds, useToggleFavorite } from '@/features/favorites/queries'
import { cn } from '@/lib/utils'

// botão redondo de 35 px do Figma; o ::after leva a área de toque a 47 px
const roundButton =
  "relative inline-flex size-[2.1875rem] items-center justify-center rounded-full border border-border bg-[#2f1d15] outline-none transition-colors after:absolute after:-inset-1.5 after:content-[''] focus-visible:ring-3 focus-visible:ring-ring"

// barra do topo do detalhe no mobile (Figma): voltar à esquerda, favoritar à direita.
// Sem o NFT (carregando ou com erro) só aparece o voltar.
export function DetailTopBar({ nft, className }: { nft?: Nft; className?: string }) {
  const router = useRouter()
  const navigate = useNavigate()
  const canGoBack = useCanGoBack()
  const favoriteIds = useFavoriteIds()
  const toggleFavorite = useToggleFavorite()
  const isFavorite = nft ? favoriteIds.has(nft.id) : false

  return (
    <div className={cn('flex items-center justify-between pt-[max(0.5rem,env(safe-area-inset-top))] md:hidden', className)}>
      <button
        type="button"
        aria-label="Voltar"
        className={cn(roundButton, 'text-muted-foreground hover:text-foreground')}
        onClick={() => (canGoBack ? router.history.back() : navigate({ to: '/' }))}
      >
        <ChevronLeftIcon className="size-5" />
      </button>
      {nft && (
        <button
          type="button"
          aria-label={isFavorite ? `Remover ${nft.name} dos favoritos` : `Favoritar ${nft.name}`}
          aria-pressed={isFavorite}
          className={cn(roundButton, 'text-highlight')}
          onClick={() => toggleFavorite(nft)}
        >
          <HeartIcon filled={isFavorite} className="size-4" />
        </button>
      )}
    </div>
  )
}
