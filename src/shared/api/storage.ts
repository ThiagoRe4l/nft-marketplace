const TOKEN_KEY = 'kurio-token'
const CART_KEY = 'kurio-cart-id'

function read(key: string) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    // sem persistência: a sessão dura até o refresh
  }
}

export const tokenStorage = { get: () => read(TOKEN_KEY), set: (v: string | null) => write(TOKEN_KEY, v) }
export const cartIdStorage = { get: () => read(CART_KEY), set: (v: string | null) => write(CART_KEY, v) }