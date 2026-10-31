import { z } from 'zod'
import { EthAmount, Id, IsoDate, paginated } from './common'

export const Network = z.enum(['ethereum', 'polygon', 'solana'])
export type Network = z.infer<typeof Network>

export const Category = z.enum([
  'digital-art', 'photography', 'music', '3d-art', 'collectibles',
  'generative', 'gaming', 'memberships', 'utility',
])
export type Category = z.infer<typeof Category>

export const Rarity = z.enum(['common', 'rare'])

// edições do Figma: 1/1, 1/10, 1/50, ABERTA
export const Edition = z.object({
  id: Id,
  kind: z.enum(['unique', 'limited', 'open']),
  label: z.string(),                       // "1/50"
  supply: z.number().int().nullable(),     // null = aberta
  available: z.number().int().nullable(), // null = sem limite de estoque
  maxPerOrder: z.number().int().min(1),
  price: EthAmount,
  compareAtPrice: EthAmount.nullable(),    // preço riscado
})
export type Edition = z.infer<typeof Edition>

export const Nft = z.object({
  id: Id,
  name: z.string(),                // "Emerald Ape #042"
  tokenId: z.string(),             // "#0042"
  collection: z.string(),
  category: Category,
  network: Network,
  images: z.array(z.string()).min(1),
  rarity: Rarity,
  rating: z.number().min(0).max(5),
  reviewCount: z.number().int(),
  description: z.string(),
  details: z.string(),
  attributes: z.array(z.string()),
  royaltyPercent: z.number(),
  contractAddress: z.string(),
  editions: z.array(Edition).min(1),
  listedAt: IsoDate,
  trending: z.boolean(),
  version: z.number().int().min(1), // sobe a cada mudança; compara com o evento
})
export type Nft = z.infer<typeof Nft>

// o card do catálogo: mais leve que o detalhe
export const NftSummary = Nft.pick({
  id: true, name: true, tokenId: true, category: true,
  network: true, rarity: true, version: true,
}).extend({
  image: z.string(),
  price: EthAmount,                     // menor preço entre as edições
  compareAtPrice: EthAmount.nullable(),
  soldOut: z.boolean(),
  editionId: Id, // edição mais barata: a que o card exibe e adiciona ao carrinho
})
export type NftSummary = z.infer<typeof NftSummary>

export const NftTab = z.enum(['all', 'new', 'trending'])
export const NftSort = z.enum(['recent', 'price_asc', 'price_desc'])

// também vira o validateSearch da rota na Fase 5
export const NftListParams = z.object({
  q: z.string().trim().optional(),
  tab: NftTab.default('all'),
  category: z.array(Category).optional(),
  network: z.array(Network).optional(),
  minPrice: EthAmount.optional(),
  maxPrice: EthAmount.optional(),
  sort: NftSort.default('recent'),
  page: z.number().int().min(1).default(1),
})
export type NftListParams = z.infer<typeof NftListParams>

const facet = <T extends z.ZodType>(value: T) =>
  z.array(z.object({ value, count: z.number().int() }))

export const NftListResponse = paginated(NftSummary).extend({
  facets: z.object({ categories: facet(Category), networks: facet(Network) }),
  priceRange: z.object({ min: EthAmount, max: EthAmount }), // limites do slider
})
export type NftListResponse = z.infer<typeof NftListResponse>

export const FeaturedResponse = z.object({
  hero: z.array(NftSummary),  // carrossel do topo
  spotlight: NftSummary,      // "NFT em destaque"
})