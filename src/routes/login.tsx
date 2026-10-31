import { createFileRoute, redirect } from '@tanstack/react-router'

// rota antiga: o login agora é um diálogo sobre a Início
export const Route = createFileRoute('/login')({
  beforeLoad: ({ search }) => {
    throw redirect({ to: '/', search: { auth: 'login', redirect: search.redirect, reason: search.reason } })
  },
})
