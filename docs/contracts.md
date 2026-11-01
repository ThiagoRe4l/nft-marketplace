| Recurso | Endpoint | Corpo / resposta |
| --- | --- | --- |
| Sessão | POST /auth/signup | SignupInput → AuthResponse (409 CONFLICT) |
| | POST /auth/login | LoginInput → AuthResponse |
| | GET /auth/session | → Session (401 se expirada) |
| | POST /auth/logout | → 204 |
| NFTs | GET /nfts | NftListParams → NftListResponse |
| | GET /nfts/featured | → FeaturedResponse |
| | GET /nfts/:id | → Nft (404) |
| Favoritos | GET /favorites | → NftSummary[] |
| | PUT /favorites/:nftId | → 204 |
| | DELETE /favorites/:nftId | → 204 |
| Carrinho | GET /cart | → Cart |
| | POST /cart/items | AddCartItemInput → Cart (409 OUT_OF_STOCK) |
| | PATCH /cart/items/:itemId | UpdateCartItemInput → Cart |
| | DELETE /cart/items/:itemId | → Cart |
| | PUT /cart/coupon | ApplyCouponInput → Cart (422 COUPON_*) |
| | DELETE /cart/coupon | → Cart |
| | POST /cart/merge | { guestCartId } → Cart |
| Cotação | POST /quote | → Quote (do carrinho atual) |
| Pedidos | POST /orders | CreateOrderInput + header Idempotency-Key → Order (409 QUOTE_STALE / IDEMPOTENCY_CONFLICT) |
| | GET /orders/:id | → Order |
| Perfil | GET /profile | → User |
| | PATCH /profile | UpdateProfileInput → User |
| | POST /profile/avatar | multipart → User |
| | DELETE /profile/avatar | → User |
| | POST /profile/password | ChangePasswordInput → 204 |
| Carteiras | GET /wallets | → Wallet[] |
| | PUT /wallets/:slot | UpsertWalletInput → Wallet |
| | POST /wallets/:slot/connect | → 204 (422 WALLET_REJECTED) |

## Eventos em tempo real (Socket.IO)

Definidos em `src/contracts/events.ts`; o mock publica em `src/mocks/realtime/events.ts` e entrega por `src/mocks/realtime/hub.ts`.

Envelope comum a todos os eventos:

| Campo | Tipo | Para que serve |
| --- | --- | --- |
| `eventId` | string | Identifica o evento: o cliente ignora duplicatas |
| `type` | `nft.updated` \| `order.updated` | Tipo do evento (também é o nome do evento no Socket.IO) |
| `resource` | `{ type: 'nft' \| 'order', id }` | Recurso afetado |
| `version` | inteiro ≥ 1 | Versão do recurso: o cliente ignora eventos mais antigos que o estado atual |
| `occurredAt` | data ISO | Quando ocorreu |
| `payload` | objeto | Específico de cada tipo (abaixo) |

| Evento | Payload | Entregue a |
| --- | --- | --- |
| `nft.updated` | `editions[]` com `id`, `price`, `compareAtPrice`, `available` | Todas as conexões, inclusive visitantes |
| `order.updated` | `status`, `txHash` (ou null), `rejectionReason` (ou null) | Só as conexões do usuário dono do pedido |

Toda mudança em NFT ou pedido publica o evento correspondente. Eventos entregues só depois que o cliente entra no namespace (pacote `40`).

## Códigos de erro

Corpo de erro: `{ code, message, fieldErrors? }` (`ApiError` em `src/contracts/common.ts`). O status HTTP de cada código vem de `src/mocks/lib/http.ts`.

| Código | Status HTTP | Quando ocorre |
| --- | --- | --- |
| `VALIDATION_ERROR` | 422 | Corpo inválido; traz `fieldErrors` por campo |
| `UNAUTHENTICATED` | 401 | Sem token, token inexistente (logout/reset) ou sessão expirada |
| `FORBIDDEN` | 403 | Ação não permitida ao usuário |
| `NOT_FOUND` | 404 | Recurso inexistente (ou que não pertence ao usuário, como pedido de outra conta) |
| `CONFLICT` | 409 | Conflito de dados, ex.: e-mail já cadastrado |
| `OUT_OF_STOCK` | 409 | Edição sem disponibilidade suficiente |
| `QUOTE_STALE` | 409 | Preço, estoque ou cupom mudou desde a cotação |
| `COUPON_INVALID` | 422 | Código de cupom inexistente |
| `COUPON_EXPIRED` | 422 | Cupom válido, mas expirado |
| `WALLET_REJECTED` | 422 | Conexão da carteira recusada (cenário `wallet-rejected`) |
| `IDEMPOTENCY_CONFLICT` | 409 | Mesma `Idempotency-Key` usada com outro conteúdo |
| `TRANSIENT` | 503 | Falha temporária (cenários `server-error` e `mutation-error`) |

Falhas sem resposta da API (rede, timeout) não têm código de contrato: o cliente as trata como `NETWORK_ERROR` e `TIMEOUT` (`src/shared/api/errors.ts`).
