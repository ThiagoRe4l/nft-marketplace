import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/carrinho')({
  component: () => <p className="mx-auto w-full max-w-page px-gutter py-10">Carrinho (provisório)</p>,
})
