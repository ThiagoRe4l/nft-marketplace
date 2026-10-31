import { ComingSoonButton } from '@/components/layout/coming-soon-button'

// conteúdo editorial estático: o blog está fora do escopo da demonstração
const POSTS = [
  {
    date: '12 de setembro',
    readTime: 'Leitura de 6 min',
    image: '/assets/nfts/nft-artwork-03.png',
    title: 'Como funciona a propriedade de NFTs',
    excerpt: 'Aprenda a colecionar, negociar e verificar ativos digitais.',
  },
  {
    date: '13 de setembro',
    readTime: 'Leitura de 2 min',
    image: '/assets/nfts/nft-artwork-05.png',
    title: '10 artistas digitais para acompanhar',
    excerpt: 'Conheça criadores que moldam a cultura digital.',
  },
  {
    date: '15 de setembro',
    readTime: 'Leitura de 3 min',
    image: '/assets/nfts/nft-artwork-04.png',
    title: 'Raridade, atributos e procedência',
    excerpt: 'Entenda raridade, procedência, direitos autorais e utilidade.',
  },
  {
    date: '15 de setembro',
    readTime: 'Leitura de 2 min',
    image: '/assets/nfts/nft-artwork-10.png',
    title: 'Como proteger sua carteira',
    excerpt: 'Proteja sua carteira, seus ativos e sua identidade.',
  },
]

export function JournalSection() {
  return (
    <section aria-labelledby="journal-title" className="mx-auto w-full max-w-page px-gutter py-8 md:py-12">
      <h2 id="journal-title" className="text-center text-2xl font-bold">
        Diário da Cunhagem
      </h2>
      <p className="mt-3 text-center text-xs text-muted-foreground md:text-sm">
        Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.
      </p>
      <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {POSTS.map((post) => {
          return (
            <li key={post.title}>
              <article className="h-full overflow-hidden rounded-sm bg-card">
                <img src={post.image} alt="" width={320} height={200} loading="lazy" className="aspect-[8/5] w-full object-cover" />
                <div className="space-y-2 p-4">
                  <p className="text-[0.6875rem] text-muted-foreground">
                    {post.date} <span aria-hidden="true">|</span> {post.readTime}
                  </p>
                  <h3 className="text-base leading-snug font-bold">{post.title}</h3>
                  <p className="text-xs leading-5 text-muted-foreground">{post.excerpt}</p>
                  <ComingSoonButton className="text-xs font-bold text-primary hover:underline">
                    Ler mais →
                  </ComingSoonButton>
                </div>
              </article>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
