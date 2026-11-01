import { NftImage } from '@/components/nft/nft-image'
import Big from 'big.js'
import type { Cart } from '@/contracts/cart'
import type { PriceSummary } from '@/contracts/common'
import type { Quote } from '@/contracts/quote'
import { useState } from 'react'
import { CouponForm } from '@/features/cart/components/coupon-form'
import { formatEth } from '@/shared/lib/money'

type Line = { key: string; image: string; name: string; tokenId: string; quantity: number; lineTotal: string }

const linesFromCart = (cart: Cart): Line[] =>
  cart.items.map((item) => ({
    key: item.id,
    image: item.nft.image,
    name: item.nft.name,
    tokenId: item.nft.tokenId,
    quantity: item.quantity,
    lineTotal: new Big(item.nft.unitPrice).times(item.quantity).toFixed(),
  }))

const linesFromQuote = (quote: Quote): Line[] =>
  quote.lines.map((line) => ({
    key: `${line.nftId}:${line.editionId}`,
    image: line.image,
    name: line.name,
    tokenId: line.tokenId,
    quantity: line.quantity,
    lineTotal: line.lineTotal,
  }))

// "Seus NFTs": antes da revisão mostra o carrinho; depois, os valores da cotação, que são os que valem
export function OrderColumn({ cart, quote }: { cart: Cart; quote: Quote | null }) {
  const lines = quote ? linesFromQuote(quote) : linesFromCart(cart)
  const summary: PriceSummary = quote ?? cart.summary

  return (
    <section aria-labelledby="checkout-items-title">
      <h2 id="checkout-items-title" className="mb-3 text-base font-bold">
        Seus NFTs
      </h2>
      <div aria-hidden="true" className="mb-3 flex justify-between border-b pb-2 text-sm font-bold">
        <span>NFTs</span>
        <span>Subtotal</span>
      </div>
      <ul className="space-y-2">
        {lines.map((line) => (
          <li key={line.key} className="flex items-center gap-3 rounded-sm bg-card p-1.5 pr-3">
            <NftImage
              src={line.image}
              alt=""
              width={70}
              height={70}
              sizes="70px"
              loading="lazy"
              decoding="async"
              className="size-[4.375rem] shrink-0 rounded-sm object-cover"
            />
            <div className="min-w-0 flex-1 space-y-0.5">
              <p className="text-sm font-bold break-words">{line.name}</p>
              <p className="text-xs text-muted-foreground">ID do token: {line.tokenId}</p>
            </div>
            <p className="shrink-0 text-xs text-muted-foreground">
              <span className="sr-only">Quantidade: </span>(x {line.quantity})
            </p>
            <p className="shrink-0 text-sm font-bold whitespace-nowrap text-primary">
              <span className="sr-only">Subtotal: </span>
              {formatEth(line.lineTotal)}
            </p>
          </li>
        ))}
      </ul>

      <PromoCode couponCode={cart.couponCode} />

      <dl aria-label={quote ? 'Valores da cotação' : 'Resumo do carrinho'} className="mt-4 text-sm">
        <div className="flex h-8 items-center justify-between">
          <dt>Subtotal</dt>
          <dd>{formatEth(summary.subtotal)}</dd>
        </div>
        <div className="flex h-8 items-center justify-between">
          <dt>Desconto do lançamento</dt>
          <dd>(-) {formatEth(summary.discount)}</dd>
        </div>
        <div className="flex h-8 items-center justify-between">
          <dt>Taxa de rede</dt>
          <dd>{formatEth(summary.networkFee)}</dd>
        </div>
        <p className="h-4 text-right text-[0.6875rem] text-primary">Taxa estimada</p>
        <div className="mt-3 flex h-8 items-center justify-between border-t pt-3 font-bold">
          <dt>Total</dt>
          <dd className="text-primary">{formatEth(summary.total)}</dd>
        </div>
      </dl>
      {quote && <p className="mt-2 text-xs text-muted-foreground">Valores confirmados pela cotação.</p>}
    </section>
  )
}

// "Tem um código promocional? Aplique aqui" (Figma): abre o mesmo formulário do carrinho.
// Aplicar ou remover o cupom muda o carrinho; se já havia cotação, o fluxo a marca como desatualizada.
function PromoCode({ couponCode }: { couponCode: string | null }) {
  const [open, setOpen] = useState(false)
  const panelId = 'checkout-promo'
  // com cupom aplicado o formulário fica à vista, para poder remover
  const expanded = open || couponCode !== null

  return (
    <div className="mt-4">
      {!expanded && (
        <button
          type="button"
          aria-expanded={false}
          aria-controls={panelId}
          onClick={() => setOpen(true)}
          className="block w-full text-center text-sm outline-none hover:text-primary focus-visible:ring-3 focus-visible:ring-ring"
        >
          Tem um código promocional? <span className="underline underline-offset-4">Aplique aqui</span>
        </button>
      )}
      <div id={panelId} hidden={!expanded}>
        {expanded && <CouponForm couponCode={couponCode} />}
      </div>
    </div>
  )
}
