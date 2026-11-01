import type { Page } from '@playwright/test'
import { api, expect, gotoApp, loginAs, seedCart, test } from './fixtures'

const EMERALD = 'emerald-ape-042' // edição aberta: 1.19 ETH
const EMERALD_OPEN = `${EMERALD}-aberta`

const TOAST_TEXT = /Emerald Ape #042 mudou de preço ou disponibilidade/

/** O preço da edição escolhida no detalhe (o texto não tem papel próprio). */
// (no mobile o preço fica na barra fixa do rodapé, fora do `main`)
// (o painel de desktop fica no DOM, escondido, no mobile: só o preço visível conta)
const price = (page: Page, value: string) =>
  page.getByText(`${value} ETH`, { exact: true }).locator('visible=true').first()

/**
 * Registra, dentro da página, todo valor "N ETH" que o primeiro parágrafo de preço do `main` assume.
 * Serve para provar que o preço NUNCA regrediu (sem depender de esperar um tempo fixo).
 */
async function recordPrices(page: Page) {
  await page.evaluate(() => {
    const seen: string[] = []
    ;(window as unknown as { __prices: string[] }).__prices = seen
    const read = () => {
      const node = [...document.querySelectorAll('p')].find((p) => /^\d+\.\d+ ETH$/.test(p.textContent ?? ''))
      const text = node?.textContent ?? null
      if (text && seen.at(-1) !== text) seen.push(text)
    }
    read()
    new MutationObserver(read).observe(document.body, { subtree: true, childList: true, characterData: true })
  })
}
const recordedPrices = (page: Page) =>
  page.evaluate(() => (window as unknown as { __prices: string[] }).__prices)

test.describe('tempo real', () => {
  test('replay "last": o evento duplicado é ignorado e o toast não se repete', async ({ page, mock }) => {
    await gotoApp(page, '/')
    await loginAs(page, 'ana')
    await seedCart(page, [{ nftId: EMERALD, quantity: 1 }])
    // o carrinho precisa estar no cache do app antes do evento (é de lá que o bridge decide se avisa)
    await gotoApp(page, '/')
    await expect(page.getByRole('link', { name: /^Carrinho(?!, vazio)/ })).toBeVisible()
    // a página mostra OUTRO NFT: o toast do carrinho independe da tela (navegação de cliente, o cache fica)
    const list = await api<{ items: { id: string; name: string }[] }>(page, 'GET', '/api/nfts')
    const other = list.items.find((item) => item.id !== EMERALD)! // o 1º card da Início que não está no carrinho
    await page.getByRole('link', { name: `Ver detalhes de ${other.name}` }).first().click()
    await expect(page).toHaveURL(new RegExp(`/nft/${other.id}`))
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    await mock.patchEdition(EMERALD, EMERALD_OPEN, { price: '1.29' })
    const toast = page.getByText(TOAST_TEXT)
    await expect(toast).toBeVisible()
    // o toast some sozinho; só então o replay pode ser distinguido de um aviso novo
    await expect(toast).toBeHidden({ timeout: 15_000 })

    await mock.replay('last')

    // sentinela: eventos chegam em ordem, então quando esta atualização aparece o replay já foi tratado
    const nft = (await api(page, 'GET', `/api/nfts/${other.id}`)) as { editions: { id: string }[] }
    for (const edition of nft.editions) await mock.patchEdition(other.id, edition.id, { price: '9.99' })
    await expect(price(page, '9.99')).toBeVisible()

    await expect(toast).toHaveCount(0)
  })

  test('replay "previous": um evento antigo e atrasado não faz o preço regredir', async ({ page, mock }) => {
    await gotoApp(page, `/nft/${EMERALD}`)
    await expect(price(page, '1.19')).toBeVisible()
    await recordPrices(page)

    await mock.patchEdition(EMERALD, EMERALD_OPEN, { price: '1.29' })
    await expect(price(page, '1.29')).toBeVisible()
    await mock.patchEdition(EMERALD, EMERALD_OPEN, { price: '1.39' })
    await expect(price(page, '1.39')).toBeVisible()

    await mock.replay('previous') // reenvia o evento do 1.29 com eventId novo e versão antiga

    // sentinela: o evento seguinte só chega depois do replay
    await mock.patchEdition(EMERALD, EMERALD_OPEN, { price: '1.49' })
    await expect(price(page, '1.49')).toBeVisible()

    // 1.29 aparece uma única vez: o replay não o trouxe de volta
    expect(await recordedPrices(page)).toEqual(['1.19 ETH', '1.29 ETH', '1.39 ETH', '1.49 ETH'])
  })

  test('uma mudança de preço durante a queda do socket aparece depois de reconectar', async ({ page, mock }) => {
    await gotoApp(page, `/nft/${EMERALD}`)
    await expect(price(page, '1.19')).toBeVisible()

    // o cliente só tenta reconectar após ≥ 500 ms: o evento do patch é emitido para ninguém e se perde
    await mock.disconnectRealtime()
    await mock.patchEdition(EMERALD, EMERALD_OPEN, { price: '1.55' })

    // ao reconectar, o app relê a API (fonte da verdade) e mostra o preço novo
    await expect(price(page, '1.55')).toBeVisible({ timeout: 15_000 })
    await expect(price(page, '1.19')).toHaveCount(0)
  })
})
