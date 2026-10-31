import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Nft } from '@/contracts/nft'
import { NETWORK_LABELS } from '@/features/catalog/components/labels'
import { truncateAddress } from '../purchase'

const triggerClass = 'h-auto flex-none px-0 py-2 text-base after:bottom-0 data-active:font-bold data-active:text-primary'

export function NftInfoTabs({ nft }: { nft: Nft }) {
  return (
    <Tabs defaultValue="details">
      <TabsList variant="line" className="h-auto w-full justify-start gap-8 border-b p-0">
        <TabsTrigger value="details" className={triggerClass}>
          Detalhes do NFT
        </TabsTrigger>
        <TabsTrigger value="reviews" className={triggerClass}>
          Avaliações ({nft.reviewCount})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="details" className="space-y-4 pt-4 text-xs leading-6 text-muted-foreground">
        <p className="whitespace-pre-line">{nft.details}</p>
        <dl className="space-y-3">
          <div>
            <dt className="font-bold text-foreground">Rede:</dt>
            <dd>{NETWORK_LABELS[nft.network]}</dd>
          </div>
          <div>
            <dt className="font-bold text-foreground">Direitos autorais:</dt>
            <dd>{nft.royaltyPercent}% nas vendas secundárias, pagos automaticamente pelos mercados compatíveis.</dd>
          </div>
          <div>
            <dt className="font-bold text-foreground">Contrato:</dt>
            <dd>
              <span title={nft.contractAddress}>{truncateAddress(nft.contractAddress)}</span>
            </dd>
          </div>
        </dl>
      </TabsContent>

      <TabsContent value="reviews" className="pt-4 text-xs leading-6 text-muted-foreground">
        <p role="status">As avaliações não estão disponíveis na demonstração.</p>
      </TabsContent>
    </Tabs>
  )
}
