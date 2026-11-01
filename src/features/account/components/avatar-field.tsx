import { useRef, useState } from 'react'
import { ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { toAppError } from '@/shared/api/errors'
import { useRemoveAvatar, useUploadAvatar } from '../mutations'
import { useProfile } from '../queries'

const MAX_BYTES = 2 * 1024 * 1024
const ERROR_ID = 'avatar-error'

export function AvatarField() {
  const user = useProfile().data
  const upload = useUploadAvatar()
  const remove = useRemoveAvatar()
  const input = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const busy = upload.isPending || remove.isPending

  const fail = (e: unknown) => {
    const app = toAppError(e)
    setError(app.fieldErrors?.avatar?.[0] ?? app.message)
  }

  const choose = (file: File | undefined) => {
    if (input.current) input.current.value = '' // permite escolher o mesmo arquivo de novo
    if (!file) return
    setError(null)
    if (!file.type.startsWith('image/')) return setError('O arquivo precisa ser uma imagem')
    if (file.size > MAX_BYTES) return setError('A imagem deve ter no máximo 2 MB')
    upload.mutate(file, { onSuccess: () => toast.success('Avatar atualizado'), onError: fail })
  }

  return (
    <div className="space-y-1.5" role="group" aria-labelledby="avatar-label">
      <p id="avatar-label" className="text-sm font-medium">
        Avatar
      </p>
      <div className="flex items-center gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-card text-primary">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="Prévia do avatar" className="size-full object-cover" />
          ) : (
            <ImageIcon className="size-5" role="img" aria-label="Sem avatar" />
          )}
        </span>
        <input
          ref={input}
          type="file"
          accept="image/*"
          hidden
          aria-label="Escolher imagem de avatar"
          onChange={(e) => choose(e.target.files?.[0])}
        />
        <Button
          type="button"
          size="lg"
          className="h-10 px-5 font-bold"
          disabled={busy}
          aria-describedby={error ? ERROR_ID : undefined}
          onClick={() => input.current?.click()}
        >
          {upload.isPending ? 'Enviando...' : 'Alterar'}
        </Button>
        {user?.avatarUrl && (
          <Button
            type="button"
            variant="ghost"
            size="lg"
            className="h-10"
            disabled={busy}
            onClick={() => {
              setError(null)
              remove.mutate(undefined, { onSuccess: () => toast.success('Avatar removido'), onError: fail })
            }}
          >
            Remover
          </Button>
        )}
      </div>
      {error && (
        <p id={ERROR_ID} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
