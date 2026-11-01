import { Skeleton } from '@/components/ui/skeleton'
import { useWallets } from '../queries'
import { AccountLayout } from './account-layout'
import { WalletSection } from './wallet-section'

export function WalletsPage() {
  const wallets = useWallets()
  const primary = wallets.data?.find((w) => w.slot === 'primary')
  const secondary = wallets.data?.find((w) => w.slot === 'secondary')

  return (
    <AccountLayout>
      <h1 className="sr-only">Carteiras</h1>
      {wallets.data ? (
        <div className="space-y-10">
          <WalletSection slot="primary" wallet={primary} />
          <WalletSection slot="secondary" wallet={secondary} primary={primary} />
        </div>
      ) : wallets.isError ? (
        <p role="alert" className="text-sm text-destructive">
          Não foi possível carregar as carteiras.{' '}
          <button type="button" onClick={() => wallets.refetch()} className="underline">
            Tentar de novo
          </button>
        </p>
      ) : (
        <div role="status" aria-label="Carregando carteiras" className="grid gap-5 md:grid-cols-2">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      )}
    </AccountLayout>
  )
}
