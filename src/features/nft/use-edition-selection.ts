import { useState } from 'react'
import type { Nft } from '@/contracts/nft'
import { defaultEdition, isSoldOut, maxQuantity } from './purchase'

// Edição e quantidade escolhidas no detalhe. O estado fica acima da galeria, do preço e dos botões
// porque as miniaturas, os seletores de edição e o preço andam juntos.
export function useEditionSelection(nft: Nft) {
  const [editionId, setEditionId] = useState<string | null>(null)
  const [requested, setRequested] = useState(1)

  // a edição vem sempre do dado atual: se o estoque mudar por evento, a tela acompanha
  const edition = nft.editions.find((e) => e.id === editionId) ?? defaultEdition(nft.editions)
  const soldOut = isSoldOut(edition)
  const max = Math.max(1, maxQuantity(edition))
  const quantity = Math.min(requested, max)

  const selectEdition = (id: string) => {
    setEditionId(id)
    setRequested(1)
  }

  return { edition, soldOut, max, quantity, selectEdition, setQuantity: setRequested }
}

export type EditionSelection = ReturnType<typeof useEditionSelection>
