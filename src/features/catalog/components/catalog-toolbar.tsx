import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { z } from 'zod'
import { NftSort, NftTab } from '@/contracts/nft'
import { SORT_OPTIONS, TAB_LABELS } from './labels'

type Tab = z.infer<typeof NftTab>
type Sort = z.infer<typeof NftSort>

type CatalogToolbarProps = {
  tab: Tab
  sort: Sort
  onTabChange: (tab: Tab) => void
  onSortChange: (sort: Sort) => void
}

export function CatalogToolbar({ tab, sort, onTabChange, onSortChange }: CatalogToolbarProps) {
  return (
    <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
      <Tabs
        value={tab}
        onValueChange={(value) => {
          const parsed = NftTab.safeParse(value)
          if (parsed.success) onTabChange(parsed.data)
        }}
        className="max-w-full overflow-x-auto"
      >
        <TabsList variant="line" aria-label="Filtrar por" className="h-auto gap-2.5 pb-2 md:gap-4">
          {NftTab.options.map((option) => (
            <TabsTrigger
              key={option}
              value={option}
              className="h-auto flex-none px-0 text-sm text-foreground md:text-base after:bg-primary data-active:text-primary group-data-[orientation=horizontal]/tabs:after:bottom-[-4px]"
            >
              {TAB_LABELS[option]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex items-center gap-2 text-sm">
        <span id="sort-label" className="whitespace-nowrap">Ordenar por:</span>
        <Select
          value={sort}
          items={SORT_OPTIONS}
          onValueChange={(value) => {
            const parsed = NftSort.safeParse(value)
            if (parsed.success) onSortChange(parsed.data)
          }}
        >
          <SelectTrigger aria-labelledby="sort-label" className="min-w-52 border-0 bg-transparent px-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false} align="end">
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
