import type { ImgHTMLAttributes } from 'react'

// Larguras geradas por scripts/optimize-images.mjs (npm run images). Manter em sincronia.
const WIDTHS = [200, 400, 500]
const GENERATED = /^(\/assets\/nfts\/nft-artwork-\d+)\.png$/

type NftImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'srcSet' | 'sizes' | 'width' | 'height'> & {
  src: string
  alt: string
  width: number
  height: number
  /** largura que a imagem ocupa na tela, como no atributo sizes do HTML */
  sizes: string
}

// AVIF e WebP com o PNG original como fallback. Imagens fora do padrão geram só o <img>.
export function NftImage({ src, sizes, ...img }: NftImageProps) {
  const base = GENERATED.exec(src)?.[1]
  if (!base) return <img src={src} {...img} />

  const srcSet = (ext: string) => WIDTHS.map((w) => `${base}-${w}.${ext} ${w}w`).join(', ')
  return (
    // display: contents deixa o <picture> sem caixa própria: o <img> se comporta como antes
    <picture className="contents">
      <source type="image/avif" srcSet={srcSet('avif')} sizes={sizes} />
      <source type="image/webp" srcSet={srcSet('webp')} sizes={sizes} />
      <img src={src} {...img} />
    </picture>
  )
}
