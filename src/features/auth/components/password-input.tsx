import { useState, type ComponentProps } from 'react'
import { EyeIcon, EyeOffIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

// campo de senha com botão de mostrar/ocultar; o ref vem do register do react-hook-form
export function PasswordInput({ className, ...props }: Omit<ComponentProps<'input'>, 'type'>) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <Input type={visible ? 'text' : 'password'} className={cn('pr-10', className)} {...props} />
      <button
        type="button"
        aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
        aria-pressed={visible}
        onClick={() => setVisible((v) => !v)}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-border-strong outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring md:w-10"
      >
        {visible ? <EyeIcon className="size-4 max-md:size-[18px]" /> : <EyeOffIcon className="size-4 max-md:size-[18px]" />}
      </button>
    </div>
  )
}
