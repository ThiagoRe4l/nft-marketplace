import { RadioGroup, RadioPill } from '@/components/ui/radio-group'
import type { Edition } from '@/contracts/nft'
import { isSoldOut } from '../purchase'

type EditionPickerProps = {
  editions: Edition[]
  value: string
  onChange: (editionId: string) => void
}

export function EditionPicker({ editions, value, onChange }: EditionPickerProps) {
  return (
    <div>
      <p id="edition-label" className="text-sm font-bold md:text-[0.9375rem] md:leading-4">
        Edição:
      </p>
      <RadioGroup aria-labelledby="edition-label" value={value} onValueChange={(next) => onChange(String(next))} className="mt-2 md:mt-3 md:gap-1.5">
        {editions.map((edition) => (
          <RadioPill key={edition.id} value={edition.id} disabled={isSoldOut(edition)}>
            {edition.label}
            {isSoldOut(edition) && <span className="ml-1">(esgotada)</span>}
          </RadioPill>
        ))}
      </RadioGroup>
    </div>
  )
}
