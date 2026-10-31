import { cn } from "@/lib/utils"

// shimmer via gradiente deslizante; com prefers-reduced-motion fica estático
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn(
        "animate-shimmer rounded-md bg-muted bg-[linear-gradient(90deg,var(--muted)_0%,var(--border)_50%,var(--muted)_100%)] bg-[length:200%_100%] motion-reduce:animate-none",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
