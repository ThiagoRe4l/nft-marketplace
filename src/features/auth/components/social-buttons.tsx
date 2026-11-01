import { FacebookIcon } from '@/components/layout/social-icons'
import { comingSoon } from '@/shared/lib/coming-soon'
import { GoogleIcon } from './google-icon'

const buttonClass =
  'flex h-10 w-full items-center justify-center gap-3 border border-border bg-transparent px-4 text-xs font-medium text-muted-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring max-md:rounded-[5px] max-md:text-[0.8125rem]'

export function SocialButtons() {
  return (
    // mobile (Figma): divisor com linhas dos dois lados do texto, 12 px até os botões e 16 px entre eles
    <div className="max-md:flex max-md:flex-col max-md:gap-3">
      <div className="relative my-6 flex items-center justify-center max-md:my-0 max-md:gap-2.5">
        <div className="h-px flex-1 bg-border md:absolute md:inset-x-0 md:top-1/2 md:flex-none" aria-hidden="true" />
        <span className="relative bg-card px-3 text-xs max-md:bg-transparent max-md:px-0 max-md:text-[0.8125rem]">Ou continue com</span>
        <div className="h-px flex-1 bg-border md:hidden" aria-hidden="true" />
      </div>
      <div className="space-y-3 max-md:space-y-4">
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
    </div>
  )
}
