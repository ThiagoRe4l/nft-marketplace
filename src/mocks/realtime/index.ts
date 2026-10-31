import { ws } from 'msw'
import { toSocketIo } from '@mswjs/socket.io-binding'
import { db } from '../db/store'
import { addClient, removeClient, type RealtimeClient } from './hub'

export const realtime = ws.link(`${import.meta.env.VITE_SOCKET_URL}/*`)

export const socketHandlers = [
  realtime.addEventListener('connection', (connection) => {
    // o cliente manda o token na query da URL; sem token válido, é visitante
    const token = connection.client.url.searchParams.get('token')
    const session = token
      ? db.read().sessions.find((s) => s.token === token && new Date(s.expiresAt) > new Date())
      : undefined

    const client: RealtimeClient = {
      io: toSocketIo(connection),
      userId: session?.userId ?? null,
      ready: false,
      close: () => connection.client.close(),
    }

    // "40" é o pacote do Socket.IO para entrar no namespace: só depois dele a conexão recebe eventos
    connection.client.addEventListener('message', (event) => {
      if (typeof event.data === 'string' && event.data.startsWith('40')) client.ready = true
    })
    
    // O binding não implementa o heartbeat do Engine.IO: sem o "ping" (pacote "2") do servidor, o cliente considera a conexão morta e reconecta a cada ~30 s.
    const heartbeat = setInterval(() => connection.client.send('2'), 10_000)
    connection.client.addEventListener('close', () => {
      clearInterval(heartbeat)
      removeClient(client)
    })
    addClient(client)
  }),
]