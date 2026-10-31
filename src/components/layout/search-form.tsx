import { useId, type FormEvent, type KeyboardEvent } from 'react'
import { SearchIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type SearchFormProps = {
  onSearch: (query: string) => void
  label: string
  placeholder: string
  defaultValue?: string
  autoFocus?: boolean
  onEscape?: () => void
  className?: string
}

// campo de busca controlado pelo formulário: quem usa decide o que fazer com o texto
export function SearchForm({ onSearch, label, placeholder, defaultValue, autoFocus, onEscape, className }: SearchFormProps) {
  const id = useId()

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const value = new FormData(event.currentTarget).get('q')
    onSearch(typeof value === 'string' ? value : '')
  }

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') onEscape?.()
  }

  return (
    <form role="search" onSubmit={onSubmit} className={cn('relative', className)}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <SearchIcon aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-primary" />
      <input
        id={id}
        name="q"
        type="search"
        autoFocus={autoFocus}
        defaultValue={defaultValue}
        placeholder={placeholder}
        onKeyDown={onKeyDown}
        className="h-12 w-full rounded-xl bg-card pr-4 pl-11 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring md:rounded-md md:border md:border-border-strong md:bg-background"
      />
    </form>
  )
}
