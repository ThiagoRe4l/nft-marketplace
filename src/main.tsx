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

// O app só é importado DEPOIS dos mocks. O socket.io-client guarda o construtor do
// WebSocket quando o módulo carrega, e ele precisa ser a versão já substituída pelo MSW.
enableMocking().then(async () => {
  const { renderApp } = await import('./app')
  renderApp()
})