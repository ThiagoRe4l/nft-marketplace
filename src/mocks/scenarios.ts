import { delay, http, HttpResponse } from 'msw'
import { apiError } from './lib/http'

// a descrição de cada cenário vai para o README e para o painel de desenvolvimento
export const SCENARIOS = {
  default: 'Padrão: latência baixa e estável',
  slow: 'Lento: 2,5 s em toda requisição',
  flaky: 'Instável: latência variável e respostas fora de ordem',
  offline: 'Sem conexão: toda requisição falha na rede',
  'server-error': 'Erro no servidor: 503 em todas as consultas (GET)',
  empty: 'Catálogo vazio',
  'order-timeout': 'O pedido é criado, mas a resposta demora mais que o timeout do app',
  'payment-rejected': 'O pagamento é recusado',
  'wallet-rejected': 'A conexão da carteira é recusada',
  'mutation-error': 'Falha nas alterações: 503 em toda escrita (exceto login)',
} as const
export type Scenario = keyof typeof SCENARIOS

const STORAGE_KEY = 'kurio-mock-scenario'
// sequência fixa: a 1ª requisição demora mais que a 2ª, então as respostas chegam fora de ordem
const FLAKY_LATENCIES = [1800, 200, 900, 400]
let requestCount = 0

const isScenario = (value: string | null): value is Scenario => value !== null && value in SCENARIOS

export function getScenario(): Scenario {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    if (isScenario(value)) return value
  } catch {
    // storage indisponível: usa o padrão
  }
  return 'default'
}

export function setScenario(name: string): boolean {
  if (!isScenario(name)) return false
  try {
    localStorage.setItem(STORAGE_KEY, name)
  } catch {
    // storage indisponível: o cenário não persiste
  }
  requestCount = 0 // recomeça a sequência: o cenário fica reproduzível
  return true
}

function latencyFor(scenario: Scenario) {
  if (scenario === 'slow') return 2500
  if (scenario === 'flaky') return FLAKY_LATENCIES[requestCount++ % FLAKY_LATENCIES.length]
  return 120
}

// Primeiro handler da lista. Aplica as condições de rede e, quando não retorna nada, a requisição segue para o handler do recurso.
export const networkHandler = http.all('/api/*', async ({ request }) => {
  const url = new URL(request.url)
  if (url.pathname.startsWith('/api/__mock')) return // controle nunca sofre falhas

  const scenario = getScenario()
  if (scenario === 'offline') return HttpResponse.error()

  await delay(latencyFor(scenario))

  if (scenario === 'server-error' && request.method === 'GET') {
    return apiError('TRANSIENT', 'Serviço temporariamente indisponível. Tente novamente.')
  }

  if (scenario === 'mutation-error' && request.method !== 'GET' && !url.pathname.startsWith('/api/auth')) {
    return apiError('TRANSIENT', 'Serviço temporariamente indisponível. Tente novamente.')
  }

  if (scenario === 'empty' && request.method === 'GET' && url.pathname === '/api/nfts') {
    return HttpResponse.json({
      items: [],
      page: 1,
      pageSize: 9,
      total: 0,
      facets: { categories: [], networks: [] },
      priceRange: { min: '0', max: '0' },
    })
  }
})