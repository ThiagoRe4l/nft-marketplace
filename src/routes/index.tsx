import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/shared/api/client'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  const health = useQuery({
    queryKey: ['health'],
    queryFn: async ({ signal }) =>
      (await api.get<{ status: string }>('/health', { signal })).data,
  })

  return (
    <main className="p-4 space-y-4">
      <p>API: {health.isPending ? 'carregando...' : health.data?.status}</p>
      <Button onClick={() => health.refetch()}>Recarregar</Button>
    </main>
  )
}