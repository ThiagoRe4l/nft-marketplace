import { Link } from '@tanstack/react-router'
import { Radio } from '@base-ui/react/radio'
import { RadioGroup } from '@base-ui/react/radio-group'
import { CheckIcon, WalletIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Wallet } from '@/contracts/wallet'
import { NETWORK_LABELS } from '@/features/catalog/components/labels'
import { cn } from '@/lib/utils'
import { shortHash, walletLabel } from '../labels'

const linkClass =
  'text-sm text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring'

// as opções são as carteiras cadastradas; escolher uma preenche o formulário com os dados dela
export function WalletPicker({
  wallets,
  value,
  onChange,
  error,
  className,
}: {
  wallets: Wallet[]
  value: string
  onChange: (walletId: string) => void
  error?: string
  className?: string
}) {
  if (wallets.length === 0) {
    return (
      <div className={cn('space-y-2 rounded-sm border border-dashed border-border p-4 text-sm', className)}>
        <p className="font-bold">Cadastre uma carteira para pagar</p>
        <p className="text-muted-foreground">O pagamento usa uma das suas carteiras cadastradas.</p>
        <Link to="/carteiras" className={linkClass}>
          Cadastrar carteira
        </Link>
      </div>
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      <RadioGroup
        aria-label="Carteira"
        value={value}
        onValueChange={(next) => typeof next === 'string' && onChange(next)}
        className="flex-col flex-nowrap gap-2"
      >
        {wallets.map((wallet) => (
          <Radio.Root
            key={wallet.id}
            value={wallet.id}
            className="flex w-full cursor-pointer items-start gap-3 rounded-sm border border-border p-3 text-left text-sm outline-none transition-colors hover:border-primary/60 focus-visible:ring-3 focus-visible:ring-ring data-checked:border-primary max-lg:min-h-11 max-lg:rounded-2xl max-lg:bg-card max-lg:p-4"
          >
            <span
              aria-hidden="true"
              className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border border-primary"
            >
              <Radio.Indicator className="block size-2 rounded-full bg-primary" />
            </span>
            <span className="min-w-0 space-y-0.5">
              <span className="block font-bold">{walletLabel(wallet)}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {wallet.nickname} · {shortHash(wallet.address)}
              </span>
              <span className="block text-xs text-muted-foreground">Rede {NETWORK_LABELS[wallet.network]}</span>
            </span>
          </Radio.Root>
        ))}
      </RadioGroup>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {!wallets.some((w) => w.slot === 'secondary') && (
        <Link to="/carteiras" className={linkClass}>
          Cadastrar carteira secundária
        </Link>
      )}
    </div>
  )
}

// estado da conexão da carteira escolhida
export function WalletConnection({
  wallet,
  connected,
  pending,
  error,
  onConnect,
  onDisconnect,
  className,
}: {
  wallet: Wallet | undefined
  connected: boolean
  pending: boolean
  error: string | null
  onConnect: () => void
  onDisconnect: () => void
  className?: string
}) {
  if (!wallet) return null

  return (
    <div className={cn('space-y-2', className)}>
      {error && (
        <p role="alert" className="border border-destructive/50 p-3 text-sm text-destructive">
          {error}
        </p>
      )}
      {connected ? (
        <div className="flex items-center justify-between gap-3 rounded-sm bg-card p-3 text-sm">
          <p role="status" className="flex items-center gap-2 font-bold text-primary">
            <CheckIcon className="size-4" aria-hidden="true" />
            Carteira conectada
          </p>
          <Button type="button" variant="outline" onClick={onDisconnect}>
            Desconectar
          </Button>
        </div>
      ) : (
        <Button type="button" variant="outline" size="lg" className="h-10 w-full max-lg:h-12 max-lg:rounded-full" disabled={pending} onClick={onConnect}>
          <WalletIcon aria-hidden="true" />
          {pending ? 'Conectando...' : 'Conectar carteira'}
        </Button>
      )}
    </div>
  )
}
