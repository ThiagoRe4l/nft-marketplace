import { cn } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Nft } from '@/contracts/nft'
import { NETWORK_LABELS } from '@/features/catalog/components/labels'
import { truncateAddress } from '../purchase'

// Figma: texto de 17 px, ativo em negrito na cor de destaque e sublinhado de 3 px a 12 px do texto, sobre a linha da lista.
// Os modificadores group-data repetem os do TabsTrigger para vencer a especificidade dele.
const triggerClass = cn(
  'h-7 flex-none items-start px-0 py-0 text-[1.0625rem] leading-4 hover:text-highlight data-active:font-bold data-active:text-highlight',
  'after:bg-primary group-data-[orientation=horizontal]/tabs:after:-bottom-px group-data-[orientation=horizontal]/tabs:after:h-[3px]',
)

export function NftInfoTabs({ nft }: { nft: Nft }) {
  return (
    <Tabs defaultValue="details">
      <TabsList variant="line" className="w-full justify-start gap-8 border-b p-0 group-data-[orientation=horizontal]/tabs:h-7">
        <TabsTrigger value="details" className={triggerClass}>
          Detalhes do NFT
        </TabsTrigger>
        <TabsTrigger value="reviews" className={triggerClass}>
          Avaliações ({nft.reviewCount})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="details" className="space-y-4 pt-4 text-xs leading-6 text-muted-foreground md:text-sm">
        <p className="whitespace-pre-line">{nft.details}</p>
        <dl className="space-y-3">
          <div>
            <dt className="font-bold text-foreground">Rede:</dt>
            <dd>{NETWORK_LABELS[nft.network]}</dd>
          </div>
          <div>
            <dt className="font-bold text-foreground">Contrato:</dt>
            <dd>
              <span title={nft.contractAddress}>{truncateAddress(nft.contractAddress)}</span>
            </dd>
          </div>
          <div>
            <dt className="font-bold text-foreground">Direitos autorais:</dt>
            <dd>{nft.royaltyPercent}% nas vendas secundárias, pagos automaticamente pelos mercados compatíveis.</dd>
          </div>
        </dl>
      </TabsContent>

      <TabsContent value="reviews" className="pt-4 text-xs leading-6 text-muted-foreground">
        <p role="status">As avaliações não estão disponíveis na demonstração.</p>
      </TabsContent>
    </Tabs>
  )
}
