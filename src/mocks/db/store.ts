import { createSeed } from './seed'
import type { DbState } from './types'

const STORAGE_KEY = 'kurio-mock-db'
let state: DbState

function load(): DbState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as DbState
      if (parsed.schemaVersion === 1) return parsed
    }
  } catch {
    // storage bloqueado ou corrompido: volta ao estado inicial
  }
  return createSeed()
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // sem persistência; o mock continua funcionando em memória
  }
}

export const db = {
  init() {
    state = load()
    persist()
  },
  read(): Readonly<DbState> {
    return state
  },
  // Porta única de escrita: toda alteração passa por aqui e é persistida,
  // então nenhum handler consegue esquecer de salvar.
  write<T>(fn: (s: DbState) => T): T {
    const result = fn(state) // 1. aplica a alteração
    persist()                // 2. salva no localStorage, sempre
    return result
  },
  reset() {
    state = createSeed()
    persist()
  },
}