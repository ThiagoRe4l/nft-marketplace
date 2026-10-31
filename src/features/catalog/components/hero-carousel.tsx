import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Button, buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { NftSummary } from '@/contracts/nft'
import { usePrefersReducedMotion } from '@/shared/hooks/use-prefers-reduced-motion'

const AUTOPLAY_MS = 6000

type HeroCarouselProps = {
  slides: NftSummary[]
  isLoading: boolean
  error?: string | null
  onRetry?: () => void
}

export function HeroCarousel({ slides, isLoading, error, onRetry }: HeroCarouselProps) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const reducedMotion = usePrefersReducedMotion()
  const autoplay = !reducedMotion && !paused && slides.length > 1

  useEffect(() => {
    if (!autoplay) return
    const timer = setInterval(() => setIndex((current) => (current + 1) % slides.length), AUTOPLAY_MS)
    return () => clearInterval(timer)
  }, [autoplay, slides.length])

  // o foco só "sai" quando vai para fora do carrossel
  const onBlur = (event: React.FocusEvent<HTMLElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false)
  }

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Destaques"
      className="mx-auto w-full max-w-page px-gutter py-4 md:py-10"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={onBlur}
    >
      <div className="grid grid-cols-[1fr_8.5rem] items-center gap-4 rounded-xl bg-gradient-to-br from-surface-raised to-card p-5 md:grid-cols-1 md:gap-10 md:rounded-none md:bg-none md:p-0 lg:grid-cols-[1fr_28rem]">
        <div>
          <div>
            <p className="text-xs md:text-sm">Bem-vindo à Kurio</p>
            <h1 className="mt-3 text-xl leading-snug font-bold uppercase md:mt-6 md:text-4xl md:leading-[1.6]">
              Seja dono do futuro da arte digital
            </h1>
            <p className="mt-3 max-w-md text-xs leading-5 text-muted-foreground md:mt-4 md:text-sm md:leading-6">
              Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital rara, apoie
              artistas e tenha uma parte da cultura da internet.
            </p>
            <Link
              to="/"
              hash="catalogo"
              className={buttonVariants({
                className: 'mt-4 h-9 rounded-full px-5 font-bold uppercase md:mt-8 md:h-10 md:rounded-md md:px-6',
              })}
            >
              Explorar
            </Link>
          </div>
        </div>

        <div>
          {isLoading ? (
            <Skeleton className="mx-auto aspect-square w-full max-w-md rounded-xl" />
          ) : error ? (
            <div role="alert" className="flex aspect-square w-full max-w-md flex-col items-center justify-center gap-3 rounded-xl bg-card p-6 text-center text-sm">
              <p>{error}</p>
              <Button variant="outline" onClick={onRetry}>
                Tentar novamente
              </Button>
            </div>
          ) : (
            <div
              className="mx-auto grid w-full max-w-md"
              aria-live={autoplay ? 'off' : 'polite'}
            >
              {slides.map((nft, i) => (
                <Link
                  key={nft.id}
                  to="/nft/$id"
                  params={{ id: nft.id }}
                  aria-label={`${nft.name} (slide ${i + 1} de ${slides.length})`}
                  aria-hidden={i !== index}
                  tabIndex={i === index ? 0 : -1}
                  className={cn(
                    'col-start-1 row-start-1 overflow-hidden rounded-xl outline-none transition-opacity duration-500 focus-visible:ring-3 focus-visible:ring-ring motion-reduce:transition-none',
                    i === index ? 'opacity-100' : 'pointer-events-none opacity-0',
                  )}
                >
                  <img
                    src={nft.image}
                    alt={nft.name}
                    width={640}
                    height={640}
                    // o primeiro slide é o LCP da página
                    loading={i === 0 ? 'eager' : 'lazy'}
                    fetchPriority={i === 0 ? 'high' : 'auto'}
                    className="aspect-square w-full object-cover"
                  />
                </Link>
              ))}
            </div>
          )}

        </div>
      </div>
      {slides.length > 1 && (
        <div className="mt-3 flex justify-center gap-1">
          <Dots count={slides.length} index={index} onSelect={setIndex} />
        </div>
      )}
    </section>
  )
}

function Dots({ count, index, onSelect }: { count: number; index: number; onSelect: (index: number) => void }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          aria-label={`Ir para o slide ${i + 1}`}
          aria-current={i === index}
          onClick={() => onSelect(i)}
          className="group flex size-6 items-center justify-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring"
        >
          <span className={cn('size-2.5 rounded-full bg-primary transition-opacity', i === index ? 'opacity-100' : 'opacity-40 group-hover:opacity-70')} />
        </button>
      ))}
    </>
  )
}
