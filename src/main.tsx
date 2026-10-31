import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import './index.css'
import { endSession } from './features/auth/session'
import { setUnauthorizedHandler } from './shared/api/client'

const queryClient = new QueryClient()

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

// sessão caiu no meio da navegação: limpa os dados privados e leva ao login, guardando a página atual para voltar depois
setUnauthorizedHandler(() => {
  endSession(queryClient)
  router.navigate({ to: '/login', search: { redirect: router.state.location.href, reason: 'expired' } })
})

async function enableMocking() {
  if (import.meta.env.VITE_ENABLE_MOCKS !== 'true') return
  const { worker } = await import('./mocks/browser')
  const { db } = await import('./mocks/db/store')

  db.init()

  const { resumePendingOrders } = await import('./mocks/handlers/checkout')
  resumePendingOrders()

  const { setScenario } = await import('./mocks/scenarios')
  const fromUrl = new URLSearchParams(window.location.search).get('scenario')
  if (fromUrl) setScenario(fromUrl)

  await worker.start({
      // avisa no console quando uma chamada à API não tem handler (ex.: handler esquecido)
    onUnhandledRequest(request, print) {
      if (new URL(request.url).pathname.startsWith('/api')) print.warning()
    }, 
  })
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  )
})