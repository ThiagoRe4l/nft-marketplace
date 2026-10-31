import { z } from 'zod'
import { Id, IsoDate } from './common'

const Password = z.string().min(8, 'Mínimo de 8 caracteres')

export const User = z.object({
  id: Id,
  username: z.string(),
  displayName: z.string(),
  email: z.email(),
  ensName: z.string().nullable(),
  walletNickname: z.string().nullable(),
  avatarUrl: z.string().nullable(),
})
export type User = z.infer<typeof User>

export const Session = z.object({ user: User, expiresAt: IsoDate })
export type Session = z.infer<typeof Session>
export const AuthResponse = Session.extend({ token: z.string() })

export const SignupInput = z
  .object({
    username: z.string().min(3, 'Mínimo de 3 caracteres').regex(/^[a-z0-9_]+$/i, 'Use letras, números ou _'),
    email: z.email('E-mail inválido'),
    password: Password,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'As senhas não conferem',
    path: ['confirmPassword'],
  })

export const LoginInput = z.object({
  email: z.email('E-mail inválido'),
  password: z.string().min(1, 'Informe a senha'),
})