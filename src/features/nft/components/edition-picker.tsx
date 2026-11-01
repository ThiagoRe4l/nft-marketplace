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
      <p id="edition-label" className="text-[0.9375rem] leading-4 font-bold">
        Edição:
      </p>
      <RadioGroup aria-labelledby="edition-label" value={value} onValueChange={(next) => onChange(String(next))} className="mt-2 max-md:gap-3 md:mt-3 md:gap-1.5">
        {editions.map((edition) => (
          <RadioPill
            key={edition.id}
            value={edition.id}
            disabled={isSoldOut(edition)}
            // mobile (Figma): pílulas de 14 px mais justas; o ::after leva o alvo de toque a 44 px
            className="relative max-md:px-2 max-md:text-sm max-md:after:absolute max-md:after:-inset-y-2 max-md:after:inset-x-0 max-md:after:content-['']"
          >
            {edition.label}
            {isSoldOut(edition) && <span className="ml-1">(esgotada)</span>}
          </RadioPill>
        ))}
      </RadioGroup>
    </div>
  )
}
