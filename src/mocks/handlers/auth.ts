import { http, HttpResponse } from 'msw'
import { LoginInput, SignupInput, User } from '@/contracts/auth'
import { db } from '../db/store'
import type { DbUser } from '../db/types'
import { apiError, parseBody, requireSession } from '../lib/http'
import { hashPassword } from '../lib/password'

const SESSION_TTL_MS = 2 * 60 * 60 * 1000 // 2 horas

// o Zod descarta campos fora do schema: passwordHash e passwordSalt somem
const toPublicUser = (user: DbUser) => User.parse(user)

function authResponse(user: DbUser, status = 200) {
  const now = Date.now()
  const session = {
    token: crypto.randomUUID(),
    userId: user.id,
    expiresAt: new Date(now + SESSION_TTL_MS).toISOString(),
  }
  db.write((s) => {
    s.sessions = s.sessions.filter((x) => new Date(x.expiresAt).getTime() > now) // limpa vencidas
    s.sessions.push(session)
  })
  return HttpResponse.json(
    { token: session.token, expiresAt: session.expiresAt, user: toPublicUser(user) },
    { status },
  )
}

export const authHandlers = [
  http.post('/api/auth/signup', async ({ request }) => {
    const input = await parseBody(request, SignupInput)

    // o hash vem ANTES da checagem: entre a checagem e a gravação não pode haver await,
    // senão dois cadastros simultâneos com o mesmo e-mail passam juntos
    const salt = crypto.randomUUID()
    const passwordHash = await hashPassword(input.password, salt)

    const result = db.write((s) => {
      const fieldErrors: Record<string, string[]> = {}
      if (s.users.some((u) => u.email.toLowerCase() === input.email.toLowerCase()))
        fieldErrors.email = ['Este e-mail já está cadastrado']
      if (s.users.some((u) => u.username.toLowerCase() === input.username.toLowerCase()))
        fieldErrors.username = ['Este nome de usuário já está em uso']
      if (Object.keys(fieldErrors).length) return { fieldErrors }

      const user: DbUser = {
        id: crypto.randomUUID(),
        username: input.username,
        displayName: input.username,
        email: input.email,
        ensName: null,
        walletNickname: null,
        avatarUrl: null,
        passwordSalt: salt,
        passwordHash,
      }
      s.users.push(user)
      return { user }
    })

    if ('fieldErrors' in result) return apiError('CONFLICT', 'Não foi possível criar a conta', result.fieldErrors)
    return authResponse(result.user, 201)
  }),

  http.post('/api/auth/login', async ({ request }) => {
    const input = await parseBody(request, LoginInput)
    const user = db.read().users.find((u) => u.email.toLowerCase() === input.email.toLowerCase())
    const hash = user ? await hashPassword(input.password, user.passwordSalt) : null

    // mensagem genérica: não revela se o e-mail existe
    if (!user || hash !== user.passwordHash) return apiError('UNAUTHENTICATED', 'E-mail ou senha incorretos')
    return authResponse(user)
  }),

  http.get('/api/auth/session', ({ request }) => {
    const session = requireSession(request)
    const user = db.read().users.find((u) => u.id === session.userId)
    if (!user) return apiError('UNAUTHENTICATED', 'Sessão inválida')
    return HttpResponse.json({ user: toPublicUser(user), expiresAt: session.expiresAt })
  }),

  // sem requireSession: sair com sessão já vencida também deve funcionar
  http.post('/api/auth/logout', ({ request }) => {
    const token = request.headers.get('Authorization')?.replace(/^Bearer /, '')
    db.write((s) => {
      s.sessions = s.sessions.filter((x) => x.token !== token)
    })
    return new HttpResponse(null, { status: 204 })
  }),
]