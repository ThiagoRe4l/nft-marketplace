import { expect, gotoApp, loginAs, test, USERS } from './fixtures'

test.describe('smoke', () => {
  test('a Início carrega com o catálogo e o carrinho do Header', async ({ page }) => {
    await gotoApp(page, '/')

    const catalog = page.getByRole('region', { name: 'Catálogo de NFTs' })
    await expect(catalog.getByRole('article')).toHaveCount(9)

    // no desktop o carrinho fica no Header; no mobile, na barra inferior (o outro some da árvore de acessibilidade)
    await expect(page.getByRole('link', { name: /^Carrinho/ })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Carrinho, vazio' })).toBeVisible()
  })

  test('loginAs mostra o nome da Ana', async ({ page, isMobile }) => {
    await gotoApp(page, '/')
    await loginAs(page, 'ana')

    if (isMobile) {
      // no mobile o usuário aparece no menu lateral
      await page.getByRole('button', { name: 'Abrir menu' }).click()
      await expect(page.getByRole('dialog').getByText(USERS.ana.displayName)).toBeVisible()
    } else {
      await expect(page.getByRole('button', { name: `Menu de ${USERS.ana.displayName}` })).toBeVisible()
    }
  })

  test('cenário server-error mostra o estado de erro do catálogo', async ({ page, mock }) => {
    await gotoApp(page, '/')
    await mock.scenario('server-error')
    await page.reload()

    // o app tenta mais 2 vezes antes de desistir (~3 s)
    const alert = page.getByRole('region', { name: 'Catálogo de NFTs' }).getByRole('alert')
    await expect(alert).toBeVisible({ timeout: 15_000 })
    await expect(alert.getByRole('button', { name: 'Tentar novamente' })).toBeVisible()
  })
})
