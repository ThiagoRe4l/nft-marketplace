import type { Page } from '@playwright/test'
import { api, expect, gotoApp, test } from './fixtures'

const catalog = (page: Page) => page.getByRole('region', { name: 'Catálogo de NFTs' })
const cards = (page: Page) => catalog(page).getByRole('article')
const tab = (page: Page, name: string) => page.getByRole('tab', { name })
const sortTrigger = (page: Page) => page.getByRole('combobox', { name: 'Ordenar por:' })

async function chooseSort(page: Page, label: string) {
  await sortTrigger(page).click()
  await page.getByRole('option', { name: label }).click()
}

test.describe('catálogo: estado na URL', () => {
  test('aba e ordenação vão para a URL, sobrevivem ao refresh e ao voltar/avançar', async ({ page }) => {
    await gotoApp(page, '/')
    await expect(cards(page)).toHaveCount(9)

    await tab(page, 'Em alta').click()
    await expect(page).toHaveURL(/tab=trending/)
    await chooseSort(page, 'Menor preço')
    await expect(page).toHaveURL(/sort=price_asc/)
    await expect(page).toHaveURL(/tab=trending/)

    // refresh: tudo continua como estava
    await page.reload()
    await expect(page).toHaveURL(/tab=trending/)
    await expect(page).toHaveURL(/sort=price_asc/)
    await expect(tab(page, 'Em alta')).toHaveAttribute('aria-selected', 'true')
    await expect(sortTrigger(page)).toContainText('Menor preço')

    // voltar desfaz a ordenação (a aba fica); avançar a refaz
    await page.goBack()
    await expect(page).not.toHaveURL(/sort=/)
    await expect(page).toHaveURL(/tab=trending/)
    await expect(sortTrigger(page)).toContainText('Listados recentemente')
    await page.goForward()
    await expect(page).toHaveURL(/sort=price_asc/)
    await expect(sortTrigger(page)).toContainText('Menor preço')
    await expect(tab(page, 'Em alta')).toHaveAttribute('aria-selected', 'true')
  })

  test('ordenar por menor preço reordena os cards', async ({ page }) => {
    await gotoApp(page, '/?sort=price_asc')
    const expected = await page.evaluate(async () => {
      const body = (await (await fetch('/api/nfts?sort=price_asc')).json()) as { items: { name: string }[] }
      return body.items.map((i) => i.name)
    })
    await expect(catalog(page).getByRole('heading', { level: 3 })).toHaveText(expected)
  })

  test('categoria na URL filtra o catálogo', async ({ page }) => {
    await // o Router serializa arrays como JSON na URL: category=["music"]
    await gotoApp(page, '/?category=%5B%22music%22%5D')
    const expected = await page.evaluate(async () => {
      const body = (await (await fetch('/api/nfts?category=music')).json()) as { items: unknown[] }
      return body.items.length
    })
    expect(expected).toBeGreaterThan(0)
    expect(expected).toBeLessThan(9)
    await expect(cards(page)).toHaveCount(expected)
  })

  test('parâmetros inválidos na URL são ignorados', async ({ page }) => {
    await gotoApp(page, '/?tab=xyz&sort=banana&page=-3&category=nao-existe&minPrice=abc')
    await expect(cards(page)).toHaveCount(9)
    await expect(tab(page, 'Todos os NFTs')).toHaveAttribute('aria-selected', 'true')
    await expect(sortTrigger(page)).toContainText('Listados recentemente')
    await expect(catalog(page).getByRole('alert')).toHaveCount(0)
  })

  test('cenário flaky: com trocas rápidas de filtro a tela termina com o resultado do último', async ({
    page,
    mock,
  }) => {
    await gotoApp(page, '/')
    await expect(cards(page)).toHaveCount(9)
    // o resultado esperado de cada aba, lido no cenário normal
    const names = async (query: string) =>
      (await api<{ items: { name: string }[] }>(page, 'GET', `/api/nfts?${query}`)).items.map((i) => i.name)
    const newNames = await names('tab=new')
    const trendingNames = await names('tab=trending')
    expect(newNames).not.toEqual(trendingNames)

    await mock.scenario('flaky')
    let started = 0
    let finished = 0
    const isList = (url: string) => new URL(url).pathname === '/api/nfts'
    page.on('request', (r) => isList(r.url()) && started++)
    page.on('requestfinished', (r) => isList(r.url()) && finished++)
    page.on('requestfailed', (r) => isList(r.url()) && finished++)

    // três trocas seguidas; a última é "Novos lançamentos"
    await tab(page, 'Novos lançamentos').click()
    await tab(page, 'Em alta').click()
    await tab(page, 'Novos lançamentos').click()
    await expect(page).toHaveURL(/tab=new/)

    // espera TODAS as respostas chegarem (inclusive as atrasadas) e só então confere a tela
    await expect.poll(() => started >= 3 && finished === started, { timeout: 15_000 }).toBe(true)
    await expect(catalog(page).getByRole('heading', { level: 3 })).toHaveText(newNames)
    await expect(tab(page, 'Novos lançamentos')).toHaveAttribute('aria-selected', 'true')
  })
})
