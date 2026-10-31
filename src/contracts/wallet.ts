import { z } from 'zod'
import { Id } from './common'
import { Network } from './nft'

export const WalletType = z.enum(['metamask', 'walletconnect', 'coinbase'])
export const WalletSlot = z.enum(['primary', 'secondary'])

const WalletFields = z.object({
  displayName: z.string().min(1, 'Obrigatório'),
  nickname: z.string().min(1, 'Obrigatório'),
  profileName: z.string().min(1, 'Obrigatório'),
  network: Network,
  address: z.string(),
  secondaryAddress: z.string().nullable(),
  type: WalletType,
  referralCode: z.string().min(1, 'Obrigatório'),
  email: z.email('E-mail inválido'),
  ensName: z.string().min(1, 'Obrigatório'),
})

// endereço muda de formato conforme a rede
const validateAddress = (d: { network: string; address: string }, ctx: z.RefinementCtx) => {
  const evm = /^0x[a-fA-F0-9]{40}$/
  const solana = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/
  const ok = d.network === 'solana' ? solana.test(d.address) : evm.test(d.address)
  if (!ok) ctx.addIssue({ code: 'custom', path: ['address'], message: 'Endereço inválido para a rede' })
}

export const UpsertWalletInput = WalletFields.superRefine(validateAddress)
export const Wallet = WalletFields.extend({ id: Id, slot: WalletSlot })
export type Wallet = z.infer<typeof Wallet>