import type { QueryClient } from '@tanstack/react-query'
import { redirect } from '@tanstack/react-router'
import { sessionQuery } from './session'
import { withoutAuthParams } from './redirect'

// beforeLoad das rotas privadas: sem sessão, abre o diálogo de login na Início e guarda a página para voltar depois.
// Uso: createFileRoute('/perfil')({ beforeLoad: requireAuth })
// (um layout _auth.tsx sem filhas conflita com "/" no gerador de rotas; ao ter rotas privadas, ele pode voltar e chamar esta função)
export async function requireAuth({ context, location }: { context: { queryClient: QueryClient }; location: { href: string } }) {
  const session = await context.queryClient.ensureQueryData(sessionQuery)
  if (!session) {
    throw redirect({ to: '/', search: { auth: 'login', redirect: withoutAuthParams(location.href) } })
  }
  return { session }
}
