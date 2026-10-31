import Big from 'big.js'
import type { Edition } from '@/contracts/nft'

// esgotada: estoque zero (null = sem limite de estoque)
export const isSoldOut = (edition: Edition) => edition.available === 0

// edição inicial: a mais barata entre as disponíveis; se tudo esgotou, a mais barata de todas
export function defaultEdition(editions: Edition[]): Edition {
  const cheapest = (list: Edition[]) => list.reduce((best, e) => (new Big(e.price).lt(best.price) ? e : best))
  const available = editions.filter((e) => !isSoldOut(e))
  return cheapest(available.length > 0 ? available : editions)
}

// limite do stepper: o menor entre o máximo por pedido e o estoque
export const maxQuantity = (edition: Edition) =>
  edition.available === null ? edition.maxPerOrder : Math.min(edition.maxPerOrder, edition.available)

// "Restam N" quando o estoque é o limite; "Máximo de N por pedido" quando é a regra do pedido
export function quantityHint(edition: Edition): string {
  if (edition.available !== null && edition.available < edition.maxPerOrder) return `Restam ${edition.available}`
  return `Máximo de ${edition.maxPerOrder} por pedido`
}

// 0x7A42C3D9...B19E8 -> 0x7A42...19E8
export const truncateAddress = (address: string) =>
  address.length > 12 ? `${address.slice(0, 6)}...${address.slice(-4)}` : address
