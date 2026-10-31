import { isAxiosError } from 'axios'
import { ApiError } from '@/contracts/common'

// erro único para a interface: da API (com status) ou do cliente (rede, timeout)
export type AppError =
  | (ApiError & { status: number })
  | { code: 'NETWORK_ERROR' | 'TIMEOUT' | 'UNKNOWN'; message: string; status: 0; fieldErrors?: undefined }

export function toAppError(error: unknown): AppError {
  if (isAxiosError(error)) {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return { code: 'TIMEOUT', message: 'A operação demorou demais. Tente novamente.', status: 0 }
    }
    if (!error.response) {
      return { code: 'NETWORK_ERROR', message: 'Sem conexão. Verifique sua internet e tente novamente.', status: 0 }
    }
    const parsed = ApiError.safeParse(error.response.data)
    if (parsed.success) return { ...parsed.data, status: error.response.status }
  }
  return { code: 'UNKNOWN', message: 'Algo deu errado. Tente novamente.', status: 0 }
}