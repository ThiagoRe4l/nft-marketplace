import type { ReactNode } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  BellRingIcon,
  DownloadIcon,
  HeartIcon,
  LifeBuoyIcon,
  LogOutIcon,
  MapPinIcon,
  ShoppingBagIcon,
  UserIcon,
  type LucideIcon,
} from 'lucide-react'
import { useLogout } from '@/features/auth/session'
import { cn } from '@/lib/utils'
import { comingSoon } from '@/shared/lib/coming-soon'

// o item da página atual (aria-current) ganha a barra lateral e o fundo
const itemClass = cn(
  'relative flex shrink-0 items-center gap-3 px-4 py-3 text-sm whitespace-nowrap text-primary outline-none transition-colors',
  'hover:bg-muted focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring lg:w-full lg:px-5',
  'aria-[current=page]:bg-muted aria-[current=page]:before:absolute aria-[current=page]:before:inset-y-0',
  'aria-[current=page]:before:left-0 aria-[current=page]:before:w-1 aria-[current=page]:before:bg-primary',
  "aria-[current=page]:before:content-['']",
)

const SOON: { label: string; icon: LucideIcon }[] = [
  { label: 'Atividade', icon: ShoppingBagIcon },
  { label: 'Lista de interesse', icon: HeartIcon },
  { label: 'Ofertas', icon: BellRingIcon },
  { label: 'Arquivos baixados', icon: DownloadIcon },
  { label: 'Suporte', icon: LifeBuoyIcon },
]

// menu lateral no desktop; no mobile vira uma lista horizontal rolável acima do conteúdo
export function AccountLayout({ children }: { children: ReactNode }) {
  const logout = useLogout()
  const navigate = useNavigate()

  return (
    <div className="mx-auto grid w-full max-w-page gap-x-7 gap-y-6 px-gutter py-8 lg:grid-cols-[19.375rem_minmax(0,1fr)] lg:items-start">
      <nav aria-label="Meu perfil" className="min-w-0 bg-card">
        <p className="hidden px-5 pt-3 pb-2 text-lg font-bold lg:block" aria-hidden="true">
          Meu perfil
        </p>
        <ul className="flex overflow-x-auto lg:block lg:overflow-visible">
          <li className="flex lg:block">
            <Link to="/perfil" className={itemClass} activeOptions={{ exact: true }}>
              <UserIcon className="size-4" /> Dados do perfil
            </Link>
          </li>
          <li className="flex lg:block">
            <Link to="/carteiras" className={itemClass} activeOptions={{ exact: true }}>
              <MapPinIcon className="size-4" /> Carteiras
            </Link>
          </li>
          {SOON.map(({ label, icon: Icon }) => (
            <li key={label} className="flex lg:block">
              <button type="button" onClick={comingSoon} className={itemClass}>
                <Icon className="size-4" /> {label}
              </button>
            </li>
          ))}
          <li className="flex lg:mt-1 lg:block lg:border-t">
            <button
              type="button"
              disabled={logout.isPending}
              onClick={() => logout.mutate(undefined, { onSuccess: () => navigate({ to: '/' }) })}
              className={cn(itemClass, 'font-bold')}
            >
              <LogOutIcon className="size-4" /> Sair
            </button>
          </li>
        </ul>
      </nav>
      <div className="min-w-0">{children}</div>
    </div>
  )
}
