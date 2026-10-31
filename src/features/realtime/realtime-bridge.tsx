import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { io } from 'socket.io-client'
import { toast } from 'sonner'
import type { Cart } from '@/contracts/cart'
import { NftUpdatedEvent, OrderUpdatedEvent } from '@/contracts/events'
import type { Nft } from '@/contracts/nft'
import type { Order } from '@/contracts/order'
import { useSession } from '@/features/auth/session'
import { cartKeys } from '@/features/cart/queries'
import { nftKeys } from '@/features/catalog/queries'
import { orderKeys } from '@/features/orders/keys'
import { tokenStorage } from '@/shared/api/storage'

const MAX_SEEN_EVENTS = 500

const debug = (...args: unknown[]) => {
  if (import.meta.env.DEV) console.debug('[realtime]', ...args)
}

// Uma conexão por sessão. Não renderiza nada: só liga o socket ao cache do Query.
export function RealtimeBridge() {
  const queryClient = useQueryClient()
  const session = useSession()
  const userId = session.data?.user.id ?? null
  const sessionKnown = !session.isPending

  useEffect(() => {
    if (!sessionKnown) return

    const token = tokenStorage.get()
    const socket = io(import.meta.env.VITE_SOCKET_URL, {
      transports: ['websocket'], // o MSW intercepta WebSocket, não long-polling
      query: token ? { token } : undefined,
    })

    const seen = new Set<string>()
    const versions = new Map<string, number>() // "nft:<id>" ou "order:<id>" -> última versão aplicada

    // aceita só eventos inéditos e mais novos que o estado conhecido
    function accept(eventId: string, key: string, version: number, cachedVersion = 0) {
      if (seen.has(eventId)) {
        debug('duplicata ignorada', eventId)
        return false
      }
      seen.add(eventId)
      if (seen.size > MAX_SEEN_EVENTS) seen.delete(seen.values().next().value as string)

      const known = Math.max(versions.get(key) ?? 0, cachedVersion)
      if (version <= known) {
        debug('evento antigo ignorado', key, `v${version} <= v${known}`)
        return false
      }
      versions.set(key, version)
      return true
    }

    socket.on('nft.updated', (raw: unknown) => {
      const parsed = NftUpdatedEvent.safeParse(raw)
      if (!parsed.success) return
      const event = parsed.data
      const id = event.resource.id

      const detail = queryClient.getQueryData<Nft>(nftKeys.detail(id))
      if (!accept(event.eventId, `nft:${id}`, event.version, detail?.version)) return
      debug('nft.updated aplicado', id, `v${event.version}`)

      // detalhe: aplica preço e estoque de cada edição direto no cache
      queryClient.setQueryData<Nft>(nftKeys.detail(id), (old) =>
        old && {
          ...old,
          version: event.version,
          editions: old.editions.map((edition) => {
            const patch = event.payload.editions.find((p) => p.id === edition.id)
            return patch ? { ...edition, ...patch } : edition
          }),
        },
      )

      // listas e destaques: o preço do card é regra do servidor (edição mais barata disponível)
      void queryClient.invalidateQueries({
        queryKey: nftKeys.all,
        predicate: (query) => query.queryKey[1] !== 'detail',
      })

      // carrinho: se o NFT está nele, o servidor recalcula o resumo
      const cart = queryClient.getQueryData<Cart>(cartKeys.owner(userId ?? 'guest'))
      const item = cart?.items.find((i) => i.nftId === id)
      if (!item) return
      void queryClient.invalidateQueries({ queryKey: cartKeys.all })

      // só avisa quando muda algo que afeta o item (a própria reserva de estoque não gera aviso)
      const patch = event.payload.editions.find((p) => p.id === item.editionId)
      const priceChanged = patch && patch.price !== item.nft.unitPrice
      const notEnough = patch && patch.available !== null && patch.available < item.quantity
      if (priceChanged || notEnough) {
        toast.info(`${item.nft.name} mudou de preço ou disponibilidade. O resumo foi atualizado.`, {
          id: `nft-changed-${id}`,
        })
      }
    })

    socket.on('order.updated', (raw: unknown) => {
      const parsed = OrderUpdatedEvent.safeParse(raw)
      if (!parsed.success) return
      const event = parsed.data
      const key = orderKeys.detail(event.resource.id)

      const cached = queryClient.getQueryData<Order>(key)
      if (!accept(event.eventId, `order:${event.resource.id}`, event.version, cached?.version)) return
      debug('order.updated aplicado', event.resource.id, event.payload.status)

      // mostra o novo estado na hora...
      queryClient.setQueryData<Order>(key, (old) => old && { ...old, ...event.payload, version: event.version })

      if (event.payload.status !== 'pending') {
        // ...e busca o recibo completo (confirmedAt, explorerUrl)
        void queryClient.invalidateQueries({ queryKey: key })
        // confirmado: os itens comprados saíram do carrinho no servidor
        if (event.payload.status === 'confirmed') void queryClient.invalidateQueries({ queryKey: cartKeys.all })
      }
    })

    // eventos da queda se perderam: a API REST volta a ser a fonte da verdade
    const onReconnect = () => {
      debug('reconectado: reconciliando com a API')
      void queryClient.invalidateQueries({ queryKey: nftKeys.all })
      void queryClient.invalidateQueries({ queryKey: cartKeys.all })
      void queryClient.invalidateQueries({ queryKey: orderKeys.all })
    }
    socket.io.on('reconnect', onReconnect)

    // fim do ciclo de vida (logout, troca de usuário): libera listeners e fecha a conexão
    return () => {
      socket.io.off('reconnect', onReconnect)
      socket.removeAllListeners()
      socket.disconnect()
    }
  }, [sessionKnown, userId, queryClient])

  return null
}