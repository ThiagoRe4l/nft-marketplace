import { Link } from '@tanstack/react-router'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

// 1 ... 4 [5] 6 ... 12
const SHOW_ALL_UP_TO = 7

function pageWindow(current: number, total: number): (number | 'gap')[] {
  if (total <= SHOW_ALL_UP_TO) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = new Set([1, total, current - 1, current, current + 1].filter((p) => p >= 1 && p <= total))
  const sorted = [...pages].sort((a, b) => a - b)
  return sorted.flatMap((page, i): (number | 'gap')[] => (i > 0 && page - sorted[i - 1] > 1 ? ['gap', page] : [page]))
}

const itemClass =
  'flex size-8 items-center justify-center rounded-sm border border-border-strong text-sm outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring'

type CatalogPaginationProps = { page: number; total: number; pageSize: number }

// mudar de página é navegação: links reais (clique do meio, nova aba, rastreáveis)
export function CatalogPagination({ page, total, pageSize }: CatalogPaginationProps) {
  const totalPages = Math.ceil(total / pageSize)
  if (totalPages <= 1) return null

  const pageLink = (target: number) => ({
    from: '/' as const,
    to: '.' as const,
    search: (prev: Record<string, unknown>) => ({ ...prev, page: target === 1 ? undefined : target }),
    hash: 'catalogo',
    resetScroll: false,
    // só o link da página exibida é "ativo" (senão todos ganham aria-current)
    activeOptions: { exact: true },
  })

  return (
    <nav aria-label="Paginação" className="mt-10 flex justify-center md:justify-end">
      <ul className="flex items-center gap-2">
        {page > 1 && (
          <li>
            <Link {...pageLink(page - 1)} aria-label="Página anterior" className={itemClass}>
              <ChevronLeftIcon className="size-4" />
            </Link>
          </li>
        )}
        {pageWindow(page, totalPages).map((item, i) =>
          item === 'gap' ? (
            <li key={`gap-${i}`} aria-hidden="true" className="px-1 text-muted-foreground">
              …
            </li>
          ) : (
            <li key={item}>
              <Link
                {...pageLink(item)}
                aria-label={`Página ${item}`}
                aria-current={item === page ? 'page' : undefined}
                className={cn(itemClass, item === page && 'border-primary bg-primary font-bold text-primary-foreground hover:bg-primary')}
              >
                {item}
              </Link>
            </li>
          ),
        )}
        {page < totalPages && (
          <li>
            <Link {...pageLink(page + 1)} aria-label="Próxima página" className={itemClass}>
              <ChevronRightIcon className="size-4" />
            </Link>
          </li>
        )}
      </ul>
    </nav>
  )
}
