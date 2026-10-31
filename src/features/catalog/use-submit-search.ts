import { useNavigate } from '@tanstack/react-router'

// busca vinda do Header ou do campo mobile: vai para o catálogo da Início com q (página zerada)
export function useSubmitSearch() {
  const navigate = useNavigate()
  return (query: string) =>
    navigate({ to: '/', search: { q: query.trim() || undefined }, hash: 'catalogo' })
}
