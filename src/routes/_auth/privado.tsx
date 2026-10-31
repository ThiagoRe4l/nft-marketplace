import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { User } from '@/contracts/auth'
import { request } from '@/shared/api/client'

export const Route = createFileRoute('/_auth/privado')({ component: Privado })

function Privado() {
  const { session } = Route.useRouteContext()
  const profile = useQuery({
    queryKey: ['profile', session.user.id], // dado privado: a chave leva o usuário
    queryFn: ({ signal }) => request(User, { url: '/profile', signal }),
  })
  return (
    <main className="p-4">
      <p>Sessão: {session.user.displayName}</p>
      <p>Perfil: {profile.isPending ? 'carregando...' : (profile.data?.email ?? 'erro')}</p>
      <button onClick={() => profile.refetch()}>Recarregar perfil</button>
    </main>
  )
}