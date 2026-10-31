// tira os parâmetros do diálogo de uma URL interna, para o redirect não carregar o próprio diálogo
export function withoutAuthParams(href: string): string {
  const url = new URL(href, 'http://local')
  url.searchParams.delete('auth')
  url.searchParams.delete('redirect')
  url.searchParams.delete('reason')
  return `${url.pathname}${url.search}${url.hash}`
}
