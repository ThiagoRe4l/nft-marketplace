import { Link } from '@tanstack/react-router'
import { Button, buttonVariants } from '@/components/ui/button'

function StatusPage({ title, text, children }: { title: string; text: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-page px-gutter py-10 md:py-16">
      <div role="alert" className="mx-auto flex max-w-xl flex-col items-center gap-4 rounded-xl bg-card px-6 py-16 text-center">
        <h1 className="text-xl font-bold">{title}</h1>
        <p className="text-sm text-muted-foreground">{text}</p>
        {children}
      </div>
    </div>
  )
}

// rota inexistente ou recurso que a API respondeu NOT_FOUND (ex.: NFT inexistente)
export function NotFoundPage() {
  return (
    <StatusPage title="Página não encontrada" text="O endereço pode estar incorreto ou o conteúdo foi removido.">
      <Link to="/" className={buttonVariants({ size: 'lg', className: 'h-10 px-6 font-bold' })}>
        Voltar para o início
      </Link>
    </StatusPage>
  )
}

// erro inesperado durante a renderização de uma rota
export function RouteErrorPage({ reset }: { reset: () => void }) {
  return (
    <StatusPage title="Algo deu errado" text="Ocorreu um erro inesperado ao exibir esta página. Tente novamente.">
      <Button type="button" size="lg" className="h-10 px-6 font-bold" onClick={reset}>
        Tentar novamente
      </Button>
    </StatusPage>
  )
}
