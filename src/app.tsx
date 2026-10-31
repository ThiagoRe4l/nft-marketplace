import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import './index.css'
import { endSession } from './features/auth/session'
import { setUnauthorizedHandler } from './shared/api/client'
import { toAppError } from './shared/api/errors'
import { withoutAuthParams } from './features/auth/redirect'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      // 4xx não melhora tentando de novo; rede e 5xx tentam até 2 vezes
      retry: (failureCount, error) => {
        const { status } = toAppError(error)
        if (status >= 400 && status < 500) return false
        return failureCount < 2
      },
    },
    // mutations nunca repetem sozinhas: pedido duplicado se evita com idempotência, não com sorte
    mutations: { retry: false },
  },
})

const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// sessão caiu no meio da navegação: limpa os dados privados e abre o diálogo de login, guardando a página atual para voltar depois
setUnauthorizedHandler(() => {
  endSession(queryClient)
  router.navigate({
    to: '/',
    search: { auth: 'login', redirect: withoutAuthParams(router.state.location.href), reason: 'expired' },
  })
})

export function renderApp() {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  )
}
