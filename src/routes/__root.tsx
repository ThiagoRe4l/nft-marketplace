import { QueryClient } from "@tanstack/react-query";
import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import { z } from 'zod'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import { Toaster } from '@/components/ui/sonner'
import { MobileNav } from '@/components/layout/mobile-nav'
import { useSubmitSearch } from '@/features/catalog/use-submit-search'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { useLogout, useSession } from '@/features/auth/session'
import { AuthDialog } from '@/features/auth/components/auth-dialog'
import { withoutAuthParams } from '@/features/auth/redirect'
import { cartItemCount, useCart } from '@/features/cart/queries'
import { NotFoundPage } from '@/components/layout/status-pages'
import { RealtimeBridge } from '@/features/realtime/realtime-bridge'

// parâmetros do diálogo de login/cadastro: valem em qualquer página
const RootSearch = z.object({
    auth: z.enum(['login', 'signup']).optional().catch(undefined),
    redirect: z.string().optional().catch(undefined),
    reason: z.enum(['expired']).optional().catch(undefined),
})

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
    const cartCount = cartItemCount(cart.data)
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
                cartCount={cartCount}
                user={session.data?.user ?? null}
                onLoginClick={() =>
                    navigate({
                        to: '.',
                        search: (prev) => ({ ...prev, auth: 'login', redirect: withoutAuthParams(href), reason: undefined }),
                    })
                }
                onLogout={() => logout.mutate(undefined, { onSuccess: () => navigate({ to: '/' }) })}
                onSearch={submitSearch}
            />
            <main id="main" tabIndex={-1} className="flex-1 outline-none">
                <Outlet />
            </main>
            <Footer />
            <MobileNav cartCount={cartCount} />
            <AuthDialog />
            <Toaster />
            <RealtimeBridge />
        </div>
    )
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
    validateSearch: RootSearch,
    component: RootLayout,
    notFoundComponent: NotFoundPage,
})
