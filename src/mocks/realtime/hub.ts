import type { toSocketIo } from '@mswjs/socket.io-binding'

type SocketIo = ReturnType<typeof toSocketIo>

export type RealtimeClient = {
  io: SocketIo
  userId: string | null // null = visitante
  ready: boolean        // true depois que o cliente entrou no namespace (pacote "40")
  close: () => void
}

const clients = new Set<RealtimeClient>()

export const addClient = (client: RealtimeClient) => clients.add(client)
export const removeClient = (client: RealtimeClient) => clients.delete(client)

// sem userId: todos recebem. Com userId: só as conexões desse usuário
export function emit(event: string, payload: unknown, userId?: string) {
  for (const client of clients) {
    if (!client.ready) continue
    if (userId !== undefined && client.userId !== userId) continue
    client.io.client.emit(event, payload)
  }
}

export function disconnectAll() {
  for (const client of clients) client.close()
}