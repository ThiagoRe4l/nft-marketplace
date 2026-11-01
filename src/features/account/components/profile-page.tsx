import { Skeleton } from '@/components/ui/skeleton'
import { useProfile } from '../queries'
import { AccountLayout } from './account-layout'
import { AvatarField } from './avatar-field'
import { PasswordForm } from './password-form'
import { ProfileForm } from './profile-form'

export function ProfilePage() {
  const profile = useProfile()
  return (
    <AccountLayout>
      <h1 className="mb-6 text-base font-bold">Perfil do colecionador</h1>
      {profile.data ? (
        <div className="space-y-10">
          <ProfileForm user={profile.data} avatar={<AvatarField />} />
          <PasswordForm />
        </div>
      ) : profile.isError ? (
        <p role="alert" className="text-sm text-destructive">
          Não foi possível carregar o perfil.{' '}
          <button type="button" onClick={() => profile.refetch()} className="underline">
            Tentar de novo
          </button>
        </p>
      ) : (
        <div role="status" aria-label="Carregando perfil" className="grid gap-5 md:grid-cols-2">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      )}
    </AccountLayout>
  )
}
