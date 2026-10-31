// "Mercado" é o catálogo da Início (#catalogo) e também fica ativo no detalhe, carrinho e checkout
const MARKET_PATHS = ['/nft', '/carrinho', '/checkout', '/pagamento']

export function isMarketActive(pathname: string, hash: string) {
  if (pathname === '/') return hash === 'catalogo'
  return MARKET_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))
}

export function isHomeActive(pathname: string, hash: string) {
  return pathname === '/' && hash !== 'catalogo'
}
