import { useCallback, useEffect, useRef, useState } from 'react'

// Leva o foco ao primeiro campo marcado com aria-invalid (na ordem do DOM). O pedido vira estado e o foco
// vai num efeito, depois do commit: assim o erro (de validação ou da API) já está nos campos.
export function useFocusFirstError<T extends HTMLElement = HTMLFormElement>() {
  const ref = useRef<T>(null)
  const [request, setRequest] = useState(0)
  const focus = useCallback(() => setRequest((n) => n + 1), [])

  useEffect(() => {
    if (request > 0) ref.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
  }, [request])

  return { ref, focus }
}
