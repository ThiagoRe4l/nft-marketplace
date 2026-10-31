import { ws } from 'msw'
import { toSocketIo } from '@mswjs/socket.io-binding'

// o socket.io-client conecta em .../socket.io/?EIO=4&transport=websocket
export const realtime = ws.link(`${import.meta.env.VITE_SOCKET_URL}/*`)

export const socketHandlers = [
  realtime.addEventListener('connection', (connection) => {
    const io = toSocketIo(connection)

    io.client.on('ping:test', (...args) => {
      console.log('[mock] recebeu ping:test', args)
      io.client.emit('pong:test', { at: Date.now() })
    })

    // simula o servidor empurrando eventos
    const timer = setInterval(() => {
      io.client.emit('nft.updated', { eventId: crypto.randomUUID(), version: Date.now() })
    }, 3000)

    connection.client.addEventListener('close', () => clearInterval(timer))
  }),
]