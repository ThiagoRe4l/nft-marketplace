import Big from 'big.js'
import { http, HttpResponse } from 'msw'
import { z } from 'zod'
import { Category, Network, NftListParams, NftListResponse, type Nft, type NftSummary } from '@/contracts/nft'
import { db } from '../db/store'
import { apiError } from '../lib/http'

const PAGE_SIZE = 9
const NEW_WINDOW_MS = 30 * 24 * 60 * 60 * 1000
const SPOTLIGHT_ID = 'sage-nomad-009'

const cheapestEdition = (nft: Nft) =>
  nft.editions.reduce((best, e) => (new Big(e.price).lt(best.price) ? e : best))

const priceOf = (nft: Nft) => new Big(cheapestEdition(nft).price)

export function toSummary(nft: Nft): NftSummary {
  const edition = cheapestEdition(nft)
  return {
    id: nft.id,
    name: nft.name,
    tokenId: nft.tokenId,
    category: nft.category,
    network: nft.network,
    rarity: nft.rarity,
    version: nft.version,
    image: nft.images[0],
    price: edition.price,
    compareAtPrice: edition.compareAtPrice,
    soldOut: nft.editions.every((e) => e.available === 0),
  }
}

// sem maiúsculas e sem acentos: "Coleção" casa com "colecao"
const normalize = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

const compareById = (a: Nft, b: Nft) => a.id.localeCompare(b.id)
const compareByRecent = (a: Nft, b: Nft) => b.listedAt.localeCompare(a.listedAt) || compareById(a, b)

// category e network repetem a chave (?category=a&category=b); os outros campos são únicos
function readQuery(url: URL) {
  const one = (key: string) => url.searchParams.get(key) ?? undefined
  const many = (key: string) => {
    const values = url.searchParams.getAll(key)
    return values.length ? values : undefined
  }
  const page = one('page')
  return {
    q: one('q'),
    tab: one('tab'),
    category: many('category'),
    network: many('network'),
    minPrice: one('minPrice'),
    maxPrice: one('maxPrice'),
    sort: one('sort'),
    page: page === undefined ? undefined : Number(page),
  }
}

export const nftHandlers = [
  http.get('/api/nfts', ({ request }) => {
    const parsed = NftListParams.safeParse(readQuery(new URL(request.url)))
    if (!parsed.success) {
      return apiError(
        'VALIDATION_ERROR',
        'Parâmetros inválidos',
        z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
      )
    }
    const params = parsed.data
    const catalog = db.read().nfts

    // referência fixa no catálogo (sem Date.now): "novo" = 30 dias antes do mais recente
    const latest = catalog.reduce((max, n) => (n.listedAt > max ? n.listedAt : max), '')
    const newSince = catalog.length ? new Date(new Date(latest).getTime() - NEW_WINDOW_MS).toISOString() : ''
    const query = params.q ? normalize(params.q) : ''

    // `skip` tira um filtro da conta: a faceta de uma dimensão ignora o filtro dela mesma
    const matches = (nft: Nft, skip?: 'category' | 'network') => {
      if (query && !normalize(`${nft.name} ${nft.collection}`).includes(query)) return false
      if (params.tab === 'new' && nft.listedAt < newSince) return false
      if (params.tab === 'trending' && !nft.trending) return false
      if (skip !== 'category' && params.category && !params.category.includes(nft.category)) return false
      if (skip !== 'network' && params.network && !params.network.includes(nft.network)) return false
      if (params.minPrice && priceOf(nft).lt(params.minPrice)) return false
      if (params.maxPrice && priceOf(nft).gt(params.maxPrice)) return false
      return true
    }

    const sorters = {
      recent: compareByRecent,
      price_asc: (a: Nft, b: Nft) => priceOf(a).cmp(priceOf(b)) || compareById(a, b),
      price_desc: (a: Nft, b: Nft) => priceOf(b).cmp(priceOf(a)) || compareById(a, b),
    }

    const filtered = catalog.filter((n) => matches(n)).sort(sorters[params.sort])
    const start = (params.page - 1) * PAGE_SIZE

    const prices = catalog.map(priceOf)
    const priceRange = prices.length
      ? {
          min: prices.reduce((a, b) => (b.lt(a) ? b : a)).toFixed(),
          max: prices.reduce((a, b) => (b.gt(a) ? b : a)).toFixed(),
        }
      : { min: '0', max: '0' }

    const countBy = <T extends string>(values: readonly T[], skip: 'category' | 'network', pick: (n: Nft) => T) => {
      const pool = catalog.filter((n) => matches(n, skip))
      return values.map((value) => ({ value, count: pool.filter((n) => pick(n) === value).length }))
    }

    return HttpResponse.json(
      NftListResponse.parse({
        items: filtered.slice(start, start + PAGE_SIZE).map(toSummary),
        page: params.page,
        pageSize: PAGE_SIZE,
        total: filtered.length,
        facets: {
          categories: countBy(Category.options, 'category', (n) => n.category),
          networks: countBy(Network.options, 'network', (n) => n.network),
        },
        priceRange,
      }),
    )
  }),

  // registrada antes de /:id, senão "featured" seria lido como um id
  http.get('/api/nfts/featured', () => {
    const catalog = db.read().nfts
    const spotlight = catalog.find((n) => n.id === SPOTLIGHT_ID)
    if (!spotlight) return apiError('NOT_FOUND', 'NFT em destaque não encontrado')
    const hero = catalog.filter((n) => n.trending).sort(compareByRecent).slice(0, 3)
    return HttpResponse.json({ hero: hero.map(toSummary), spotlight: toSummary(spotlight) })
  }),

  http.get('/api/nfts/:id', ({ params }) => {
    const nft = db.read().nfts.find((n) => n.id === params.id)
    return nft ? HttpResponse.json(nft) : apiError('NOT_FOUND', 'NFT não encontrado')
  }),
]
