import { useRef, useState } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { LogInIcon, LogOutIcon, MenuIcon, SearchIcon, ShoppingCartIcon, UserIcon } from 'lucide-react'
import { cn } from "@/lib/utils"
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
import { isHomeActive, isMarketActive } from './nav'

type HeaderUser = { displayName: string; avatarUrl: string | null }

type HeaderProps = {
  cartCount: number
  user: HeaderUser | null
  onLoginClick: () => void
  onLogout: () => void
  onSearch: (query: string) => void
}

const linkClass = (active: boolean) =>
  cn(
    'relative px-1 py-2 text-base outline-none transition-colors hover:text-primary focus-visible:ring-3 focus-visible:ring-ring',
    active ? 'text-primary after:absolute after:inset-x-0 after:-bottom-1 after:h-0.5 after:bg-primary' : 'text-foreground',
  )

const iconButton =
  'relative inline-flex size-10 items-center justify-center rounded-md text-foreground outline-none transition-colors hover:text-primary focus-visible:ring-3 focus-visible:ring-ring'

export function Header({ cartCount, user, onLoginClick, onLogout, onSearch }: HeaderProps) {
  const { pathname, hash } = useRouterState({ select: (state) => state.location })
  const home = isHomeActive(pathname, hash)
  const market = isMarketActive(pathname, hash)

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
    <header className="border-b bg-background">
      <div className="mx-auto flex h-header w-full max-w-page items-center justify-between gap-4 px-gutter">
        <Link to="/" className="text-sm font-bold tracking-widest outline-none focus-visible:ring-3 focus-visible:ring-ring">
          KURIO
        </Link>

        <nav aria-label="Principal" className="hidden items-center gap-10 md:flex">
          <Link to="/" aria-current={home ? 'page' : undefined} className={linkClass(home)}>
            Início
          </Link>
          <Link to="/" hash="catalogo" aria-current={market ? 'page' : undefined} className={linkClass(market)}>
            Mercado
          </Link>
          <button type="button" className={linkClass(false)} onClick={comingSoon}>
            Criadores
          </button>
          <button type="button" className={linkClass(false)} onClick={comingSoon}>
            Aprenda
          </button>
        </nav>

        <div className="flex items-center gap-1">
          <button
            ref={searchTrigger}
            type="button"
            className={iconButton}
            aria-label="Buscar"
            aria-expanded={searchOpen}
            onClick={() => setSearchOpen((open) => !open)}
          >
            <SearchIcon className="size-5" />
          </button>
          {/* no mobile o carrinho fica na barra inferior */}
          <Link
            to="/carrinho"
            className={cn(iconButton, 'hidden md:inline-flex')}
            aria-label={cartCount > 0 ? `Carrinho, ${cartCount} ${cartCount === 1 ? 'item' : 'itens'}` : 'Carrinho, vazio'}
          >
            <ShoppingCartIcon className="size-5" />
            <span
              aria-hidden="true"
              className="absolute top-0.5 right-0 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[0.625rem] leading-4 font-bold text-primary-foreground"
            >
              {cartCount}
            </span>
          </Link>

          <div className="hidden md:block md:pl-3">
            {user ? (
              <UserMenu user={user} onLogout={onLogout} />
            ) : (
              <Button size="lg" className="h-9 px-3" onClick={onLoginClick}>
                <LogInIcon /> Entrar
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

      {searchOpen && (
        <div className="border-t">
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
                  <LogOutIcon /> Sair
                </Button>
              </>
            ) : (
              <Button
                onClick={() => {
                  closeMenu()
                  onLoginClick()
                }}
              >
                <LogInIcon /> Entrar
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
          <LogOutIcon /> Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
