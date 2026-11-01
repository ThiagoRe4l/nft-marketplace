import { z } from 'zod'

const Draft = z.record(z.string(), z.string())

// sessionStorage, por usuário: sobrevive a refresh e ao login depois de sessão expirada, e some ao fechar a aba
const storageKey = (userId: string) => `kurio-checkout-draft:${userId}`

export const draftStorage = {
  get(userId: string): Record<string, string> | null {
    try {
      const raw = sessionStorage.getItem(storageKey(userId))
      if (!raw) return null
      const parsed = Draft.safeParse(JSON.parse(raw))
      return parsed.success ? parsed.data : null
    } catch {
      return null
    }
  },
  set(userId: string, values: object) {
    try {
      const strings = Object.entries(values).filter(([, value]) => typeof value === 'string')
      sessionStorage.setItem(storageKey(userId), JSON.stringify(Object.fromEntries(strings)))
    } catch {
      // sem persistência: o rascunho vale só enquanto a página está aberta
    }
  },
  clear(userId: string) {
    try {
      sessionStorage.removeItem(storageKey(userId))
    } catch {
      // nada a fazer
    }
  },
}
