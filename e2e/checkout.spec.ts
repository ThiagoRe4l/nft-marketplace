import { expect, gotoApp, loginAs, test, TOKEN_KEY, USERS, type UserKey } from './fixtures'
import type { Page } from '@playwright/test'

const ATTEMPT_KEY: Record<UserKey, string> = {
  ana: 'kurio-checkout-attempt:user-ana',
  bruno: 'kurio-checkout-attempt:user-bruno',
}

/** Chamada autenticada ao mock, feita de dentro da página (é onde o MSW roda). */
async function api<T = unknown>(page: Page, method: string, url: string, body?: unknown): Promise<T> {
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
async function seedCart(page: Page, items: { nftId: string; quantity: number }[]) {
  for (const { nftId, quantity } of items) {
    const nft = await api<{ editions: { id: string; kind: string }[] }>(page, 'GET', `/api/nfts/${nftId}`)
    const edition = nft.editions.find((e) => e.kind === 'open')
    if (!edition) throw new Error(`${nftId} não tem edição aberta`)
    await api(page, 'POST', '/api/cart/items', { nftId, editionId: edition.id, quantity })
  }
}

const EMERALD_APE = 'emerald-ape-042' // edição aberta: 1.19 ETH

/** Entra como o usuário, monta o carrinho e abre o checkout. */
async function openCheckout(page: Page, user: UserKey, items = [{ nftId: EMERALD_APE, quantity: 2 }]) {
  await gotoApp(page, '/')
  await loginAs(page, user)
  if (items.length) await seedCart(page, items)
  await gotoApp(page, '/checkout')
}

const reviewButton = (page: Page) => page.getByRole('button', { name: 'Revisar pedido' })
const confirmButton = (page: Page) => page.getByRole('button', { name: /^(Confirmar compra|Enviando\.\.\.)$/ })

/** Revisa o pedido e conecta a carteira: deixa o checkout pronto para confirmar. */
async function reviewAndConnect(page: Page) {
  await reviewButton(page).click()
  await expect(confirmButton(page)).toBeVisible()
  await page.getByRole('button', { name: 'Conectar carteira' }).click()
  await expect(page.getByText('Carteira conectada')).toBeVisible()
}

const STALE = 'Os valores mudaram. Revise o pedido antes de confirmar.'

test.describe('checkout: Ana (com carteira)', () => {
  test('vem preenchido com o perfil e a carteira principal; compra até o recibo', async ({ page }) => {
    await openCheckout(page, 'ana')

    // pré-preenchimento: perfil + carteira principal
    await expect(page.getByLabel('Nome de exibição')).toHaveValue('Ana Ribeiro')
    await expect(page.getByLabel(/^E-mail/)).toHaveValue('ana@kurio.dev')
    await expect(page.getByLabel('Endereço da carteira')).toHaveValue(/^0x3fA9/)
    await expect(page.getByRole('combobox', { name: /Rede/ })).toContainText('Ethereum')
    await expect(page.getByRole('radio', { name: /Principal — MetaMask/ })).toBeChecked()

    // antes da revisão: resumo do carrinho (2 × 1.19 + 0.016 de taxa)
    await expect(page.getByRole('list').getByText('Emerald Ape #042')).toBeVisible()
    await expect(page.getByRole('definition').filter({ hasText: '2.396 ETH' })).toBeVisible()

    await reviewButton(page).click()
    // sem carteira conectada, o Confirmar não habilita
    await expect(confirmButton(page)).toBeDisabled()
    await page.getByRole('button', { name: 'Conectar carteira' }).click()
    await expect(page.getByText('Carteira conectada')).toBeVisible()
    await expect(confirmButton(page)).toBeEnabled()

    // Desconectar volta ao estado inicial e desabilita o Confirmar de novo
    await page.getByRole('button', { name: 'Desconectar' }).click()
    await expect(page.getByRole('button', { name: 'Conectar carteira' })).toBeVisible()
    await expect(confirmButton(page)).toBeDisabled()
    await page.getByRole('button', { name: 'Conectar carteira' }).click()
    await expect(confirmButton(page)).toBeEnabled()

    await confirmButton(page).click()
    await expect(page).toHaveURL(/\/pedidos\/[\w-]+$/)
    await expect(page.getByText('Aguardando confirmação da rede...')).toBeVisible()

    // o pagamento é decidido em ~3 s
    await expect(page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })).toBeVisible({
      timeout: 15_000,
    })
    const receipt = page.getByRole('article')
    await expect(receipt.getByText('Emerald Ape #042')).toBeVisible()
    await expect(receipt.getByText('(x 2)')).toBeVisible()
    await expect(receipt.getByText('2.38 ETH')).toBeVisible() // subtotal da linha
    await expect(receipt.getByText('0.016 ETH')).toBeVisible() // taxa de rede
    await expect(receipt.getByText('MetaMask')).toBeVisible()
    await expect(receipt.getByText(/^0x[0-9a-f]{4}…[0-9a-f]{4}$/)).toBeVisible() // hash truncado

    const explorer = receipt.getByRole('link', { name: /Ver no Etherscan/ })
    await expect(explorer).toHaveAttribute('target', '_blank')
    await expect(explorer).toHaveAttribute('rel', 'noopener noreferrer')
    await expect(receipt.getByText(/simulada/)).toBeVisible()

    // pedido terminal: a tentativa guardada foi encerrada
    expect(await page.evaluate((key) => localStorage.getItem(key), ATTEMPT_KEY.ana)).toBeNull()
  })

  test('mostra "Enviando..." e desabilita o botão enquanto o pedido é criado', async ({ page, mock }) => {
    test.setTimeout(60_000)
    await openCheckout(page, 'ana')
    await reviewAndConnect(page)

    await mock.scenario('slow') // 2,5 s por requisição
    await confirmButton(page).click()
    const sending = page.getByRole('button', { name: 'Enviando...' })
    await expect(sending).toBeVisible()
    await expect(sending).toBeDisabled()
    await expect(page).toHaveURL(/\/pedidos\//, { timeout: 15_000 })
  })

  test('order-timeout: o reenvio recupera o MESMO pedido e o usuário chega ao recibo', async ({ page, mock }) => {
    test.setTimeout(90_000)
    await openCheckout(page, 'ana')
    await reviewAndConnect(page)
    await mock.scenario('order-timeout') // o pedido nasce, mas a resposta passa do timeout de 10 s

    const posts: { key: string | undefined }[] = []
    page.on('request', (request) => {
      if (request.method() === 'POST' && new URL(request.url()).pathname === '/api/orders') {
        posts.push({ key: request.headers()['idempotency-key'] })
      }
    })

    await confirmButton(page).click()
    // o pedido é confirmado durante a espera, o carrinho esvazia e o fluxo é desmontado:
    // o usuário nunca deve ver "carrinho vazio", e sim chegar ao pedido
    await expect(page.getByText('Seu carrinho está vazio')).toHaveCount(0)
    await expect(page).toHaveURL(/\/pedidos\/[\w-]+$/, { timeout: 45_000 })
    const orderId = new URL(page.url()).pathname.split('/').pop()
    await expect(page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })).toBeVisible({
      timeout: 20_000,
    })

    expect(posts).toHaveLength(2)
    expect(posts[0].key).toBeTruthy()
    expect(posts[1].key).toBe(posts[0].key)

    // o pedido da URL é o que o reenvio recuperou: a tentativa guardada aponta para ele (e termina com o recibo)
    expect(orderId).toBeTruthy()
    expect(await api<{ id: string }>(page, 'GET', `/api/orders/${orderId}`)).toMatchObject({ id: orderId })
  })

  test('pagamento recusado: mostra o motivo e os itens continuam no carrinho', async ({ page, mock }) => {
    await openCheckout(page, 'ana')
    await mock.scenario('payment-rejected')
    await reviewAndConnect(page)
    await confirmButton(page).click()

    await expect(page.getByRole('heading', { name: 'Pagamento recusado' })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText('O pagamento foi recusado pela carteira.')).toBeVisible()
    await page.getByRole('link', { name: 'Voltar ao carrinho' }).click()
    await expect(page).toHaveURL(/\/carrinho$/)
    await expect(page.getByRole('region', { name: 'Itens do carrinho' }).getByText('Emerald Ape #042')).toBeVisible()
  })

  test('carteira recusada: mostra a mensagem da API e não deixa confirmar', async ({ page, mock }) => {
    await openCheckout(page, 'ana')
    await mock.scenario('wallet-rejected')
    await reviewButton(page).click()
    await page.getByRole('button', { name: 'Conectar carteira' }).click()

    await expect(page.getByRole('alert').filter({ hasText: 'A conexão com a carteira foi recusada.' })).toBeVisible()
    await expect(confirmButton(page)).toBeDisabled()
  })

  test('valida os campos obrigatórios antes de criar a cotação', async ({ page }) => {
    await openCheckout(page, 'ana')
    await page.getByLabel('Nome de exibição').fill('')
    await page.getByLabel(/^E-mail/).fill('isso-nao-e-email')
    await reviewButton(page).click()

    await expect(page.getByText('Obrigatório')).toBeVisible()
    await expect(page.getByText('E-mail inválido')).toBeVisible()
    await expect(reviewButton(page)).toBeVisible() // continua sem cotação
  })

  test('cotação desatualizada: avisa, bloqueia o Confirmar e libera com "Atualizar cotação"', async ({
    page,
    mock,
  }) => {
    await openCheckout(page, 'ana')
    await reviewAndConnect(page)
    await expect(confirmButton(page)).toBeEnabled()

    // o preço muda no servidor depois da cotação
    await mock.patchEdition(EMERALD_APE, `${EMERALD_APE}-aberta`, { price: '1.29' })
    const alert = page.getByRole('alert').filter({ hasText: STALE })
    await expect(alert).toBeVisible()
    await expect(confirmButton(page)).toBeDisabled()

    await alert.getByRole('button', { name: 'Atualizar cotação' }).click()
    await expect(alert).toBeHidden()
    await expect(page.getByRole('definition').filter({ hasText: '2.596 ETH' })).toBeVisible() // 2 × 1.29 + 0.016
    await expect(confirmButton(page)).toBeEnabled()
  })

  test('um refetch do carrinho sem mudança real não gera o aviso de valores', async ({ page, mock }) => {
    await openCheckout(page, 'ana')
    await reviewAndConnect(page)

    // mesmo preço: o evento faz o carrinho ser relido, mas nada mudou de verdade
    await mock.patchEdition(EMERALD_APE, `${EMERALD_APE}-aberta`, { price: '1.19' })
    await page.waitForTimeout(1000) // dá tempo ao refetch (não há sinal visível para esperar)
    await expect(page.getByRole('alert').filter({ hasText: STALE })).toHaveCount(0)
    await expect(confirmButton(page)).toBeEnabled()
  })

  test('escolher outra carteira preenche o formulário e desconecta a anterior', async ({ page }) => {
    await gotoApp(page, '/')
    await loginAs(page, 'ana')
    await api(page, 'PUT', '/api/wallets/secondary', {
      displayName: 'Ana Reserva',
      nickname: 'Reserva',
      profileName: 'ana_reserva',
      network: 'polygon',
      address: '0x1111111111111111111111111111111111111111',
      secondaryAddress: null,
      type: 'coinbase',
      referralCode: 'KURIO-ANA2',
      email: 'ana@kurio.dev',
      ensName: 'nova',
    })
    await seedCart(page, [{ nftId: EMERALD_APE, quantity: 1 }])
    await gotoApp(page, '/checkout')

    await reviewAndConnect(page)
    await page.getByRole('radio', { name: /Secundária — Coinbase Wallet/ }).click()

    await expect(page.getByLabel('Endereço da carteira')).toHaveValue('0x1111111111111111111111111111111111111111')
    await expect(page.getByRole('combobox', { name: /Rede/ })).toContainText('Polygon')
    await expect(page.getByRole('combobox', { name: /Tipo de carteira/ })).toContainText('Coinbase Wallet')
    // a conexão era da carteira anterior
    await expect(page.getByRole('button', { name: 'Conectar carteira' })).toBeVisible()
    await expect(confirmButton(page)).toBeDisabled()
  })

  test('sessão expirada no checkout: o login devolve o formulário como estava', async ({ page, mock }) => {
    await openCheckout(page, 'ana')
    await page.getByLabel('Nome de exibição').fill('Ana R.')
    await page.getByLabel('Observação do colecionador').fill('Entregar com carinho')

    await mock.expireSessions()
    await reviewButton(page).click() // a cotação recebe 401

    const dialog = page.getByRole('dialog')
    await expect(dialog.getByText('Sua sessão expirou')).toBeVisible()
    await dialog.getByLabel('E-mail', { exact: true }).fill(USERS.ana.email)
    await dialog.getByLabel('Senha', { exact: true }).fill(USERS.ana.password)
    await dialog.locator('button[type="submit"]').click()

    await expect(page).toHaveURL(/\/checkout/)
    await expect(page.getByLabel('Nome de exibição')).toHaveValue('Ana R.')
    await expect(page.getByLabel('Observação do colecionador')).toHaveValue('Entregar com carinho')
  })

  test('rascunho sobrevive a um refresh', async ({ page }) => {
    await openCheckout(page, 'ana')
    await page.getByLabel('Observação do colecionador').fill('Rascunho')
    await page.reload()
    await expect(page.getByLabel('Observação do colecionador')).toHaveValue('Rascunho')
  })

  test('carrinho vazio: mensagem e link para o catálogo', async ({ page }) => {
    await openCheckout(page, 'ana', [])
    await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Explorar o catálogo' })).toBeVisible()
  })
})

test.describe('checkout: retomada', () => {
  async function storeAttempt(page: Page, body: { quoteId: string; walletId: string; network: string }, orderId: string | null) {
    await page.evaluate(
      ([key, value]) => localStorage.setItem(key, value),
      [ATTEMPT_KEY.ana, JSON.stringify({ key: crypto.randomUUID(), body, orderId })],
    )
  }

  test('tentativa sem pedido (refresh no meio do envio): retoma e leva ao pedido', async ({ page }) => {
    await openCheckout(page, 'ana')
    const quote = await api<{ id: string }>(page, 'POST', '/api/quote')
    await storeAttempt(page, { quoteId: quote.id, walletId: 'wallet-ana-primary', network: 'ethereum' }, null)

    await page.reload()
    await expect(page).toHaveURL(/\/pedidos\/[\w-]+$/)
    await expect(page.getByRole('heading', { name: 'Aguardando confirmação da rede...' })).toBeVisible()
  })

  test('retomada com cotação vencida (QUOTE_STALE): volta ao fluxo normal e descarta a tentativa', async ({ page }) => {
    await openCheckout(page, 'ana')
    await storeAttempt(page, { quoteId: 'cotacao-que-nao-existe', walletId: 'wallet-ana-primary', network: 'ethereum' }, null)

    await page.reload()
    await expect(reviewButton(page)).toBeVisible()
    await expect(page.getByText('Retomando sua compra...')).toHaveCount(0)
    await expect(page.getByRole('alert')).toHaveCount(0)
    expect(await page.evaluate((key) => localStorage.getItem(key), ATTEMPT_KEY.ana)).toBeNull()
  })

  test('tentativa com pedido: oferece o link para o pedido em andamento', async ({ page }) => {
    await openCheckout(page, 'ana')
    await storeAttempt(page, { quoteId: 'q', walletId: 'wallet-ana-primary', network: 'ethereum' }, 'pedido-123')

    await page.reload()
    await expect(page.getByText('Você tem um pedido em andamento')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Acompanhar pedido' })).toHaveAttribute('href', '/pedidos/pedido-123')
  })
})

test.describe('checkout: Bruno (sem carteira)', () => {
  test('pede para cadastrar uma carteira e não deixa revisar', async ({ page }) => {
    await openCheckout(page, 'bruno')

    await expect(page.getByLabel('Nome de exibição')).toHaveValue('Bruno Costa') // perfil preenchido
    await expect(page.getByText('Cadastre uma carteira para pagar')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Cadastrar carteira' }).first()).toHaveAttribute('href', '/carteiras')
    await expect(reviewButton(page)).toBeDisabled()
  })

  test('o link leva à rota /carteiras', async ({ page }) => {
    await openCheckout(page, 'bruno')
    await page.getByRole('link', { name: 'Cadastrar carteira' }).first().click()
    await expect(page).toHaveURL(/\/carteiras$/)
    await expect(page.getByRole('heading', { name: 'Carteira principal' })).toBeVisible()
  })
})

test.describe('pedido', () => {
  test('pedido inexistente mostra "Pedido não encontrado"', async ({ page }) => {
    await gotoApp(page, '/')
    await loginAs(page, 'ana')
    await gotoApp(page, '/pedidos/nao-existe')
    await expect(page.getByRole('heading', { name: 'Pedido não encontrado' })).toBeVisible()
  })

  test('rota privada: sem sessão abre o diálogo de login', async ({ page }) => {
    await gotoApp(page, '/pedidos/qualquer')
    await expect(page).toHaveURL(/auth=login/)
    await expect(page.getByRole('dialog')).toBeVisible()
  })
})
