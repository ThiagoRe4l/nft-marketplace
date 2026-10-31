import { Radio } from "@base-ui/react/radio"
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group"
import { cn } from "@/lib/utils"

function RadioGroup({ className, ...props }: RadioGroupPrimitive.Props) {
  return <RadioGroupPrimitive data-slot="radio-group" className={cn("flex flex-wrap gap-2", className)} {...props} />
}

// opção em forma de pílula (edições do NFT): o texto é o próprio rótulo
function RadioPill({ className, ...props }: Radio.Root.Props) {
  return (
    <Radio.Root
      data-slot="radio-pill"
      className={cn(
        "inline-flex h-7 cursor-pointer items-center rounded-full border border-border px-3 text-xs text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring data-checked:border-primary data-checked:text-foreground data-disabled:cursor-not-allowed data-disabled:opacity-60",
        className
      )}
      {...props}
    />
  )
}

export { RadioGroup, RadioPill }
