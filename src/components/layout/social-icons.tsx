import type { ComponentProps } from 'react'

// lucide não traz ícones de marca; traçados no mesmo estilo (24x24, stroke 2)
function Svg(props: ComponentProps<'svg'>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="size-4"
      {...props}
    />
  )
}

// Facebook, Instagram, Twitter e LinkedIn vêm do Figma (src/components/icons); o YouTube não foi exportado
export { FacebookIcon, InstagramIcon, LinkedinIcon, TwitterIcon } from '@/components/icons'
export const YoutubeIcon = () => (
  <Svg>
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
    <path d="M9.75 15.02 15.5 11.75 9.75 8.48z" />
  </Svg>
)
