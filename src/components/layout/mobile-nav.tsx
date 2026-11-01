import { Link, useRouterState } from '@tanstack/react-router'
import { HeartIcon, HomeIcon, ScanIcon, ShopIcon, UserIcon } from '@/components/icons'
import { cn } from '@/lib/utils'
import { comingSoon } from '@/shared/lib/coming-soon'
import { isHomeActive, isMarketActive, isNftDetail } from './nav'

const itemClass =
  'relative flex size-12 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring'

// barra inferior do mobile (frame do Figma, ícones de docs/figma/icons); Favoritos e Escanear ainda não existem
export function MobileNav({ cartCount }: { cartCount: number }) {
  const { pathname, hash } = useRouterState({ select: (state) => state.location })
  const home = isHomeActive(pathname, hash) || isMarketActive(pathname, hash)
  const cartActive = pathname === '/carrinho'
  const profileActive = pathname === '/perfil'
  if (isNftDetail(pathname)) return null

  return (
    <nav
      aria-label="Navegação inferior"
      className="fixed inset-x-0 bottom-0 z-40 md:hidden"
    >
      <div className="relative flex h-16 items-center justify-between rounded-t-3xl bg-card px-8 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_30px_rgba(10,6,4,0.45)] box-content">
        <Link
          to="/"
          aria-label="Início"
          aria-current={home ? 'page' : undefined}
          className={cn(itemClass, home && 'text-highlight')}
        >
          <HomeIcon className="size-6" />
        </Link>
        <button type="button" aria-label="Favoritos" className={itemClass} onClick={comingSoon}>
          <HeartIcon filled className="size-5" />
        </button>
        <span className="w-14" aria-hidden="true" />
        <Link
          to="/carrinho"
          aria-label={cartCount > 0 ? `Carrinho, ${cartCount} ${cartCount === 1 ? 'item' : 'itens'}` : 'Carrinho, vazio'}
          aria-current={cartActive ? 'page' : undefined}
          className={cn(itemClass, cartActive && 'text-highlight')}
        >
          <ShopIcon className="size-6" />
          {cartCount > 0 && (
            <span
              aria-hidden="true"
              className="absolute top-1 right-0.5 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[0.625rem] leading-4 font-bold text-primary-foreground"
            >
              {cartCount}
            </span>
          )}
        </Link>
        <Link
          to="/perfil"
          aria-label="Perfil"
          aria-current={profileActive ? 'page' : undefined}
          className={cn(itemClass, profileActive && 'text-highlight')}
        >
          <UserIcon className="size-6" />
        </Link>
        <button
          type="button"
          aria-label="Escanear"
          onClick={comingSoon}
          className="absolute -top-8 left-1/2 flex size-[65px] -translate-x-1/2 items-center justify-center rounded-full bg-[linear-gradient(180deg,rgb(210_138_76/0.4)_-16.92%,var(--primary)_109.23%)] text-foreground shadow-lg outline-none focus-visible:ring-3 focus-visible:ring-ring"
        >
          <ScanIcon className="h-6 w-[1.6875rem]" />
        </button>
      </div>
    </nav>
  )
}
