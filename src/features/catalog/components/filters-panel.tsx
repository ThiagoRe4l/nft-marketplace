import { useId, useState } from 'react'
import Big from 'big.js'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
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
    <div className="space-y-8 bg-card p-5 md:rounded-sm">
      <CheckboxGroup
        legend="Coleções"
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
      <CheckboxGroup
        legend="Rede"
        options={facets?.networks}
        labels={NETWORK_LABELS}
        selected={value.network}
        onChange={(network) => onChange({ network })}
      />
    </div>
  )
}

type CheckboxGroupProps<T extends Category | Network> = {
  legend: string
  options: { value: T; count: number }[] | undefined
  labels: Record<T, string>
  selected: T[] | undefined
  onChange: (next: T[] | undefined) => void
}

function CheckboxGroup<T extends Category | Network>({ legend, options, labels, selected, onChange }: CheckboxGroupProps<T>) {
  const prefix = useId()
  const toggle = (option: T, checked: boolean) => {
    const current = selected ?? []
    const next = checked ? [...current, option] : current.filter((item) => item !== option)
    onChange(next.length > 0 ? next : undefined)
  }

  return (
    <fieldset>
      <legend className="mb-3 text-base font-bold">{legend}</legend>
      <ul className="space-y-3 text-sm">
        {options?.map((option) => {
          const id = `${prefix}-${option.value}`
          return (
            <li key={option.value} className="flex items-center gap-2">
              <Checkbox
                id={id}
                checked={selected?.includes(option.value) ?? false}
                onCheckedChange={(checked) => toggle(option.value, checked)}
              />
              <Label htmlFor={id} className="flex-1 justify-between gap-2 text-muted-foreground">
                <span>{labels[option.value]}</span>
                <span className="text-foreground">({option.count})</span>
              </Label>
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
        <legend className="mb-3 text-base font-bold">Faixa de preço</legend>
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
      <legend className="mb-3 text-base font-bold">Faixa de preço</legend>
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
      <p className="mt-4 text-sm" aria-live="polite">
        Preço: {label(current[0])} - {label(current[1])} ETH
      </p>
      <Button type="button" className="mt-3 h-8 px-3 font-bold" onClick={apply}>
        Aplicar
      </Button>
    </fieldset>
  )
}
