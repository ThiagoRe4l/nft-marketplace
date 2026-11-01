import type { Page } from '@playwright/test'
import { expect, gotoApp, loginAs, test, TOKEN_KEY } from './fixtures'

/**
 * Comportamento das telas ajustadas ao Figma (desktop): filtros sem checkbox, miniaturas de edição,
 * limite de quantidade, pontos dos carrosséis, cupom no pagamento e linha do header.
 */
test.skip(({ isMobile }) => isMobile, 'telas de desktop (o mobile tem outro layout)')

async function addToCart(page: Page, nftId: string, quantity: number) {
  await page.evaluate(
    async ({ nftId, quantity, tokenKey }) => {
      const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem(tokenKey)}` }
      const nft = await (await fetch(`/api/nfts/${nftId}`)).json()
      const edition = nft.editions.find((e: { kind: string }) => e.kind === 'open')
      await fetch('/api/cart/items', {
        method: 'POST',
        headers,
        body: JSON.stringify({ nftId, editionId: edition.id, quantity }),
      })
    },
    { nftId, quantity, tokenKey: TOKEN_KEY },
  )
}

test.describe('Início', () => {
  test('filtros são botões com aria-pressed e a seleção é múltipla', async ({ page }) => {
    await gotoApp(page, '/')
    const filters = page.getByRole('complementary', { name: 'Filtros' })
    await expect(filters.getByRole('checkbox')).toHaveCount(0)

    const art = filters.getByRole('button', { name: /^Arte digital/ })
    const photo = filters.getByRole('button', { name: /^Fotografia/ })
    await expect(art).toHaveAttribute('aria-pressed', 'false')

    await art.click()
    await photo.click()
    await expect(art).toHaveAttribute('aria-pressed', 'true')
    await expect(photo).toHaveAttribute('aria-pressed', 'true')
    await expect(page).toHaveURL(/category/)

    await art.click()
    await expect(art).toHaveAttribute('aria-pressed', 'false')
    await expect(photo).toHaveAttribute('aria-pressed', 'true')
  })

  test('a linha do header existe aqui e some nas telas do Mercado', async ({ page }) => {
    const divider = page.locator('header .h-px')
    await gotoApp(page, '/')
    await expect(divider).toBeVisible()
    await gotoApp(page, '/nft/emerald-ape-042')
    await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
    await expect(divider).toHaveCount(0)
    await gotoApp(page, '/carrinho')
    await expect(divider).toHaveCount(0)
  })

  test('os pontos do hero são botões que trocam o slide', async ({ page }) => {
    await gotoApp(page, '/')
    const dots = page.getByRole('region', { name: 'Destaques' }).getByRole('button', { name: /^Ir para o slide/ })
    await expect(dots.first()).toBeVisible()
    await dots.nth(1).click()
    await expect(dots.nth(1)).toHaveAttribute('aria-current', 'true')
    await expect(dots.first()).toHaveAttribute('aria-current', 'false')
  })
})

test.describe('Detalhe', () => {
  test('miniaturas escolhem a edição, em sincronia com os botões e o preço', async ({ page }) => {
    await gotoApp(page, '/nft/emerald-ape-042')
    const thumbs = page.getByRole('list', { name: 'Selecionar edição' }).getByRole('button')
    await expect(thumbs).toHaveCount(4) // uma por edição

    const image = page.getByRole('img', { name: 'Emerald Ape #042' }).first()
    const src = await image.getAttribute('src')

    const limited = page.getByRole('button', { name: /^Edição 1\/50,/ })
    await limited.click()
    await expect(limited).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByRole('radio', { name: '1/50' })).toBeChecked()
    await expect(image).toHaveAttribute('src', src!) // a imagem central não muda

    const price = (await limited.getAttribute('aria-label'))!.split(', ')[1]
    await expect(page.getByText(price, { exact: true }).first()).toBeVisible()

    // e o caminho inverso: os botões de edição movem as miniaturas
    await page.getByRole('radio', { name: 'ABERTA' }).click()
    await expect(page.getByRole('button', { name: /^Edição ABERTA,/ })).toHaveAttribute('aria-pressed', 'true')
    await expect(limited).toHaveAttribute('aria-pressed', 'false')
  })

  test('o texto de limite só aparece ao chegar no máximo', async ({ page }) => {
    await gotoApp(page, '/nft/emerald-ape-042')
    const more = page.getByRole('button', { name: 'Aumentar quantidade' })
    const hint = page.getByText(/^Máximo de \d+ por pedido$/)
    await expect(more).toBeEnabled()
    await expect(hint).toHaveCount(0)

    while (await more.isEnabled()) await more.click()
    await expect(hint).toBeVisible()

    await page.getByRole('button', { name: 'Diminuir quantidade' }).click()
    await expect(hint).toHaveCount(0)
  })

  test('ordem: sobre o NFT acima da compra; Rede, Contrato e Direitos autorais nas abas', async ({ page }) => {
    await gotoApp(page, '/nft/emerald-ape-042')
    const about = page.getByRole('heading', { name: 'Sobre este NFT:' })
    const buy = page.getByRole('button', { name: 'Comprar', exact: true })
    await expect(about).toBeVisible()
    expect((await about.boundingBox())!.y).toBeLessThan((await buy.boundingBox())!.y)

    const panel = page.getByRole('tabpanel')
    await expect(panel.getByRole('term')).toHaveText(['Rede:', 'Contrato:', 'Direitos autorais:'])
    await expect(panel.getByRole('definition').nth(1)).toHaveText(/^0x[0-9A-Fa-f]{4}\.\.\.[0-9A-Fa-f]{4}$/) // Contrato
    await expect(panel.getByRole('definition').nth(2)).toContainText('nas vendas secundárias') // Direitos autorais
  })
})

test.describe('Carrinho', () => {
  test('a edição some da linha mas fica no nome acessível; pontos do carrossel navegam', async ({ page }) => {
    await gotoApp(page, '/')
    await loginAs(page, 'ana')
    await addToCart(page, 'emerald-ape-042', 2)
    await gotoApp(page, '/carrinho')

    const line = page.getByRole('region', { name: 'Itens do carrinho' }).getByRole('listitem').first()
    await expect(line.getByRole('link', { name: /^Emerald Ape #042 \(edição \S+\)$/ })).toBeVisible()
    await expect(line.getByText('Edição:')).toHaveCount(0)

    await expect(page.getByRole('list', { name: 'NFTs em alta' }).getByRole('article').first()).toBeVisible()
    const dots = page.getByRole('group', { name: /^Páginas de/ }).getByRole('button')
    await expect(dots.nth(1)).toBeVisible()
    await expect(dots.first()).toHaveAttribute('aria-current', 'true')
    await dots.nth(1).click()
    await expect(dots.nth(1)).toHaveAttribute('aria-current', 'true')
    await expect(dots.first()).not.toHaveAttribute('aria-current', 'true')
  })
})

test.describe('Pagamento', () => {
  test('rótulos e total como no Figma; cupom abre o mesmo formulário e muda o carrinho', async ({ page }) => {
    await gotoApp(page, '/')
    await loginAs(page, 'ana')
    await addToCart(page, 'emerald-ape-042', 2)
    await gotoApp(page, '/checkout')

    await expect(page.getByText('Estimativa do carrinho')).toHaveCount(0)
    await expect(page.getByText('Taxa estimada')).toBeVisible()
    await expect(page.locator('label', { hasText: 'Endereço da carteira' })).toBeVisible() // rótulo visível, não só o placeholder

    await page.getByRole('button', { name: /Tem um código promocional/ }).click()
    await page.getByLabel('Código promocional').fill('KURIO10')
    await page.getByRole('button', { name: 'Aplicar' }).click()
    await expect(page.getByText('Cupom aplicado:')).toBeVisible()
    await expect(page).toHaveURL(/checkout/) // Aplicar não envia o formulário do pagamento

    await page.getByRole('button', { name: 'Remover cupom' }).click()
    await expect(page.getByLabel('Código promocional')).toBeVisible()
  })

  test('cupom aplicado depois da revisão marca a cotação como desatualizada', async ({ page }) => {
    await gotoApp(page, '/')
    await loginAs(page, 'ana')
    await addToCart(page, 'emerald-ape-042', 2)
    await gotoApp(page, '/checkout')

    await page.getByRole('button', { name: 'Revisar pedido' }).click()
    await expect(page.getByRole('button', { name: /^Confirmar compra$/ })).toBeVisible()
    await page.getByRole('button', { name: /Tem um código promocional/ }).click()
    await page.getByLabel('Código promocional').fill('KURIO10')
    await page.getByRole('button', { name: 'Aplicar' }).click()
    await expect(page.getByRole('alert').filter({ hasText: 'Os valores mudaram' })).toBeVisible()
  })
})
