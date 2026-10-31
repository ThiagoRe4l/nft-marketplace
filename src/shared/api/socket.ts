import { io } from 'socket.io-client'

export const socket = io(import.meta.env.VITE_SOCKET_URL, {
  transports: ['websocket'], // o MSW intercepta WebSocket, não long-polling
  autoConnect: false,
})