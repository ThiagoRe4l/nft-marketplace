import type { EthAmount } from '@/contracts/common'
import { Nft, type Edition, type Network } from '@/contracts/nft'

const image = (file: string) => `/assets/nfts/nft-artwork-${file}.png`

// personagens das artes em public/assets/nfts
const APE = [image('03')]                    // macaco de óculos e jaqueta verde
const NOMAD = [image('04'), image('06')]     // gorila de chapéu e moletom roxo
const NOMAD_ALT = [image('06'), image('04')]
const BARON = [image('05')]                  // macaco preto de terno
const GOLDEN = [image('10')]                 // macaco dourado de fone

// a coleção define rede, contrato e royalty
const collections = {
  apes: { name: 'Kurio Apes', network: 'ethereum', royaltyPercent: 5, contractAddress: '0x7A42C3D9E1B05F6A28D4E7B91C0AF35D6E8B19E8' },
  vessels: { name: 'Neon Vessels', network: 'ethereum', royaltyPercent: 7.5, contractAddress: '0x55E19C0B7D23A4F861BE0C973A5DE2F418B6C0D9' },
  barons: { name: 'Baron Society', network: 'ethereum', royaltyPercent: 6, contractAddress: '0xB4A07E2D91C63F58E0A7D14B9C2E6F03857A1D2C' },
  nomads: { name: 'Nomad Collective', network: 'polygon', royaltyPercent: 5, contractAddress: '0x3E9D21A7C4F80B56D13E7A9C02F4B8E6D1A5C730' },
  arena: { name: 'Pixel Arena', network: 'polygon', royaltyPercent: 4, contractAddress: '0xA1F7C3E05B29D84F6E1C7A30B5D92E48F06C1B7A' },
  lens: { name: 'Kurio Lens', network: 'polygon', royaltyPercent: 3, contractAddress: '0x6C2B8F41D07E3A95C18B4E62F0D7A39E5B1C84F2' },
  frequency: { name: 'Golden Frequency', network: 'solana', royaltyPercent: 8, contractAddress: 'GFq7Xk2mRb9TzV4hPn8YcLw3JdS6aEu5HtNj1KxQpW2' },
  garden: { name: 'Cosmic Garden', network: 'solana', royaltyPercent: 6.5, contractAddress: 'CsMb4Ndr8Wq2ZtYh6FvK9pXe3RgJ7aUo5TkL1yBnu8P' },
  keys: { name: 'Kurio Keys', network: 'solana', royaltyPercent: 2.5, contractAddress: 'KyD3vT9wQm6sHb2XcN8RfJ5aZe4LpG7uWk1YtVhrS3' },
} satisfies Record<string, { name: string; network: Network; royaltyPercent: number; contractAddress: string }>

const networkLabel = { ethereum: 'Ethereum', polygon: 'Polygon', solana: 'Solana' } satisfies Record<Network, string>

// [rótulo, preço, disponível, preço riscado]; o rótulo define kind e supply
type EditionRow = [label: `1/${number}` | 'ABERTA', price: EthAmount, available: number | null, compareAtPrice?: EthAmount | null]

type NftRow = Pick<Nft, 'name' | 'category' | 'images' | 'rarity' | 'rating' | 'reviewCount' | 'description' | 'listedAt'> & {
  collection: keyof typeof collections
  traits: string[] // o último atributo (Raro/Comum) vem da raridade
  editions: EditionRow[]
  trending?: boolean
}

const toEdition = (nftId: string, [label, price, available, compareAtPrice = null]: EditionRow): Edition => {
  const id = `${nftId}-${label.toLowerCase().replace('/', '-')}`
  if (label === 'ABERTA') {
    return { id, kind: 'open', label, supply: null, available, maxPerOrder: 10, price, compareAtPrice }
  }
  const supply = Number(label.slice(2))
  return {
    id,
    kind: supply === 1 ? 'unique' : 'limited',
    label,
    supply,
    available,
    maxPerOrder: supply === 1 ? 1 : supply <= 10 ? 2 : 5,
    price,
    compareAtPrice,
  }
}

const toNft = ({ collection: key, traits, editions, trending = false, ...row }: NftRow): Nft => {
  const collection = collections[key]
  const id = row.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') // "Emerald Ape #042" → "emerald-ape-042"
  const tokenId = `#${row.name.split('#')[1].padStart(4, '0')}`  // "#042" → "#0042"
  const royalty = String(collection.royaltyPercent).replace('.', ',')
  return {
    ...row,
    id,
    tokenId,
    collection: collection.name,
    network: collection.network,
    details: `Token ${tokenId} da coleção ${collection.name}, na rede ${networkLabel[collection.network]}. Arte em PNG de alta resolução com metadados no IPFS. ${royalty}% de royalty ao criador em cada revenda.`,
    attributes: [...traits, row.rarity === 'rare' ? 'Raro' : 'Comum'],
    royaltyPercent: collection.royaltyPercent,
    contractAddress: collection.contractAddress,
    editions: editions.map((edition) => toEdition(id, edition)),
    trending,
    version: 1,
  }
}

const rows: NftRow[] = [
  // do Figma: o preço mostrado é o da edição mais barata
  {
    name: 'Emerald Ape #042', collection: 'apes', category: 'collectibles', images: APE,
    rarity: 'rare', rating: 4.8, reviewCount: 126, listedAt: '2026-10-12T15:00:00Z', trending: true,
    traits: ['Óculos', 'Esmeralda'],
    description: 'O macaco mais elegante da Kurio Apes: óculos redondos de lente verde, jaqueta college esmeralda e um pingente que brilha na luz certa.',
    editions: [['1/1', '6.50', 1], ['1/10', '2.90', 4], ['1/50', '1.79', 23], ['ABERTA', '1.19', null]],
  },
  {
    name: 'Sage Nomad #009', collection: 'nomads', category: '3d-art', images: NOMAD,
    rarity: 'common', rating: 4.6, reviewCount: 112, listedAt: '2026-10-05T14:00:00Z', trending: true,
    traits: ['Modelo 3D', 'Chapéu'],
    description: 'O gorila andarilho da Nomad Collective, modelado em 3D com chapéu de pescador e moletom roxo.',
    editions: [['1/1', '5.40', 0], ['1/25', '2.40', 9], ['ABERTA', '1.69', null]],
  },
  {
    name: 'Neon Vessel #552', collection: 'vessels', category: 'digital-art', images: BARON,
    rarity: 'rare', rating: 4.7, reviewCount: 98, listedAt: '2026-10-20T16:00:00Z', trending: true,
    traits: ['Neon', 'Brinco dourado'],
    description: 'O primeiro retrato da Neon Vessels: blazer bege, gola alta verde e um brinco dourado sob luz de neon.',
    editions: [['1/1', '7.20', 1], ['1/10', '3.40', 3], ['1/50', '1.99', 17, '2.29']],
  },
  {
    name: 'Cosmic Bloom #118', collection: 'garden', category: 'generative', images: NOMAD,
    rarity: 'common', rating: 4.6, reviewCount: 67, listedAt: '2026-10-01T15:20:00Z', trending: true,
    traits: ['Flores', 'Nebulosa'],
    description: 'Arte generativa em que flores de nebulosa crescem ao redor do gorila nômade.',
    editions: [['1/10', '2.20', 4], ['ABERTA', '1.29', null]],
  },
  {
    name: 'Violet Nomad #314', collection: 'nomads', category: 'digital-art', images: NOMAD,
    rarity: 'common', rating: 4.4, reviewCount: 76, listedAt: '2026-09-14T16:30:00Z',
    traits: ['Ilustração', 'Violeta'],
    description: 'Ilustração digital do nômade em tons de violeta, inspirada nos cartazes de viagem dos anos 70.',
    editions: [['1/10', '2.30', 3], ['ABERTA', '1.39', null]],
  },
  {
    name: 'Ivory Baron #088', collection: 'barons', category: 'memberships', images: BARON,
    rarity: 'rare', rating: 4.6, reviewCount: 73, listedAt: '2026-09-27T17:00:00Z', trending: true,
    traits: ['Membro', 'Pré-venda'],
    description: 'Credencial de membro da Baron Society. Dá acesso aos encontros fechados e à pré-venda das próximas coleções.',
    editions: [['1/1', '12.30', 1], ['1/25', '3.20', 8], ['ABERTA', '1.79', null]],
  },
  {
    name: 'Golden Beat #207', collection: 'frequency', category: 'music', images: GOLDEN,
    rarity: 'common', rating: 4.7, reviewCount: 154, listedAt: '2026-10-16T19:30:00Z', trending: true,
    traits: ['Fone', '90 BPM'],
    description: 'Batida original do macaco dourado, a 90 BPM e com o fone verde no volume máximo. Inclui o áudio em WAV.',
    editions: [['1/10', '2.60', 5], ['1/50', '1.40', 22], ['ABERTA', '0.99', null]],
  },
  {
    name: 'Golden Signal #160', collection: 'frequency', category: 'music', images: GOLDEN,
    rarity: 'common', rating: 4.5, reviewCount: 89, listedAt: '2026-09-21T13:10:00Z',
    traits: ['Sintetizador', 'Vinheta'],
    description: 'Faixa curta de sintetizador que abre as transmissões da Golden Frequency.',
    editions: [['1/100', '0.70', 58], ['ABERTA', '0.39', null]],
  },

  // Kurio Apes
  {
    name: 'Cedar Ape #017', collection: 'apes', category: 'collectibles', images: APE,
    rarity: 'common', rating: 4.5, reviewCount: 88, listedAt: '2026-02-03T13:00:00Z',
    traits: ['Jaqueta verde', 'Fundador'],
    description: 'Um dos primeiros membros da Kurio Apes, com a jaqueta verde que virou a marca registrada da coleção.',
    editions: [['1/50', '0.89', 31], ['ABERTA', '0.45', null]],
  },
  {
    name: 'Jade Ape #231', collection: 'apes', category: 'collectibles', images: APE,
    rarity: 'rare', rating: 4.9, reviewCount: 54, listedAt: '2026-01-14T18:30:00Z',
    traits: ['Jade', 'Edição única'],
    description: 'Edição única com pingente de jade lapidado à mão, arrematada nas primeiras horas após o lançamento.',
    editions: [['1/1', '8.90', 0]],
  },
  {
    name: 'Velvet Ape #305', collection: 'apes', category: 'digital-art', images: APE,
    rarity: 'common', rating: 4.3, reviewCount: 41, listedAt: '2026-06-22T11:00:00Z',
    traits: ['Pintura digital', 'Veludo'],
    description: 'Retrato em pinceladas digitais com textura de veludo e paleta de verdes profundos.',
    editions: [['1/10', '2.40', 6, '2.80'], ['1/50', '1.10', 40]],
  },
  {
    name: 'Arcade Ape #411', collection: 'apes', category: 'gaming', images: APE,
    rarity: 'common', rating: 4.1, reviewCount: 19, listedAt: '2026-09-03T20:00:00Z',
    traits: ['Skin jogável', 'Fliperama'],
    description: 'Skin oficial do macaco da Kurio Apes para o modo fliperama, com animação de vitória exclusiva.',
    editions: [['ABERTA', '0.12', null]],
  },

  // Neon Vessels
  {
    name: 'Chrome Vessel #601', collection: 'vessels', category: 'digital-art', images: BARON,
    rarity: 'common', rating: 4.4, reviewCount: 37, listedAt: '2026-04-08T10:00:00Z',
    traits: ['Cromado', 'Blazer'],
    description: 'Versão com acabamento cromado do retrato clássico da coleção, renderizada em alta resolução.',
    editions: [['1/25', '1.45', 12], ['ABERTA', '0.79', null, '0.95']],
  },
  {
    name: 'Prism Vessel #477', collection: 'vessels', category: '3d-art', images: GOLDEN,
    rarity: 'rare', rating: 4.6, reviewCount: 22, listedAt: '2026-07-15T19:00:00Z',
    traits: ['Modelo 3D', 'Prisma'],
    description: 'Escultura digital em 3D que decompõe a luz em faixas de cor conforme o modelo gira.',
    editions: [['1/1', '5.90', 1], ['1/10', '2.75', 2]],
  },
  {
    name: 'Fractal Vessel #389', collection: 'vessels', category: 'generative', images: APE,
    rarity: 'common', rating: 4.0, reviewCount: 12, listedAt: '2026-03-19T14:30:00Z',
    traits: ['Fractal', 'Semente fixa'],
    description: 'Obra generativa em que fractais verdes envolvem o retrato do macaco, todos derivados da mesma semente.',
    editions: [['1/100', '0.35', 64], ['ABERTA', '0.18', null]],
  },
  {
    name: 'Mirage Vessel #250', collection: 'vessels', category: 'photography', images: BARON,
    rarity: 'rare', rating: 4.8, reviewCount: 9, listedAt: '2026-05-02T09:00:00Z',
    traits: ['Dupla exposição', 'Estúdio'],
    description: 'Fotografia de estúdio em dupla exposição, com o retrato desfocado como uma miragem.',
    editions: [['1/1', '9.80', 0], ['1/10', '4.60', 0]],
  },

  // Baron Society
  {
    name: 'Onyx Baron #140', collection: 'barons', category: 'memberships', images: BARON,
    rarity: 'common', rating: 4.2, reviewCount: 66, listedAt: '2026-01-28T12:00:00Z',
    traits: ['Membro', 'Entrada'],
    description: 'Passe de entrada da Baron Society, em edição aberta para quem quer começar no clube.',
    editions: [['ABERTA', '0.60', null]],
  },
  {
    name: 'Ebony Baron #276', collection: 'barons', category: 'memberships', images: BARON,
    rarity: 'rare', rating: 4.7, reviewCount: 31, listedAt: '2026-08-11T21:00:00Z',
    traits: ['Conselho', 'Direito a voto'],
    description: 'Assento no conselho da Baron Society, com direito a voto nas decisões da comunidade.',
    editions: [['1/10', '4.20', 5], ['1/50', '2.10', 19, '2.60']],
  },
  {
    name: 'Tweed Baron #333', collection: 'barons', category: 'collectibles', images: NOMAD_ALT,
    rarity: 'common', rating: 4.3, reviewCount: 45, listedAt: '2026-05-17T15:45:00Z',
    traits: ['Chapéu', 'Moletom roxo'],
    description: 'O lado casual da Baron Society: chapéu de pescador, moletom roxo e nenhuma pressa.',
    editions: [['1/1', '3.80', 0], ['1/50', '0.95', 27], ['1/100', '0.48', 72], ['ABERTA', '0.25', null]],
  },
  {
    name: 'Signet Baron #019', collection: 'barons', category: 'utility', images: BARON,
    rarity: 'common', rating: 4.0, reviewCount: 14, listedAt: '2026-07-01T08:30:00Z',
    traits: ['Sinete', 'Lounge'],
    description: 'Anel de sinete digital que libera o lounge da Baron Society e descontos em eventos parceiros.',
    editions: [['1/100', '0.30', 80], ['ABERTA', '0.15', null]],
  },

  // Nomad Collective
  {
    name: 'Moss Nomad #072', collection: 'nomads', category: '3d-art', images: NOMAD_ALT,
    rarity: 'rare', rating: 4.7, reviewCount: 28, listedAt: '2026-03-02T10:15:00Z',
    traits: ['Modelo 3D', 'Musgo'],
    description: 'Modelo 3D com textura de musgo no chapéu e iluminação de fim de tarde.',
    editions: [['1/1', '4.40', 1]],
  },
  {
    name: 'Dune Nomad #158', collection: 'nomads', category: 'photography', images: NOMAD,
    rarity: 'common', rating: 3.9, reviewCount: 17, listedAt: '2026-06-06T13:20:00Z',
    traits: ['Analógico', 'Dunas'],
    description: 'Ensaio fotográfico do nômade cruzando dunas, com grão de filme analógico.',
    editions: [['1/50', '0.55', 33], ['ABERTA', '0.22', null, '0.30']],
  },
  {
    name: 'Lilac Nomad #261', collection: 'nomads', category: 'collectibles', images: NOMAD_ALT,
    rarity: 'common', rating: 4.1, reviewCount: 52, listedAt: '2026-10-24T18:00:00Z',
    traits: ['Figurinha', 'Lilás'],
    description: 'Figurinha colecionável da Nomad Collective em tom lilás, a mais trocada entre os membros.',
    editions: [['1/100', '0.68', 41], ['ABERTA', '0.33', null]],
  },

  // Pixel Arena
  {
    name: 'Pixel Brawler #101', collection: 'arena', category: 'gaming', images: APE,
    rarity: 'common', rating: 4.2, reviewCount: 140, listedAt: '2026-08-29T22:00:00Z', trending: true,
    traits: ['Personagem jogável', 'Lutador'],
    description: 'Lutador jogável do Pixel Arena, com golpe especial e emote de comemoração.',
    editions: [['1/50', '0.40', 12], ['ABERTA', '0.09', null]],
  },
  {
    name: 'Turbo Racer #212', collection: 'arena', category: 'gaming', images: GOLDEN,
    rarity: 'common', rating: 4.0, reviewCount: 63, listedAt: '2026-02-19T17:10:00Z',
    traits: ['Personagem jogável', 'Corrida'],
    description: 'Piloto do modo corrida do Pixel Arena, em edição aberta para todos os jogadores.',
    editions: [['ABERTA', '0.05', null]],
  },
  {
    name: 'Boss Raider #013', collection: 'arena', category: 'gaming', images: BARON,
    rarity: 'rare', rating: 4.5, reviewCount: 38, listedAt: '2026-05-25T20:40:00Z',
    traits: ['Chefe', 'Arena personalizada'],
    description: 'Chefe final da primeira temporada do Pixel Arena. A edição 1/1 vem com uma arena personalizada.',
    editions: [['1/1', '3.10', 1], ['1/10', '1.20', 7], ['1/100', '0.28', 55]],
  },
  {
    name: 'Voxel Knight #087', collection: 'arena', category: '3d-art', images: NOMAD,
    rarity: 'common', rating: 4.3, reviewCount: 26, listedAt: '2026-04-27T11:50:00Z',
    traits: ['Voxel', 'Editor de mapas'],
    description: 'Cavaleiro em voxels pronto para importar no editor de mapas do Pixel Arena.',
    editions: [['1/25', '0.90', 14], ['ABERTA', '0.36', null]],
  },
  {
    name: 'Arcade Anthem #404', collection: 'arena', category: 'music', images: GOLDEN,
    rarity: 'common', rating: 4.4, reviewCount: 48, listedAt: '2026-07-21T15:15:00Z',
    traits: ['8 bits', 'Trilha sonora'],
    description: 'Trilha sonora da tela de abertura do Pixel Arena, em loop de 8 bits.',
    editions: [['ABERTA', '0.07', null]],
  },

  // Kurio Lens
  {
    name: 'Golden Hour #046', collection: 'lens', category: 'photography', images: GOLDEN,
    rarity: 'rare', rating: 4.9, reviewCount: 34, listedAt: '2026-09-08T18:45:00Z',
    traits: ['Hora dourada', 'Sem retoques'],
    description: 'Retrato fotográfico do macaco dourado na hora mágica, sem retoques.',
    editions: [['1/1', '3.60', 1], ['1/10', '1.50', 2]],
  },
  {
    name: 'Urban Frame #129', collection: 'lens', category: 'photography', images: BARON,
    rarity: 'common', rating: 4.1, reviewCount: 21, listedAt: '2026-01-09T09:30:00Z',
    traits: ['Preto e branco', 'Rua'],
    description: 'Fotografia de rua em preto e branco feita no centro da cidade, com o barão de passagem.',
    editions: [['1/100', '0.20', 90], ['ABERTA', '0.08', null]],
  },
  {
    name: 'Silver Portrait #377', collection: 'lens', category: 'photography', images: NOMAD,
    rarity: 'common', rating: 3.8, reviewCount: 11, listedAt: '2026-03-28T16:00:00Z',
    traits: ['Gelatina de prata', 'Retrato'],
    description: 'Retrato em gelatina de prata digitalizado em alta resolução, com tiragem de 50 cópias.',
    editions: [['1/50', '0.70', 0]],
  },
  {
    name: 'Analog Ape #064', collection: 'lens', category: 'digital-art', images: APE,
    rarity: 'common', rating: 4.2, reviewCount: 29, listedAt: '2026-06-30T12:40:00Z',
    traits: ['Colagem', 'Analógico'],
    description: 'Colagem digital que mistura fotografia analógica e ilustração do macaco de óculos.',
    editions: [['1/25', '0.85', 10, '1.05'], ['ABERTA', '0.38', null]],
  },
  {
    name: 'Studio Bust #219', collection: 'lens', category: '3d-art', images: BARON,
    rarity: 'common', rating: 0, reviewCount: 0, listedAt: '2026-10-28T10:00:00Z',
    traits: ['Busto', 'Arquivo STL'],
    description: 'Busto 3D do barão esculpido para impressão, com o arquivo STL incluso.',
    editions: [['ABERTA', '0.26', null]],
  },

  // Golden Frequency
  {
    name: 'Amber Tempo #120', collection: 'frequency', category: 'music', images: GOLDEN,
    rarity: 'rare', rating: 4.8, reviewCount: 40, listedAt: '2026-04-14T21:20:00Z',
    traits: ['Jazz', 'Instrumental'],
    description: 'Composição de jazz instrumental em quatro partes, gravada em uma única sessão.',
    editions: [['1/1', '4.90', 1], ['1/25', '1.75', 6]],
  },
  {
    name: 'Lo-fi Groove #058', collection: 'frequency', category: 'music', images: GOLDEN,
    rarity: 'common', rating: 4.3, reviewCount: 72, listedAt: '2026-10-09T23:00:00Z', trending: true,
    traits: ['Lo-fi', 'Loop'],
    description: 'Loop lo-fi para estudar e relaxar, com licença de uso em vídeos pessoais.',
    editions: [['ABERTA', '0.02', null]],
  },
  {
    name: 'Golden Waveform #300', collection: 'frequency', category: 'generative', images: GOLDEN,
    rarity: 'common', rating: 4.0, reviewCount: 16, listedAt: '2026-02-25T14:50:00Z',
    traits: ['Visualizador', 'Áudio'],
    description: 'Visualização generativa do áudio da Golden Frequency: cada onda sai da própria faixa.',
    editions: [['1/100', '0.32', 47], ['ABERTA', '0.14', null, '0.19']],
  },

  // Cosmic Garden
  {
    name: 'Nebula Fern #221', collection: 'garden', category: 'generative', images: APE,
    rarity: 'common', rating: 4.2, reviewCount: 24, listedAt: '2026-05-09T10:40:00Z',
    traits: ['Samambaia', 'Esmeralda'],
    description: 'Samambaias generativas em tons de esmeralda, desenhadas a partir de uma única semente.',
    editions: [['1/50', '0.62', 38], ['ABERTA', '0.29', null]],
  },
  {
    name: 'Stellar Moss #349', collection: 'garden', category: 'generative', images: NOMAD_ALT,
    rarity: 'rare', rating: 4.7, reviewCount: 13, listedAt: '2026-08-02T17:25:00Z',
    traits: ['Musgo', 'Crescimento'],
    description: 'Musgo estelar gerado por um algoritmo de crescimento, com variações em cada edição.',
    editions: [['1/1', '6.80', 1], ['1/10', '2.95', 4, '3.40'], ['1/50', '1.35', 29]],
  },
  {
    name: 'Orbit Quest #075', collection: 'garden', category: 'gaming', images: GOLDEN,
    rarity: 'common', rating: 4.1, reviewCount: 58, listedAt: '2026-03-11T19:55:00Z',
    traits: ['Item de missão', 'Desbloqueio'],
    description: 'Item de missão que desbloqueia a fase do jardim cósmico no jogo Orbit Quest.',
    editions: [['1/100', '0.24', 66], ['ABERTA', '0.11', null]],
  },
  {
    name: 'Garden Pass #001', collection: 'garden', category: 'memberships', images: APE,
    rarity: 'rare', rating: 4.9, reviewCount: 18, listedAt: '2026-06-14T12:00:00Z',
    traits: ['Fundador', 'Acesso antecipado'],
    description: 'Passe de fundador do Cosmic Garden, com acesso antecipado a todos os lançamentos.',
    editions: [['1/25', '3.75', 7]],
  },

  // Kurio Keys
  {
    name: 'Vault Key #010', collection: 'keys', category: 'utility', images: BARON,
    rarity: 'rare', rating: 4.6, reviewCount: 36, listedAt: '2026-07-08T16:10:00Z',
    traits: ['Cofre', 'Item surpresa'],
    description: 'Chave do cofre da Kurio Keys: dá direito a resgatar um item surpresa por temporada.',
    editions: [['1/10', '2.10', 2], ['1/100', '0.58', 43]],
  },
  {
    name: 'Beta Key #255', collection: 'keys', category: 'utility', images: APE,
    rarity: 'common', rating: 4.0, reviewCount: 27, listedAt: '2026-01-21T11:25:00Z',
    traits: ['Beta', 'Acesso antecipado'],
    description: 'Acesso antecipado às funções em beta antes do lançamento geral.',
    editions: [['ABERTA', '0.06', null]],
  },
  {
    name: 'Studio Key #146', collection: 'keys', category: 'utility', images: GOLDEN,
    rarity: 'common', rating: 4.2, reviewCount: 15, listedAt: '2026-04-02T13:35:00Z',
    traits: ['Estúdio', 'Horas de gravação'],
    description: 'Libera horas de gravação nos estúdios parceiros da Kurio Keys.',
    editions: [['1/50', '0.44', 20], ['ABERTA', '0.17', null]],
  },
  {
    name: 'Lounge Key #321', collection: 'keys', category: 'utility', images: NOMAD,
    rarity: 'common', rating: 3.7, reviewCount: 8, listedAt: '2026-08-19T09:45:00Z',
    traits: ['Lounge', 'Evento presencial'],
    description: 'Entrada para o lounge dos eventos presenciais de 2026.',
    editions: [['1/100', '0.16', 71]],
  },
  {
    name: 'Founder Key #007', collection: 'keys', category: 'memberships', images: BARON,
    rarity: 'rare', rating: 5.0, reviewCount: 6, listedAt: '2026-02-11T20:30:00Z',
    traits: ['Fundador', 'Vitalício'],
    description: 'Chave de fundador: acesso vitalício a todos os clubes da Kurio Keys.',
    editions: [['1/1', '10.50', 1], ['1/10', '4.80', 3], ['1/50', '1.95', 12], ['ABERTA', '0.82', null]],
  },
]

const built = rows.map(toNft) // toNft já devolve Nft (tipado)

// A validação com o schema só roda em desenvolvimento: no build de produção ela ficaria no caminho
// crítico de toda abertura (o módulo carrega antes do primeiro render) e atrasaria o TBT.
export const nftFixtures: Nft[] = import.meta.env.DEV ? Nft.array().parse(built) : built
