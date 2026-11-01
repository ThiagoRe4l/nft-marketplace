import { MailIcon } from 'lucide-react'
import { LinkedinIcon, TwitterIcon } from '@/components/icons'

const linkClass =
  'inline-flex size-6 items-center justify-center text-foreground outline-none transition-colors hover:text-primary focus-visible:ring-3 focus-visible:ring-ring [&_svg]:size-4'

export function ShareLinks({ name }: { name: string }) {
  const url = encodeURIComponent(window.location.href)
  const text = encodeURIComponent(`${name} na Kurio`)
  const links = [
    { label: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`, icon: <LinkedinIcon /> },
    { label: 'E-mail', href: `mailto:?subject=${text}&body=${url}`, icon: <MailIcon /> },
    { label: 'X (Twitter)', href: `https://twitter.com/intent/tweet?url=${url}&text=${text}`, icon: <TwitterIcon /> },
  ]
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-bold md:text-[0.9375rem]">Compartilhar este NFT:</span>
      {links.map((link) => (
        <a
          key={link.label}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Compartilhar no ${link.label}`}
          className={linkClass}
        >
          {link.icon}
        </a>
      ))}
    </div>
  )
}
