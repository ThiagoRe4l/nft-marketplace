import { z } from 'zod'
import { Network } from '@/contracts/nft'
import { UpsertWalletInput, WalletType } from '@/contracts/wallet'

// Campos e regras da carteira vêm do contrato (inclusive "endereço conforme a rede").
// safeExtend mantém a validação do endereço; aqui entram só o que é do formulário:
// a carteira escolhida, a observação, o endereço secundário como texto livre e
// mensagens em português para os selects.
export const CheckoutFormSchema = UpsertWalletInput.safeExtend({
  walletId: z.string().min(1, 'Selecione uma carteira'),
  network: z.enum(Network.options, { error: 'Selecione uma rede' }),
  type: z.enum(WalletType.options, { error: 'Selecione o tipo de carteira' }),
  secondaryAddress: z.string(),
  note: z.string().max(500, 'Máximo de 500 caracteres'),
})
export type CheckoutValues = z.infer<typeof CheckoutFormSchema>
