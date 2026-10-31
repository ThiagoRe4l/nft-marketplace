import axios, { type AxiosRequestConfig } from 'axios'
import type { z } from 'zod'
import { cartIdStorage, tokenStorage } from './storage'

export const api = axios.create({ 
  baseURL: '/api',
  timeout: 10_000,
  paramsSerializer: { indexes: null }, // arrays como ?category=a&category=b
})

// identidade: com sessão vai o token; sem sessão, o carrinho de visitante
api.interceptors.request.use((config) => {
  const token = tokenStorage.get()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  } else {
    const cartId = cartIdStorage.get()
    if (cartId) config.headers['X-Cart-Id'] = cartId
  }
  return config
})

// O cliente só AVISA que a sessão caiu; quem decide o que fazer é a camada de sessão,
// registrada no main.tsx. Assim o cliente não depende do router nem do Query.
let onUnauthorized: (() => void) | null = null
export const setUnauthorizedHandler = (handler: () => void) => {
  onUnauthorized = handler
}

// nessas rotas o 401 é resposta esperada (senha errada, sessão já vencida), não expiração
const AUTH_ROUTES = ['/auth/login', '/auth/signup', '/auth/session', '/auth/logout']

api.interceptors.response.use(undefined, (error) => {
  const url = axios.isAxiosError(error) ? (error.config?.url ?? '') : ''
  if (
    axios.isAxiosError(error) &&
    error.response?.status === 401 &&
    tokenStorage.get() &&
    !AUTH_ROUTES.some((route) => url.startsWith(route))
  ) {
    onUnauthorized?.()
  }
  return Promise.reject(error)
})

// toda resposta é validada com o schema do contrato
export async function request<T extends z.ZodType>(schema: T, config: AxiosRequestConfig): Promise<z.infer<T>> {
  const { data } = await api.request(config)
  return schema.parse(data)
}