import { z } from 'zod'

export const UpdateProfileInput = z.object({
  displayName: z.string().min(1, 'Obrigatório'),
  username: z.string().min(3, 'Mínimo de 3 caracteres'),
  email: z.email('E-mail inválido'),
  ensName: z.string().min(1, 'Obrigatório'),
  walletNickname: z.string().min(1, 'Obrigatório'),
})

export const ChangePasswordInput = z
  .object({
    currentPassword: z.string().min(1, 'Informe a senha atual'),
    newPassword: z.string().min(8, 'Mínimo de 8 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'As senhas não conferem',
    path: ['confirmPassword'],
  })
  .refine((d) => d.newPassword !== d.currentPassword, {
    message: 'A nova senha deve ser diferente da atual',
    path: ['newPassword'],
  })