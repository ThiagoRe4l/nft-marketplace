import { Link, useRouterState } from '@tanstack/react-router'
import { HeartIcon, HouseIcon, ScanLineIcon, ShoppingCartIcon, UserIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { comingSoon } from '@/shared/lib/coming-soon'
import { isHomeActive, isMarketActive } from './nav'

const itemClass =
  'relative flex size-12 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring'

// barra inferior do mobile (frame do Figma); Favoritos e Escanear ainda não existem
export function MobileNav({ cartCount }: { cartCount: number }) {
  const { pathname, hash } = useRouterState({ select: (state) => state.location })
  const home = isHomeActive(pathname, hash) || isMarketActive(pathname, hash)
  const cartActive = pathname === '/carrinho'
  const profileActive = pathname === '/perfil'

  return (
    <nav
      aria-label="Navegação inferior"
      className="fixed inset-x-0 bottom-0 z-40 md:hidden"
    >
      <div className="relative flex h-16 items-center justify-between rounded-t-3xl border-t bg-card px-8 pb-[env(safe-area-inset-bottom)] box-content">
        <Link
          to="/"
          aria-label="Início"
          aria-current={home ? 'page' : undefined}
          className={cn(itemClass, home && 'text-primary')}
        >
          <HouseIcon className={cn('size-6', home && 'fill-primary')} />
        </Link>
        <button type="button" aria-label="Favoritos" className={itemClass} onClick={comingSoon}>
          <HeartIcon className="size-6" />
        </button>
        <span className="w-14" aria-hidden="true" />
        <Link
          to="/carrinho"
          aria-label={cartCount > 0 ? `Carrinho, ${cartCount} ${cartCount === 1 ? 'item' : 'itens'}` : 'Carrinho, vazio'}
          aria-current={cartActive ? 'page' : undefined}
          className={cn(itemClass, cartActive && 'text-primary')}
        >
          <ShoppingCartIcon className="size-6" />
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
          className={cn(itemClass, profileActive && 'text-primary')}
        >
          <UserIcon className={cn('size-6', profileActive && 'fill-primary')} />
        </Link>
        <button
          type="button"
          aria-label="Escanear"
          onClick={comingSoon}
          className="absolute left-1/2 -top-7 flex size-14 -translate-x-1/2 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-hover text-primary-foreground shadow-lg ring-4 ring-background outline-none focus-visible:ring-ring"
        >
          <ScanLineIcon className="size-7" />
        </button>
      </div>
    </nav>
  )
}
