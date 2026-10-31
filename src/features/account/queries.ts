import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { User } from '@/contracts/auth'
import { Wallet } from '@/contracts/wallet'
import { useSession } from '@/features/auth/session'
import { request } from '@/shared/api/client'

export const accountKeys = {
  profile: (userId: string) => ['profile', userId] as const,
  wallets: (userId: string) => ['wallets', userId] as const,
}

export function useProfile() {
  const userId = useSession().data?.user.id ?? ''
  return useQuery({
    queryKey: accountKeys.profile(userId),
    queryFn: ({ signal }) => request(User, { url: '/profile', signal }),
    enabled: userId !== '',
  })
}

export function useWallets() {
  const userId = useSession().data?.user.id ?? ''
  return useQuery({
    queryKey: accountKeys.wallets(userId),
    queryFn: ({ signal }) => request(z.array(Wallet), { url: '/wallets', signal }),
    enabled: userId !== '',
  })
}