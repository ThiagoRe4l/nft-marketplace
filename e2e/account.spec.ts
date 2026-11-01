import type { Page } from '@playwright/test'
import { expect, gotoApp, loginAs, test, TOKEN_KEY, USERS } from './fixtures'

// PNG de 1x1 pixel
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)

async function openAs(page: Page, user: 'ana' | 'bruno', path: string) {
  await gotoApp(page, '/')
  await loginAs(page, user)
  await gotoApp(page, path)
}

const profileForm = (page: Page) => page.getByRole('form', { name: 'Dados do perfil' })
const passwordForm = (page: Page) => page.getByRole('form', { name: 'Alterar senha' })
const walletForm = (page: Page, slot: 'principal' | 'secundária') =>
  page.getByRole('form', { name: `Carteira ${slot}` })
const walletSection = (page: Page, slot: 'principal' | 'secundária') =>
  page.getByRole('region', { name: `Carteira ${slot}` })
const avatarInput = (page: Page) => page.locator('input[type="file"]')

test.describe('perfil', () => {
  test('rota privada e menu da conta', async ({ page }) => {
    await gotoApp(page, '/perfil')
    await expect(page).toHaveURL(/auth=login/)

    await openAs(page, 'ana', '/perfil')
    const nav = page.getByRole('main').getByRole('navigation', { name: 'Meu perfil' })
    await expect(nav.getByRole('link', { name: 'Dados do perfil' })).toHaveAttribute('aria-current', 'page')
    await nav.getByRole('link', { name: 'Carteiras' }).click()
    await expect(page).toHaveURL(/\/carteiras$/)
    await expect(nav.getByRole('link', { name: 'Carteiras' })).toHaveAttribute('aria-current', 'page')

    await nav.getByRole('button', { name: 'Atividade' }).click()
    await expect(page.getByText('Disponível em breve nesta demonstração')).toBeVisible()
  })

  test('Sair encerra a sessão', async ({ page }) => {
    await openAs(page, 'ana', '/perfil')
    await page.getByRole('main').getByRole('button', { name: 'Sair' }).click()
    await expect(page).toHaveURL(/\/$/)
    await gotoApp(page, '/perfil')
    await expect(page).toHaveURL(/auth=login/)
  })

  test('edita o perfil e confere após o refresh', async ({ page }, testInfo) => {
    await openAs(page, 'ana', '/perfil')
    const form = profileForm(page)
    await expect(form.getByLabel('Nome de exibição')).toHaveValue('Ana Ribeiro')

    await form.getByLabel('Nome de exibição').fill('Ana Nova')
    await form.getByLabel('Nome de usuário').fill('ana_nova')
    await form.getByLabel('Nome ENS').fill('ananova')
    await form.getByLabel('Apelido da carteira').fill('Cofre novo')
    await form.getByRole('button', { name: 'Salvar dados' }).click()
    await expect(page.getByText('Dados do perfil salvos')).toBeVisible()
    if (testInfo.project.name === 'desktop') {
      await expect(page.getByRole('button', { name: 'Menu de Ana Nova' })).toBeVisible() // Header na hora
    }

    await page.reload()
    await expect(form.getByLabel('Nome de exibição')).toHaveValue('Ana Nova')
    await expect(form.getByLabel('Nome de usuário')).toHaveValue('ana_nova')
    await expect(form.getByLabel('Nome ENS')).toHaveValue('ananova')
    await expect(form.getByLabel('Apelido da carteira')).toHaveValue('Cofre novo')
  })

  test('validação no cliente foca o primeiro campo com erro', async ({ page }) => {
    await openAs(page, 'ana', '/perfil')
    const form = profileForm(page)
    await form.getByLabel('Nome de usuário').fill('ab')
    await form.getByLabel('E-mail').fill('invalido')
    await form.getByRole('button', { name: 'Salvar dados' }).click()
    const username = form.getByLabel('Nome de usuário')
    await expect(username).toHaveAttribute('aria-invalid', 'true')
    await expect(username).toHaveAccessibleDescription('Mínimo de 3 caracteres')
    await expect(username).toBeFocused()
  })

  test('e-mail em uso mostra o conflito no campo', async ({ page }) => {
    await openAs(page, 'ana', '/perfil')
    const form = profileForm(page)
    await form.getByLabel('E-mail').fill(USERS.bruno.email)
    await form.getByRole('button', { name: 'Salvar dados' }).click()
    const email = form.getByLabel('E-mail')
    await expect(email).toHaveAttribute('aria-invalid', 'true')
    await expect(email).toHaveAccessibleDescription('Este e-mail já está cadastrado')
    await expect(email).toBeFocused()
  })

  test('avatar: envia, mostra a prévia, remove', async ({ page }, testInfo) => {
    await openAs(page, 'ana', '/perfil')
    await avatarInput(page).setInputFiles({ name: 'avatar.png', mimeType: 'image/png', buffer: PNG })
    await expect(page.getByText('Avatar atualizado')).toBeVisible()
    await expect(page.getByRole('img', { name: 'Prévia do avatar' })).toBeVisible()
    if (testInfo.project.name === 'desktop') {
      await expect(page.getByRole('button', { name: 'Menu de Ana Ribeiro' }).locator('img')).toBeVisible()
    }

    await page.getByRole('button', { name: 'Remover' }).click()
    await expect(page.getByText('Avatar removido')).toBeVisible()
    await expect(page.getByRole('img', { name: 'Prévia do avatar' })).toHaveCount(0)
  })

  test('avatar inválido: não é imagem e passa de 2 MB', async ({ page }) => {
    await openAs(page, 'ana', '/perfil')
    await avatarInput(page).setInputFiles({ name: 'nota.txt', mimeType: 'text/plain', buffer: Buffer.from('oi') })
    await expect(page.getByRole('alert').filter({ hasText: 'O arquivo precisa ser uma imagem' })).toBeVisible()

    await avatarInput(page).setInputFiles({
      name: 'grande.png',
      mimeType: 'image/png',
      buffer: Buffer.alloc(2 * 1024 * 1024 + 1),
    })
    await expect(page.getByRole('alert').filter({ hasText: 'no máximo 2 MB' })).toBeVisible()
    await expect(page.getByRole('img', { name: 'Prévia do avatar' })).toHaveCount(0)
  })

  test('senha atual errada aparece no campo', async ({ page }) => {
    await openAs(page, 'ana', '/perfil')
    const form = passwordForm(page)
    await form.getByLabel('Senha atual').fill('senha-errada')
    await form.getByLabel(/^Nova senha/).fill('novasenha99')
    await form.getByLabel('Confirmar nova senha').fill('novasenha99')
    await form.getByRole('button', { name: 'Alterar senha' }).click()
    const current = form.getByLabel('Senha atual')
    await expect(current).toHaveAttribute('aria-invalid', 'true')
    await expect(current).toHaveAccessibleDescription('Senha atual incorreta')
    await expect(current).toBeFocused()
  })

  test('troca a senha e entra com a nova', async ({ page }) => {
    await openAs(page, 'ana', '/perfil')
    const form = passwordForm(page)
    await form.getByLabel('Senha atual').fill(USERS.ana.password)
    await form.getByLabel(/^Nova senha/).fill('novasenha99')
    await form.getByLabel('Confirmar nova senha').fill('divergente99')
    await form.getByRole('button', { name: 'Alterar senha' }).click()
    await expect(form.getByLabel('Confirmar nova senha')).toHaveAccessibleDescription('As senhas não conferem')

    await form.getByLabel('Confirmar nova senha').fill('novasenha99')
    await form.getByRole('button', { name: 'Alterar senha' }).click()
    await expect(page.getByText('Senha alterada')).toBeVisible()
    await expect(form.getByLabel('Senha atual')).toHaveValue('')

    const status = await page.evaluate(async (email) => {
      const login = (password: string) =>
        fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        }).then((r) => r.status)
      return { novaSenha: await login('novasenha99'), senhaAntiga: await login('kurio1234') }
    }, USERS.ana.email)
    expect(status.novaSenha).toBe(200)
    expect(status.senhaAntiga).not.toBe(200)
  })
})

test.describe('carteiras', () => {
  test('Ana: principal preenchida para edição, secundária vazia', async ({ page }) => {
    await openAs(page, 'ana', '/carteiras')
    const main = walletForm(page, 'principal')
    await expect(main.getByLabel('Apelido da carteira')).toHaveValue('Cofre principal')
    await expect(main.getByLabel('Endereço da carteira')).toHaveValue(/^0x3fA9/)
    // com carteira, o formulário de edição já está visível: sem "Adicionar"
    await expect(walletSection(page, 'principal').getByRole('button', { name: 'Adicionar' })).toHaveCount(0)
    await expect(page.getByText('Você ainda não adicionou uma carteira secundária')).toBeVisible()
  })

  test('Ana cadastra a carteira secundária copiando a principal e depois edita', async ({ page }) => {
    await openAs(page, 'ana', '/carteiras')
    await walletSection(page, 'secundária').getByRole('button', { name: 'Adicionar' }).click()
    const second = walletForm(page, 'secundária')
    await expect(second).toBeVisible()

    await page.getByRole('checkbox', { name: 'Igual à carteira principal' }).check()
    await expect(second.getByLabel('Apelido da carteira')).toHaveValue('Cofre principal')
    await expect(second.getByLabel('Endereço da carteira')).toHaveValue(/^0x3fA9/)

    await second.getByLabel('Apelido da carteira').fill('Cofre reserva')
    await second.getByRole('button', { name: 'Salvar carteira' }).click()
    await expect(page.getByText('Carteira secundária salva')).toBeVisible()

    await page.reload()
    await expect(walletForm(page, 'secundária').getByLabel('Apelido da carteira')).toHaveValue('Cofre reserva')
    await expect(page.getByText('Você ainda não adicionou uma carteira secundária')).toHaveCount(0)
  })

  test('endereço inválido para a rede mostra o erro e foca o campo', async ({ page }) => {
    await openAs(page, 'ana', '/carteiras')
    const main = walletForm(page, 'principal')
    await main.getByLabel('Endereço da carteira').fill('0x123')
    await main.getByRole('button', { name: 'Salvar carteira' }).click()
    const address = main.getByLabel('Endereço da carteira')
    await expect(address).toHaveAttribute('aria-invalid', 'true')
    await expect(address).toHaveAccessibleDescription('Endereço inválido para a rede')
    await expect(address).toBeFocused()
  })

  test('Bruno cadastra a primeira carteira e consegue revisar o pedido', async ({ page }) => {
    await openAs(page, 'bruno', '/carteiras')
    await expect(page.getByText('Você ainda não adicionou uma carteira principal')).toBeVisible()
    await walletSection(page, 'principal').getByRole('button', { name: 'Adicionar' }).click()

    const main = walletForm(page, 'principal')
    await main.getByLabel('Nome de exibição').fill('Bruno Costa')
    await main.getByLabel('Apelido da carteira').fill('Cofre do Bruno')
    await main.getByRole('combobox', { name: 'Rede' }).click()
    await page.getByRole('option', { name: 'Ethereum' }).click()
    await main.getByLabel('Nome do perfil').fill('bruno_nft')
    await main.getByLabel('Endereço da carteira').fill('0x4B1d9e6A2c7F3b85D0a1E9c4F6b2A8d3C5e7F901')
    await main.getByRole('combobox', { name: 'Tipo de carteira' }).click()
    await page.getByRole('option', { name: 'MetaMask' }).click()
    await main.getByLabel('Código de indicação').fill('KURIO-BRU')
    await main.getByLabel('E-mail').fill('bruno@kurio.dev')
    await main.getByLabel('Nome ENS').fill('brunocosta')
    await main.getByRole('button', { name: 'Salvar carteira' }).click()
    await expect(page.getByText('Carteira principal salva')).toBeVisible()

    // carrinho com uma edição aberta, pelo mesmo caminho do checkout.spec
    const added = await page.evaluate(async (tokenKey) => {
      const nft = await (await fetch('/api/nfts/emerald-ape-042')).json()
      const edition = nft.editions.find((e: { kind: string }) => e.kind === 'open')
      const response = await fetch('/api/cart/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem(tokenKey)}`,
        },
        body: JSON.stringify({ nftId: 'emerald-ape-042', editionId: edition.id, quantity: 1 }),
      })
      return response.ok
    }, TOKEN_KEY)
    expect(added).toBe(true)

    await gotoApp(page, '/checkout')
    await expect(page.getByText('Cadastre uma carteira para pagar')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Revisar pedido' })).toBeEnabled()
  })
})
