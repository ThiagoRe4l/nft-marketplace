import { http, HttpResponse } from 'msw'
import { User } from '@/contracts/auth'
import { ChangePasswordInput, UpdateProfileInput } from '@/contracts/profile'
import { db } from '../db/store'
import { apiError, parseBody, requireSession } from '../lib/http'
import { hashPassword } from '../lib/password'

const MAX_AVATAR_BYTES = 2 * 1024 * 1024

const avatarError = (message: string) => apiError('VALIDATION_ERROR', message, { avatar: [message] })

// btoa em blocos: String.fromCharCode(...bytes) estoura a pilha em arquivos grandes
function toDataUrl(type: string, buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return `data:${type};base64,${btoa(binary)}`
}

export const profileHandlers = [
  http.get('/api/profile', ({ request }) => {
    const { userId } = requireSession(request)
    const user = db.read().users.find((u) => u.id === userId)
    if (!user) return apiError('UNAUTHENTICATED', 'Sessão inválida')
    return HttpResponse.json(User.parse(user))
  }),

  http.patch('/api/profile', async ({ request }) => {
    const { userId } = requireSession(request)
    const input = await parseBody(request, UpdateProfileInput)
    return db.write((s) => {
      const user = s.users.find((u) => u.id === userId)
      if (!user) return apiError('UNAUTHENTICATED', 'Sessão inválida')

      const others = s.users.filter((u) => u.id !== userId)
      const fieldErrors: Record<string, string[]> = {}
      if (others.some((u) => u.email.toLowerCase() === input.email.toLowerCase()))
        fieldErrors.email = ['Este e-mail já está cadastrado']
      if (others.some((u) => u.username.toLowerCase() === input.username.toLowerCase()))
        fieldErrors.username = ['Este nome de usuário já está em uso']
      if (Object.keys(fieldErrors).length) return apiError('CONFLICT', 'Não foi possível salvar o perfil', fieldErrors)

      Object.assign(user, input)
      return HttpResponse.json(User.parse(user))
    })
  }),

  http.post('/api/profile/avatar', async ({ request }) => {
    const { userId } = requireSession(request)
    const form = await request.formData().catch(() => null)
    const file = form?.get('avatar')
    if (!(file instanceof File)) return avatarError('Envie uma imagem')
    if (!file.type.startsWith('image/')) return avatarError('O arquivo precisa ser uma imagem')
    if (file.size > MAX_AVATAR_BYTES) return avatarError('A imagem deve ter no máximo 2 MB')

    const avatarUrl = toDataUrl(file.type, await file.arrayBuffer())
    return db.write((s) => {
      const user = s.users.find((u) => u.id === userId)
      if (!user) return apiError('UNAUTHENTICATED', 'Sessão inválida')
      user.avatarUrl = avatarUrl
      return HttpResponse.json(User.parse(user))
    })
  }),

  http.delete('/api/profile/avatar', ({ request }) => {
    const { userId } = requireSession(request)
    return db.write((s) => {
      const user = s.users.find((u) => u.id === userId)
      if (!user) return apiError('UNAUTHENTICATED', 'Sessão inválida')
      user.avatarUrl = null
      return HttpResponse.json(User.parse(user))
    })
  }),

  http.post('/api/profile/password', async ({ request }) => {
    const { userId } = requireSession(request)
    const input = await parseBody(request, ChangePasswordInput)
    const user = db.read().users.find((u) => u.id === userId)
    if (!user) return apiError('UNAUTHENTICATED', 'Sessão inválida')

    // os hashes vêm ANTES do write: dentro dele não pode haver await
    const currentHash = await hashPassword(input.currentPassword, user.passwordSalt)
    const salt = crypto.randomUUID()
    const newHash = await hashPassword(input.newPassword, salt)

    return db.write((s) => {
      const target = s.users.find((u) => u.id === userId)
      // confere de novo: a senha pode ter mudado durante os awaits
      if (!target || target.passwordHash !== currentHash) {
        const message = 'Senha atual incorreta'
        return apiError('VALIDATION_ERROR', message, { currentPassword: [message] })
      }
      target.passwordSalt = salt
      target.passwordHash = newHash
      return new HttpResponse(null, { status: 204 })
    })
  }),
]
