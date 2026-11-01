import type { User } from '@/contracts/auth'
import type { Wallet } from '@/contracts/wallet'
import { CheckoutFormSchema, type CheckoutValues } from './schema'

type Fields = Omit<CheckoutValues, 'note'>

// Rede e tipo começam vazios (o select mostra o placeholder). O tipo do formulário
// não admite '', então o cast fica só aqui.
const blank = <T>() => '' as T

export const walletToValues = (wallet: Wallet): Fields => ({
  displayName: wallet.displayName,
  nickname: wallet.nickname,
  profileName: wallet.profileName,
  network: wallet.network,
  address: wallet.address,
  secondaryAddress: wallet.secondaryAddress ?? '',
  type: wallet.type,
  referralCode: wallet.referralCode,
  email: wallet.email,
  ensName: wallet.ensName,
  walletId: wallet.id,
})

const profileToValues = (user: User): Fields => ({
  displayName: user.displayName,
  nickname: user.walletNickname ?? '',
  profileName: user.username,
  network: blank<Fields['network']>(),
  address: '',
  secondaryAddress: '',
  type: blank<Fields['type']>(),
  referralCode: '',
  email: user.email,
  ensName: user.ensName ?? '',
  walletId: '',
})

const FIELD_KEYS = Object.keys(CheckoutFormSchema.shape) as (keyof CheckoutValues)[]

// perfil + carteira principal; o rascunho (se houver) vale mais que os dois
export function buildDefaults(user: User, wallets: Wallet[], draft: Record<string, string> | null): CheckoutValues {
  const preferred = wallets.find((w) => w.slot === 'primary') ?? wallets[0]
  const base: CheckoutValues = { ...profileToValues(user), ...(preferred ? walletToValues(preferred) : {}), note: '' }
  if (!draft) return base

  const restored = { ...base }
  for (const key of FIELD_KEYS) {
    const value = draft[key]
    if (typeof value === 'string') (restored as Record<string, string>)[key] = value
  }
  // carteira que não existe mais: volta ao padrão, mas a observação digitada fica
  if (restored.walletId && !wallets.some((w) => w.id === restored.walletId)) return { ...base, note: restored.note }
  return restored
}
