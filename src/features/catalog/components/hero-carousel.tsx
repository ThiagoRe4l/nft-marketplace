import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRightIcon } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { NftImage } from '@/components/nft/nft-image'
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
      className="relative mx-auto w-full max-w-page px-gutter py-4 md:pt-8 md:pb-10 lg:pb-0"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={onBlur}
    >
      <div className="relative grid grid-cols-[1fr_8.625rem] items-center gap-2 overflow-hidden rounded-lg bg-gradient-to-br from-surface-raised to-card p-4 pb-8 md:grid-cols-1 md:overflow-visible md:gap-10 md:rounded-none md:bg-none md:p-0 md:pb-0 lg:min-h-[28.125rem] lg:grid-cols-[minmax(0,37.5rem)_28.125rem] lg:justify-between lg:pl-10">
        {/* mobile (Figma): duas formas translúcidas no fundo do card */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-[1.9375rem] -left-20 size-[15.5rem] rounded-full bg-[linear-gradient(160.25deg,rgb(221_154_95/0.43)_22.1%,rgb(210_138_76/0.04)_87.42%)] md:hidden"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-2.5 left-[4.5625rem] size-[15.5rem] rounded-full bg-[linear-gradient(160.25deg,rgb(221_154_95/0.37)_22.1%,rgb(210_138_76/0)_87.42%)] md:hidden"
        />
        <div className="max-md:relative">
          <div>
            <p className="text-xs max-md:font-medium md:text-sm lg:leading-4 lg:font-medium lg:tracking-[0.1em]">Bem-vindo à Kurio</p>
            <h1 className="mt-1.5 text-[1.125rem] leading-[1.8125rem] font-bold uppercase md:mt-6 md:text-4xl md:leading-[1.6] lg:mt-2 lg:text-[2.6875rem] lg:leading-[4.375rem]">
              <span className="md:hidden">Seja dono da cultura digital</span>
              <span className="max-md:hidden">Seja dono do futuro da arte digital</span>
            </h1>
            <p className="mt-1.5 max-w-md text-xs leading-[1.125rem] text-muted-foreground md:mt-4 md:leading-6 md:text-sm lg:mt-1 lg:max-w-[34.8125rem]">
              <span className="md:hidden">Descubra NFTs selecionados de criadores do mundo todo.</span>
              <span className="max-md:hidden">
                Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital rara, apoie
                artistas e tenha uma parte da cultura da internet.
              </span>
            </p>
            <Link
              to="/"
              hash="catalogo"
              className={buttonVariants({
                className:
                  // mobile (Figma): link de texto com seta, junto ao parágrafo; o ::after mantém a área de toque
                  'mt-2 h-9 rounded-full px-5 font-bold uppercase max-md:relative max-md:mt-2 max-md:h-auto max-md:gap-2 max-md:bg-transparent max-md:p-0 max-md:text-xs max-md:text-highlight max-md:after:absolute max-md:after:-inset-x-2 max-md:after:-inset-y-3.5 max-md:after:content-[""] max-md:hover:bg-transparent md:mt-8 md:h-10 md:rounded-md md:px-6 lg:pr-9 lg:pl-7 lg:text-base',
              })}
            >
              Explorar
              <ArrowRightIcon aria-hidden="true" className="size-4 text-primary md:hidden" />
            </Link>
          </div>
          {/* desktop: os pontos ficam no fim da coluna de texto, à direita (Figma) */}
          {slides.length > 1 && (
            <div className="mt-11 hidden justify-end gap-2 lg:flex">
              <Dots count={slides.length} index={index} onSelect={setIndex} />
            </div>
          )}
        </div>

        <div className="max-md:relative">
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
              className="mx-auto grid w-full max-w-md lg:max-w-none"
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
                    'col-start-1 row-start-1 overflow-hidden rounded-2xl outline-none md:rounded-xl lg:rounded-3xl transition-opacity duration-500 focus-visible:ring-3 focus-visible:ring-ring motion-reduce:transition-none',
                    i === index ? 'opacity-100' : 'pointer-events-none opacity-0',
                  )}
                >
                  <NftImage
                    src={nft.image}
                    alt={nft.name}
                    width={640}
                    height={640}
                    sizes="(min-width: 768px) 448px, 138px"
                    // o primeiro slide é o LCP da página
                    loading={i === 0 ? 'eager' : 'lazy'}
                    fetchPriority={i === 0 ? 'high' : 'auto'}
                    className="aspect-square w-full object-cover"
                  />
                </Link>
              ))}
            </div>
          )}
          {/* mobile (Figma): a imagem do próximo slide aparece menor, sobreposta à que troca (decorativa: o slide já é o link) */}
          {!isLoading && !error && slides.length > 1 && (
            <div
              aria-hidden="true"
              className="absolute -bottom-2 left-3.5 size-[3.625rem] overflow-hidden rounded-2xl ring-[3px] ring-card md:hidden"
            >
              <NftImage
                src={slides[(index + 1) % slides.length].image}
                alt=""
                width={116}
                height={116}
                sizes="58px"
                loading="lazy"
                className="size-full object-cover"
              />
            </div>
          )}
        </div>
      </div>
      {slides.length > 1 && (
        // mobile: os pontos ficam dentro do card, na base (Figma)
        <div className="mt-3 flex justify-center gap-1 max-md:absolute max-md:inset-x-0 max-md:bottom-[0.8125rem] max-md:mt-0 max-md:gap-0 lg:hidden">
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
          // desktop: pontos de 8 px com 8 px entre eles (Figma); a área de clique de 24 px vem do ::after
          className="group relative flex size-6 items-center justify-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring max-md:-mx-[5.5px] lg:size-2 lg:after:absolute lg:after:-inset-2 lg:after:content-['']"
        >
          <span className={cn('size-2.5 rounded-full bg-primary transition-opacity max-md:size-[7px] lg:size-2', i === index ? 'opacity-100' : 'opacity-40 group-hover:opacity-70')} />
        </button>
      ))}
    </>
  )
}
