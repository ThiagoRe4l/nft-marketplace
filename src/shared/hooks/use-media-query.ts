import { useSyncExternalStore } from 'react'

// true quando a media query vale agora (ex.: '(min-width: 768px)'); acompanha mudanças de tamanho
export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(query)
      media.addEventListener('change', onChange)
      return () => media.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}
