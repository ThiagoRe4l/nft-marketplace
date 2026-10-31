import { Link } from '@tanstack/react-router'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// artes fixas de public/assets/nfts: Emerald Ape (03) e Ivory Baron (05)
const EMERALD_APE = '/assets/nfts/nft-artwork-03.png'
const IVORY_BARON = '/assets/nfts/nft-artwork-05.png'

export function PromoBanners() {
  return (
    <section aria-label="Destaques da Kurio" className="mx-auto grid w-full max-w-page gap-6 px-gutter py-8 md:grid-cols-2 md:py-12">
      <Banner
        image={EMERALD_APE}
        title="Lançamentos gênesis de edição limitada"
        text="Colecione edições escassas diretamente dos criadores antes da revelação pública."
        action={
          <Link to="/" search={{ tab: 'new' }} hash="catalogo" className={buttonVariants({ className: 'h-9 px-4 font-bold' })}>
            Explorar →
          </Link>
        }
      />
      <Banner
        image={IVORY_BARON}
        reverse
        title="Arte digital selecionada e muito mais"
        text="Explore novos artistas, coleções verificadas e obras digitais que definem a cultura digital."
        action={
          <Link
            to="/"
            search={{ category: ['digital-art'] }}
            hash="catalogo"
            className={buttonVariants({ className: 'h-9 px-4 font-bold' })}
          >
            Explorar →
          </Link>
        }
      />
    </section>
  )
}

type BannerProps = {
  image: string
  title: string
  text: string
  action: React.ReactNode
  reverse?: boolean
}

function Banner({ image, title, text, action, reverse }: BannerProps) {
  return (
    <article className={cn('grid grid-cols-[2fr_3fr] items-stretch overflow-hidden rounded-sm bg-card', reverse && 'md:grid-cols-[3fr_2fr]')}>
      <img
        src={image}
        alt=""
        width={320}
        height={320}
        loading="lazy"
        className={cn('h-full min-h-48 w-full object-cover', reverse && 'md:order-2')}
      />
      <div className="flex flex-col justify-center gap-3 p-5 md:items-end md:text-right">
        <h2 className="text-base leading-snug font-bold">{title}</h2>
        <p className="text-xs leading-5 text-muted-foreground">{text}</p>
        <div>{action}</div>
      </div>
    </article>
  )
}
