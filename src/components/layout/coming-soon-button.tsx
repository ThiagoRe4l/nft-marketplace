import type { ComponentProps } from 'react'
import { cn } from "@/lib/utils"
import { comingSoon } from '@/shared/lib/coming-soon'

// parece botão de verdade (é um <button>) mas só avisa que ainda não existe
export function ComingSoonButton({ className, onClick, ...props }: ComponentProps<'button'>) {
  return (
    <button
      type="button"
      className={cn('text-left outline-none focus-visible:ring-3 focus-visible:ring-ring', className)}
      onClick={(event) => {
        onClick?.(event)
        comingSoon()
      }}
      {...props}
    />
  )
}
