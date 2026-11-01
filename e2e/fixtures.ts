import { test as base, expect, type Page } from '@playwright/test'

/**
 * Fixtures e helpers dos testes E2E.
 *
 * O "backend" é o MSW rodando DENTRO da página (service worker), então só as
 * requisições feitas pela página são interceptadas. Por isso toda chamada ao
 * mock usa `page.evaluate(fetch(...))`; `page.request` falaria com o servidor
 * de preview, que não tem API nenhuma.
 *
 * Isolamento: o banco do mock vive no localStorage do navegador. Cada teste
 * roda num contexto novo, então ele já começa no estado inicial (seed). Não é
 * preciso chamar `mock.reset()` no começo do teste; só use quando quiser
 * voltar ao estado inicial no meio dele.
 */

export const TOKEN_KEY = 'kurio-token'

export const USERS = {
  ana: { email: 'ana@kurio.dev', password: 'kurio1234', displayName: 'Ana Ribeiro' },
  bruno: { email: 'bruno@kurio.dev', password: 'kurio5678', displayName: 'Bruno Costa' },
} as const
export type UserKey = keyof typeof USERS

/** Navega e espera o app pronto. O app só renderiza depois de o MSW iniciar, então `main` visível já implica mocks ativos. */
export async function gotoApp(page: Page, path = '/') {
  await page.goto(path)
  await expect(page.getByRole('main')).toBeVisible()
  // garante que a página já é controlada pelo service worker (fetch passa pelo MSW)
  await page.waitForFunction(() => navigator.serviceWorker?.controller != null)
}

type FetchResult = { status: number; body: unknown }

/** Faz um fetch de dentro da página (passa pelo MSW) e falha se a resposta não for 2xx. */
async function pageFetch(page: Page, url: string, init?: { method?: string; body?: unknown; token?: string }) {
  const result = await page.evaluate(
    async ({ url, init }): Promise<FetchResult> => {
      const response = await fetch(url, {
        method: init?.method ?? 'GET',
        headers: {
          ...(init?.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
          ...(init?.token ? { Authorization: `Bearer ${init.token}` } : {}),
        },
        body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
      })
      const text = await response.text()
      return { status: response.status, body: text ? JSON.parse(text) : null }
    },
    { url, init },
  )
  if (result.status < 200 || result.status >= 300) {
    throw new Error(`${init?.method ?? 'GET'} ${url} -> ${result.status}: ${JSON.stringify(result.body)}`)
  }
  return result.body
}

/** Controles do mock (src/mocks/handlers/control.ts). A página precisa estar carregada (use gotoApp antes). */
export function createMockControls(page: Page) {
  const post = (url: string, body?: unknown) => pageFetch(page, url, { method: 'POST', body }).then(() => undefined)
  return {
    /** Volta o banco e o cenário ao estado inicial. */
    reset: () => post('/api/__mock/reset'),
    /** Troca o cenário (slow, flaky, offline, server-error, empty, order-timeout, payment-rejected, wallet-rejected). */
    scenario: (name: string) => post('/api/__mock/scenario', { name }),
    /** Simula uma mudança externa de preço/estoque: altera o banco e emite o evento em tempo real. */
    patchEdition: (nftId: string, editionId: string, patch: { price?: string; available?: number | null }) =>
      post(`/api/__mock/nfts/${nftId}/editions/${editionId}`, patch),
    /** Reenvia o último evento (ou o anterior) do tempo real, para testar eventos duplicados/fora de ordem. */
    replay: (which: 'last' | 'previous') => post('/api/__mock/realtime/replay', { which }),
    /** Derruba o socket simulado; o app deve reconectar. */
    disconnectRealtime: () => post('/api/__mock/realtime/disconnect'),
    /** Expira todas as sessões: a próxima chamada autenticada recebe 401. */
    expireSessions: () => post('/api/__mock/session/expire'),
  }
}
export type MockControls = ReturnType<typeof createMockControls>

/**
 * Entra como um usuário do seed: faz o login via fetch na página, grava o token
 * em localStorage e recarrega, para o app subir já autenticado.
 */
export async function loginAs(page: Page, user: UserKey) {
  const { email, password } = USERS[user]
  if (page.url() === 'about:blank') await gotoApp(page)
  const auth = (await pageFetch(page, '/api/auth/login', { method: 'POST', body: { email, password } })) as {
    token: string
  }
  await page.evaluate(([key, token]) => localStorage.setItem(key, token), [TOKEN_KEY, auth.token])
  await page.reload()
  await expect(page.getByRole('main')).toBeVisible()
}

export const test = base.extend<{ mock: MockControls }>({
  // `provide` é o `use` do Playwright; o nome original colide com a regra de hooks do ESLint
  mock: async ({ page }, provide) => {
    await provide(createMockControls(page))
  },
})

export { expect }

/** Chamada autenticada (token do localStorage) ao mock, feita de dentro da página. Falha se a resposta não for 2xx. */
export async function api<T = unknown>(page: Page, method: string, url: string, body?: unknown): Promise<T> {
  return page.evaluate(
    async ({ method, url, body, tokenKey }) => {
      const token = localStorage.getItem(tokenKey)
      const response = await fetch(url, {
        method,
        headers: {
          ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      })
      const text = await response.text()
      if (!response.ok) throw new Error(`${method} ${url} -> ${response.status}: ${text}`)
      return text ? JSON.parse(text) : null
    },
    { method, url, body, tokenKey: TOKEN_KEY },
  ) as Promise<T>
}

/** Coloca no carrinho a edição ABERTA (sem limite de estoque) de cada NFT. */
export async function seedCart(page: Page, items: { nftId: string; quantity: number }[]) {
  for (const { nftId, quantity } of items) {
    const nft = await api<{ editions: { id: string; kind: string }[] }>(page, 'GET', `/api/nfts/${nftId}`)
    const edition = nft.editions.find((e) => e.kind === 'open')
    if (!edition) throw new Error(`${nftId} não tem edição aberta`)
    await api(page, 'POST', '/api/cart/items', { nftId, editionId: edition.id, quantity })
  }
}

/**
 * O coração da página de detalhe: no desktop é o botão "Favoritar" do painel de compra; no mobile fica na barra do topo,
 * com o nome do NFT no rótulo ("Favoritar X" / "Remover X dos favoritos").
 */
export function detailHeart(page: Page, nftName: string) {
  const mobile = page.getByRole('button', { name: new RegExp(`^(Favoritar|Remover) ${nftName}( dos favoritos)?$`) })
  return mobile.or(page.getByRole('button', { name: 'Favoritar', exact: true }))
}
