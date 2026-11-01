import type { SVGProps } from 'react'

// Exportado do Figma (docs/figma/icons/Facebook.svg); cores trocadas por currentColor.
// Decorativo por padrão: o nome acessível vem do botão ou link que o contém.
export function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="8" height="16" viewBox="0 0 8 16" fill="none" aria-hidden="true" {...props}>
      <path d="M2 5.33333H0V8H2V16H5.33333V8H7.73333L8 5.33333H5.33333V4.2C5.33333 3.6 5.46667 3.33333 6.06667 3.33333H8V0H5.46667C3.06667 0 2 1.06667 2 3.06667V5.33333Z" fill="currentColor"/>
    </svg>
  )
}
