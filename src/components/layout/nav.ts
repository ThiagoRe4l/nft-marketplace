// "Mercado" é o catálogo da Início (#catalogo) e também fica ativo no detalhe, carrinho e checkout
const MARKET_PATHS = ['/nft', '/carrinho', '/checkout', '/pagamento']

// no mobile o detalhe do NFT tem tela própria (Figma): sem header e sem barra inferior, com a barra de compra no lugar
export const isNftDetail = (pathname: string) => pathname.startsWith('/nft/')

export function isMarketActive(pathname: string, hash: string) {
  if (pathname === '/') return hash === 'catalogo'
  return MARKET_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))
}

export function isHomeActive(pathname: string, hash: string) {
  return pathname === '/' && hash !== 'catalogo'
}

// A linha sob o header existe só na Início, no Perfil e em Carteiras (e no login/cadastro, que são a Início).
// As telas do Mercado (detalhe, carrinho, pagamento e pedido) usam o header sem a linha, como no Figma.
const DIVIDER_PATHS = ['/', '/login', '/cadastro', '/perfil', '/carteiras']

export const hasHeaderDivider = (pathname: string) => DIVIDER_PATHS.includes(pathname)
