// Gera as variantes AVIF e WebP das imagens de NFT em public/assets/nfts.
// Uso: npm run images. Os PNG originais ficam como fallback do <picture>.
// As fontes têm ~500 px de largura, então os tamanhos são 200, 400 e 500 (não há o que ganhar acima disso).
import { readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'assets', 'nfts')
const WIDTHS = [200, 400, 500] // manter em sincronia com src/components/nft/nft-image.tsx
const FORMATS = {
  avif: (img) => img.avif({ quality: 55, effort: 6 }),
  webp: (img) => img.webp({ quality: 78, effort: 6 }),
}

const sources = (await readdir(dir)).filter((f) => /^nft-artwork-\d+\.png$/.test(f))
for (const file of sources) {
  const base = file.replace(/\.png$/, '')
  for (const width of WIDTHS) {
    for (const [ext, encode] of Object.entries(FORMATS)) {
      const out = path.join(dir, `${base}-${width}.${ext}`)
      // withoutEnlargement: false mantém o nome do arquivo igual ao descritor "w" do srcset
      const info = await encode(sharp(path.join(dir, file)).resize({ width, withoutEnlargement: false })).toFile(out)
      console.log(`${path.basename(out)}  ${(info.size / 1024).toFixed(1)} KB`)
    }
  }
}
