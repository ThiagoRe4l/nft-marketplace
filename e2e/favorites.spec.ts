import { api, expect, gotoApp, loginAs, test, USERS } from './fixtures'

const EMERALD = 'emerald-ape-042'
const NAME = 'Emerald Ape #042'

test.describe('favoritos', () => {
  test('falha ao favoritar: o coração volta ao estado anterior e aparece um toast', async ({ page, mock }) => {
    await gotoApp(page, '/')
    await loginAs(page, 'ana')
    await gotoApp(page, `/nft/${EMERALD}`)
    const heart = page.getByRole('button', { name: 'Favoritar', exact: true })
    await expect(heart).toHaveAttribute('aria-pressed', 'false')

    await mock.scenario('mutation-error')
    await heart.click()

    await expect(page.getByText(`Não foi possível atualizar os favoritos (${NAME}).`)).toBeVisible()
    await expect(heart).toHaveAttribute('aria-pressed', 'false') // rollback
    await mock.scenario('default')
    // o servidor também não tem o favorito
    expect(await api<unknown[]>(page, 'GET', '/api/favorites')).toEqual([])
  })

  test('falha ao desfavoritar: o coração continua marcado e aparece um toast', async ({ page, mock }) => {
    await gotoApp(page, '/')
    await loginAs(page, 'ana')
    await api(page, 'PUT', `/api/favorites/${EMERALD}`)
    await gotoApp(page, `/nft/${EMERALD}`)
    const heart = page.getByRole('button', { name: 'Favoritar', exact: true })
    await expect(heart).toHaveAttribute('aria-pressed', 'true')

    await mock.scenario('mutation-error')
    await heart.click()

    await expect(page.getByText(`Não foi possível atualizar os favoritos (${NAME}).`)).toBeVisible()
    await expect(heart).toHaveAttribute('aria-pressed', 'true')
  })

  test('sem erro, favoritar e desfavoritar funcionam e persistem após o refresh', async ({ page }) => {
    await gotoApp(page, '/')
    await loginAs(page, 'ana')
    await gotoApp(page, `/nft/${EMERALD}`)
    const heart = page.getByRole('button', { name: 'Favoritar', exact: true })
    // o coração muda na hora (otimista); só recarrega depois que o servidor confirmou
    const saved = page.waitForResponse((r) => r.request().method() === 'PUT' && r.url().includes('/api/favorites/'))
    await heart.click()
    await expect(heart).toHaveAttribute('aria-pressed', 'true')
    await saved

    await page.reload()
    await expect(heart).toHaveAttribute('aria-pressed', 'true')
    await heart.click()
    await expect(heart).toHaveAttribute('aria-pressed', 'false')
  })

  test('visitante que clica no coração abre o login e, ao entrar, volta à mesma página', async ({ page }) => {
    await gotoApp(page, `/nft/${EMERALD}`)
    await expect(page.getByRole('heading', { level: 1, name: NAME })).toBeVisible()
    await page.getByRole('button', { name: 'Favoritar', exact: true }).click()

    await expect(page).toHaveURL(/auth=login/)
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await dialog.getByLabel('E-mail', { exact: true }).fill(USERS.ana.email)
    await dialog.getByLabel('Senha', { exact: true }).fill(USERS.ana.password)
    await dialog.locator('button[type="submit"]').click()

    await expect(dialog).toBeHidden()
    await expect(page).toHaveURL(new RegExp(`/nft/${EMERALD}$`))
    await expect(page.getByRole('heading', { level: 1, name: NAME })).toBeVisible()
  })
})
