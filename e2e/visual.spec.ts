import type { Page } from '@playwright/test'
import { expect, gotoApp, loginAs, test, TOKEN_KEY } from './fixtures'

/**
 * Regressão visual das telas do Figma (Início, Detalhe, Carrinho, Pagamento), nos projetos desktop e mobile.
 *
 * Dados estáveis: cada teste roda num contexto novo, então o mock começa no estado inicial (seed) e no
 * cenário "default"; o reducedMotion do playwright.config.ts desliga o carrossel e as animações.
 * As baselines ficam em e2e/visual.spec.ts-snapshots/ (npm run test:visual -- --update-snapshots).
 * Os testes levam a tag @visual: `test:e2e` os exclui (--grep-invert) e `test:visual` roda só eles.
 */

// carrinho fixo: três NFTs, sempre pela edição aberta (sem limite de estoque)
const CART = [
  { nftId: 'emerald-ape-042', quantity: 2 },
  { nftId: 'violet-nomad-314', quantity: 6 },
  { nftId: 'ivory-baron-088', quantity: 9 },
]

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

async function seedCart(page: Page) {
  for (const { nftId, quantity } of CART) {
    const nft = await api<{ editions: { id: string; kind: string }[] }>(page, 'GET', `/api/nfts/${nftId}`)
    const edition = nft.editions.find((e) => e.kind === 'open')
    if (!edition) throw new Error(`${nftId} não tem edição aberta`)
    await api(page, 'POST', '/api/cart/items', { nftId, editionId: edition.id, quantity })
  }
}

/** Espera fonte e imagens: a captura de página inteira não rola, então as imagens "lazy" são forçadas a carregar. */
async function settle(page: Page) {
  await page.evaluate(async () => {
    document.querySelectorAll('img[loading="lazy"]').forEach((img) => img.setAttribute('loading', 'eager'))
    await document.fonts.ready
    await Promise.all(
      [...document.images].map((img) =>
        img.complete ? undefined : new Promise((resolve) => img.addEventListener('load', resolve, { once: true })),
      ),
    )
  })
}

async function expectScreenshot(page: Page, name: string) {
  await settle(page)
  await expect(page).toHaveScreenshot(name, { fullPage: true })
}

// As baselines foram geradas no Windows (sufixo -win32): em outro SO o render de fontes difere e elas não valem.
test.skip(
  process.platform !== 'win32',
  'Baselines visuais geradas no Windows (-win32); gere as do seu SO com `npm run test:visual -- --update-snapshots`.',
)

test.describe('regressão visual', { tag: '@visual' }, () => {
  test('Início', async ({ page }) => {
    await gotoApp(page, '/')
    await expect(page.getByRole('region', { name: 'Catálogo de NFTs' }).getByRole('article')).toHaveCount(9)
    await expectScreenshot(page, 'inicio.png')
  })

  test('Detalhe (emerald-ape-042)', async ({ page }) => {
    await gotoApp(page, '/nft/emerald-ape-042')
    await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
    // a seção "Mais desta coleção" carrega depois do NFT
    await expect(page.getByRole('list', { name: 'NFTs da coleção' }).getByRole('article').first()).toBeVisible()
    await expectScreenshot(page, 'detalhe.png')
  })

  test('Carrinho (itens fixos)', async ({ page, isMobile }) => {
    await gotoApp(page, '/')
    await loginAs(page, 'ana')
    await seedCart(page)
    await gotoApp(page, '/carrinho')
    await expect(page.getByRole('region', { name: 'Itens do carrinho' }).getByRole('listitem')).toHaveCount(CART.length)
    // no mobile a seção "Colecionadores também viram" não aparece no carrinho
    if (!isMobile) await expect(page.getByRole('list', { name: 'NFTs em alta' }).getByRole('article').first()).toBeVisible()
    await expectScreenshot(page, 'carrinho.png')
  })

  test('Pagamento', async ({ page }) => {
    await gotoApp(page, '/')
    await loginAs(page, 'ana')
    await seedCart(page)
    await gotoApp(page, '/checkout')
    await expect(page.getByRole('button', { name: 'Revisar pedido' })).toBeVisible()
    await expect(page.getByLabel('Endereço da carteira')).toHaveValue(/^0x3fA9/)
    await expectScreenshot(page, 'pagamento.png')
  })
})
