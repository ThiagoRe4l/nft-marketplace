import { Link } from '@tanstack/react-router'
import Big from 'big.js'
import { MailOpenIcon, XIcon } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import type { Order } from '@/contracts/order'
import { NETWORK_LABELS } from '@/features/catalog/components/labels'
import { cn } from '@/lib/utils'
import { formatEth } from '@/shared/lib/money'
import { formatReceiptDate, shortHash, WALLET_TYPE_LABELS } from '../labels'

function Meta({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="min-w-0 border-primary px-3 first:pl-0 last:pr-0 max-sm:px-0 max-sm:py-1 sm:border-l sm:first:border-l-0">
      <dt className={cn('text-xs', strong ? 'font-bold' : 'text-muted-foreground')}>{label}</dt>
      <dd className="truncate text-xs text-muted-foreground">{value}</dd>
    </div>
  )
}

// o recibo usa só o snapshot do pedido (linhas, carteira, valores): nunca consulta o catálogo
export function OrderReceipt({ order }: { order: Order }) {
  const hasDiscount = new Big(order.discount).gt(0)
  const safeExplorer = order.explorerUrl?.startsWith('https://') ? order.explorerUrl : null

  return (
    <article
      aria-labelledby="receipt-title"
      className="relative mx-auto w-full max-w-[36.125rem] border-b-[10px] border-b-primary bg-card"
    >
      <Link
        to="/"
        aria-label="Fechar e voltar ao início"
        className="absolute top-4 right-4 inline-flex size-8 items-center justify-center rounded-full text-primary outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring"
      >
        <XIcon className="size-5" />
      </Link>

      <header className="border-b border-primary/70 px-6 pt-6 pb-5 text-center">
        <MailOpenIcon className="mx-auto mb-4 size-14 text-primary" strokeWidth={1.5} aria-hidden="true" />
        <h1 id="receipt-title" className="text-sm font-bold text-foreground/90 sm:text-base">
          Seus NFTs agora estão na sua carteira
        </h1>
      </header>

      <dl className="grid grid-cols-2 gap-y-3 border-b border-primary/70 px-6 py-4 sm:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <Meta label="ID da transação" value={order.txHash ? shortHash(order.txHash) : '—'} strong />
        <Meta label="Data" value={formatReceiptDate(order.confirmedAt ?? order.createdAt)} />
        <Meta label="Total" value={formatEth(order.total)} />
        <Meta label="Carteira" value={WALLET_TYPE_LABELS[order.wallet.type]} strong />
      </dl>

      <div className="px-6 py-5 sm:px-11">
        <h2 className="mb-3 text-sm font-bold">Detalhes da transação</h2>
        <table className="w-full text-sm">
          <caption className="sr-only">NFTs do pedido</caption>
          <thead>
            <tr className="border-b text-left font-bold">
              <th scope="col" className="pb-2 font-bold">
                NFTs
              </th>
              <th scope="col" className="pb-2 text-center font-bold">
                Edições
              </th>
              <th scope="col" className="pb-2 text-right font-bold">
                Subtotal
              </th>
            </tr>
          </thead>
          <tbody>
            {order.lines.map((line) => (
              <tr key={`${line.nftId}:${line.editionId}`}>
                <td className="py-2 pr-2">
                  <div className="flex items-center gap-3">
                    <img
                      src={line.image}
                      alt=""
                      width={65}
                      height={65}
                      decoding="async"
                      className="size-12 shrink-0 rounded-sm object-cover sm:size-[4.0625rem]"
                    />
                    <div className="min-w-0">
                      <p className="font-bold break-words">{line.name}</p>
                      <p className="text-xs text-muted-foreground">ID do token: {line.tokenId}</p>
                      <p className="text-xs text-muted-foreground">Edição: {line.editionLabel}</p>
                    </div>
                  </div>
                </td>
                <td className="px-2 text-center text-xs whitespace-nowrap text-muted-foreground">
                  <span className="sr-only">Quantidade: </span>(x {line.quantity})
                </td>
                <td className="pl-2 text-right font-bold whitespace-nowrap text-primary">{formatEth(line.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <dl className="mt-3 border-b pb-3 text-sm">
          {hasDiscount && (
            <div className="flex h-7 items-center justify-between">
              <dt>Desconto</dt>
              <dd>(-) {formatEth(order.discount)}</dd>
            </div>
          )}
          <div className="flex h-7 items-center justify-between">
            <dt>Taxa de rede</dt>
            <dd>{formatEth(order.networkFee)}</dd>
          </div>
          <div className="flex h-7 items-center justify-between font-bold">
            <dt>Total</dt>
            <dd className="text-primary">{formatEth(order.total)}</dd>
          </div>
        </dl>

        <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground">
          Transação confirmada na {NETWORK_LABELS[order.network]}. A propriedade foi transferida para sua carteira
          conectada e registrada na rede.
        </p>

        {safeExplorer && (
          <div className="mt-5 space-y-2 text-center">
            <a
              href={safeExplorer}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ size: 'lg' }), 'h-12 px-4 font-bold')}
            >
              Ver no Etherscan
              <span className="sr-only"> (abre em nova aba)</span>
            </a>
            <p className="text-xs text-muted-foreground">
              Demonstração: esta transação é simulada e não existe na rede real.
            </p>
          </div>
        )}

        <div className="mt-5 text-center">
          <Link
            to="/"
            hash="catalogo"
            className="text-sm text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring"
          >
            Continuar explorando
          </Link>
        </div>
      </div>
    </article>
  )
}
