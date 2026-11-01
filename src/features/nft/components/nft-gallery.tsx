import { NftImage } from '@/components/nft/nft-image'
import { useRef, useState } from 'react'
import { SearchIcon } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import type { Edition } from '@/contracts/nft'
import { cn } from '@/lib/utils'
import { formatEth } from '@/shared/lib/money'
import { isSoldOut } from '../purchase'

// dimensões intrínsecas: com o aspect-ratio fixo, evitam deslocamento de layout
const MAIN_SIZE = 600
const THUMB_SIZE = 100

type NftGalleryProps = {
  name: string
  /** a imagem central não muda: as miniaturas escolhem a edição, não a imagem */
  image: string
  editions: Edition[]
  selectedEditionId: string
  onSelectEdition: (editionId: string) => void
}

export function NftGallery({ name, image, editions, selectedEditionId, onSelectEdition }: NftGalleryProps) {
  const [zoomOpen, setZoomOpen] = useState(false)
  const zoomTrigger = useRef<HTMLButtonElement>(null)

  return (
    <div className="flex flex-col-reverse gap-4 md:flex-row md:items-start md:gap-7">
      {/* uma miniatura por edição: escolher aqui equivale a escolher nos botões de edição */}
      <ul aria-label="Selecionar edição" className="flex gap-3 max-md:hidden md:w-[6.25rem] md:shrink-0 md:flex-col md:gap-4">
        {editions.map((edition) => {
          const soldOut = isSoldOut(edition)
          const selected = edition.id === selectedEditionId
          return (
            <li key={edition.id} className="w-16 md:w-full">
              <button
                type="button"
                aria-label={`Edição ${edition.label}, ${soldOut ? 'esgotada' : formatEth(edition.price)}`}
                aria-pressed={selected}
                disabled={soldOut}
                onClick={() => onSelectEdition(edition.id)}
                className={cn(
                  'block w-full overflow-hidden rounded-sm border-2 border-transparent outline-none focus-visible:ring-3 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:rounded-lg md:border',
                  selected && 'border-primary',
                )}
              >
                <NftImage
                  src={image}
                  alt=""
                  width={THUMB_SIZE}
                  height={THUMB_SIZE}
                  sizes="100px"
                  loading="lazy"
                  decoding="async"
                  className="aspect-square w-full object-cover"
                />
              </button>
            </li>
          )
        })}
      </ul>

      <div className="relative min-w-0 flex-1 md:rounded-md md:bg-card md:p-4">
        <NftImage
          src={image}
          alt={name}
          width={MAIN_SIZE}
          height={MAIN_SIZE}
          sizes="(min-width: 1024px) 404px, 90vw"
          fetchPriority="high"
          decoding="async"
          className="aspect-[361/356] w-full rounded-3xl object-cover md:aspect-square"
        />
        <button
          ref={zoomTrigger}
          type="button"
          aria-label="Ampliar imagem"
          onClick={() => setZoomOpen(true)}
          className="absolute top-3 right-3 inline-flex size-9 items-center justify-center rounded-full bg-background/80 text-foreground outline-none backdrop-blur-sm transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:ring-3 focus-visible:ring-ring md:top-[1.875rem] md:right-7 md:size-[1.875rem] md:border md:bg-muted"
        >
          <SearchIcon className="size-4 md:size-5" />
        </button>
      </div>

      {/* o foco vai ao botão de fechar ao abrir e volta à lupa ao fechar */}
      <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
        <DialogContent finalFocus={zoomTrigger} className="w-auto max-w-[min(90vw,60rem)] bg-card p-3">
          <DialogTitle className="sr-only">Imagem ampliada de {name}</DialogTitle>
          <NftImage src={image} alt={name} width={MAIN_SIZE} height={MAIN_SIZE} sizes="90vw" className="max-h-[80dvh] w-full rounded-lg object-contain" />
        </DialogContent>
      </Dialog>
    </div>
  )
}
