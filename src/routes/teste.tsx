import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { socket } from '@/shared/api/socket'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/teste')({ component: Teste })

function Teste() {
  const [connected, setConnected] = useState(false)
  const [log, setLog] = useState<string[]>([])
  const add = (msg: string) => setLog((l) => [msg, ...l].slice(0, 10))

  useEffect(() => {
    const onConnect = () => { setConnected(true); add('connect') }
    const onDisconnect = () => { setConnected(false); add('disconnect') }
    const onNft = (data: unknown) => add(`nft.updated ${JSON.stringify(data)}`)
    const onPong = (data: unknown) => add(`pong:test ${JSON.stringify(data)}`)

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('nft.updated', onNft)
    socket.on('pong:test', onPong)
    socket.connect()

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('nft.updated', onNft)
      socket.off('pong:test', onPong)
      socket.disconnect()
    }
  }, [])

  return (
    <main className="p-4 space-y-4">
      <p>Socket: {connected ? 'conectado' : 'desconectado'}</p>
      <div className="flex gap-2">
        <Button onClick={() => socket.emit('ping:test', 'olá')}>Enviar ping</Button>
        <Button variant="outline" onClick={() => socket.disconnect()}>Desconectar</Button>
        <Button variant="outline" onClick={() => socket.connect()}>Reconectar</Button>
      </div>
      <ul className="font-mono text-sm">{log.map((l, i) => <li key={i}>{l}</li>)}</ul>
    </main>
  )
}