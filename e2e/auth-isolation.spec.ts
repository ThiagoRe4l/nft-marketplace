import type { Page } from '@playwright/test'
import { api, expect, gotoApp, loginAs, seedCart, test, TOKEN_KEY, USERS } from './fixtures'

const EMERALD = 'emerald-ape-042'

/** Preenche e envia o diálogo de login (como o usuário faria), na página atual. */
async function loginThroughDialog(page: Page, email: string, password: string) {
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('E-mail', { exact: true }).fill(email)
  await dialog.getByLabel('Senha', { exact: true }).fill(password)
  await dialog.locator('button[type="submit"]').click()
  return dialog
}

/** Cria um pedido (pendente) da Ana pela API: cotação + POST /orders com Idempotency-Key. */
async function createOrder(page: Page): Promise<string> {
  const quote = await api<{ id: string }>(page, 'POST', '/api/quote')
  return page.evaluate(
    async ({ quoteId, tokenKey }) => {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': crypto.randomUUID(),
          Authorization: `Bearer ${localStorage.getItem(tokenKey)}`,
        },
        body: JSON.stringify({ quoteId, walletId: 'wallet-ana-primary', network: 'ethereum' }),
      })
      if (!response.ok) throw new Error(`POST /api/orders -> ${response.status}`)
      return ((await response.json()) as { id: string }).id
    },
    { quoteId: quote.id, tokenKey: TOKEN_KEY },
  )
}

/** Sai pelo botão "Sair" da página de perfil e espera voltar à Início como visitante. */
async function logoutThroughProfile(page: Page) {
  await gotoApp(page, '/perfil')
  await page.getByRole('main').getByRole('button', { name: 'Sair' }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('link', { name: 'Carrinho, vazio' })).toBeVisible()
}

test.describe('isolamento entre usuários', () => {
  test('Bruno, depois da Ana, não vê favoritos, carrinho, perfil nem pedido dela', async ({ page }) => {
    // --- Ana monta tudo o que é privado ---
    await gotoApp(page, '/')
    await loginAs(page, 'ana')
    await api(page, 'PUT', `/api/favorites/${EMERALD}`)
    await seedCart(page, [{ nftId: EMERALD, quantity: 1 }])
    const orderId = await createOrder(page)
    await seedCart(page, [{ nftId: EMERALD, quantity: 2 }]) // o pedido esvazia o carrinho; põe de novo

    await gotoApp(page, '/')
    await expect(page.getByRole('button', { name: 'Remover Emerald Ape #042 dos favoritos' }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: /^Carrinho(?!, vazio)/ })).toBeVisible()
    await gotoApp(page, `/pedidos/${orderId}`)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    // --- logout e entrada do Bruno pelo diálogo ---
    await logoutThroughProfile(page)
    await gotoApp(page, '/?auth=login')
    await loginThroughDialog(page, USERS.bruno.email, USERS.bruno.password)
    await expect(page.getByRole('dialog')).toBeHidden()

    // favoritos
    await expect(page.getByRole('button', { name: 'Favoritar Emerald Ape #042' }).first()).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    await expect(page.getByRole('button', { name: /^Remover .* dos favoritos$/ })).toHaveCount(0)
    // carrinho
    await expect(page.getByRole('link', { name: 'Carrinho, vazio' })).toBeVisible()
    await gotoApp(page, '/carrinho')
    await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible()
    // perfil
    await gotoApp(page, '/perfil')
    await expect(page.getByRole('form', { name: 'Dados do perfil' }).getByLabel('Nome de exibição')).toHaveValue(
      USERS.bruno.displayName,
    )
    // pedido da Ana por URL: não existe para o Bruno
    await gotoApp(page, `/pedidos/${orderId}`)
    await expect(page.getByRole('heading', { name: 'Pedido não encontrado' })).toBeVisible()
  })

  test('troca de usuário sem recarregar a aplicação: o cache da Ana não aparece para o Bruno', async ({ page, isMobile }) => {
    await gotoApp(page, '/')
    await loginAs(page, 'ana')
    await api(page, 'PUT', `/api/favorites/${EMERALD}`)
    await seedCart(page, [{ nftId: EMERALD, quantity: 1 }])
    await gotoApp(page, '/')
    await expect(page.getByRole('button', { name: 'Remover Emerald Ape #042 dos favoritos' }).first()).toBeVisible()

    // logout e login do Bruno só com navegação de cliente (sem reload): o cache em memória tem de ter sido limpo
    await logoutThroughProfile(page)
    if (isMobile) await page.getByRole('button', { name: 'Abrir menu' }).click()
    await page.getByRole('button', { name: 'Entrar' }).click()
    await loginThroughDialog(page, USERS.bruno.email, USERS.bruno.password)
    await expect(page.getByRole('dialog')).toBeHidden()

    await expect(page.getByRole('button', { name: 'Favoritar Emerald Ape #042' }).first()).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    await expect(page.getByRole('link', { name: 'Carrinho, vazio' })).toBeVisible()
  })
})

test.describe('autenticação', () => {
  test('cadastro novo: cria a conta e já entra', async ({ page }) => {
    await gotoApp(page, '/?auth=signup')
    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('Nome de usuário').fill('carla_nova')
    await dialog.getByLabel('E-mail', { exact: true }).fill('carla@kurio.dev')
    await dialog.getByLabel('Senha', { exact: true }).fill('kurio9999')
    await dialog.getByLabel('Confirmar senha').fill('kurio9999')
    await dialog.locator('button[type="submit"]').click()

    await expect(page.getByText('Bem-vindo(a), carla_nova')).toBeVisible()
    await expect(dialog).toBeHidden()

    await gotoApp(page, '/perfil')
    await expect(page.getByRole('form', { name: 'Dados do perfil' }).getByLabel('E-mail')).toHaveValue(
      'carla@kurio.dev',
    )
  })

  test('cadastro com e-mail já usado mostra o erro no campo', async ({ page }) => {
    await gotoApp(page, '/?auth=signup')
    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('Nome de usuário').fill('outra_ana')
    await dialog.getByLabel('E-mail', { exact: true }).fill(USERS.ana.email)
    await dialog.getByLabel('Senha', { exact: true }).fill('kurio9999')
    await dialog.getByLabel('Confirmar senha').fill('kurio9999')
    await dialog.locator('button[type="submit"]').click()
    await expect(dialog.getByLabel('E-mail', { exact: true })).toHaveAccessibleDescription(
      'Este e-mail já está cadastrado',
    )
  })

  test('senha errada e e-mail desconhecido recebem a mesma mensagem genérica', async ({ page }) => {
    await gotoApp(page, '/?auth=login')
    const dialog = await loginThroughDialog(page, USERS.ana.email, 'senha-errada-123')
    const alert = dialog.getByRole('alert')
    await expect(alert).toHaveText('E-mail ou senha incorretos')
    await expect(dialog).toBeVisible() // continua no diálogo, sem sessão

    await dialog.getByLabel('E-mail', { exact: true }).fill('ninguem@kurio.dev')
    await dialog.locator('button[type="submit"]').click()
    await expect(alert).toHaveText('E-mail ou senha incorretos') // não revela se o e-mail existe
    await expect(page).toHaveURL(/auth=login/)
  })

  test('sessão expirada durante a navegação: aviso no diálogo e, ao entrar, volta à mesma página', async ({
    page,
    mock,
  }) => {
    await gotoApp(page, '/')
    await loginAs(page, 'ana')
    await gotoApp(page, `/nft/${EMERALD}`)
    await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
    // a página termina de montar (a seção da coleção chega depois do NFT) antes de agir
    await expect(page.getByRole('list', { name: 'NFTs da coleção' }).getByRole('article').first()).toBeVisible()

    await mock.expireSessions()
    await page.getByRole('button', { name: 'Favoritar', exact: true }).click() // chamada autenticada → 401

    const dialog = page.getByRole('dialog')
    await expect(dialog.getByText('Sua sessão expirou. Entre novamente para continuar.')).toBeVisible()
    await loginThroughDialog(page, USERS.ana.email, USERS.ana.password)

    await expect(dialog).toBeHidden()
    await expect(page).toHaveURL(new RegExp(`/nft/${EMERALD}$`))
    await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
  })
})
