import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { z } from 'zod'
import { Session, User } from '@/contracts/auth'
import { ChangePasswordInput, UpdateProfileInput } from '@/contracts/profile'
import { UpsertWalletInput, Wallet } from '@/contracts/wallet'
import { sessionQuery, useSession } from '@/features/auth/session'
import { api, request } from '@/shared/api/client'
import { accountKeys } from './queries'

// o perfil aparece em dois lugares: na tela de perfil e no Header (via sessão)
function useSyncUser() {
  const queryClient = useQueryClient()
  const userId = useSession().data?.user.id ?? ''
  return (user: z.infer<typeof User>) => {
    queryClient.setQueryData(accountKeys.profile(userId), user)
    queryClient.setQueryData<Session | null>(sessionQuery.queryKey, (old) => (old ? { ...old, user } : old))
  }
}

export function useUpdateProfile() {
  const syncUser = useSyncUser()
  return useMutation({
    mutationFn: (input: z.infer<typeof UpdateProfileInput>) =>
      request(User, { method: 'PATCH', url: '/profile', data: input }),
    onSuccess: syncUser,
  })
}

export function useUploadAvatar() {
  const syncUser = useSyncUser()
  return useMutation({
    mutationFn: (file: File) => {
      const form = new FormData()
      form.append('avatar', file)
      return request(User, { method: 'POST', url: '/profile/avatar', data: form })
    },
    onSuccess: syncUser,
  })
}

export function useRemoveAvatar() {
  const syncUser = useSyncUser()
  return useMutation({
    mutationFn: () => request(User, { method: 'DELETE', url: '/profile/avatar' }),
    onSuccess: syncUser,
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async (input: z.infer<typeof ChangePasswordInput>) => {
      await api.post('/profile/password', input)
    },
  })
}

export function useUpsertWallet() {
  const queryClient = useQueryClient()
  const userId = useSession().data?.user.id ?? ''
  return useMutation({
    mutationFn: ({ slot, input }: { slot: 'primary' | 'secondary'; input: z.infer<typeof UpsertWalletInput> }) =>
      request(Wallet, { method: 'PUT', url: `/wallets/${slot}`, data: input }),
    // a lista inteira pode mudar (cadastro ou edição): busca de novo
    onSuccess: () => queryClient.invalidateQueries({ queryKey: accountKeys.wallets(userId) }),
  })
}