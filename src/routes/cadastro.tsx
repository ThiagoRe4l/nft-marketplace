import { createFileRoute, redirect } from '@tanstack/react-router'

// o cadastro também é um diálogo sobre a Início
export const Route = createFileRoute('/cadastro')({
  beforeLoad: ({ search }) => {
    throw redirect({ to: '/', search: { auth: 'signup', redirect: search.redirect, reason: search.reason } })
  },
})
