import type { Wallet } from '@/contracts/wallet'

export const WALLET_TYPE_LABELS: Record<Wallet['type'], string> = {
  metamask: 'MetaMask',
  walletconnect: 'WalletConnect',
  coinbase: 'Coinbase Wallet',
}

export const SLOT_LABELS: Record<Wallet['slot'], string> = {
  primary: 'Principal',
  secondary: 'Secundária',
}

export const walletLabel = (wallet: Pick<Wallet, 'slot' | 'type'>) =>
  `${SLOT_LABELS[wallet.slot]} — ${WALLET_TYPE_LABELS[wallet.type]}`

// "0xA91F…E82C": começo e fim bastam para reconhecer
export const shortHash = (value: string) => (value.length > 12 ? `${value.slice(0, 6)}…${value.slice(-4)}` : value)

// "29 Jul, 2026" (como no Figma)
export function formatReceiptDate(iso: string): string {
  const parts = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' }).formatToParts(
    new Date(iso),
  )
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  const month = get('month').replace('.', '')
  return `${get('day')} ${month.charAt(0).toUpperCase()}${month.slice(1)}, ${get('year')}`
}
