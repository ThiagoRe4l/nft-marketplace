import type { FormEvent, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { comingSoon } from '@/shared/lib/coming-soon'
import { ComingSoonButton } from './coming-soon-button'
import { FacebookIcon, InstagramIcon, LinkedinIcon, TwitterIcon, YoutubeIcon } from './social-icons'

const HIGHLIGHTS = [
  { letter: 'W', title: 'Segurança da carteira', text: 'Proteja sua carteira e colecione arte digital verificada com confiança.' },
  { letter: 'C', title: 'Criadores em destaque', text: 'Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.' },
  { letter: 'D', title: 'Alertas de lançamentos', text: 'Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.' },
]

const LINK_COLUMNS = [
  { title: 'Meu perfil', links: ['Meu perfil', 'Minha coleção', 'Atividade', 'Estúdio do criador', 'Lista de interesse'] },
  { title: 'Central de ajuda', links: ['Central de ajuda', 'Como comprar NFTs', 'Carteira e segurança', 'Política do mercado', 'Denunciar item'] },
  { title: 'Coleções', links: ['Arte digital', 'Fotografia', 'Música', 'Arte 3D', 'Utilidade'] },
]

const SOCIALS: { label: string; icon: ReactNode }[] = [
  { label: 'Facebook', icon: <FacebookIcon /> },
  { label: 'Instagram', icon: <InstagramIcon /> },
  { label: 'Twitter', icon: <TwitterIcon /> },
  { label: 'LinkedIn', icon: <LinkedinIcon /> },
  { label: 'YouTube', icon: <YoutubeIcon /> },
]

export function Footer() {
  const onNewsletterSubmit = (event: FormEvent) => {
    event.preventDefault()
    comingSoon()
  }

  return (
    <footer className="mx-auto mt-24 w-full max-w-page px-gutter pb-6">
      <div className="bg-card">
        <div className="grid gap-8 p-8 md:grid-cols-2 md:gap-0 md:p-0 lg:grid-cols-[1fr_1fr_1fr_1.35fr]">
          {HIGHLIGHTS.map((item) => (
            <section key={item.title} className="lg:border-r lg:border-border-strong md:p-8">
              <div
                aria-hidden="true"
                className="mb-4 flex size-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground"
              >
                {item.letter}
              </div>
              <h2 className="text-base font-bold">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p>
            </section>
          ))}
          <section className="md:p-8">
            <h2 className="text-base leading-4 font-bold">Antecipe-se ao próximo lançamento</h2>
            <form className="mt-4 flex" onSubmit={onNewsletterSubmit}>
              <label htmlFor="newsletter-email" className="sr-only">
                Seu e-mail
              </label>
              <Input
                id="newsletter-email"
                type="email"
                placeholder="digite seu e-mail..."
                className="h-10 rounded-r-none border-0 bg-background"
              />
              <Button type="submit" className="h-10 rounded-l-none px-4 font-bold">
                Enviar
              </Button>
            </form>
            <p className="mt-4 text-xs leading-5 text-muted-foreground">
              Receba lançamentos selecionados, histórias de criadores e novidades do mercado.
            </p>
          </section>
        </div>

        <div className="grid gap-3 bg-surface-raised px-8 py-6 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <span className="text-sm font-bold tracking-widest">KURIO</span>
          <span>Feito para colecionadores, criadores e cultura</span>
          <span>contato@email.com</span>
          <span>+55 11 4002 8922</span>
        </div>

        <div className="grid gap-8 p-8 sm:grid-cols-2 lg:grid-cols-4">
          {LINK_COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="text-base font-bold">{column.title}</h2>
              <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                {column.links.map((link) => (
                  <li key={link}>
                    <ComingSoonButton className="hover:text-primary">{link}</ComingSoonButton>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
          <div>
            <h2 className="text-base font-bold">Redes sociais</h2>
            <ul className="mt-2 flex gap-2">
              {SOCIALS.map((social) => (
                <li key={social.label}>
                  <ComingSoonButton
                    aria-label={social.label}
                    className="flex size-8 items-center justify-center rounded-sm border border-primary text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                  >
                    {social.icon}
                  </ComingSoonButton>
                </li>
              ))}
            </ul>
            <h2 className="mt-8 text-base font-bold">Carteiras compatíveis</h2>
            <p className="mt-2 rounded-sm border border-border-strong bg-surface-raised px-3 py-1.5 text-[0.625rem] font-bold tracking-wide text-primary">
              METAMASK · WALLETCONNECT · COINBASE
            </p>
          </div>
        </div>
      </div>
      <p className="mt-6 text-center text-sm">© 2026 Kurio. Propriedade digital para todos.</p>
    </footer>
  )
}
