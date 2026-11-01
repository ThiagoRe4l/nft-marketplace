import { useState } from 'react'
import Big from 'big.js'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Slider } from '@/components/ui/slider'
import type { Category, Network, NftListResponse } from '@/contracts/nft'
import type { CatalogSearch } from '../search'
import { CATEGORY_LABELS, NETWORK_LABELS } from './labels'

type FiltersPatch = Partial<Pick<CatalogSearch, 'category' | 'network' | 'minPrice' | 'maxPrice'>>

type FiltersPanelProps = {
  facets: NftListResponse['facets'] | undefined
  priceRange: NftListResponse['priceRange'] | undefined
  value: FiltersPatch
  onChange: (patch: FiltersPatch) => void
}

export function FiltersPanel({ facets, priceRange, value, onChange }: FiltersPanelProps) {
  return (
    <div className="space-y-10 bg-card p-5 md:rounded-sm">
      <FilterGroup
        legend="Coleções"
        boldCount
        options={facets?.categories}
        labels={CATEGORY_LABELS}
        selected={value.category}
        onChange={(category) => onChange({ category })}
      />
      <PriceFilter
        // recomeça do que está na URL quando ela (ou os limites) muda
        key={`${value.minPrice}|${value.maxPrice}|${priceRange?.min}|${priceRange?.max}`}
        priceRange={priceRange}
        minPrice={value.minPrice}
        maxPrice={value.maxPrice}
        onApply={onChange}
      />
      <FilterGroup
        legend="Rede"
        options={facets?.networks}
        labels={NETWORK_LABELS}
        selected={value.network}
        onChange={(network) => onChange({ network })}
      />
    </div>
  )
}

type FilterGroupProps<T extends Category | Network> = {
  legend: string
  options: { value: T; count: number }[] | undefined
  labels: Record<T, string>
  selected: T[] | undefined
  onChange: (next: T[] | undefined) => void
  /** Coleções traz a contagem em negrito; Rede, em peso normal (Figma) */
  boldCount?: boolean
}

// Sem checkbox (Figma): cada item é um botão com aria-pressed; o ativo ganha a cor de destaque. A seleção continua múltipla.
function FilterGroup<T extends Category | Network>({ legend, options, labels, selected, onChange, boldCount }: FilterGroupProps<T>) {
  const toggle = (option: T, active: boolean) => {
    const current = selected ?? []
    const next = active ? current.filter((item) => item !== option) : [...current, option]
    onChange(next.length > 0 ? next : undefined)
  }

  return (
    <fieldset>
      <legend className="mb-3 text-lg leading-4 font-bold">{legend}</legend>
      <ul className="px-3">
        {options?.map((option) => {
          const active = selected?.includes(option.value) ?? false
          return (
            <li key={option.value}>
              <button
                type="button"
                aria-pressed={active}
                onClick={() => toggle(option.value, active)}
                className={cn(
                  'flex h-10 w-full items-center justify-between gap-2 text-left text-[0.9375rem] outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring',
                  active ? 'text-highlight' : 'text-muted-foreground',
                )}
              >
                <span>{labels[option.value]}</span>
                <span className={cn('shrink-0', boldCount && 'font-bold')}>({option.count})</span>
              </button>
            </li>
          )
        })}
      </ul>
    </fieldset>
  )
}

const STEP = 0.01
// os limites do slider são arredondados para fora, para a faixa nunca excluir itens
const floor2 = (value: string) => Big(value).round(2, Big.roundDown)
const ceil2 = (value: string) => Big(value).round(2, Big.roundUp)
const label = (value: number) => Big(value).toFixed(2).replace('.', ',')

type PriceFilterProps = {
  priceRange: NftListResponse['priceRange'] | undefined
  minPrice?: string
  maxPrice?: string
  onApply: (patch: Pick<FiltersPatch, 'minPrice' | 'maxPrice'>) => void
}

function PriceFilter({ priceRange, minPrice, maxPrice, onApply }: PriceFilterProps) {
  const limits = priceRange ? ([floor2(priceRange.min).toNumber(), ceil2(priceRange.max).toNumber()] as const) : null
  const [draft, setDraft] = useState<number[] | null>(null)

  if (!limits) {
    return (
      <fieldset disabled>
        <legend className="mb-3 text-lg leading-4 font-bold">Faixa de preço</legend>
        <p className="text-sm text-muted-foreground">Carregando faixa...</p>
      </fieldset>
    )
  }

  const [low, high] = limits
  const current = draft ?? [minPrice ? Number(minPrice) : low, maxPrice ? Number(maxPrice) : high]

  const apply = () => {
    const [lo, hi] = current
    const isFullRange = lo <= low && hi >= high
    onApply({
      minPrice: isFullRange ? undefined : Big(lo).toFixed(2),
      maxPrice: isFullRange ? undefined : Big(hi).toFixed(2),
    })
  }

  return (
    <fieldset>
      <legend className="mb-3 text-lg leading-4 font-bold">Faixa de preço</legend>
      <Slider
        min={low}
        max={high}
        step={STEP}
        value={current}
        thumbLabels={['Preço mínimo', 'Preço máximo']}
        onValueChange={(next) => {
          if (Array.isArray(next)) setDraft(next)
        }}
      />
      <p className="mt-4 text-[0.9375rem]" aria-live="polite">
        Preço: {label(current[0])} - {label(current[1])} ETH
      </p>
      <Button type="button" className="mt-3 h-9 rounded-md px-3 text-base font-bold" onClick={apply}>
        Aplicar
      </Button>
    </fieldset>
  )
}
