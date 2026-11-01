import { useRef, useState } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { MenuIcon, SearchIcon } from 'lucide-react'
import { cn } from "@/lib/utils"
import { CartIcon, LogoutIcon, UserIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { comingSoon } from '@/shared/lib/coming-soon'
import { SearchForm } from './search-form'
import { hasHeaderDivider, isHomeActive, isMarketActive, isNftDetail } from './nav'

type HeaderUser = { displayName: string; avatarUrl: string | null }

type HeaderProps = {
  cartCount: number
  user: HeaderUser | null
  onLoginClick: () => void
  onLogout: () => void
  onSearch: (query: string) => void
}

// menu lateral (mobile): item ativo só em destaque, sem sublinhado
const linkClass = (active: boolean) =>
  cn(
    'relative px-1 py-2 text-base outline-none transition-colors hover:text-primary focus-visible:ring-3 focus-visible:ring-ring',
    active ? 'text-primary after:absolute after:inset-x-0 after:-bottom-1 after:h-0.5 after:bg-primary' : 'text-foreground',
  )

// nav do desktop (Figma): item de 45 px, ativo em negrito na cor de destaque e sublinhado de 3 px colado na base
const navLinkClass = (active: boolean) =>
  cn(
    'relative flex h-[45px] items-start text-base leading-[21px] outline-none transition-colors hover:text-primary focus-visible:ring-3 focus-visible:ring-ring',
    active
      ? 'font-bold text-highlight after:absolute after:inset-x-0 after:bottom-0 after:h-[3px] after:bg-primary'
      : 'text-foreground',
  )

// no desktop o alvo visual é o do Figma (ícone de 20 a 24 px); a área de clique é ampliada pelo ::after
const iconButton =
  'relative inline-flex size-10 items-center justify-center rounded-md text-foreground outline-none transition-colors hover:text-primary focus-visible:ring-3 focus-visible:ring-ring'

// ícone de 20 px no desktop; o ::after amplia a área de clique sem mudar o layout do Figma
const desktopHitArea = "md:after:absolute md:after:-inset-1 md:after:content-['']"

export function Header({ cartCount, user, onLoginClick, onLogout, onSearch }: HeaderProps) {
  const { pathname, hash } = useRouterState({ select: (state) => state.location })
  const home = isHomeActive(pathname, hash)
  const market = isMarketActive(pathname, hash)
  const divider = hasHeaderDivider(pathname)

  const [menuOpen, setMenuOpen] = useState(false)
  const menuTrigger = useRef<HTMLButtonElement>(null)
  const firstMenuLink = useRef<HTMLAnchorElement>(null)
  const closeMenu = () => setMenuOpen(false)

  const [searchOpen, setSearchOpen] = useState(false)
  const searchTrigger = useRef<HTMLButtonElement>(null)
  const closeSearch = () => {
    setSearchOpen(false)
    searchTrigger.current?.focus()
  }

  return (
    <header className={cn('bg-background max-md:border-b', isNftDetail(pathname) && 'max-md:hidden')}>
      {/* desktop: 24 px acima, linha de 45 px; a linha divisória só existe em algumas telas (ver nav.ts) */}
      <div className="mx-auto w-full max-w-page px-gutter md:pt-6">
        <div className="relative flex h-header items-center justify-between gap-4 md:grid md:h-[45px] md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-start md:gap-0 lg:grid-cols-[10rem_minmax(0,1fr)_minmax(12.9375rem,auto)]">
          {divider && <div aria-hidden="true" className="absolute inset-x-0 bottom-0 hidden h-px bg-border md:block" />}
          <Link
            to="/"
            className="text-sm font-bold tracking-widest outline-none focus-visible:ring-3 focus-visible:ring-ring md:flex md:h-[35px] md:items-center md:justify-self-start"
          >
            KURIO
          </Link>

          <nav aria-label="Principal" className="hidden items-start gap-10 md:flex md:justify-self-center">
          <Link to="/" aria-current={home ? 'page' : undefined} className={navLinkClass(home)}>
            Início
          </Link>
          <Link to="/" hash="catalogo" aria-current={market ? 'page' : undefined} className={navLinkClass(market)}>
            Mercado
          </Link>
          <button type="button" className={navLinkClass(false)} onClick={comingSoon}>
            Criadores
          </button>
          <button type="button" className={navLinkClass(false)} onClick={comingSoon}>
            Aprenda
          </button>
        </nav>

        <div className="flex items-center gap-1 md:h-[35px] md:justify-end md:gap-7">
          <button
            ref={searchTrigger}
            type="button"
            className={cn(iconButton, desktopHitArea, 'hidden md:inline-flex md:size-5')}
            aria-label="Buscar"
            aria-expanded={searchOpen}
            onClick={() => setSearchOpen((open) => !open)}
          >
            <SearchIcon className="size-5" />
          </button>
          {/* no mobile o carrinho fica na barra inferior */}
          <Link
            to="/carrinho"
            className={cn(iconButton, desktopHitArea, 'hidden md:inline-flex md:h-6 md:w-[31px] md:justify-start')}
            aria-label={cartCount > 0 ? `Carrinho, ${cartCount} ${cartCount === 1 ? 'item' : 'itens'}` : 'Carrinho, vazio'}
          >
            <CartIcon className="size-5 md:size-6" />
            {cartCount > 0 && (
              <span
                aria-hidden="true"
                className="absolute top-0.5 right-0 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[0.625rem] leading-4 font-bold text-primary-foreground md:top-0 md:right-auto md:left-[15px] md:box-content md:h-3 md:min-w-3 md:border-2 md:border-background md:px-0 md:font-medium md:leading-3"
              >
                {cartCount}
              </span>
            )}
          </Link>

          <div className="hidden md:block">
            {user ? (
              <UserMenu user={user} onLogout={onLogout} />
            ) : (
              <Button size="lg" className="h-9 rounded-md px-3 md:h-[35px] md:gap-1 md:px-[9px] md:text-base" onClick={onLoginClick}>
                <LogoutIcon className="size-5" /> Entrar
              </Button>
            )}
          </div>

          <button
            ref={menuTrigger}
            type="button"
            className={cn(iconButton, 'md:hidden')}
            aria-label="Abrir menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
          >
            <MenuIcon className="size-5" />
          </button>
        </div>
        </div>
      </div>

      {searchOpen && (
        <div className="hidden border-t md:block">
          <div className="mx-auto w-full max-w-page px-gutter py-3">
            <SearchForm
              autoFocus
              label="Buscar NFTs"
              placeholder="Buscar NFTs, coleções..."
              onSearch={(query) => {
                onSearch(query)
                closeSearch()
              }}
              onEscape={closeSearch}
            />
          </div>
        </div>
      )}

      {/* foco vai ao primeiro link ao abrir e volta ao botão do menu ao fechar */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="right" initialFocus={firstMenuLink} finalFocus={menuTrigger} className="bg-background">
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>
          <nav aria-label="Principal (mobile)" className="flex flex-col gap-1 px-4">
            <Link
              ref={firstMenuLink}
              to="/"
              aria-current={home ? 'page' : undefined}
              className={cn(linkClass(home), 'py-3 after:hidden', home && 'font-bold')}
              onClick={closeMenu}
            >
              Início
            </Link>
            <Link
              to="/"
              hash="catalogo"
              aria-current={market ? 'page' : undefined}
              className={cn(linkClass(market), 'py-3 after:hidden', market && 'font-bold')}
              onClick={closeMenu}
            >
              Mercado
            </Link>
            <button type="button" className={cn(linkClass(false), 'py-3 text-left')} onClick={comingSoon}>
              Criadores
            </button>
            <button type="button" className={cn(linkClass(false), 'py-3 text-left')} onClick={comingSoon}>
              Aprenda
            </button>
          </nav>
          <div className="mt-auto flex flex-col gap-2 border-t p-4">
            {user ? (
              <>
                <p className="truncate text-sm text-muted-foreground">{user.displayName}</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    closeMenu()
                    onLogout()
                  }}
                >
                  <LogoutIcon className="size-4" /> Sair
                </Button>
              </>
            ) : (
              <Button
                onClick={() => {
                  closeMenu()
                  onLoginClick()
                }}
              >
                <LogoutIcon className="size-4" /> Entrar
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </header>
  )
}

function UserMenu({ user, onLogout }: { user: HeaderUser; onLogout: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Menu de ${user.displayName}`}
        className="flex h-9 items-center gap-2 rounded-md border border-border-strong px-2 text-sm outline-none transition-colors hover:text-primary focus-visible:ring-3 focus-visible:ring-ring"
      >
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt="" width={24} height={24} className="size-6 rounded-full object-cover" />
        ) : (
          <UserIcon className="size-4" />
        )}
        <span className="max-w-32 truncate">{user.displayName}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem render={<Link to="/perfil" />}>Meu perfil</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout}>
          <LogoutIcon className="size-4" /> Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
