import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/teste')({
  component: () => <p className="p-4">Rota de teste</p>,
})