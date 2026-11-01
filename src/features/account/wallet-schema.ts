import { z } from 'zod'
import { Network } from '@/contracts/nft'
import { UpsertWalletInput, WalletType, type Wallet } from '@/contracts/wallet'

// Campos e regras (inclusive "endereço conforme a rede") vêm do contrato; safeExtend mantém a validação do endereço.
// Aqui entram só o que é do formulário: mensagens em português para os selects e o endereço secundário como texto livre.
export const WalletFormSchema = UpsertWalletInput.safeExtend({
  network: z.enum(Network.options, { error: 'Selecione uma rede' }),
  type: z.enum(WalletType.options, { error: 'Selecione o tipo de carteira' }),
  secondaryAddress: z.string(),
})
export type WalletFormValues = z.infer<typeof WalletFormSchema>

export const WALLET_FIELD_KEYS = [
  'displayName',
  'nickname',
  'network',
  'profileName',
  'address',
  'secondaryAddress',
  'type',
  'referralCode',
  'email',
  'ensName',
] as const satisfies readonly (keyof WalletFormValues)[]

export const EMPTY_WALLET = {
  displayName: '',
  nickname: '',
  profileName: '',
  address: '',
  secondaryAddress: '',
  referralCode: '',
  email: '',
  ensName: '',
}

export function walletToValues(wallet: Wallet): WalletFormValues {
  return {
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
  }
}
