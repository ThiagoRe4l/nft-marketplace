import { QueryClient } from "@tanstack/react-query";
import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import { Toaster } from '@/components/ui/sonner'
import { MobileNav } from '@/components/layout/mobile-nav'
import { useSubmitSearch } from '@/features/catalog/use-submit-search'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { useLogout, useSession } from '@/features/auth/session'
import { cartItemCount, useCart } from '@/features/cart/queries'

function skipToContent(event: React.MouseEvent<HTMLAnchorElement>) {
    // foca o <main> sem mexer no hash da URL (o router usa hash para âncoras como #catalogo)
    event.preventDefault()
    document.getElementById('main')?.focus()
}

function RootLayout() {
    const session = useSession()
    const cart = useCart()
    const logout = useLogout()
    const navigate = useNavigate()
    const href = useRouterState({ select: (s) => s.location.href })
    const submitSearch = useSubmitSearch()
    // valores provisórios: ligar ao carrinho e à sessão quando essas fases chegarem
    const cartCount = 0
    return (
        <div className="flex min-h-dvh flex-col pb-[calc(4.25rem+env(safe-area-inset-bottom))] md:pb-0">
            <a
                href="#main"
                onClick={skipToContent}
                className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:outline-none focus:ring-3 focus:ring-ring"
            >
                Pular para o conteúdo
            </a>
            <Header
                cartCount={cartItemCount(cart.data)}
                user={session.data?.user ?? null}
                onLoginClick={() => navigate({ to: '/login', search: { redirect: href } })}
                onLogout={() => logout.mutate(undefined, { onSuccess: () => navigate({ to: '/' }) })}
                onSearch={submitSearch}
            />
            <main id="main" tabIndex={-1} className="flex-1 outline-none">
                <Outlet />
            </main>
            <Footer />
            <MobileNav cartCount={cartCount} />
            <Toaster />
        </div>
    )
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
    component: RootLayout,
    notFoundComponent: () => <p className="p-4">Página não encontrada</p>,
})
