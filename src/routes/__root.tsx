import { QueryClient } from "@tanstack/react-query";
import { Link, Outlet, createRootRouteWithContext } from '@tanstack/react-router'

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
    component: () => (
        <>
            <nav className="flex gap-4 p-4">
                <Link to="/">Início</Link>
                <Link to="/">Teste</Link>
            </nav>
            <Outlet />
        </>
    ),
    notFoundComponent: () => <p className="p-4">Página não encontrada</p>,
})