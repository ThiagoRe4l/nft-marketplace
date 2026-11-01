import { NftImage } from '@/components/nft/nft-image'
import { useRef, useState } from 'react'
import { SearchIcon } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

// dimensões intrínsecas: com o aspect-ratio fixo, evitam deslocamento de layout
const MAIN_SIZE = 600
const THUMB_SIZE = 88

export function NftGallery({ name, images }: { name: string; images: string[] }) {
  const [index, setIndex] = useState(0)
  const [zoomOpen, setZoomOpen] = useState(false)
  const zoomTrigger = useRef<HTMLButtonElement>(null)
  const current = images[Math.min(index, images.length - 1)]

  return (
    <div className="flex flex-col-reverse gap-4 md:flex-row md:items-start">
      <ul aria-label="Miniaturas" className="flex gap-3 md:w-[5.5rem] md:shrink-0 md:flex-col">
        {images.map((src, i) => (
          <li key={src + i} className="w-16 md:w-full">
            <button
              type="button"
              aria-label={`Ver imagem ${i + 1} de ${images.length}`}
              aria-pressed={i === index}
              onClick={() => setIndex(i)}
              className={cn(
                'block w-full overflow-hidden rounded-sm border-2 border-transparent outline-none focus-visible:ring-3 focus-visible:ring-ring',
                i === index && 'border-primary',
              )}
            >
              <NftImage
                src={src}
                alt=""
                width={THUMB_SIZE}
                height={THUMB_SIZE}
                sizes="88px"
                loading="lazy"
                decoding="async"
                className="aspect-square w-full object-cover"
              />
            </button>
          </li>
        ))}
      </ul>

      <div className="relative min-w-0 flex-1 rounded-xl bg-card p-3 md:rounded-sm md:p-5">
        <NftImage
          src={current}
          alt={name}
          width={MAIN_SIZE}
          height={MAIN_SIZE}
          sizes="(min-width: 1024px) 520px, 90vw"
          fetchPriority="high"
          decoding="async"
          className="aspect-square w-full rounded-lg object-cover"
        />
        <button
          ref={zoomTrigger}
          type="button"
          aria-label="Ampliar imagem"
          onClick={() => setZoomOpen(true)}
          className="absolute top-5 right-5 inline-flex size-9 items-center justify-center rounded-full bg-background/80 text-foreground outline-none backdrop-blur-sm transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:ring-3 focus-visible:ring-ring md:top-8 md:right-8"
        >
          <SearchIcon className="size-4" />
        </button>
      </div>

      {/* o foco vai ao botão de fechar ao abrir e volta à lupa ao fechar */}
      <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
        <DialogContent finalFocus={zoomTrigger} className="w-auto max-w-[min(90vw,60rem)] bg-card p-3">
          <DialogTitle className="sr-only">Imagem ampliada de {name}</DialogTitle>
          <NftImage src={current} alt={name} width={MAIN_SIZE} height={MAIN_SIZE} sizes="90vw" className="max-h-[80dvh] w-full rounded-lg object-contain" />
        </DialogContent>
      </Dialog>
    </div>
  )
}
