import type { DbState } from '../db/types'

// credenciais fictícias (vão para o README):
// ana@kurio.dev / kurio1234
// bruno@kurio.dev / kurio5678
export const userFixtures: DbState['users'] = [
  {
    id: 'user-ana',
    username: 'ana_coleciona',
    displayName: 'Ana Ribeiro',
    email: 'ana@kurio.dev',
    ensName: 'anaribeiro',
    walletNickname: 'Cofre principal',
    avatarUrl: null,
    passwordSalt: 'ana-salt-7f3a',
    passwordHash: 'fd26d8b0619d8724166965c3c89bb7a2a338e3723a6afa6e4802abc415e78a22',
  },
  {
    id: 'user-bruno',
    username: 'bruno_nft',
    displayName: 'Bruno Costa',
    email: 'bruno@kurio.dev',
    ensName: null,
    walletNickname: null,
    avatarUrl: null,
    passwordSalt: 'bruno-salt-2c9e',
    passwordHash: 'edc7588e18536890fe3adc21df77d9d272129c117fa7d4225fa096f866f45477',
  },
]

export const walletFixtures: DbState['wallets'] = [
  {
    id: 'wallet-ana-primary',
    userId: 'user-ana',
    slot: 'primary',
    displayName: 'Ana Ribeiro',
    nickname: 'Cofre principal',
    profileName: 'ana_coleciona',
    network: 'ethereum',
    address: '0x3fA9c2B7e41D5a08C6b19E7f2d4A6c8B0e1F9a72',
    secondaryAddress: null,
    type: 'metamask',
    referralCode: 'KURIO-ANA',
    email: 'ana@kurio.dev',
    ensName: 'anaribeiro',
  },
]