import { NftImage } from '@/components/nft/nft-image'
import { Link } from '@tanstack/react-router'
import Big from 'big.js'
import { CircleAlertIcon, Trash2Icon } from 'lucide-react'
import type { Cart } from '@/contracts/cart'
import { useRemoveCartItem, useUpdateCartItem } from '@/features/cart/queries'
import { QuantityStepper } from '@/features/nft/components/quantity-stepper'
import { toAppError } from '@/shared/api/errors'
import { formatEth } from '@/shared/lib/money'
import { toast } from 'sonner'

// mesmas colunas do cabeçalho em cart-page.tsx
export const LINE_COLUMNS = 'lg:grid-cols-[minmax(0,1fr)_8.5rem_8.5rem_9rem_3rem]'

function stockWarning(available: number) {
  if (available === 0) return 'Esgotado no momento'
  return available === 1 ? 'Só resta 1 disponível' : `Só restam ${available} disponíveis`
}

export function CartLine({ line }: { line: Cart['items'][number] }) {
  const update = useUpdateCartItem()
  const remove = useRemoveCartItem()
  const busy = update.isPending || remove.isPending
  const { nft } = line

  const max = Math.min(nft.maxPerOrder, nft.available ?? nft.maxPerOrder)
  const lineTotal = formatEth(new Big(nft.unitPrice).times(line.quantity).toFixed())
  const warning = nft.available !== null && line.quantity > nft.available ? stockWarning(nft.available) : null

  const onError = (error: unknown) => toast.error(toAppError(error).message)

  return (
    <li
      aria-busy={busy}
      className={`grid grid-cols-[6rem_minmax(0,1fr)] overflow-hidden rounded-xl bg-card lg:items-center lg:rounded-sm lg:pr-4 ${LINE_COLUMNS}`}
    >
      {/* no desktop, imagem e nome ocupam a primeira coluna; as demais ficam em células próprias */}
      <div className="contents lg:flex lg:items-center lg:gap-4">
        <NftImage
          src={nft.image}
          alt=""
          width={96}
          height={96}
          sizes="96px"
          loading="lazy"
          decoding="async"
          className="row-span-3 size-24 object-cover lg:row-auto lg:size-[4.375rem] lg:shrink-0"
        />
        <div className="min-w-0 space-y-0.5 p-3 pb-0 lg:p-0">
          <Link
            to="/nft/$id"
            params={{ id: line.nftId }}
            className="line-clamp-2 text-sm font-bold break-words outline-none hover:text-primary focus-visible:ring-3 focus-visible:ring-ring"
          >
            {nft.name}
            {/* a edição não aparece na linha (Figma), mas continua no nome acessível */}
            <span className="sr-only"> (edição {nft.editionLabel})</span>
          </Link>
          <p className="text-xs text-muted-foreground">ID do token: {nft.tokenId}</p>
        </div>
      </div>

      <p className="px-3 pt-1 text-xs text-muted-foreground lg:hidden">
        {formatEth(nft.unitPrice)} cada
      </p>
      <p className="hidden text-sm font-bold text-primary lg:block">
        <span className="sr-only">Preço unitário: </span>
        {formatEth(nft.unitPrice)}
      </p>

      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 p-3 pt-1 lg:contents">
        <div className="lg:justify-self-start">
          <QuantityStepper
            value={line.quantity}
            max={max}
            size="sm"
            disabled={busy}
            onChange={(quantity) => update.mutate({ itemId: line.id, quantity }, { onError })}
          />
        </div>
        <p className="text-base font-bold whitespace-nowrap text-primary max-lg:order-first max-lg:w-full lg:text-sm">
          <span className="sr-only">Total da linha: </span>
          {lineTotal}
        </p>
        <button
          type="button"
          aria-label={`Remover ${nft.name} do carrinho`}
          disabled={busy}
          onClick={() => remove.mutate(line.id, { onError })}
          className="inline-flex size-9 items-center justify-center rounded-full text-primary outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40"
        >
          <Trash2Icon className="size-4" />
        </button>
      </div>

      {warning && (
        <p className="col-span-full flex items-center gap-1.5 px-3 pb-3 text-xs font-bold text-destructive lg:col-start-1 lg:px-0 lg:pb-2">
          <CircleAlertIcon className="size-4 shrink-0" aria-hidden="true" />
          {warning}
        </p>
      )}
    </li>
  )
}
