import { FacebookIcon } from '@/components/layout/social-icons'
import { comingSoon } from '@/shared/lib/coming-soon'
import { GoogleIcon } from './google-icon'

const buttonClass =
  'flex h-10 w-full items-center justify-center gap-3 border border-border bg-transparent px-4 text-xs font-medium text-muted-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring max-md:rounded-md'

export function SocialButtons() {
  return (
    <>
      <div className="relative my-6 flex items-center justify-center">
        <div className="absolute inset-x-0 top-1/2 h-px bg-border" aria-hidden="true" />
        <span className="relative bg-card px-3 text-xs">Ou continue com</span>
      </div>
      <div className="space-y-3">
        <button type="button" className={buttonClass} onClick={comingSoon}>
          <GoogleIcon /> Continuar com Google
        </button>
        <button type="button" className={buttonClass} onClick={comingSoon}>
          <span className="text-[#4267B2]">
            <FacebookIcon />
          </span>
          Continuar com Facebook
        </button>
      </div>
    </>
  )
}
